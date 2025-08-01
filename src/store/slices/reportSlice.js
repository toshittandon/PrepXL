import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { databaseService } from '../../services/appwrite/database.js';
import { interviewService } from '../../services/ai/interviewService.js';

// Async thunks for report operations
export const fetchInterviewReport = createAsyncThunk(
  'report/fetchReport',
  async (sessionId, { rejectWithValue }) => {
    try {
      const [sessionResult, interactionsResult] = await Promise.all([
        databaseService.getInterviewSession(sessionId),
        databaseService.getSessionInteractions(sessionId)
      ]);

      if (!sessionResult.success) {
        return rejectWithValue(sessionResult.error || 'Failed to fetch session data');
      }

      if (!interactionsResult.success) {
        return rejectWithValue(interactionsResult.error || 'Failed to fetch interactions');
      }

      return {
        session: sessionResult.data,
        interactions: interactionsResult.data
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const generateDetailedFeedback = createAsyncThunk(
  'report/generateFeedback',
  async ({ sessionId, interactions }, { rejectWithValue }) => {
    try {
      const result = await interviewService.generateDetailedFeedback({
        sessionId,
        interactions
      });

      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.error || 'Failed to generate feedback');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const calculateInterviewScore = createAsyncThunk(
  'report/calculateScore',
  async (interactions, { rejectWithValue }) => {
    try {
      const result = await interviewService.calculateInterviewScore(interactions);
      
      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.error || 'Failed to calculate score');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserReports = createAsyncThunk(
  'report/fetchUserReports',
  async ({ userId, limit = 10, offset = 0 }, { rejectWithValue }) => {
    try {
      const result = await databaseService.getCompletedInterviewSessions(userId);
      
      if (!result.success) {
        return rejectWithValue(result.error || 'Failed to fetch user reports');
      }

      // Apply pagination
      const sessions = result.data || [];
      const paginatedSessions = sessions.slice(offset, offset + limit);
      
      return {
        sessions: paginatedSessions,
        total: sessions.length,
        limit,
        offset,
        hasMore: offset + limit < sessions.length
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const exportReport = createAsyncThunk(
  'report/exportReport',
  async ({ sessionId, format = 'json' }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const currentReport = state.report.currentReport;
      
      if (!currentReport || currentReport.session.id !== sessionId) {
        return rejectWithValue('Report data not available');
      }

      // Format the report data for export
      const exportData = {
        session: currentReport.session,
        interactions: currentReport.interactions,
        score: currentReport.score,
        feedback: currentReport.feedback,
        exportedAt: new Date().toISOString(),
        format
      };

      // In a real implementation, this would handle different export formats
      // For now, we'll return the formatted data
      return {
        data: exportData,
        filename: `interview-report-${sessionId}-${Date.now()}.${format}`,
        format
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  currentReport: null,
  userReports: [],
  loading: false,
  error: null,
  fetchingReport: false,
  generatingFeedback: false,
  calculatingScore: false,
  exportingReport: false,
  pagination: {
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false
  }
};

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    // Set error state
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Clear current report
    clearCurrentReport: (state) => {
      state.currentReport = null;
      state.error = null;
    },
    
    // Set current report
    setCurrentReport: (state, action) => {
      state.currentReport = action.payload;
    },
    
    // Update report feedback
    updateReportFeedback: (state, action) => {
      if (state.currentReport) {
        state.currentReport.feedback = action.payload;
      }
    },
    
    // Update report score
    updateReportScore: (state, action) => {
      if (state.currentReport) {
        state.currentReport.score = action.payload;
      }
    },
    
    // Clear user reports
    clearUserReports: (state) => {
      state.userReports = [];
      state.pagination = {
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false
      };
    },
    
    // Reset report state
    resetReportState: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Interview Report
      .addCase(fetchInterviewReport.pending, (state) => {
        state.fetchingReport = true;
        state.error = null;
      })
      .addCase(fetchInterviewReport.fulfilled, (state, action) => {
        state.fetchingReport = false;
        state.currentReport = {
          session: action.payload.session,
          interactions: action.payload.interactions,
          score: action.payload.session.finalScore || null,
          feedback: action.payload.session.feedback || null
        };
      })
      .addCase(fetchInterviewReport.rejected, (state, action) => {
        state.fetchingReport = false;
        state.error = action.payload;
      })
      
      // Generate Detailed Feedback
      .addCase(generateDetailedFeedback.pending, (state) => {
        state.generatingFeedback = true;
        state.error = null;
      })
      .addCase(generateDetailedFeedback.fulfilled, (state, action) => {
        state.generatingFeedback = false;
        if (state.currentReport) {
          state.currentReport.feedback = action.payload;
        }
      })
      .addCase(generateDetailedFeedback.rejected, (state, action) => {
        state.generatingFeedback = false;
        state.error = action.payload;
      })
      
      // Calculate Interview Score
      .addCase(calculateInterviewScore.pending, (state) => {
        state.calculatingScore = true;
        state.error = null;
      })
      .addCase(calculateInterviewScore.fulfilled, (state, action) => {
        state.calculatingScore = false;
        if (state.currentReport) {
          state.currentReport.score = action.payload;
        }
      })
      .addCase(calculateInterviewScore.rejected, (state, action) => {
        state.calculatingScore = false;
        state.error = action.payload;
      })
      
      // Fetch User Reports
      .addCase(fetchUserReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserReports.fulfilled, (state, action) => {
        state.loading = false;
        const { sessions, total, limit, offset, hasMore } = action.payload;
        
        if (offset === 0) {
          // First page - replace existing data
          state.userReports = sessions;
        } else {
          // Subsequent pages - append to existing data
          state.userReports = [...state.userReports, ...sessions];
        }
        
        state.pagination = {
          total,
          limit,
          offset,
          hasMore
        };
      })
      .addCase(fetchUserReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Export Report
      .addCase(exportReport.pending, (state) => {
        state.exportingReport = true;
        state.error = null;
      })
      .addCase(exportReport.fulfilled, (state) => {
        state.exportingReport = false;
        // Export success - could add success message here
      })
      .addCase(exportReport.rejected, (state, action) => {
        state.exportingReport = false;
        state.error = action.payload;
      });
  },
});

export const {
  setLoading,
  setError,
  clearError,
  clearCurrentReport,
  setCurrentReport,
  updateReportFeedback,
  updateReportScore,
  clearUserReports,
  resetReportState,
} = reportSlice.actions;

// Selectors
export const selectReport = (state) => state.report;
export const selectCurrentReport = (state) => state.report.currentReport;
export const selectUserReports = (state) => state.report.userReports;
export const selectReportLoading = (state) => state.report.loading;
export const selectReportError = (state) => state.report.error;
export const selectFetchingReport = (state) => state.report.fetchingReport;
export const selectGeneratingFeedback = (state) => state.report.generatingFeedback;
export const selectCalculatingScore = (state) => state.report.calculatingScore;
export const selectExportingReport = (state) => state.report.exportingReport;
export const selectReportPagination = (state) => state.report.pagination;

// Computed selectors
export const selectFormattedCurrentReport = (state) => {
  const report = state.report.currentReport;
  if (!report) return null;

  return {
    ...report,
    formattedScore: report.score ? `${Math.round(report.score * 100) / 100}/100` : 'N/A',
    formattedDate: report.session.completedAt 
      ? new Date(report.session.completedAt).toLocaleDateString()
      : new Date(report.session.startedAt).toLocaleDateString(),
    duration: report.session.completedAt && report.session.startedAt
      ? Math.round((new Date(report.session.completedAt) - new Date(report.session.startedAt)) / 60000)
      : null,
    interactionCount: report.interactions.length
  };
};

export const selectSortedInteractions = (state) => {
  const report = state.report.currentReport;
  if (!report || !report.interactions) return [];

  return [...report.interactions].sort((a, b) => a.order - b.order);
};

export const selectReportStatistics = (state) => {
  const reports = state.report.userReports;
  if (!reports.length) return null;

  const completedReports = reports.filter(report => report.finalScore !== null);
  const averageScore = completedReports.length > 0
    ? completedReports.reduce((sum, report) => sum + (report.finalScore || 0), 0) / completedReports.length
    : 0;

  const sessionTypes = reports.reduce((acc, report) => {
    acc[report.sessionType] = (acc[report.sessionType] || 0) + 1;
    return acc;
  }, {});

  return {
    totalReports: reports.length,
    completedReports: completedReports.length,
    averageScore: Math.round(averageScore * 100) / 100,
    sessionTypes,
    latestReport: reports[0] || null,
    bestScore: completedReports.length > 0 
      ? Math.max(...completedReports.map(r => r.finalScore || 0))
      : 0
  };
};

export default reportSlice.reducer;