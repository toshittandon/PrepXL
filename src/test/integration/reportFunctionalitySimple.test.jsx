import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice.js';
import reportReducer, { 
  fetchInterviewReport, 
  fetchUserReports,
  generateDetailedFeedback,
  exportReport
} from '../../store/slices/reportSlice.js';

// Mock the services
vi.mock('../../services/appwrite/database.js', () => ({
  databaseService: {
    getInterviewSession: vi.fn(),
    getSessionInteractions: vi.fn(),
    getCompletedInterviewSessions: vi.fn(),
  },
}));

vi.mock('../../services/ai/interviewService.js', () => ({
  interviewService: {
    generateDetailedFeedback: vi.fn(),
  },
}));

import { databaseService } from '../../services/appwrite/database.js';
import { interviewService } from '../../services/ai/interviewService.js';

// Helper function to create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      report: reportReducer,
    },
    preloadedState: {
      auth: {
        user: { id: 'user-123', name: 'Test User', email: 'test@example.com' },
        session: { id: 'session-123' },
        loading: false,
        error: null,
      },
      report: {
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
      },
      ...initialState,
    },
  });
};

// Mock data
const mockSession = {
  id: 'test-session-123',
  userId: 'user-123',
  role: 'Software Engineer',
  sessionType: 'Technical',
  status: 'completed',
  finalScore: 85,
  startedAt: '2024-01-15T10:00:00Z',
  completedAt: '2024-01-15T10:30:00Z',
  feedback: 'Great technical knowledge demonstrated.'
};

const mockInteractions = [
  {
    id: 'int-1',
    sessionId: 'test-session-123',
    questionText: 'What is your experience with React?',
    userAnswerText: 'I have 3 years of experience with React and have built several applications.',
    order: 1,
    timestamp: '2024-01-15T10:05:00Z'
  },
  {
    id: 'int-2',
    sessionId: 'test-session-123',
    questionText: 'How do you handle state management?',
    userAnswerText: 'I use Redux for complex state and useState for simple component state.',
    order: 2,
    timestamp: '2024-01-15T10:10:00Z'
  }
];

const mockUserReports = [
  {
    id: 'session-1',
    userId: 'user-123',
    role: 'Frontend Developer',
    sessionType: 'Technical',
    status: 'completed',
    finalScore: 88,
    startedAt: '2024-01-14T09:00:00Z',
    completedAt: '2024-01-14T09:45:00Z'
  },
  {
    id: 'session-2',
    userId: 'user-123',
    role: 'Product Manager',
    sessionType: 'Behavioral',
    status: 'completed',
    finalScore: 92,
    startedAt: '2024-01-13T14:00:00Z',
    completedAt: '2024-01-13T14:30:00Z'
  }
];

describe('Report Functionality Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Data Fetching Integration', () => {
    it('should fetch interview report data successfully', async () => {
      databaseService.getInterviewSession.mockResolvedValue({
        success: true,
        data: mockSession,
      });

      databaseService.getSessionInteractions.mockResolvedValue({
        success: true,
        data: mockInteractions,
      });

      const store = createTestStore();
      
      // Dispatch the fetch action
      const result = await store.dispatch(fetchInterviewReport('test-session-123'));
      
      // Check that the action was fulfilled
      expect(result.type).toBe('report/fetchReport/fulfilled');
      expect(result.payload.session).toEqual(mockSession);
      expect(result.payload.interactions).toEqual(mockInteractions);

      // Check store state
      const state = store.getState();
      expect(state.report.currentReport).toBeTruthy();
      expect(state.report.currentReport.session).toEqual(mockSession);
      expect(state.report.currentReport.interactions).toEqual(mockInteractions);
      expect(state.report.fetchingReport).toBe(false);
    });

    it('should handle fetch interview report errors', async () => {
      databaseService.getInterviewSession.mockResolvedValue({
        success: false,
        error: 'Session not found',
      });

      const store = createTestStore();
      
      const result = await store.dispatch(fetchInterviewReport('invalid-session'));
      
      expect(result.type).toBe('report/fetchReport/rejected');
      expect(result.payload).toBe('Session not found');

      const state = store.getState();
      expect(state.report.error).toBe('Session not found');
      expect(state.report.fetchingReport).toBe(false);
    });

    it('should fetch user reports with pagination', async () => {
      databaseService.getCompletedInterviewSessions.mockResolvedValue({
        success: true,
        data: mockUserReports,
      });

      const store = createTestStore();
      
      const result = await store.dispatch(fetchUserReports({
        userId: 'user-123',
        limit: 10,
        offset: 0
      }));
      
      expect(result.type).toBe('report/fetchUserReports/fulfilled');
      expect(result.payload.sessions).toEqual(mockUserReports);
      expect(result.payload.total).toBe(2);

      const state = store.getState();
      expect(state.report.userReports).toEqual(mockUserReports);
      expect(state.report.pagination.total).toBe(2);
    });
  });

  describe('AI Feedback Generation Integration', () => {
    it('should generate detailed feedback successfully', async () => {
      const mockFeedback = {
        overall: 'Strong technical performance with good problem-solving skills.',
        strengths: ['Clear communication', 'Good technical knowledge'],
        improvements: ['Could provide more specific examples', 'Consider edge cases']
      };

      interviewService.generateDetailedFeedback.mockResolvedValue({
        success: true,
        data: mockFeedback,
      });

      const store = createTestStore({
        report: {
          currentReport: {
            session: mockSession,
            interactions: mockInteractions,
            score: 85,
            feedback: null
          },
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
        }
      });
      
      const result = await store.dispatch(generateDetailedFeedback({
        sessionId: 'test-session-123',
        interactions: mockInteractions
      }));
      
      expect(result.type).toBe('report/generateFeedback/fulfilled');
      expect(result.payload).toEqual(mockFeedback);

      const state = store.getState();
      expect(state.report.currentReport.feedback).toEqual(mockFeedback);
      expect(state.report.generatingFeedback).toBe(false);
    });

    it('should handle feedback generation errors', async () => {
      interviewService.generateDetailedFeedback.mockResolvedValue({
        success: false,
        error: 'AI service unavailable',
      });

      const store = createTestStore({
        report: {
          currentReport: {
            session: mockSession,
            interactions: mockInteractions,
            score: 85,
            feedback: null
          },
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
        }
      });
      
      const result = await store.dispatch(generateDetailedFeedback({
        sessionId: 'test-session-123',
        interactions: mockInteractions
      }));
      
      expect(result.type).toBe('report/generateFeedback/rejected');
      expect(result.payload).toBe('AI service unavailable');

      const state = store.getState();
      expect(state.report.error).toBe('AI service unavailable');
      expect(state.report.generatingFeedback).toBe(false);
    });
  });

  describe('Export Functionality Integration', () => {
    it('should export report data successfully', async () => {
      const store = createTestStore({
        report: {
          currentReport: {
            session: mockSession,
            interactions: mockInteractions,
            score: 85,
            feedback: 'Great performance'
          },
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
        }
      });
      
      const result = await store.dispatch(exportReport({
        sessionId: 'test-session-123',
        format: 'json'
      }));
      
      expect(result.type).toBe('report/exportReport/fulfilled');
      expect(result.payload.data).toBeTruthy();
      expect(result.payload.filename).toContain('test-session-123');
      expect(result.payload.format).toBe('json');

      const state = store.getState();
      expect(state.report.exportingReport).toBe(false);
    });

    it('should handle export errors when no report is available', async () => {
      const store = createTestStore(); // No current report
      
      const result = await store.dispatch(exportReport({
        sessionId: 'test-session-123',
        format: 'json'
      }));
      
      expect(result.type).toBe('report/exportReport/rejected');
      expect(result.payload).toBe('Report data not available');

      const state = store.getState();
      expect(state.report.error).toBe('Report data not available');
      expect(state.report.exportingReport).toBe(false);
    });
  });

  describe('Navigation and Data Flow Integration', () => {
    it('should handle complete report viewing workflow', async () => {
      // Step 1: Fetch user reports list
      databaseService.getCompletedInterviewSessions.mockResolvedValue({
        success: true,
        data: mockUserReports,
      });

      const store = createTestStore();
      
      let result = await store.dispatch(fetchUserReports({
        userId: 'user-123',
        limit: 10,
        offset: 0
      }));
      
      expect(result.type).toBe('report/fetchUserReports/fulfilled');
      expect(store.getState().report.userReports).toEqual(mockUserReports);

      // Step 2: Fetch specific report
      databaseService.getInterviewSession.mockResolvedValue({
        success: true,
        data: mockSession,
      });

      databaseService.getSessionInteractions.mockResolvedValue({
        success: true,
        data: mockInteractions,
      });

      result = await store.dispatch(fetchInterviewReport('test-session-123'));
      
      expect(result.type).toBe('report/fetchReport/fulfilled');
      expect(store.getState().report.currentReport.session).toEqual(mockSession);

      // Step 3: Generate feedback
      const mockFeedback = 'Excellent technical skills demonstrated';
      interviewService.generateDetailedFeedback.mockResolvedValue({
        success: true,
        data: mockFeedback,
      });

      result = await store.dispatch(generateDetailedFeedback({
        sessionId: 'test-session-123',
        interactions: mockInteractions
      }));
      
      expect(result.type).toBe('report/generateFeedback/fulfilled');
      expect(store.getState().report.currentReport.feedback).toEqual(mockFeedback);

      // Step 4: Export report
      result = await store.dispatch(exportReport({
        sessionId: 'test-session-123',
        format: 'json'
      }));
      
      expect(result.type).toBe('report/exportReport/fulfilled');
      expect(result.payload.data).toBeTruthy();
    });

    it('should handle error recovery in report workflow', async () => {
      const store = createTestStore();

      // Step 1: Failed reports list load
      databaseService.getCompletedInterviewSessions.mockResolvedValueOnce({
        success: false,
        error: 'Network error',
      });

      let result = await store.dispatch(fetchUserReports({
        userId: 'user-123',
        limit: 10,
        offset: 0
      }));
      
      expect(result.type).toBe('report/fetchUserReports/rejected');
      expect(store.getState().report.error).toBe('Network error');

      // Step 2: Successful retry
      databaseService.getCompletedInterviewSessions.mockResolvedValueOnce({
        success: true,
        data: mockUserReports,
      });

      result = await store.dispatch(fetchUserReports({
        userId: 'user-123',
        limit: 10,
        offset: 0
      }));
      
      expect(result.type).toBe('report/fetchUserReports/fulfilled');
      expect(store.getState().report.userReports).toEqual(mockUserReports);
      expect(store.getState().report.error).toBe(null); // Error should be cleared
    });
  });

  describe('State Management Integration', () => {
    it('should maintain consistent state across multiple operations', async () => {
      const store = createTestStore();

      // Initial state should be clean
      let state = store.getState().report;
      expect(state.currentReport).toBe(null);
      expect(state.userReports).toEqual([]);
      expect(state.loading).toBe(false);

      // Fetch user reports
      databaseService.getCompletedInterviewSessions.mockResolvedValue({
        success: true,
        data: mockUserReports,
      });

      await store.dispatch(fetchUserReports({
        userId: 'user-123',
        limit: 10,
        offset: 0
      }));

      state = store.getState().report;
      expect(state.userReports).toEqual(mockUserReports);
      expect(state.pagination.total).toBe(2);

      // Fetch specific report
      databaseService.getInterviewSession.mockResolvedValue({
        success: true,
        data: mockSession,
      });

      databaseService.getSessionInteractions.mockResolvedValue({
        success: true,
        data: mockInteractions,
      });

      await store.dispatch(fetchInterviewReport('test-session-123'));

      state = store.getState().report;
      expect(state.currentReport).toBeTruthy();
      expect(state.userReports).toEqual(mockUserReports); // Should still be there
      expect(state.currentReport.session).toEqual(mockSession);
      expect(state.currentReport.interactions).toEqual(mockInteractions);

      // Clear current report
      store.dispatch({ type: 'report/clearCurrentReport' });

      state = store.getState().report;
      expect(state.currentReport).toBe(null);
      expect(state.userReports).toEqual(mockUserReports); // Should still be there
    });
  });
});