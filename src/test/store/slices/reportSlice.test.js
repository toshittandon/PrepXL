import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import reportReducer, {
  setLoading,
  setError,
  clearError,
  clearCurrentReport,
  setCurrentReport,
  updateReportFeedback,
  updateReportScore,
  clearUserReports,
  resetReportState,
  fetchInterviewReport,
  generateDetailedFeedback,
  calculateInterviewScore,
  fetchUserReports,
  exportReport,
  selectReport,
  selectCurrentReport,
  selectUserReports,
  selectReportLoading,
  selectReportError,
  selectFormattedCurrentReport,
  selectSortedInteractions,
  selectReportStatistics,
} from '../../../store/slices/reportSlice.js';

// Mock the services
vi.mock('../../../services/appwrite/database.js', () => ({
  databaseService: {
    getInterviewSession: vi.fn(),
    getSessionInteractions: vi.fn(),
    getCompletedInterviewSessions: vi.fn(),
  },
}));

vi.mock('../../../services/ai/interviewService.js', () => ({
  interviewService: {
    generateDetailedFeedback: vi.fn(),
    calculateInterviewScore: vi.fn(),
  },
}));

import { databaseService } from '../../../services/appwrite/database.js';
import { interviewService } from '../../../services/ai/interviewService.js';

describe('reportSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        report: reportReducer,
      },
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().report;
      expect(state).toEqual({
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
          hasMore: false,
        },
      });
    });
  });

  describe('synchronous actions', () => {
    it('should handle setLoading', () => {
      store.dispatch(setLoading(true));
      expect(store.getState().report.loading).toBe(true);
    });

    it('should handle setError', () => {
      const errorMessage = 'Test error';
      store.dispatch(setError(errorMessage));
      const state = store.getState().report;
      expect(state.error).toBe(errorMessage);
      expect(state.loading).toBe(false);
    });

    it('should handle clearError', () => {
      store.dispatch(setError('Test error'));
      store.dispatch(clearError());
      expect(store.getState().report.error).toBeNull();
    });

    it('should handle clearCurrentReport', () => {
      const mockReport = {
        session: { id: '1', sessionType: 'Behavioral' },
        interactions: [],
        score: 85,
        feedback: 'Good job',
      };
      store.dispatch(setCurrentReport(mockReport));
      store.dispatch(clearCurrentReport());
      const state = store.getState().report;
      expect(state.currentReport).toBeNull();
      expect(state.error).toBeNull();
    });

    it('should handle setCurrentReport', () => {
      const mockReport = {
        session: { id: '1', sessionType: 'Behavioral' },
        interactions: [],
        score: 85,
        feedback: 'Good job',
      };
      store.dispatch(setCurrentReport(mockReport));
      expect(store.getState().report.currentReport).toEqual(mockReport);
    });

    it('should handle updateReportFeedback', () => {
      const mockReport = {
        session: { id: '1' },
        interactions: [],
        score: 85,
        feedback: 'Initial feedback',
      };
      store.dispatch(setCurrentReport(mockReport));
      
      const newFeedback = 'Updated feedback';
      store.dispatch(updateReportFeedback(newFeedback));
      
      expect(store.getState().report.currentReport.feedback).toBe(newFeedback);
    });

    it('should handle updateReportScore', () => {
      const mockReport = {
        session: { id: '1' },
        interactions: [],
        score: 85,
        feedback: 'Good job',
      };
      store.dispatch(setCurrentReport(mockReport));
      
      const newScore = 92;
      store.dispatch(updateReportScore(newScore));
      
      expect(store.getState().report.currentReport.score).toBe(newScore);
    });

    it('should handle clearUserReports', () => {
      // First set some reports
      const mockReports = [{ id: '1' }, { id: '2' }];
      store.dispatch(fetchUserReports.fulfilled({
        sessions: mockReports,
        total: 2,
        limit: 10,
        offset: 0,
        hasMore: false,
      }));
      
      store.dispatch(clearUserReports());
      const state = store.getState().report;
      expect(state.userReports).toEqual([]);
      expect(state.pagination).toEqual({
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      });
    });

    it('should handle resetReportState', () => {
      // Modify state first
      store.dispatch(setLoading(true));
      store.dispatch(setError('Test error'));
      
      store.dispatch(resetReportState());
      const state = store.getState().report;
      expect(state).toEqual({
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
          hasMore: false,
        },
      });
    });
  });

  describe('async thunks', () => {
    describe('fetchInterviewReport', () => {
      it('should handle successful fetch', async () => {
        const mockSession = { id: '1', sessionType: 'Behavioral', finalScore: 85 };
        const mockInteractions = [
          { id: '1', order: 1, questionText: 'Q1', userAnswerText: 'A1' },
          { id: '2', order: 2, questionText: 'Q2', userAnswerText: 'A2' },
        ];

        databaseService.getInterviewSession.mockResolvedValue({
          success: true,
          data: mockSession,
        });
        databaseService.getSessionInteractions.mockResolvedValue({
          success: true,
          data: mockInteractions,
        });

        await store.dispatch(fetchInterviewReport('1'));
        
        const state = store.getState().report;
        expect(state.fetchingReport).toBe(false);
        expect(state.currentReport).toEqual({
          session: mockSession,
          interactions: mockInteractions,
          score: 85,
          feedback: null,
        });
        expect(state.error).toBeNull();
      });

      it('should handle fetch error', async () => {
        databaseService.getInterviewSession.mockResolvedValue({
          success: false,
          error: 'Session not found',
        });

        await store.dispatch(fetchInterviewReport('1'));
        
        const state = store.getState().report;
        expect(state.fetchingReport).toBe(false);
        expect(state.error).toBe('Session not found');
        expect(state.currentReport).toBeNull();
      });

      it('should handle network error', async () => {
        databaseService.getInterviewSession.mockRejectedValue(new Error('Network error'));

        await store.dispatch(fetchInterviewReport('1'));
        
        const state = store.getState().report;
        expect(state.fetchingReport).toBe(false);
        expect(state.error).toBe('Network error');
      });
    });

    describe('generateDetailedFeedback', () => {
      it('should handle successful feedback generation', async () => {
        const mockFeedback = {
          overall: 'Great performance',
          strengths: ['Clear communication'],
          improvements: ['More specific examples'],
        };

        interviewService.generateDetailedFeedback.mockResolvedValue({
          success: true,
          data: mockFeedback,
        });

        // Set up current report first
        store.dispatch(setCurrentReport({
          session: { id: '1' },
          interactions: [],
          score: null,
          feedback: null,
        }));

        await store.dispatch(generateDetailedFeedback({
          sessionId: '1',
          interactions: [],
        }));
        
        const state = store.getState().report;
        expect(state.generatingFeedback).toBe(false);
        expect(state.currentReport.feedback).toEqual(mockFeedback);
        expect(state.error).toBeNull();
      });

      it('should handle feedback generation error', async () => {
        interviewService.generateDetailedFeedback.mockResolvedValue({
          success: false,
          error: 'AI service unavailable',
        });

        await store.dispatch(generateDetailedFeedback({
          sessionId: '1',
          interactions: [],
        }));
        
        const state = store.getState().report;
        expect(state.generatingFeedback).toBe(false);
        expect(state.error).toBe('AI service unavailable');
      });
    });

    describe('calculateInterviewScore', () => {
      it('should handle successful score calculation', async () => {
        const mockScore = { score: 87.5, breakdown: { communication: 90, technical: 85 } };

        interviewService.calculateInterviewScore.mockResolvedValue({
          success: true,
          data: mockScore,
        });

        // Set up current report first
        store.dispatch(setCurrentReport({
          session: { id: '1' },
          interactions: [],
          score: null,
          feedback: null,
        }));

        await store.dispatch(calculateInterviewScore([]));
        
        const state = store.getState().report;
        expect(state.calculatingScore).toBe(false);
        expect(state.currentReport.score).toEqual(mockScore);
        expect(state.error).toBeNull();
      });

      it('should handle score calculation error', async () => {
        interviewService.calculateInterviewScore.mockRejectedValue(new Error('Calculation failed'));

        await store.dispatch(calculateInterviewScore([]));
        
        const state = store.getState().report;
        expect(state.calculatingScore).toBe(false);
        expect(state.error).toBe('Calculation failed');
      });
    });

    describe('fetchUserReports', () => {
      it('should handle successful fetch with pagination', async () => {
        const mockSessions = [
          { id: '1', sessionType: 'Behavioral', finalScore: 85 },
          { id: '2', sessionType: 'Technical', finalScore: 90 },
        ];

        databaseService.getCompletedInterviewSessions.mockResolvedValue({
          success: true,
          data: mockSessions,
        });

        await store.dispatch(fetchUserReports({
          userId: 'user1',
          limit: 10,
          offset: 0,
        }));
        
        const state = store.getState().report;
        expect(state.loading).toBe(false);
        expect(state.userReports).toEqual(mockSessions);
        expect(state.pagination).toEqual({
          total: 2,
          limit: 10,
          offset: 0,
          hasMore: false,
        });
        expect(state.error).toBeNull();
      });

      it('should handle pagination correctly', async () => {
        const mockSessions = Array.from({ length: 15 }, (_, i) => ({
          id: `${i + 1}`,
          sessionType: 'Behavioral',
          finalScore: 80 + i,
        }));

        databaseService.getCompletedInterviewSessions.mockResolvedValue({
          success: true,
          data: mockSessions,
        });

        // First page
        await store.dispatch(fetchUserReports({
          userId: 'user1',
          limit: 10,
          offset: 0,
        }));
        
        let state = store.getState().report;
        expect(state.userReports).toHaveLength(10);
        expect(state.pagination.hasMore).toBe(true);

        // Second page (should append)
        await store.dispatch(fetchUserReports({
          userId: 'user1',
          limit: 10,
          offset: 10,
        }));
        
        state = store.getState().report;
        expect(state.userReports).toHaveLength(15); // 10 + 5
        expect(state.pagination.hasMore).toBe(false);
      });

      it('should handle fetch error', async () => {
        databaseService.getCompletedInterviewSessions.mockResolvedValue({
          success: false,
          error: 'Database error',
        });

        await store.dispatch(fetchUserReports({
          userId: 'user1',
          limit: 10,
          offset: 0,
        }));
        
        const state = store.getState().report;
        expect(state.loading).toBe(false);
        expect(state.error).toBe('Database error');
      });
    });

    describe('exportReport', () => {
      it('should handle successful export', async () => {
        const mockReport = {
          session: { id: '1', sessionType: 'Behavioral' },
          interactions: [{ id: '1', questionText: 'Q1', userAnswerText: 'A1' }],
          score: 85,
          feedback: 'Good job',
        };

        store.dispatch(setCurrentReport(mockReport));

        await store.dispatch(exportReport({
          sessionId: '1',
          format: 'json',
        }));
        
        const state = store.getState().report;
        expect(state.exportingReport).toBe(false);
        expect(state.error).toBeNull();
      });

      it('should handle export error when no report available', async () => {
        await store.dispatch(exportReport({
          sessionId: '1',
          format: 'json',
        }));
        
        const state = store.getState().report;
        expect(state.exportingReport).toBe(false);
        expect(state.error).toBe('Report data not available');
      });
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      const mockState = {
        currentReport: {
          session: {
            id: '1',
            sessionType: 'Behavioral',
            startedAt: '2024-01-01T10:00:00Z',
            completedAt: '2024-01-01T10:30:00Z',
          },
          interactions: [
            { id: '2', order: 2, questionText: 'Q2', userAnswerText: 'A2' },
            { id: '1', order: 1, questionText: 'Q1', userAnswerText: 'A1' },
          ],
          score: 87.5,
          feedback: 'Great job',
        },
        userReports: [
          { id: '1', finalScore: 85, sessionType: 'Behavioral' },
          { id: '2', finalScore: 90, sessionType: 'Technical' },
          { id: '3', finalScore: null, sessionType: 'Case Study' },
        ],
        loading: false,
        error: null,
        fetchingReport: false,
        generatingFeedback: false,
        calculatingScore: false,
        exportingReport: false,
        pagination: {
          total: 3,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      };

      store = configureStore({
        reducer: {
          report: () => mockState,
        },
      });
    });

    it('should select report state', () => {
      const result = selectReport(store.getState());
      expect(result).toBeDefined();
      expect(result.currentReport).toBeDefined();
    });

    it('should select current report', () => {
      const result = selectCurrentReport(store.getState());
      expect(result.session.id).toBe('1');
      expect(result.score).toBe(87.5);
    });

    it('should select user reports', () => {
      const result = selectUserReports(store.getState());
      expect(result).toHaveLength(3);
    });

    it('should select loading states', () => {
      expect(selectReportLoading(store.getState())).toBe(false);
      expect(selectReportError(store.getState())).toBeNull();
    });

    it('should select formatted current report', () => {
      const result = selectFormattedCurrentReport(store.getState());
      expect(result.formattedScore).toBe('87.5/100');
      expect(result.duration).toBe(30); // 30 minutes
      expect(result.interactionCount).toBe(2);
    });

    it('should select sorted interactions', () => {
      const result = selectSortedInteractions(store.getState());
      expect(result).toHaveLength(2);
      expect(result[0].order).toBe(1);
      expect(result[1].order).toBe(2);
    });

    it('should select report statistics', () => {
      const result = selectReportStatistics(store.getState());
      expect(result.totalReports).toBe(3);
      expect(result.completedReports).toBe(2);
      expect(result.averageScore).toBe(87.5); // (85 + 90) / 2
      expect(result.bestScore).toBe(90);
      expect(result.sessionTypes).toEqual({
        Behavioral: 1,
        Technical: 1,
        'Case Study': 1,
      });
    });

    it('should handle empty reports in statistics', () => {
      const emptyStore = configureStore({
        reducer: {
          report: () => ({
            ...store.getState().report,
            userReports: [],
          }),
        },
      });

      const result = selectReportStatistics(emptyStore.getState());
      expect(result).toBeNull();
    });
  });
});