import { baseApi } from './baseApi.js';
import { databaseService } from '../../services/appwrite/database.js';
import { interviewService } from '../../services/ai/interviewService.js';

/**
 * Report API slice
 * Handles all report-related API operations using RTK Query
 */
export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get complete interview report with interactions
    getInterviewReport: builder.query({
      queryFn: async (sessionId) => {
        try {
          const [sessionResult, interactionsResult] = await Promise.all([
            databaseService.getInterviewSession(sessionId),
            databaseService.getSessionInteractions(sessionId)
          ]);

          if (!sessionResult.success) {
            return { error: { status: 'FETCH_ERROR', error: sessionResult.error } };
          }

          if (!interactionsResult.success) {
            return { error: { status: 'FETCH_ERROR', error: interactionsResult.error } };
          }

          // Sort interactions by order
          const sortedInteractions = (interactionsResult.data || [])
            .sort((a, b) => a.order - b.order);

          // Calculate additional metrics
          const session = sessionResult.data;
          const interactions = sortedInteractions;
          
          const reportData = {
            session,
            interactions,
            metrics: {
              totalQuestions: interactions.length,
              averageResponseLength: interactions.length > 0
                ? Math.round(interactions.reduce((sum, int) => sum + (int.userAnswerText?.length || 0), 0) / interactions.length)
                : 0,
              sessionDuration: session.completedAt && session.startedAt
                ? Math.round((new Date(session.completedAt) - new Date(session.startedAt)) / 60000)
                : null,
              completionRate: session.status === 'completed' ? 100 : 0
            }
          };

          return { data: reportData };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (result, error, sessionId) => [
        { type: 'InterviewSession', id: sessionId },
        { type: 'Interaction', id: 'LIST' },
      ],
    }),

    // Get paginated list of user reports
    getUserReports: builder.query({
      queryFn: async ({ userId, limit = 10, offset = 0, status = 'completed' }) => {
        try {
          let result;
          
          if (status === 'completed') {
            result = await databaseService.getCompletedInterviewSessions(userId);
          } else {
            result = await databaseService.getUserInterviewSessions(userId);
          }

          if (!result.success) {
            return { error: { status: 'FETCH_ERROR', error: result.error } };
          }

          const sessions = result.data || [];
          
          // Filter by status if not 'completed'
          const filteredSessions = status !== 'completed' 
            ? sessions.filter(session => session.status === status)
            : sessions;

          // Apply pagination
          const paginatedSessions = filteredSessions.slice(offset, offset + limit);
          
          // Add summary statistics for each session
          const enrichedSessions = await Promise.all(
            paginatedSessions.map(async (session) => {
              try {
                const interactionsResult = await databaseService.getSessionInteractions(session.id);
                const interactionCount = interactionsResult.success ? interactionsResult.data.length : 0;
                
                return {
                  ...session,
                  interactionCount,
                  formattedScore: session.finalScore ? `${Math.round(session.finalScore * 100) / 100}%` : 'N/A',
                  formattedDate: session.completedAt 
                    ? new Date(session.completedAt).toLocaleDateString()
                    : new Date(session.startedAt).toLocaleDateString(),
                  duration: session.completedAt && session.startedAt
                    ? Math.round((new Date(session.completedAt) - new Date(session.startedAt)) / 60000)
                    : null
                };
              } catch (error) {
                console.warn(`Failed to enrich session ${session.id}:`, error);
                return session;
              }
            })
          );

          return {
            data: {
              reports: enrichedSessions,
              pagination: {
                total: filteredSessions.length,
                limit,
                offset,
                hasMore: offset + limit < filteredSessions.length,
                currentPage: Math.floor(offset / limit) + 1,
                totalPages: Math.ceil(filteredSessions.length / limit)
              }
            }
          };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (result, error, { userId }) => [
        { type: 'InterviewSession', id: 'LIST' },
        { type: 'User', id: userId },
      ],
    }),

    // Generate detailed feedback for an interview
    generateInterviewFeedback: builder.mutation({
      queryFn: async ({ sessionId, interactions }) => {
        try {
          const result = await interviewService.generateDetailedFeedback({
            sessionId,
            interactions
          });

          if (!result.success) {
            return { error: { status: 'FETCH_ERROR', error: result.error } };
          }

          return { data: result.data };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: (result, error, { sessionId }) => [
        { type: 'InterviewSession', id: sessionId },
      ],
    }),

    // Calculate interview score
    calculateInterviewScore: builder.mutation({
      queryFn: async (interactions) => {
        try {
          const result = await interviewService.calculateInterviewScore(interactions);

          if (!result.success) {
            return { error: { status: 'FETCH_ERROR', error: result.error } };
          }

          return { data: result.data };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
    }),

    // Get report statistics for a user
    getReportStatistics: builder.query({
      queryFn: async (userId) => {
        try {
          const result = await databaseService.getCompletedInterviewSessions(userId);

          if (!result.success) {
            return { error: { status: 'FETCH_ERROR', error: result.error } };
          }

          const sessions = result.data || [];
          
          if (sessions.length === 0) {
            return {
              data: {
                totalReports: 0,
                averageScore: 0,
                bestScore: 0,
                sessionTypes: {},
                recentTrend: 'no-data',
                completionRate: 0
              }
            };
          }

          // Calculate statistics
          const completedSessions = sessions.filter(session => session.finalScore !== null);
          const averageScore = completedSessions.length > 0
            ? completedSessions.reduce((sum, session) => sum + (session.finalScore || 0), 0) / completedSessions.length
            : 0;

          const bestScore = completedSessions.length > 0 
            ? Math.max(...completedSessions.map(s => s.finalScore || 0))
            : 0;

          // Session type distribution
          const sessionTypes = sessions.reduce((acc, session) => {
            acc[session.sessionType] = (acc[session.sessionType] || 0) + 1;
            return acc;
          }, {});

          // Calculate recent trend (last 5 vs previous 5)
          let recentTrend = 'stable';
          if (completedSessions.length >= 10) {
            const recent5 = completedSessions.slice(0, 5);
            const previous5 = completedSessions.slice(5, 10);
            
            const recentAvg = recent5.reduce((sum, s) => sum + (s.finalScore || 0), 0) / 5;
            const previousAvg = previous5.reduce((sum, s) => sum + (s.finalScore || 0), 0) / 5;
            
            if (recentAvg > previousAvg + 5) {
              recentTrend = 'improving';
            } else if (recentAvg < previousAvg - 5) {
              recentTrend = 'declining';
            }
          }

          // Completion rate
          const completionRate = sessions.length > 0 
            ? (completedSessions.length / sessions.length) * 100
            : 0;

          return {
            data: {
              totalReports: sessions.length,
              completedReports: completedSessions.length,
              averageScore: Math.round(averageScore * 100) / 100,
              bestScore: Math.round(bestScore * 100) / 100,
              sessionTypes,
              recentTrend,
              completionRate: Math.round(completionRate * 100) / 100,
              latestReport: sessions[0] || null
            }
          };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (result, error, userId) => [
        { type: 'InterviewSession', id: 'STATS' },
        { type: 'User', id: userId },
      ],
    }),

    // Export report data
    exportReport: builder.mutation({
      queryFn: async ({ sessionId, format = 'json' }) => {
        try {
          // First get the complete report data
          const [sessionResult, interactionsResult] = await Promise.all([
            databaseService.getInterviewSession(sessionId),
            databaseService.getSessionInteractions(sessionId)
          ]);

          if (!sessionResult.success || !interactionsResult.success) {
            return { error: { status: 'FETCH_ERROR', error: 'Failed to fetch report data' } };
          }

          const session = sessionResult.data;
          const interactions = interactionsResult.data.sort((a, b) => a.order - b.order);

          // Format export data
          const exportData = {
            reportInfo: {
              sessionId: session.id,
              exportedAt: new Date().toISOString(),
              format
            },
            session: {
              id: session.id,
              sessionType: session.sessionType,
              role: session.role,
              status: session.status,
              finalScore: session.finalScore,
              startedAt: session.startedAt,
              completedAt: session.completedAt,
              feedback: session.feedback
            },
            interactions: interactions.map(interaction => ({
              order: interaction.order,
              question: interaction.questionText,
              answer: interaction.userAnswerText,
              timestamp: interaction.timestamp
            })),
            summary: {
              totalQuestions: interactions.length,
              sessionDuration: session.completedAt && session.startedAt
                ? Math.round((new Date(session.completedAt) - new Date(session.startedAt)) / 60000)
                : null,
              averageResponseLength: interactions.length > 0
                ? Math.round(interactions.reduce((sum, int) => sum + (int.userAnswerText?.length || 0), 0) / interactions.length)
                : 0
            }
          };

          // Generate filename
          const timestamp = new Date().toISOString().split('T')[0];
          const filename = `interview-report-${session.sessionType}-${timestamp}.${format}`;

          return {
            data: {
              exportData,
              filename,
              format,
              size: JSON.stringify(exportData).length
            }
          };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
    }),

    // Get interaction details for a specific session
    getSessionInteractions: builder.query({
      queryFn: async (sessionId) => {
        try {
          const result = await databaseService.getSessionInteractions(sessionId);

          if (!result.success) {
            return { error: { status: 'FETCH_ERROR', error: result.error } };
          }

          // Sort interactions and add formatting
          const interactions = (result.data || [])
            .sort((a, b) => a.order - b.order)
            .map(interaction => ({
              ...interaction,
              formattedTimestamp: new Date(interaction.timestamp).toLocaleTimeString(),
              responseLength: interaction.userAnswerText?.length || 0,
              hasResponse: Boolean(interaction.userAnswerText?.trim())
            }));

          return { data: interactions };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (result, error, sessionId) => [
        { type: 'Interaction', id: 'LIST' },
        { type: 'InterviewSession', id: sessionId },
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetInterviewReportQuery,
  useGetUserReportsQuery,
  useGenerateInterviewFeedbackMutation,
  useCalculateInterviewScoreMutation,
  useGetReportStatisticsQuery,
  useExportReportMutation,
  useGetSessionInteractionsQuery,
  useLazyGetInterviewReportQuery,
  useLazyGetUserReportsQuery,
  useLazyGetReportStatisticsQuery,
  useLazyGetSessionInteractionsQuery,
} = reportApi;