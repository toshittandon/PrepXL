import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockUser, mockAppwriteServices } from '../testUtils';
import App from '../../App';

// Mock the auth service
vi.mock('../../services/appwrite/auth.js', () => ({
  authService: mockAppwriteServices.auth,
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

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Login Flow', () => {
    it('should complete full login flow from login page to dashboard', async () => {
      mockAppwriteServices.auth.login.mockResolvedValue({
        success: true,
        data: { user: mockUser, session: { $id: 'session123' } },
      });

      mockAppwriteServices.auth.getCurrentUser.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const { store } = renderWithProviders(<App />);

      // Should start at login page for unauthenticated user
      await waitFor(() => {
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      });

      // Fill in login form
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      // Should show loading state
      await waitFor(() => {
        expect(loginButton).toBeDisabled();
      });

      // Should redirect to dashboard after successful login
      await waitFor(() => {
        expect(store.getState().auth.isAuthenticated).toBe(true);
        expect(store.getState().auth.user).toEqual(mockUser);
      });

      // Verify auth service was called
      expect(mockAppwriteServices.auth.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle login errors and display error messages', async () => {
      mockAppwriteServices.auth.login.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      });

      // Fill in login form with invalid credentials
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Form should be re-enabled
      expect(loginButton).not.toBeDisabled();
    });

    it('should handle OAuth login flow', async () => {
      mockAppwriteServices.auth.loginWithOAuth = vi.fn().mockResolvedValue({
        success: true,
        data: { user: mockUser, session: { $id: 'session123' } },
      });

      const { store } = renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      });

      // Click Google OAuth button
      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      fireEvent.click(googleButton);

      // Should show loading state
      await waitFor(() => {
        expect(googleButton).toBeDisabled();
      });

      // Should authenticate user
      await waitFor(() => {
        expect(store.getState().auth.isAuthenticated).toBe(true);
      });

      expect(mockAppwriteServices.auth.loginWithOAuth).toHaveBeenCalledWith('google');
    });
  });

  describe('Signup Flow', () => {
    it('should complete full signup flow and auto-login', async () => {
      mockAppwriteServices.auth.createAccount = vi.fn().mockResolvedValue({
        success: true,
        data: mockUser,
      });

      mockAppwriteServices.auth.login.mockResolvedValue({
        success: true,
        data: { user: mockUser, session: { $id: 'session123' } },
      });

      const { store } = renderWithProviders(<App />);

      // Navigate to signup page
      await waitFor(() => {
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      });

      const signupLink = screen.getByText(/create an account/i);
      fireEvent.click(signupLink);

      await waitFor(() => {
        expect(screen.getByText(/create your account/i)).toBeInTheDocument();
      });

      // Fill in signup form
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/create a password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const signupButton = screen.getByRole('button', { name: /create account/i });

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
      fireEvent.click(signupButton);

      // Should create account and auto-login
      await waitFor(() => {
        expect(store.getState().auth.isAuthenticated).toBe(true);
      });

      expect(mockAppwriteServices.auth.createAccount).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      });

      expect(mockAppwriteServices.auth.login).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'Password123!',
      });
    });

    it('should handle signup validation errors', async () => {
      renderWithProviders(<App />);

      // Navigate to signup page
      await waitFor(() => {
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      });

      const signupLink = screen.getByText(/create an account/i);
      fireEvent.click(signupLink);

      await waitFor(() => {
        expect(screen.getByText(/create your account/i)).toBeInTheDocument();
      });

      // Try to submit with invalid data
      const passwordInput = screen.getByPlaceholderText(/create a password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const signupButton = screen.getByRole('button', { name: /create account/i });

      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });
      fireEvent.click(signupButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      // Should not call API with invalid data
      expect(mockAppwriteServices.auth.createAccount).not.toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should check authentication status on app load', async () => {
      mockAppwriteServices.auth.getCurrentSession.mockResolvedValue({
        success: true,
        data: { $id: 'session123' },
      });

      mockAppwriteServices.auth.getCurrentUser.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const { store } = renderWithProviders(<App />);

      // Should check auth status on mount
      await waitFor(() => {
        expect(mockAppwriteServices.auth.getCurrentSession).toHaveBeenCalled();
        expect(mockAppwriteServices.auth.getCurrentUser).toHaveBeenCalled();
      });

      // Should set authenticated state
      await waitFor(() => {
        expect(store.getState().auth.isAuthenticated).toBe(true);
        expect(store.getState().auth.isInitialized).toBe(true);
      });
    });

    it('should handle expired session gracefully', async () => {
      mockAppwriteServices.auth.getCurrentSession.mockResolvedValue({
        success: false,
        error: 'Session expired',
      });

      const { store } = renderWithProviders(<App />);

      await waitFor(() => {
        expect(store.getState().auth.isAuthenticated).toBe(false);
        expect(store.getState().auth.isInitialized).toBe(true);
      });

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      });
    });

    it('should maintain session across page refreshes', async () => {
      // Simulate existing session in storage
      localStorage.setItem('appwrite-session', JSON.stringify({ $id: 'session123' }));

      mockAppwriteServices.auth.getCurrentSession.mockResolvedValue({
        success: true,
        data: { $id: 'session123' },
      });

      mockAppwriteServices.auth.getCurrentUser.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const { store } = renderWithProviders(<App />);

      await waitFor(() => {
        expect(store.getState().auth.isAuthenticated).toBe(true);
        expect(store.getState().auth.user).toEqual(mockUser);
      });
    });
  });

  describe('Logout Flow', () => {
    it('should complete logout flow and redirect to login', async () => {
      // Start with authenticated state
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

      mockAppwriteServices.auth.logout.mockResolvedValue({
        success: true,
        data: { message: 'Logged out successfully' },
      });

      const { store } = renderWithProviders(<App />, { preloadedState });

      // Should show dashboard for authenticated user
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Click logout button
      const logoutButton = screen.getByRole('button', { name: /logout/i }) || 
                          screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(logoutButton);

      // Should logout and redirect
      await waitFor(() => {
        expect(mockAppwriteServices.auth.logout).toHaveBeenCalled();
        expect(store.getState().auth.isAuthenticated).toBe(false);
        expect(store.getState().auth.user).toBeNull();
      });

      // Should redirect to login page
      await waitFor(() => {
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      });
    });

    it('should handle logout errors gracefully', async () => {
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

      mockAppwriteServices.auth.logout.mockResolvedValue({
        success: false,
        error: 'Logout failed',
      });

      const { store } = renderWithProviders(<App />, { preloadedState });

      const logoutButton = screen.getByRole('button', { name: /logout/i }) || 
                          screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(logoutButton);

      // Should show error but still clear local state
      await waitFor(() => {
        expect(store.getState().auth.error).toBe('Logout failed');
        expect(store.getState().auth.isAuthenticated).toBe(false);
      });
    });
  });

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users to login', async () => {
      // Mock window.location for navigation testing
      delete window.location;
      window.location = { pathname: '/dashboard', search: '', hash: '' };

      renderWithProviders(<App />);

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      });
    });

    it('should allow authenticated users to access protected routes', async () => {
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

      renderWithProviders(<App />, { preloadedState });

      // Should show dashboard
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });

    it('should preserve return URL after login', async () => {
      // Set return URL
      localStorage.setItem('returnUrl', '/interview/setup');

      mockAppwriteServices.auth.login.mockResolvedValue({
        success: true,
        data: { user: mockUser, session: { $id: 'session123' } },
      });

      renderWithProviders(<App />);

      // Complete login
      await waitFor(() => {
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      // Should redirect to return URL
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/interview/setup');
      });
    });
  });

  describe('Form Validation Integration', () => {
    it('should validate email format in real-time', async () => {
      renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);

      // Enter invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
        expect(emailInput).toHaveClass('border-red-500');
      });

      // Fix email
      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
        expect(emailInput).toHaveClass('border-green-500');
      });
    });

    it('should prevent form submission with validation errors', async () => {
      renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      });

      // Try to submit empty form
      const loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      // Should not call auth service
      expect(mockAppwriteServices.auth.login).not.toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after network errors', async () => {
      mockAppwriteServices.auth.login
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          success: true,
          data: { user: mockUser, session: { $id: 'session123' } },
        });

      const { store } = renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      });

      // First attempt - network error
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      // Should show network error
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Retry - should succeed
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(store.getState().auth.isAuthenticated).toBe(true);
      });
    });

    it('should clear errors when user starts typing', async () => {
      mockAppwriteServices.auth.login.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      });

      // Trigger error
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Start typing - should clear error
      fireEvent.change(emailInput, { target: { value: 'correct@example.com' } });

      await waitFor(() => {
        expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
      });
    });
  });
});