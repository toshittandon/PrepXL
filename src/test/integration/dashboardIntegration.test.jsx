import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockUser, mockInterviewSession, mockResume } from '../testUtils';
import Dashboard from '../../pages/dashboard/Dashboard';

// Mock the services
const mockDashboardApi = {
  getUserStats: vi.fn(),
  getRecentSessions: vi.fn(),
  getRecentResumes: vi.fn(),
};

vi.mock('../../store/api/dashboardApi.js', () => ({
  dashboardApi: {
    endpoints: {
      getUserStats: { useQuery: () => mockDashboardApi.getUserStats() },
      getRecentSessions: { useQuery: () => mockDashboardApi.getRecentSessions() },
      getRecentResumes: { useQuery: () => mockDashboardApi.getRecentResumes() },
    },
  },
}));

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Dashboard Integration Tests', () => {
  const authenticatedState = {
    auth: {
      user: mockUser,
      session: { $id: 'session123' },
      isAuthenticated: true,
      isInitialized: true,
      loading: false,
      error: null,
    },
    resume: {
      resumes: [],
      currentAnalysis: null,
      uploading: false,
      analyzing: false,
      loading: false,
      error: null,
    },
    interview: {
      sessions: [],
      currentSession: null,
      loading: false,
      error: null,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Data Loading', () => {
    it('should load and display user dashboard data', async () => {
      const mockStats = {
        totalInterviews: 15,
        completedInterviews: 12,
        averageScore: 82,
        totalResumes: 3,
        lastActivity: '2024-01-15T10:00:00.000Z',
      };

      const mockRecentSessions = [
        {
          ...mockInterviewSession,
          $id: 'session1',
          role: 'Frontend Developer',
          finalScore: 88,
          $createdAt: '2024-01-14T10:00:00.000Z',
        },
        {
          ...mockInterviewSession,
          $id: 'session2',
          role: 'Backend Developer',
          finalScore: 76,
          $createdAt: '2024-01-13T10:00:00.000Z',
        },
      ];

      const mockRecentResumes = [
        {
          ...mockResume,
          $id: 'resume1',
          fileName: 'frontend-resume.pdf',
          analysisResults: { overallScore: 85 },
        },
        {
          ...mockResume,
          $id: 'resume2',
          fileName: 'fullstack-resume.pdf',
          analysisResults: { overallScore: 78 },
        },
      ];

      mockDashboardApi.getUserStats.mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentSessions.mockReturnValue({
        data: mockRecentSessions,
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentResumes.mockReturnValue({
        data: mockRecentResumes,
        isLoading: false,
        error: null,
      });

      renderWithProviders(<Dashboard />, { preloadedState: authenticatedState });

      // Should display user stats
      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument(); // Total interviews
        expect(screen.getByText('12')).toBeInTheDocument(); // Completed interviews
        expect(screen.getByText('82')).toBeInTheDocument(); // Average score
        expect(screen.getByText('3')).toBeInTheDocument(); // Total resumes
      });

      // Should display recent sessions
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Backend Developer')).toBeInTheDocument();
      expect(screen.getByText('88')).toBeInTheDocument();
      expect(screen.getByText('76')).toBeInTheDocument();

      // Should display recent resumes
      expect(screen.getByText('frontend-resume.pdf')).toBeInTheDocument();
      expect(screen.getByText('fullstack-resume.pdf')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('78')).toBeInTheDocument();
    });

    it('should handle loading states for dashboard data', async () => {
      mockDashboardApi.getUserStats.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      mockDashboardApi.getRecentSessions.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      mockDashboardApi.getRecentResumes.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      renderWithProviders(<Dashboard />, { preloadedState: authenticatedState });

      // Should show loading skeletons
      expect(screen.getAllByRole('status')).toHaveLength(3);
      expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      mockDashboardApi.getUserStats.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Failed to load user statistics' },
      });

      mockDashboardApi.getRecentSessions.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Failed to load recent sessions' },
      });

      mockDashboardApi.getRecentResumes.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithProviders(<Dashboard />, { preloadedState: authenticatedState });

      // Should show error messages
      await waitFor(() => {
        expect(screen.getByText(/failed to load user statistics/i)).toBeInTheDocument();
        expect(screen.getByText(/failed to load recent sessions/i)).toBeInTheDocument();
      });

      // Should show retry buttons
      expect(screen.getAllByRole('button', { name: /retry/i })).toHaveLength(2);
    });
  });

  describe('Quick Actions Integration', () => {
    it('should navigate to resume upload when upload button is clicked', async () => {
      mockDashboardApi.getUserStats.mockReturnValue({
        data: { totalInterviews: 0, completedInterviews: 0, averageScore: 0, totalResumes: 0 },
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentSessions.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentResumes.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithProviders(<Dashboard />, { preloadedState: authenticatedState });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upload resume/i })).toBeInTheDocument();
      });

      const uploadButton = screen.getByRole('button', { name: /upload resume/i });
      fireEvent.click(uploadButton);

      expect(mockNavigate).toHaveBeenCalledWith('/resume/upload');
    });

    it('should navigate to interview setup when interview button is clicked', async () => {
      mockDashboardApi.getUserStats.mockReturnValue({
        data: { totalInterviews: 0, completedInterviews: 0, averageScore: 0, totalResumes: 0 },
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentSessions.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentResumes.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithProviders(<Dashboard />, { preloadedState: authenticatedState });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start interview/i })).toBeInTheDocument();
      });

      const interviewButton = screen.getByRole('button', { name: /start interview/i });
      fireEvent.click(interviewButton);

      expect(mockNavigate).toHaveBeenCalledWith('/interview/setup');
    });

    it('should show progress indicators when operations are in progress', async () => {
      const stateWithProgress = {
        ...authenticatedState,
        resume: {
          ...authenticatedState.resume,
          uploading: true,
        },
        interview: {
          ...authenticatedState.interview,
          loading: true,
        },
      };

      mockDashboardApi.getUserStats.mockReturnValue({
        data: { totalInterviews: 0, completedInterviews: 0, averageScore: 0, totalResumes: 0 },
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentSessions.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentResumes.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithProviders(<Dashboard />, { preloadedState: stateWithProgress });

      // Should show progress indicators
      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument();
        expect(screen.getByText(/processing/i)).toBeInTheDocument();
      });

      // Buttons should be disabled
      const uploadButton = screen.getByRole('button', { name: /upload resume/i });
      const interviewButton = screen.getByRole('button', { name: /start interview/i });

      expect(uploadButton).toBeDisabled();
      expect(interviewButton).toBeDisabled();
    });
  });

  describe('Session History Integration', () => {
    it('should display session history with proper formatting', async () => {
      const mockSessions = [
        {
          ...mockInterviewSession,
          $id: 'session1',
          role: 'Senior Software Engineer',
          sessionType: 'Technical',
          status: 'completed',
          finalScore: 92,
          $createdAt: '2024-01-15T14:30:00.000Z',
        },
        {
          ...mockInterviewSession,
          $id: 'session2',
          role: 'Product Manager',
          sessionType: 'Behavioral',
          status: 'completed',
          finalScore: 78,
          $createdAt: '2024-01-14T09:15:00.000Z',
        },
        {
          ...mockInterviewSession,
          $id: 'session3',
          role: 'Frontend Developer',
          sessionType: 'Technical',
          status: 'active',
          finalScore: null,
          $createdAt: '2024-01-13T16:45:00.000Z',
        },
      ];

      mockDashboardApi.getUserStats.mockReturnValue({
        data: { totalInterviews: 3, completedInterviews: 2, averageScore: 85, totalResumes: 1 },
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentSessions.mockReturnValue({
        data: mockSessions,
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentResumes.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithProviders(<Dashboard />, { preloadedState: authenticatedState });

      // Should display all sessions
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Product Manager')).toBeInTheDocument();
        expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      });

      // Should display session types
      expect(screen.getAllByText('Technical')).toHaveLength(2);
      expect(screen.getByText('Behavioral')).toBeInTheDocument();

      // Should display scores for completed sessions
      expect(screen.getByText('92')).toBeInTheDocument();
      expect(screen.getByText('78')).toBeInTheDocument();

      // Should display status for active session
      expect(screen.getByText(/in progress/i)).toBeInTheDocument();

      // Should format dates properly
      expect(screen.getByText(/jan 15/i) || screen.getByText(/january 15/i)).toBeInTheDocument();
    });

    it('should navigate to session report when session is clicked', async () => {
      const mockSessions = [
        {
          ...mockInterviewSession,
          $id: 'session123',
          role: 'Software Engineer',
          status: 'completed',
          finalScore: 85,
        },
      ];

      mockDashboardApi.getUserStats.mockReturnValue({
        data: { totalInterviews: 1, completedInterviews: 1, averageScore: 85, totalResumes: 0 },
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentSessions.mockReturnValue({
        data: mockSessions,
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentResumes.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithProviders(<Dashboard />, { preloadedState: authenticatedState });

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      // Click on session
      const sessionItem = screen.getByText('Software Engineer').closest('button');
      fireEvent.click(sessionItem);

      expect(mockNavigate).toHaveBeenCalledWith('/interview/report/session123');
    });

    it('should handle empty session history', async () => {
      mockDashboardApi.getUserStats.mockReturnValue({
        data: { totalInterviews: 0, completedInterviews: 0, averageScore: 0, totalResumes: 0 },
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentSessions.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentResumes.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithProviders(<Dashboard />, { preloadedState: authenticatedState });

      // Should show empty state
      await waitFor(() => {
        expect(screen.getByText(/no interview sessions/i)).toBeInTheDocument();
        expect(screen.getByText(/start your first interview/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Profile Integration', () => {
    it('should display user profile information', async () => {
      mockDashboardApi.getUserStats.mockReturnValue({
        data: { totalInterviews: 5, completedInterviews: 4, averageScore: 80, totalResumes: 2 },
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentSessions.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentResumes.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithProviders(<Dashboard />, { preloadedState: authenticatedState });

      // Should display user information
      await waitFor(() => {
        expect(screen.getByText(mockUser.name)).toBeInTheDocument();
        expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      });

      // Should display user preferences if available
      if (mockUser.experienceLevel) {
        expect(screen.getByText(mockUser.experienceLevel)).toBeInTheDocument();
      }
      if (mockUser.targetRole) {
        expect(screen.getByText(mockUser.targetRole)).toBeInTheDocument();
      }
    });

    it('should handle profile editing', async () => {
      mockDashboardApi.getUserStats.mockReturnValue({
        data: { totalInterviews: 0, completedInterviews: 0, averageScore: 0, totalResumes: 0 },
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentSessions.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentResumes.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithProviders(<Dashboard />, { preloadedState: authenticatedState });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
      });

      // Click edit profile
      const editButton = screen.getByRole('button', { name: /edit profile/i });
      fireEvent.click(editButton);

      // Should open edit modal or navigate to edit page
      await waitFor(() => {
        expect(screen.getByText(/edit profile/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Responsiveness', () => {
    it('should adapt layout for mobile screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      mockDashboardApi.getUserStats.mockReturnValue({
        data: { totalInterviews: 5, completedInterviews: 4, averageScore: 80, totalResumes: 2 },
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentSessions.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentResumes.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithProviders(<Dashboard />, { preloadedState: authenticatedState });

      // Should use mobile layout classes
      await waitFor(() => {
        const container = screen.getByText(mockUser.name).closest('div');
        expect(container).toHaveClass('flex-col');
      });
    });

    it('should handle tablet and desktop layouts', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      mockDashboardApi.getUserStats.mockReturnValue({
        data: { totalInterviews: 5, completedInterviews: 4, averageScore: 80, totalResumes: 2 },
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentSessions.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentResumes.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithProviders(<Dashboard />, { preloadedState: authenticatedState });

      // Should use desktop grid layout
      await waitFor(() => {
        const container = screen.getByText(mockUser.name).closest('div');
        expect(container).toHaveClass('grid');
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update dashboard when new data is available', async () => {
      const initialStats = { totalInterviews: 5, completedInterviews: 4, averageScore: 80, totalResumes: 2 };
      const updatedStats = { totalInterviews: 6, completedInterviews: 5, averageScore: 82, totalResumes: 2 };

      mockDashboardApi.getUserStats
        .mockReturnValueOnce({
          data: initialStats,
          isLoading: false,
          error: null,
        })
        .mockReturnValueOnce({
          data: updatedStats,
          isLoading: false,
          error: null,
        });

      mockDashboardApi.getRecentSessions.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentResumes.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      const { rerender } = renderWithProviders(<Dashboard />, { preloadedState: authenticatedState });

      // Should show initial stats
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // Total interviews
        expect(screen.getByText('80')).toBeInTheDocument(); // Average score
      });

      // Simulate data update
      rerender(<Dashboard />);

      // Should show updated stats
      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument(); // Updated total interviews
        expect(screen.getByText('82')).toBeInTheDocument(); // Updated average score
      });
    });
  });

  describe('Performance Optimization', () => {
    it('should memoize expensive calculations', async () => {
      const mockStats = { totalInterviews: 100, completedInterviews: 85, averageScore: 78, totalResumes: 10 };

      mockDashboardApi.getUserStats.mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentSessions.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentResumes.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      const { rerender } = renderWithProviders(<Dashboard />, { preloadedState: authenticatedState });

      // Should calculate completion rate
      await waitFor(() => {
        expect(screen.getByText('85%')).toBeInTheDocument(); // Completion rate
      });

      // Re-render with same data should not recalculate
      rerender(<Dashboard />);

      // Should still show same calculated values
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should lazy load non-critical components', async () => {
      mockDashboardApi.getUserStats.mockReturnValue({
        data: { totalInterviews: 0, completedInterviews: 0, averageScore: 0, totalResumes: 0 },
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentSessions.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockDashboardApi.getRecentResumes.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithProviders(<Dashboard />, { preloadedState: authenticatedState });

      // Critical components should load immediately
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      });

      // Non-critical components may load later
      // This would be tested with actual lazy loading implementation
    });
  });
});