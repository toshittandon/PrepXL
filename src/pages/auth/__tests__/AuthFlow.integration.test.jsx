import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import App from '../../../App';
import authReducer from '../../../store/slices/authSlice';
import { authService } from '../../../services/appwrite/auth';

// Mock the auth service
vi.mock('../../../services/appwrite/auth.js', () => ({
  authService: {
    login: vi.fn(),
    createAccount: vi.fn(),
    getCurrentUser: vi.fn(),
    getCurrentSession: vi.fn(),
    logout: vi.fn(),
    loginWithGoogle: vi.fn(),
    loginWithLinkedIn: vi.fn(),
  }
}));

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        session: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        isInitialized: true,
        ...initialState.auth,
      },
    },
  });
};

const renderApp = (initialState = {}) => {
  const store = createTestStore(initialState);
  return {
    ...render(
      <Provider store={store}>
        <App />
      </Provider>
    ),
    store,
  };
};

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful auth service responses
    authService.getCurrentSession.mockResolvedValue({ success: false });
    authService.getCurrentUser.mockResolvedValue({ success: false });
  });

  it('redirects unauthenticated users to login page', async () => {
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/');
    });
  });

  it('shows dashboard for authenticated users', async () => {
    renderApp({
      auth: {
        isAuthenticated: true,
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        isInitialized: true,
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
    });
  });

  it('completes login flow successfully', async () => {
    // Mock successful login
    authService.login.mockResolvedValue({
      success: true,
      data: { userId: '1', sessionId: 'session1' },
    });
    authService.getCurrentUser.mockResolvedValue({
      success: true,
      data: { id: '1', name: 'John Doe', email: 'john@example.com' },
    });

    const { store } = renderApp();

    // Should start at login page
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    // Fill in login form
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Signing In...')).toBeInTheDocument();
    });

    // Should redirect to dashboard after successful login
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify auth service was called
    expect(authService.login).toHaveBeenCalledWith('john@example.com', 'password123');
    expect(authService.getCurrentUser).toHaveBeenCalled();
  });

  it('completes signup flow successfully', async () => {
    // Mock successful signup
    authService.createAccount.mockResolvedValue({
      success: true,
      data: { userId: '1' },
    });
    authService.login.mockResolvedValue({
      success: true,
      data: { userId: '1', sessionId: 'session1' },
    });
    authService.getCurrentUser.mockResolvedValue({
      success: true,
      data: { id: '1', name: 'Jane Doe', email: 'jane@example.com' },
    });

    renderApp();

    // Navigate to signup page
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    const signupLink = screen.getByText('Sign up here');
    fireEvent.click(signupLink);

    await waitFor(() => {
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    // Fill in signup form
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Creating Account...')).toBeInTheDocument();
    });

    // Should redirect to dashboard after successful signup
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome, Jane Doe!')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify auth service was called
    expect(authService.createAccount).toHaveBeenCalledWith('jane@example.com', 'Password123', 'Jane Doe');
    expect(authService.login).toHaveBeenCalledWith('jane@example.com', 'Password123');
    expect(authService.getCurrentUser).toHaveBeenCalled();
  });

  it('handles login errors gracefully', async () => {
    // Mock failed login
    authService.login.mockRejectedValue(new Error('Invalid credentials'));

    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    // Fill in login form with invalid credentials
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'invalid@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Should remain on login page
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('handles logout flow', async () => {
    // Mock successful logout
    authService.logout.mockResolvedValue({ success: true });

    const { store } = renderApp({
      auth: {
        isAuthenticated: true,
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        isInitialized: true,
      },
    });

    // Should start at dashboard
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Click logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    // Should redirect to login page
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    // Verify auth service was called
    expect(authService.logout).toHaveBeenCalled();
  });

  it('preserves intended destination after login', async () => {
    // Mock successful login
    authService.login.mockResolvedValue({
      success: true,
      data: { userId: '1', sessionId: 'session1' },
    });
    authService.getCurrentUser.mockResolvedValue({
      success: true,
      data: { id: '1', name: 'John Doe', email: 'john@example.com' },
    });

    // Start with a protected route that should redirect to login
    window.history.pushState({}, 'Test', '/dashboard');
    
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    // Complete login
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Should redirect back to dashboard
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});