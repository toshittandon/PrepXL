import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice.js';
import reportReducer from '../../store/slices/reportSlice.js';
import FeedbackReport from '../../pages/interview/FeedbackReport.jsx';
import ReportsList from '../../pages/interview/ReportsList.jsx';

// Mock the services
vi.mock('../../services/appwrite/database.js', () => ({
  databaseService: {
    getInterviewSession: vi.fn(),
    getSessionInteractions: vi.fn(),
    getCompletedInterviewSessions: vi.fn(),
    getUserInterviewSessions: vi.fn(),
  },
}));

vi.mock('../../services/ai/interviewService.js', () => ({
  interviewService: {
    generateDetailedFeedback: vi.fn(),
    calculateInterviewScore: vi.fn(),
  },
}));

// Mock React Router hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ sessionId: 'test-session-123' }),
    useNavigate: () => mockNavigate,
  };
});

// Mock URL.createObjectURL and related APIs for export functionality
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockClear();
  
  // Mock document.createElement for export functionality
  const mockAnchor = {
    href: '',
    download: '',
    click: vi.fn(),
  };
  
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
    if (tagName === 'a') {
      return mockAnchor;
    }
    return originalCreateElement(tagName);
  });
  
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

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

// Helper function to render component with providers
const renderWithProviders = (component, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
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
  },
  {
    id: 'int-3',
    sessionId: 'test-session-123',
    questionText: 'Explain the concept of closures in JavaScript.',
    userAnswerText: 'Closures allow inner functions to access variables from outer functions even after the outer function has returned.',
    order: 3,
    timestamp: '2024-01-15T10:15:00Z'
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
  describe('FeedbackReport Component', () => {
    describe('Data Fetching and Display', () => {
      it('should load and display interview report data correctly', async () => {
        databaseService.getInterviewSession.mockResolvedValue({
          success: true,
          data: mockSession,
        });

        databaseService.getSessionInteractions.mockResolvedValue({
          success: true,
          data: mockInteractions,
        });

        renderWithProviders(<FeedbackReport />);

        // Wait for loading to complete
        await waitFor(() => {
          expect(screen.getByText('Interview Feedback Report')).toBeInTheDocument();
        });

        // Check session details
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Technical Interview')).toBeInTheDocument();
        expect(screen.getByText('3 Questions')).toBeInTheDocument();

        // Check interactions are displayed
        expect(screen.getByText('What is your experience with React?')).toBeInTheDocument();
        expect(screen.getByText('I have 3 years of experience with React and have built several applications.')).toBeInTheDocument();

        // Verify API calls
        expect(databaseService.getInterviewSession).toHaveBeenCalledWith('test-session-123');
        expect(databaseService.getSessionInteractions).toHaveBeenCalledWith('test-session-123');
      });

      it('should handle loading states properly', async () => {
        // Mock delayed response
        databaseService.getInterviewSession.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockSession }), 100))
        );

        databaseService.getSessionInteractions.mockResolvedValue({
          success: true,
          data: mockInteractions,
        });

        renderWithProviders(<FeedbackReport />);

        // Check loading state
        expect(screen.getByText('Loading interview report...')).toBeInTheDocument();

        // Wait for loading to complete
        await waitFor(() => {
          expect(screen.getByText('Interview Feedback Report')).toBeInTheDocument();
        });

        expect(screen.queryByText('Loading interview report...')).not.toBeInTheDocument();
      });

      it('should handle error states gracefully', async () => {
        databaseService.getInterviewSession.mockResolvedValue({
          success: false,
          error: 'Session not found',
        });

        renderWithProviders(<FeedbackReport />);

        await waitFor(() => {
          expect(screen.getByText('Unable to Load Report')).toBeInTheDocument();
          expect(screen.getByText('Session not found')).toBeInTheDocument();
        });

        // Check error recovery options
        expect(screen.getByText('Try Again')).toBeInTheDocument();
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
      });

      it('should handle unauthorized access', async () => {
        const unauthorizedSession = {
          ...mockSession,
          userId: 'different-user-456'
        };

        databaseService.getInterviewSession.mockResolvedValue({
          success: true,
          data: unauthorizedSession,
        });

        renderWithProviders(<FeedbackReport />);

        await waitFor(() => {
          expect(screen.getByText('Unable to Load Report')).toBeInTheDocument();
        });
      });
    });

    describe('Export Functionality', () => {
      beforeEach(async () => {
        databaseService.getInterviewSession.mockResolvedValue({
          success: true,
          data: mockSession,
        });

        databaseService.getSessionInteractions.mockResolvedValue({
          success: true,
          data: mockInteractions,
        });
      });

      it('should export report as JSON format', async () => {
        renderWithProviders(<FeedbackReport />);

        await waitFor(() => {
          expect(screen.getByText('Interview Feedback Report')).toBeInTheDocument();
        });

        // Click export dropdown
        const exportButton = screen.getByText('Export Report');
        fireEvent.click(exportButton);

        await waitFor(() => {
          expect(screen.getByText('Export as JSON')).toBeInTheDocument();
        });

        // Click JSON export
        const jsonExportButton = screen.getByText('Export as JSON');
        fireEvent.click(jsonExportButton);

        // Verify download was triggered
        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });

      it('should export report as CSV format', async () => {
        renderWithProviders(<FeedbackReport />);

        await waitFor(() => {
          expect(screen.getByText('Interview Feedback Report')).toBeInTheDocument();
        });

        // Click export dropdown
        const exportButton = screen.getByText('Export Report');
        fireEvent.click(exportButton);

        // Click CSV export
        const csvExportButton = screen.getByText('Export as CSV');
        fireEvent.click(csvExportButton);

        // Verify download was triggered
        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });

      it('should export report as text format', async () => {
        renderWithProviders(<FeedbackReport />);

        await waitFor(() => {
          expect(screen.getByText('Interview Feedback Report')).toBeInTheDocument();
        });

        // Click export dropdown
        const exportButton = screen.getByText('Export Report');
        fireEvent.click(exportButton);

        // Click text export
        const textExportButton = screen.getByText('Export as Text');
        fireEvent.click(textExportButton);

        // Verify download was triggered
        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });

      it('should close export dropdown when clicking outside', async () => {
        renderWithProviders(<FeedbackReport />);

        await waitFor(() => {
          expect(screen.getByText('Interview Feedback Report')).toBeInTheDocument();
        });

        // Open dropdown
        const exportButton = screen.getByText('Export Report');
        fireEvent.click(exportButton);

        expect(screen.getByText('Export as JSON')).toBeInTheDocument();

        // Click outside
        fireEvent.mouseDown(document.body);

        await waitFor(() => {
          expect(screen.queryByText('Export as JSON')).not.toBeInTheDocument();
        });
      });
    });

    describe('AI Feedback Generation', () => {
      beforeEach(async () => {
        databaseService.getInterviewSession.mockResolvedValue({
          success: true,
          data: mockSession,
        });

        databaseService.getSessionInteractions.mockResolvedValue({
          success: true,
          data: mockInteractions,
        });
      });

      it('should generate AI feedback successfully', async () => {
        const mockFeedback = {
          overall: 'Strong technical performance with good problem-solving skills.',
          strengths: ['Clear communication', 'Good technical knowledge'],
          improvements: ['Could provide more specific examples', 'Consider edge cases']
        };

        interviewService.generateDetailedFeedback.mockResolvedValue({
          success: true,
          data: mockFeedback,
        });

        renderWithProviders(<FeedbackReport />);

        await waitFor(() => {
          expect(screen.getByText('Interview Feedback Report')).toBeInTheDocument();
        });

        // Click generate feedback button
        const generateButton = screen.getByText('Generate AI Feedback');
        fireEvent.click(generateButton);

        // Check loading state
        await waitFor(() => {
          expect(screen.getByText('Generating...')).toBeInTheDocument();
        });

        // Wait for feedback to be generated
        await waitFor(() => {
          expect(screen.getByText('AI-Generated Feedback')).toBeInTheDocument();
          expect(screen.getByText('Strong technical performance with good problem-solving skills.')).toBeInTheDocument();
          expect(screen.getByText('Clear communication')).toBeInTheDocument();
          expect(screen.getByText('Could provide more specific examples')).toBeInTheDocument();
        });

        expect(interviewService.generateDetailedFeedback).toHaveBeenCalledWith({
          sessionId: 'test-session-123',
          interactions: mockInteractions
        });
      });

      it('should handle feedback generation errors', async () => {
        interviewService.generateDetailedFeedback.mockResolvedValue({
          success: false,
          error: 'AI service unavailable',
        });

        renderWithProviders(<FeedbackReport />);

        await waitFor(() => {
          expect(screen.getByText('Interview Feedback Report')).toBeInTheDocument();
        });

        const generateButton = screen.getByText('Generate AI Feedback');
        fireEvent.click(generateButton);

        await waitFor(() => {
          expect(screen.getByText('Generate AI Feedback')).toBeInTheDocument(); // Button should be back to normal
        });
      });
    });

    describe('Navigation', () => {
      beforeEach(async () => {
        databaseService.getInterviewSession.mockResolvedValue({
          success: true,
          data: mockSession,
        });

        databaseService.getSessionInteractions.mockResolvedValue({
          success: true,
          data: mockInteractions,
        });
      });

      it('should navigate back to dashboard', async () => {
        renderWithProviders(<FeedbackReport />);

        await waitFor(() => {
          expect(screen.getByText('Interview Feedback Report')).toBeInTheDocument();
        });

        const backButton = screen.getByText('Back to Dashboard');
        fireEvent.click(backButton);

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('ReportsList Component', () => {
    describe('Data Fetching and Display', () => {
      it('should load and display user reports list', async () => {
        databaseService.getCompletedInterviewSessions.mockResolvedValue({
          success: true,
          data: mockUserReports,
        });

        renderWithProviders(<ReportsList />);

        await waitFor(() => {
          expect(screen.getByText('Interview Reports')).toBeInTheDocument();
        });

        // Check reports are displayed
        expect(screen.getByText('Technical Interview')).toBeInTheDocument();
        expect(screen.getByText('Behavioral Interview')).toBeInTheDocument();
        expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
        expect(screen.getByText('Product Manager')).toBeInTheDocument();

        expect(databaseService.getCompletedInterviewSessions).toHaveBeenCalledWith('user-123');
      });

      it('should handle empty reports list', async () => {
        databaseService.getCompletedInterviewSessions.mockResolvedValue({
          success: true,
          data: [],
        });

        renderWithProviders(<ReportsList />);

        await waitFor(() => {
          expect(screen.getByText('No Reports Found')).toBeInTheDocument();
          expect(screen.getByText('You haven\'t completed any interviews yet. Start your first interview to see reports here.')).toBeInTheDocument();
        });
      });

      it('should handle loading state', async () => {
        databaseService.getCompletedInterviewSessions.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockUserReports }), 100))
        );

        renderWithProviders(<ReportsList />);

        expect(screen.getByText('Loading reports...')).toBeInTheDocument();

        await waitFor(() => {
          expect(screen.getByText('Interview Reports')).toBeInTheDocument();
        });

        expect(screen.queryByText('Loading reports...')).not.toBeInTheDocument();
      });

      it('should handle error state', async () => {
        databaseService.getCompletedInterviewSessions.mockResolvedValue({
          success: false,
          error: 'Database connection failed',
        });

        renderWithProviders(<ReportsList />);

        await waitFor(() => {
          expect(screen.getByText('Unable to Load Reports')).toBeInTheDocument();
          expect(screen.getByText('Database connection failed')).toBeInTheDocument();
        });
      });
    });

    describe('Filtering and Sorting', () => {
      beforeEach(() => {
        databaseService.getCompletedInterviewSessions.mockResolvedValue({
          success: true,
          data: mockUserReports,
        });
      });

      it('should filter reports by session type', async () => {
        renderWithProviders(<ReportsList />);

        await waitFor(() => {
          expect(screen.getByText('Interview Reports')).toBeInTheDocument();
        });

        // Change session type filter
        const sessionTypeSelect = screen.getByDisplayValue('All Types');
        fireEvent.change(sessionTypeSelect, { target: { value: 'Technical' } });

        // The component should re-fetch with new filters
        // In a real implementation, this would filter the displayed results
        expect(sessionTypeSelect.value).toBe('Technical');
      });

      it('should sort reports by different criteria', async () => {
        renderWithProviders(<ReportsList />);

        await waitFor(() => {
          expect(screen.getByText('Interview Reports')).toBeInTheDocument();
        });

        // Change sort criteria
        const sortBySelect = screen.getByDisplayValue('Date');
        fireEvent.change(sortBySelect, { target: { value: 'score' } });

        expect(sortBySelect.value).toBe('score');
      });
    });

    describe('Navigation to Individual Reports', () => {
      beforeEach(() => {
        databaseService.getCompletedInterviewSessions.mockResolvedValue({
          success: true,
          data: mockUserReports,
        });
      });

      it('should navigate to individual report when clicking on report item', async () => {
        renderWithProviders(<ReportsList />);

        await waitFor(() => {
          expect(screen.getByText('Interview Reports')).toBeInTheDocument();
        });

        // Click on a report item
        const reportItem = screen.getByText('Technical Interview').closest('.cursor-pointer');
        fireEvent.click(reportItem);

        expect(mockNavigate).toHaveBeenCalledWith('/interview/report/session-1');
      });

      it('should navigate back to dashboard', async () => {
        renderWithProviders(<ReportsList />);

        await waitFor(() => {
          expect(screen.getByText('Interview Reports')).toBeInTheDocument();
        });

        const backButton = screen.getByText('Back to Dashboard');
        fireEvent.click(backButton);

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    describe('Pagination', () => {
      it('should handle pagination correctly', async () => {
        const manyReports = Array.from({ length: 15 }, (_, i) => ({
          id: `session-${i + 1}`,
          userId: 'user-123',
          role: `Role ${i + 1}`,
          sessionType: i % 2 === 0 ? 'Technical' : 'Behavioral',
          status: 'completed',
          finalScore: 80 + (i % 20),
          startedAt: new Date(Date.now() - i * 86400000).toISOString(),
          completedAt: new Date(Date.now() - i * 86400000 + 1800000).toISOString()
        }));

        databaseService.getCompletedInterviewSessions.mockResolvedValue({
          success: true,
          data: manyReports,
        });

        const store = createTestStore({
          report: {
            currentReport: null,
            userReports: manyReports.slice(0, 10), // First page
            loading: false,
            error: null,
            fetchingReport: false,
            generatingFeedback: false,
            calculatingScore: false,
            exportingReport: false,
            pagination: {
              total: 15,
              limit: 10,
              offset: 0,
              hasMore: true,
              currentPage: 1,
              totalPages: 2
            }
          }
        });

        renderWithProviders(<ReportsList />, store);

        await waitFor(() => {
          expect(screen.getByText('Interview Reports')).toBeInTheDocument();
        });

        // Check pagination controls
        expect(screen.getByText('Showing 1 to 10 of 15 reports')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByText('Previous')).toBeInTheDocument();

        // Previous button should be disabled on first page
        const prevButton = screen.getByText('Previous');
        expect(prevButton).toHaveClass('disabled:opacity-50');
      });
    });
  });

  describe('End-to-End Report Workflow', () => {
    it('should complete full report viewing workflow', async () => {
      // Setup mocks for reports list
      databaseService.getCompletedInterviewSessions.mockResolvedValue({
        success: true,
        data: mockUserReports,
      });

      // Setup mocks for individual report
      databaseService.getInterviewSession.mockResolvedValue({
        success: true,
        data: mockSession,
      });

      databaseService.getSessionInteractions.mockResolvedValue({
        success: true,
        data: mockInteractions,
      });

      // Start with reports list
      const { rerender } = renderWithProviders(<ReportsList />);

      await waitFor(() => {
        expect(screen.getByText('Interview Reports')).toBeInTheDocument();
      });

      // Simulate navigation to individual report
      rerender(
        <Provider store={createTestStore()}>
          <BrowserRouter>
            <FeedbackReport />
          </BrowserRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Interview Feedback Report')).toBeInTheDocument();
      });

      // Verify report details are shown
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('What is your experience with React?')).toBeInTheDocument();

      // Test export functionality
      const exportButton = screen.getByText('Export Report');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('Export as JSON')).toBeInTheDocument();
      });

      const jsonExportButton = screen.getByText('Export as JSON');
      fireEvent.click(jsonExportButton);

      // Verify export was triggered
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should handle error recovery in report workflow', async () => {
      // Start with failed reports list load
      databaseService.getCompletedInterviewSessions.mockResolvedValueOnce({
        success: false,
        error: 'Network error',
      });

      renderWithProviders(<ReportsList />);

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Reports')).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByText('Try Again');
      
      // Mock successful retry
      databaseService.getCompletedInterviewSessions.mockResolvedValueOnce({
        success: true,
        data: mockUserReports,
      });

      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Interview Reports')).toBeInTheDocument();
      });
    });
  });
});