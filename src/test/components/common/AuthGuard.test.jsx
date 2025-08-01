import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../testUtils';
import AuthGuard from '../../../components/common/AuthGuard';

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AuthGuard', () => {
  const TestComponent = () => <div>Protected Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when user is authenticated', () => {
    const preloadedState = {
      auth: {
        user: { $id: 'user123', name: 'Test User' },
        session: { $id: 'session123' },
        isAuthenticated: true,
        isInitialized: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>,
      { preloadedState }
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should show loading spinner when auth is not initialized', () => {
    const preloadedState = {
      auth: {
        user: null,
        session: null,
        isAuthenticated: false,
        isInitialized: false,
        loading: true,
        error: null,
      },
    };

    renderWithProviders(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>,
      { preloadedState }
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when user is not authenticated', () => {
    const preloadedState = {
      auth: {
        user: null,
        session: null,
        isAuthenticated: false,
        isInitialized: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>,
      { preloadedState }
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to custom path when specified', () => {
    const preloadedState = {
      auth: {
        user: null,
        session: null,
        isAuthenticated: false,
        isInitialized: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(
      <AuthGuard redirectTo="/custom-login">
        <TestComponent />
      </AuthGuard>,
      { preloadedState }
    );

    expect(mockNavigate).toHaveBeenCalledWith('/custom-login', { replace: true });
  });

  it('should handle loading state during authentication check', () => {
    const preloadedState = {
      auth: {
        user: null,
        session: null,
        isAuthenticated: false,
        isInitialized: false,
        loading: true,
        error: null,
      },
    };

    renderWithProviders(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>,
      { preloadedState }
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when user has valid session but no user object yet', () => {
    const preloadedState = {
      auth: {
        user: null,
        session: { $id: 'session123' },
        isAuthenticated: true,
        isInitialized: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>,
      { preloadedState }
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});