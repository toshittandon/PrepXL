import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { dashboardApi } from '../store/api/dashboardApi.js';
import { databaseService } from '../services/appwrite/database.js';

// Mock the database service
vi.mock('../services/appwrite/database.js', () => ({
  databaseService: {
    getDashboardData: vi.fn(),
    getUserInterviewSessions: vi.fn(),
    getCompletedInterviewSessions: vi.fn(),
    getActiveInterviewSessions: vi.fn(),
    getUserResumes: vi.fn(),
    getUser: vi.fn(),
  },
}));

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      [dashboardApi.reducerPath]: dashboardApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(dashboardApi.middleware),
  });
};

describe('Dashboard API', () => {
  let store;

  beforeEach(() => {
    store = createTestStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    store.dispatch(dashboardApi.util.resetApiState());
  });

  describe('getDashboardData', () => {
    const mockUserId = 'user123';
    const mockDashboardData = {
      success: true,
      data: {
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com',
        },
        sessions: [
          {
            id: 'session1',
            sessionType: 'Behavioral',
            role: 'Software Engineer',
            status: 'completed',
            finalScore: 85,
            startedAt: '2024-01-15T10:00:00Z',
            completedAt: '2024-01-15T10:30:00Z',
          },
          {
            id: 'session2',
            sessionType: 'Technical',
            role: 'Frontend Developer',
            status: 'active',
            startedAt: '2024-01-16T14:00:00Z',
          },
        ],
        resumes: [
          {
            id: 'resume1',
            fileName: 'john_doe_resume.pdf',
            uploadedAt: '2024-01-10T09:00:00Z',
          },
        ],
      },
    };

    it('should fetch dashboard data successfully', async () => {
      databaseService.getDashboardData.mockResolvedValue(mockDashboardData);

      const result = await store.dispatch(
        dashboardApi.endpoints.getDashboardData.initiate(mockUserId)
      );

      expect(result.data).toBeDefined();
      expect(result.data.user).toEqual(mockDashboardData.data.user);
      expect(result.data.sessions).toEqual(mockDashboardData.data.sessions);
      expect(result.data.resumes).toEqual(mockDashboardData.data.resumes);
      expect(result.data.statistics).toBeDefined();
      expect(result.data.statistics.totalSessions).toBe(2);
      expect(result.data.statistics.completedSessions).toBe(1);
      expect(result.data.statistics.activeSessions).toBe(1);
      expect(result.data.statistics.averageScore).toBe(85);
      expect(result.data.statistics.totalResumes).toBe(1);
      expect(databaseService.getDashboardData).toHaveBeenCalledWith(mockUserId);
    });

    it('should calculate statistics correctly', async () => {
      const mockDataWithMultipleSessions = {
        success: true,
        data: {
          user: mockDashboardData.data.user,
          sessions: [
            {
              id: 'session1',
              sessionType: 'Behavioral',
              status: 'completed',
              finalScore: 80,
            },
            {
              id: 'session2',
              sessionType: 'Technical',
              status: 'completed',
              finalScore: 90,
            },
            {
              id: 'session3',
              sessionType: 'Behavioral',
              status: 'active',
            },
          ],
          resumes: [],
        },
      };

      databaseService.getDashboardData.mockResolvedValue(mockDataWithMultipleSessions);

      const result = await store.dispatch(
        dashboardApi.endpoints.getDashboardData.initiate(mockUserId)
      );

      expect(result.data.statistics.totalSessions).toBe(3);
      expect(result.data.statistics.completedSessions).toBe(2);
      expect(result.data.statistics.activeSessions).toBe(1);
      expect(result.data.statistics.averageScore).toBe(85); // (80 + 90) / 2
      expect(result.data.statistics.sessionsByType).toEqual({
        Behavioral: 2,
        Technical: 1,
      });
    });

    it('should handle database service errors', async () => {
      const mockError = 'Database connection failed';
      databaseService.getDashboardData.mockResolvedValue({
        success: false,
        error: mockError,
      });

      const result = await store.dispatch(
        dashboardApi.endpoints.getDashboardData.initiate(mockUserId)
      );

      expect(result.error).toBeDefined();
      expect(result.error.error).toBe(mockError);
    });

    it('should handle exceptions', async () => {
      const mockError = new Error('Network error');
      databaseService.getDashboardData.mockRejectedValue(mockError);

      const result = await store.dispatch(
        dashboardApi.endpoints.getDashboardData.initiate(mockUserId)
      );

      expect(result.error).toBeDefined();
      expect(result.error.error).toBe('Network error');
    });
  });

  describe('getSessionHistory', () => {
    const mockUserId = 'user123';
    const mockSessions = [
      {
        id: 'session1',
        sessionType: 'Behavioral',
        status: 'completed',
        startedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'session2',
        sessionType: 'Technical',
        status: 'completed',
        startedAt: '2024-01-14T10:00:00Z',
      },
      {
        id: 'session3',
        sessionType: 'Case Study',
        status: 'active',
        startedAt: '2024-01-13T10:00:00Z',
      },
    ];

    it('should fetch all sessions by default', async () => {
      databaseService.getUserInterviewSessions.mockResolvedValue({
        success: true,
        data: mockSessions,
      });

      const result = await store.dispatch(
        dashboardApi.endpoints.getSessionHistory.initiate({
          userId: mockUserId,
          limit: 10,
          offset: 0,
        })
      );

      expect(result.data.sessions).toEqual(mockSessions);
      expect(result.data.total).toBe(3);
      expect(result.data.hasMore).toBe(false);
      expect(databaseService.getUserInterviewSessions).toHaveBeenCalledWith(mockUserId);
    });

    it('should fetch completed sessions when status is specified', async () => {
      const completedSessions = mockSessions.filter(s => s.status === 'completed');
      databaseService.getCompletedInterviewSessions.mockResolvedValue({
        success: true,
        data: completedSessions,
      });

      const result = await store.dispatch(
        dashboardApi.endpoints.getSessionHistory.initiate({
          userId: mockUserId,
          status: 'completed',
        })
      );

      expect(result.data.sessions).toEqual(completedSessions);
      expect(databaseService.getCompletedInterviewSessions).toHaveBeenCalledWith(mockUserId);
    });

    it('should fetch active sessions when status is specified', async () => {
      const activeSessions = mockSessions.filter(s => s.status === 'active');
      databaseService.getActiveInterviewSessions.mockResolvedValue({
        success: true,
        data: activeSessions,
      });

      const result = await store.dispatch(
        dashboardApi.endpoints.getSessionHistory.initiate({
          userId: mockUserId,
          status: 'active',
        })
      );

      expect(result.data.sessions).toEqual(activeSessions);
      expect(databaseService.getActiveInterviewSessions).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle pagination correctly', async () => {
      databaseService.getUserInterviewSessions.mockResolvedValue({
        success: true,
        data: mockSessions,
      });

      const result = await store.dispatch(
        dashboardApi.endpoints.getSessionHistory.initiate({
          userId: mockUserId,
          limit: 2,
          offset: 1,
        })
      );

      expect(result.data.sessions).toHaveLength(2);
      expect(result.data.sessions[0]).toEqual(mockSessions[1]);
      expect(result.data.sessions[1]).toEqual(mockSessions[2]);
      expect(result.data.total).toBe(3);
      expect(result.data.hasMore).toBe(false);
    });

    it('should handle database service errors', async () => {
      databaseService.getUserInterviewSessions.mockResolvedValue({
        success: false,
        error: 'Failed to fetch sessions',
      });

      const result = await store.dispatch(
        dashboardApi.endpoints.getSessionHistory.initiate({
          userId: mockUserId,
        })
      );

      expect(result.error).toBeDefined();
      expect(result.error.error).toBe('Failed to fetch sessions');
    });
  });

  describe('getUserStatistics', () => {
    const mockUserId = 'user123';
    const mockSessions = [
      {
        id: 'session1',
        sessionType: 'Behavioral',
        status: 'completed',
        finalScore: 85,
        completedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'session2',
        sessionType: 'Technical',
        status: 'completed',
        finalScore: 90,
        completedAt: '2024-01-14T10:00:00Z',
      },
      {
        id: 'session3',
        sessionType: 'Behavioral',
        status: 'active',
        startedAt: '2024-01-13T10:00:00Z',
      },
    ];

    const mockResumes = [
      { id: 'resume1', fileName: 'resume1.pdf' },
      { id: 'resume2', fileName: 'resume2.pdf' },
    ];

    beforeEach(() => {
      databaseService.getUserInterviewSessions.mockResolvedValue({
        success: true,
        data: mockSessions,
      });
      databaseService.getUserResumes.mockResolvedValue({
        success: true,
        data: mockResumes,
      });
    });

    it('should calculate user statistics correctly', async () => {
      const result = await store.dispatch(
        dashboardApi.endpoints.getUserStatistics.initiate(mockUserId)
      );

      expect(result.data.totalSessions).toBe(3);
      expect(result.data.completedSessions).toBe(2);
      expect(result.data.activeSessions).toBe(1);
      expect(result.data.totalResumes).toBe(2);
      expect(result.data.averageScore).toBe(87.5); // (85 + 90) / 2
      expect(result.data.sessionsByType).toEqual({
        Behavioral: 2,
        Technical: 1,
      });
    });

    it('should calculate performance by type correctly', async () => {
      const result = await store.dispatch(
        dashboardApi.endpoints.getUserStatistics.initiate(mockUserId)
      );

      expect(result.data.performanceByType.Behavioral).toEqual({
        count: 1, // Only completed sessions count
        averageScore: 85,
      });
      expect(result.data.performanceByType.Technical).toEqual({
        count: 1,
        averageScore: 90,
      });
    });

    it('should handle empty data gracefully', async () => {
      databaseService.getUserInterviewSessions.mockResolvedValue({
        success: true,
        data: [],
      });
      databaseService.getUserResumes.mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await store.dispatch(
        dashboardApi.endpoints.getUserStatistics.initiate(mockUserId)
      );

      expect(result.data.totalSessions).toBe(0);
      expect(result.data.completedSessions).toBe(0);
      expect(result.data.activeSessions).toBe(0);
      expect(result.data.totalResumes).toBe(0);
      expect(result.data.averageScore).toBe(0);
      expect(result.data.sessionsByType).toEqual({});
    });
  });

  describe('getRecentActivity', () => {
    const mockUserId = 'user123';
    const mockSessions = [
      {
        id: 'session1',
        sessionType: 'Behavioral',
        role: 'Software Engineer',
        status: 'completed',
        startedAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-15T10:30:00Z',
      },
    ];

    const mockResumes = [
      {
        id: 'resume1',
        fileName: 'john_doe_resume.pdf',
        uploadedAt: '2024-01-14T09:00:00Z',
      },
    ];

    beforeEach(() => {
      databaseService.getUserInterviewSessions.mockResolvedValue({
        success: true,
        data: mockSessions,
      });
      databaseService.getUserResumes.mockResolvedValue({
        success: true,
        data: mockResumes,
      });
    });

    it('should fetch and format recent activities correctly', async () => {
      const result = await store.dispatch(
        dashboardApi.endpoints.getRecentActivity.initiate({
          userId: mockUserId,
          limit: 5,
        })
      );

      expect(result.data.activities).toHaveLength(2);
      expect(result.data.total).toBe(2);

      // Check session activity
      const sessionActivity = result.data.activities.find(a => a.type === 'session');
      expect(sessionActivity).toBeDefined();
      expect(sessionActivity.action).toBe('completed');
      expect(sessionActivity.title).toBe('Behavioral Interview - Software Engineer');
      expect(sessionActivity.timestamp).toBe('2024-01-15T10:30:00Z');

      // Check resume activity
      const resumeActivity = result.data.activities.find(a => a.type === 'resume');
      expect(resumeActivity).toBeDefined();
      expect(resumeActivity.action).toBe('uploaded');
      expect(resumeActivity.title).toBe('Resume: john_doe_resume.pdf');
      expect(resumeActivity.timestamp).toBe('2024-01-14T09:00:00Z');
    });

    it('should sort activities by timestamp (most recent first)', async () => {
      const result = await store.dispatch(
        dashboardApi.endpoints.getRecentActivity.initiate({
          userId: mockUserId,
          limit: 5,
        })
      );

      const timestamps = result.data.activities.map(a => new Date(a.timestamp));
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i-1].getTime()).toBeGreaterThanOrEqual(timestamps[i].getTime());
      }
    });

    it('should respect the limit parameter', async () => {
      const result = await store.dispatch(
        dashboardApi.endpoints.getRecentActivity.initiate({
          userId: mockUserId,
          limit: 1,
        })
      );

      expect(result.data.activities).toHaveLength(1);
      expect(result.data.total).toBe(2); // Total should still reflect all activities
    });
  });

  describe('getDashboardSummary', () => {
    const mockUserId = 'user123';
    const mockUser = {
      id: mockUserId,
      name: 'John Doe',
      email: 'john@example.com',
    };

    const mockSessions = [
      {
        id: 'session1',
        status: 'completed',
        startedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'session2',
        status: 'active',
        startedAt: '2024-01-14T10:00:00Z',
      },
    ];

    beforeEach(() => {
      databaseService.getUser.mockResolvedValue({
        success: true,
        data: mockUser,
      });
      databaseService.getUserInterviewSessions.mockResolvedValue({
        success: true,
        data: mockSessions,
      });
    });

    it('should fetch dashboard summary successfully', async () => {
      const result = await store.dispatch(
        dashboardApi.endpoints.getDashboardSummary.initiate(mockUserId)
      );

      expect(result.data.user).toEqual(mockUser);
      expect(result.data.summary.totalSessions).toBe(2);
      expect(result.data.summary.completedSessions).toBe(1);
      expect(result.data.summary.activeSessions).toBe(1);
      expect(result.data.summary.lastSessionDate).toBe('2024-01-15T10:00:00Z');
    });

    it('should handle user fetch errors', async () => {
      databaseService.getUser.mockResolvedValue({
        success: false,
        error: 'User not found',
      });

      const result = await store.dispatch(
        dashboardApi.endpoints.getDashboardSummary.initiate(mockUserId)
      );

      expect(result.error).toBeDefined();
      expect(result.error.error).toBe('User not found');
    });

    it('should handle empty sessions gracefully', async () => {
      databaseService.getUserInterviewSessions.mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await store.dispatch(
        dashboardApi.endpoints.getDashboardSummary.initiate(mockUserId)
      );

      expect(result.data.summary.totalSessions).toBe(0);
      expect(result.data.summary.completedSessions).toBe(0);
      expect(result.data.summary.activeSessions).toBe(0);
      expect(result.data.summary.lastSessionDate).toBeNull();
    });
  });
});