import { baseApi } from './baseApi.js';
import { databaseService } from '../../services/appwrite/database.js';

/**
 * Dashboard API slice
 * Handles all dashboard-related API operations using RTK Query
 */
export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get complete dashboard data for a user
    getDashboardData: builder.query({
      queryFn: async (userId) => {
        try {
          const result = await databaseService.getDashboardData(userId);
          
          if (!result.success) {
            return { error: { status: 'FETCH_ERROR', error: result.error } };
          }

          // Calculate additional statistics
          const sessions = result.data.sessions || [];
          const completedSessions = sessions.filter(session => session.status === 'completed');
          const activeSessions = sessions.filter(session => session.status === 'active');
          
          // Calculate average score for completed sessions
          const averageScore = completedSessions.length > 0
            ? completedSessions.reduce((sum, session) => sum + (session.finalScore || 0), 0) / completedSessions.length
            : 0;

          // Get recent sessions (last 5)
          const recentSessions = sessions.slice(0, 5);

          // Calculate session statistics by type
          const sessionsByType = sessions.reduce((acc, session) => {
            acc[session.sessionType] = (acc[session.sessionType] || 0) + 1;
            return acc;
          }, {});

          return {
            data: {
              user: result.data.user,
              sessions: result.data.sessions,
              resumes: result.data.resumes,
              statistics: {
                totalSessions: sessions.length,
                completedSessions: completedSessions.length,
                activeSessions: activeSessions.length,
                averageScore: Math.round(averageScore * 100) / 100,
                sessionsByType,
                totalResumes: result.data.resumes?.length || 0,
              },
              recentSessions,
            }
          };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (result, error, userId) => [
        { type: 'User', id: userId },
        { type: 'InterviewSession', id: 'LIST' },
        { type: 'Resume', id: 'LIST' },
      ],
    }),

    // Get user session history with pagination
    getSessionHistory: builder.query({
      queryFn: async ({ userId, limit = 10, offset = 0, status = null }) => {
        try {
          let result;
          
          if (status === 'completed') {
            result = await databaseService.getCompletedInterviewSessions(userId);
          } else if (status === 'active') {
            result = await databaseService.getActiveInterviewSessions(userId);
          } else {
            result = await databaseService.getUserInterviewSessions(userId);
          }

          if (!result.success) {
            return { error: { status: 'FETCH_ERROR', error: result.error } };
          }

          // Apply pagination
          const sessions = result.data || [];
          const paginatedSessions = sessions.slice(offset, offset + limit);
          
          return {
            data: {
              sessions: paginatedSessions,
              total: sessions.length,
              limit,
              offset,
              hasMore: offset + limit < sessions.length,
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

    // Get user statistics
    getUserStatistics: builder.query({
      queryFn: async (userId) => {
        try {
          const [sessionsResult, resumesResult] = await Promise.all([
            databaseService.getUserInterviewSessions(userId),
            databaseService.getUserResumes(userId),
          ]);

          const sessions = sessionsResult.success ? sessionsResult.data : [];
          const resumes = resumesResult.success ? resumesResult.data : [];

          const completedSessions = sessions.filter(session => session.status === 'completed');
          const activeSessions = sessions.filter(session => session.status === 'active');

          // Calculate performance trends (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const recentSessions = completedSessions.filter(session => 
            new Date(session.completedAt) >= thirtyDaysAgo
          );

          // Calculate average score trend
          const averageScore = completedSessions.length > 0
            ? completedSessions.reduce((sum, session) => sum + (session.finalScore || 0), 0) / completedSessions.length
            : 0;

          const recentAverageScore = recentSessions.length > 0
            ? recentSessions.reduce((sum, session) => sum + (session.finalScore || 0), 0) / recentSessions.length
            : 0;

          // Session type distribution
          const sessionsByType = sessions.reduce((acc, session) => {
            acc[session.sessionType] = (acc[session.sessionType] || 0) + 1;
            return acc;
          }, {});

          // Performance by session type
          const performanceByType = {};
          Object.keys(sessionsByType).forEach(type => {
            const typeSessions = completedSessions.filter(session => session.sessionType === type);
            performanceByType[type] = {
              count: typeSessions.length,
              averageScore: typeSessions.length > 0
                ? typeSessions.reduce((sum, session) => sum + (session.finalScore || 0), 0) / typeSessions.length
                : 0,
            };
          });

          return {
            data: {
              totalSessions: sessions.length,
              completedSessions: completedSessions.length,
              activeSessions: activeSessions.length,
              totalResumes: resumes.length,
              averageScore: Math.round(averageScore * 100) / 100,
              recentAverageScore: Math.round(recentAverageScore * 100) / 100,
              sessionsByType,
              performanceByType,
              recentSessionsCount: recentSessions.length,
              scoreImprovement: Math.round((recentAverageScore - averageScore) * 100) / 100,
            }
          };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (result, error, userId) => [
        { type: 'User', id: userId },
        { type: 'InterviewSession', id: 'STATS' },
        { type: 'Resume', id: 'STATS' },
      ],
    }),

    // Get recent activity for dashboard
    getRecentActivity: builder.query({
      queryFn: async ({ userId, limit = 5 }) => {
        try {
          const [sessionsResult, resumesResult] = await Promise.all([
            databaseService.getUserInterviewSessions(userId),
            databaseService.getUserResumes(userId),
          ]);

          const sessions = sessionsResult.success ? sessionsResult.data : [];
          const resumes = resumesResult.success ? resumesResult.data : [];

          // Combine and sort activities by date
          const activities = [];

          // Add session activities
          sessions.forEach(session => {
            activities.push({
              id: session.id,
              type: 'session',
              action: session.status === 'completed' ? 'completed' : 'started',
              title: `${session.sessionType} Interview - ${session.role}`,
              timestamp: session.status === 'completed' ? session.completedAt : session.startedAt,
              data: session,
            });
          });

          // Add resume activities
          resumes.forEach(resume => {
            activities.push({
              id: resume.id,
              type: 'resume',
              action: 'uploaded',
              title: `Resume: ${resume.fileName}`,
              timestamp: resume.uploadedAt,
              data: resume,
            });
          });

          // Sort by timestamp (most recent first) and limit
          const sortedActivities = activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);

          return {
            data: {
              activities: sortedActivities,
              total: activities.length,
            }
          };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        { type: 'InterviewSession', id: 'LIST' },
        { type: 'Resume', id: 'LIST' },
      ],
    }),

    // Get dashboard summary (lightweight version for quick loading)
    getDashboardSummary: builder.query({
      queryFn: async (userId) => {
        try {
          const [userResult, sessionsResult] = await Promise.all([
            databaseService.getUser(userId),
            databaseService.getUserInterviewSessions(userId),
          ]);

          if (!userResult.success) {
            return { error: { status: 'FETCH_ERROR', error: userResult.error } };
          }

          const sessions = sessionsResult.success ? sessionsResult.data : [];
          const completedSessions = sessions.filter(session => session.status === 'completed');
          const activeSessions = sessions.filter(session => session.status === 'active');

          return {
            data: {
              user: userResult.data,
              summary: {
                totalSessions: sessions.length,
                completedSessions: completedSessions.length,
                activeSessions: activeSessions.length,
                lastSessionDate: sessions.length > 0 ? sessions[0].startedAt : null,
              }
            }
          };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (result, error, userId) => [
        { type: 'User', id: userId },
        { type: 'InterviewSession', id: 'SUMMARY' },
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetDashboardDataQuery,
  useGetSessionHistoryQuery,
  useGetUserStatisticsQuery,
  useGetRecentActivityQuery,
  useGetDashboardSummaryQuery,
  useLazyGetDashboardDataQuery,
  useLazyGetSessionHistoryQuery,
  useLazyGetUserStatisticsQuery,
  useLazyGetRecentActivityQuery,
  useLazyGetDashboardSummaryQuery,
} = dashboardApi;