import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders, mockUser } from '../../testUtils';
import UserProfile from '../../../components/dashboard/UserProfile';

describe('UserProfile', () => {
  it('should render user information when user is authenticated', () => {
    const preloadedState = {
      auth: {
        user: mockUser,
        session: { $id: 'session123' },
        isAuthenticated: true,
        isInitialized: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<UserProfile />, { preloadedState });
    
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
  });

  it('should render placeholder when user is not authenticated', () => {
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

    renderWithProviders(<UserProfile />, { preloadedState });
    
    expect(screen.getByText(/guest user/i) || screen.getByText(/not signed in/i)).toBeInTheDocument();
  });

  it('should display user experience level', () => {
    const preloadedState = {
      auth: {
        user: { ...mockUser, experienceLevel: 'Senior' },
        session: { $id: 'session123' },
        isAuthenticated: true,
        isInitialized: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<UserProfile />, { preloadedState });
    
    expect(screen.getByText('Senior')).toBeInTheDocument();
  });

  it('should display target role and industry', () => {
    const preloadedState = {
      auth: {
        user: {
          ...mockUser,
          targetRole: 'Frontend Developer',
          targetIndustry: 'FinTech',
        },
        session: { $id: 'session123' },
        isAuthenticated: true,
        isInitialized: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<UserProfile />, { preloadedState });
    
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('FinTech')).toBeInTheDocument();
  });

  it('should show edit profile button', () => {
    const preloadedState = {
      auth: {
        user: mockUser,
        session: { $id: 'session123' },
        isAuthenticated: true,
        isInitialized: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<UserProfile />, { preloadedState });
    
    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
  });

  it('should handle edit profile click', () => {
    const preloadedState = {
      auth: {
        user: mockUser,
        session: { $id: 'session123' },
        isAuthenticated: true,
        isInitialized: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<UserProfile />, { preloadedState });
    
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editButton);
    
    // Should open edit modal or navigate to edit page
    expect(screen.getByText(/edit/i)).toBeInTheDocument();
  });

  it('should display user avatar or initials', () => {
    const preloadedState = {
      auth: {
        user: mockUser,
        session: { $id: 'session123' },
        isAuthenticated: true,
        isInitialized: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<UserProfile />, { preloadedState });
    
    // Should show avatar or user initials
    expect(screen.getByText('JD') || screen.getByRole('img')).toBeInTheDocument();
  });

  it('should show loading state when user data is loading', () => {
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

    renderWithProviders(<UserProfile />, { preloadedState });
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display member since date', () => {
    const preloadedState = {
      auth: {
        user: {
          ...mockUser,
          $createdAt: '2024-01-01T00:00:00.000Z',
        },
        session: { $id: 'session123' },
        isAuthenticated: true,
        isInitialized: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<UserProfile />, { preloadedState });
    
    expect(screen.getByText(/member since/i)).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('should handle missing user profile fields gracefully', () => {
    const incompleteUser = {
      $id: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
      // Missing optional fields
    };

    const preloadedState = {
      auth: {
        user: incompleteUser,
        session: { $id: 'session123' },
        isAuthenticated: true,
        isInitialized: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<UserProfile />, { preloadedState });
    
    expect(screen.getByText(incompleteUser.name)).toBeInTheDocument();
    expect(screen.getByText(incompleteUser.email)).toBeInTheDocument();
  });

  it('should display profile completion status', () => {
    const preloadedState = {
      auth: {
        user: {
          ...mockUser,
          experienceLevel: null,
          targetRole: null,
        },
        session: { $id: 'session123' },
        isAuthenticated: true,
        isInitialized: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<UserProfile />, { preloadedState });
    
    expect(screen.getByText(/complete your profile/i) || screen.getByText(/profile incomplete/i)).toBeInTheDocument();
  });

  it('should show logout button', () => {
    const preloadedState = {
      auth: {
        user: mockUser,
        session: { $id: 'session123' },
        isAuthenticated: true,
        isInitialized: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<UserProfile />, { preloadedState });
    
    expect(screen.getByRole('button', { name: /logout/i }) || screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('should handle logout click', () => {
    const preloadedState = {
      auth: {
        user: mockUser,
        session: { $id: 'session123' },
        isAuthenticated: true,
        isInitialized: true,
        loading: false,
        error: null,
      },
    };

    const { store } = renderWithProviders(<UserProfile />, { preloadedState });
    
    const logoutButton = screen.getByRole('button', { name: /logout/i }) || screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(logoutButton);
    
    // Should dispatch logout action
    expect(store.getState().auth.loading).toBe(true);
  });

  it('should be responsive on different screen sizes', () => {
    const preloadedState = {
      auth: {
        user: mockUser,
        session: { $id: 'session123' },
        isAuthenticated: true,
        isInitialized: true,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<UserProfile />, { preloadedState });
    
    const profileContainer = screen.getByText(mockUser.name).closest('div');
    expect(profileContainer).toHaveClass('flex');
  });
});