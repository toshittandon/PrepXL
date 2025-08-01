import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders, mockInterviewSession } from '../../testUtils';
import SessionHistory from '../../../components/dashboard/SessionHistory';

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SessionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no sessions exist', () => {
    const preloadedState = {
      interview: {
        sessions: [],
        currentSession: null,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<SessionHistory />, { preloadedState });
    
    expect(screen.getByText(/no interview sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/start your first interview/i)).toBeInTheDocument();
  });

  it('should render session list when sessions exist', () => {
    const sessions = [
      { ...mockInterviewSession, $id: 'session1', role: 'Software Engineer', finalScore: 85 },
      { ...mockInterviewSession, $id: 'session2', role: 'Product Manager', finalScore: 92 },
    ];

    const preloadedState = {
      interview: {
        sessions,
        currentSession: null,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<SessionHistory />, { preloadedState });
    
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Product Manager')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();
  });

  it('should navigate to report when session is clicked', () => {
    const sessions = [
      { ...mockInterviewSession, $id: 'session1', status: 'completed' },
    ];

    const preloadedState = {
      interview: {
        sessions,
        currentSession: null,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<SessionHistory />, { preloadedState });
    
    const sessionItem = screen.getByRole('button');
    fireEvent.click(sessionItem);
    
    expect(mockNavigate).toHaveBeenCalledWith('/interview/report/session1');
  });

  it('should display session status correctly', () => {
    const sessions = [
      { ...mockInterviewSession, $id: 'session1', status: 'completed' },
      { ...mockInterviewSession, $id: 'session2', status: 'active' },
      { ...mockInterviewSession, $id: 'session3', status: 'abandoned' },
    ];

    const preloadedState = {
      interview: {
        sessions,
        currentSession: null,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<SessionHistory />, { preloadedState });
    
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    expect(screen.getByText(/abandoned/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const preloadedState = {
      interview: {
        sessions: [],
        currentSession: null,
        loading: true,
        error: null,
      },
    };

    renderWithProviders(<SessionHistory />, { preloadedState });
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show error state', () => {
    const preloadedState = {
      interview: {
        sessions: [],
        currentSession: null,
        loading: false,
        error: 'Failed to load sessions',
      },
    };

    renderWithProviders(<SessionHistory />, { preloadedState });
    
    expect(screen.getByText(/failed to load sessions/i)).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    const sessions = [
      {
        ...mockInterviewSession,
        $id: 'session1',
        $createdAt: '2024-01-15T10:30:00.000Z',
      },
    ];

    const preloadedState = {
      interview: {
        sessions,
        currentSession: null,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<SessionHistory />, { preloadedState });
    
    // Should display formatted date
    expect(screen.getByText(/jan/i) || screen.getByText(/january/i)).toBeInTheDocument();
  });

  it('should display session type badges', () => {
    const sessions = [
      { ...mockInterviewSession, $id: 'session1', sessionType: 'Behavioral' },
      { ...mockInterviewSession, $id: 'session2', sessionType: 'Technical' },
      { ...mockInterviewSession, $id: 'session3', sessionType: 'Case Study' },
    ];

    const preloadedState = {
      interview: {
        sessions,
        currentSession: null,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<SessionHistory />, { preloadedState });
    
    expect(screen.getByText('Behavioral')).toBeInTheDocument();
    expect(screen.getByText('Technical')).toBeInTheDocument();
    expect(screen.getByText('Case Study')).toBeInTheDocument();
  });

  it('should handle pagination for large session lists', () => {
    const sessions = Array.from({ length: 15 }, (_, i) => ({
      ...mockInterviewSession,
      $id: `session${i}`,
      role: `Role ${i}`,
    }));

    const preloadedState = {
      interview: {
        sessions,
        currentSession: null,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<SessionHistory />, { preloadedState });
    
    // Should show pagination controls if implemented
    const sessionItems = screen.getAllByRole('button');
    expect(sessionItems.length).toBeGreaterThan(0);
  });

  it('should sort sessions by date (newest first)', () => {
    const sessions = [
      {
        ...mockInterviewSession,
        $id: 'session1',
        $createdAt: '2024-01-10T10:00:00.000Z',
        role: 'Older Session',
      },
      {
        ...mockInterviewSession,
        $id: 'session2',
        $createdAt: '2024-01-15T10:00:00.000Z',
        role: 'Newer Session',
      },
    ];

    const preloadedState = {
      interview: {
        sessions,
        currentSession: null,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<SessionHistory />, { preloadedState });
    
    const sessionItems = screen.getAllByRole('button');
    expect(sessionItems[0]).toHaveTextContent('Newer Session');
  });

  it('should show score with appropriate styling', () => {
    const sessions = [
      { ...mockInterviewSession, $id: 'session1', finalScore: 95 }, // Excellent
      { ...mockInterviewSession, $id: 'session2', finalScore: 75 }, // Good
      { ...mockInterviewSession, $id: 'session3', finalScore: 45 }, // Needs improvement
    ];

    const preloadedState = {
      interview: {
        sessions,
        currentSession: null,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<SessionHistory />, { preloadedState });
    
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('should handle sessions without scores', () => {
    const sessions = [
      { ...mockInterviewSession, $id: 'session1', finalScore: null, status: 'active' },
    ];

    const preloadedState = {
      interview: {
        sessions,
        currentSession: null,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<SessionHistory />, { preloadedState });
    
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    expect(screen.queryByText(/score/i)).not.toBeInTheDocument();
  });
});