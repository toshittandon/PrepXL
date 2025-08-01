import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LoginForm from '../LoginForm.jsx';
import authReducer from '../../../store/slices/authSlice.js';

// Mock the auth service
vi.mock('../../../services/appwrite/auth.js', () => ({
  authService: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
  }
}));

const createMockStore = (initialState = {}) => {
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
        isInitialized: false,
        ...initialState.auth,
      },
    },
  });
};

const renderWithProvider = (component, store) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('LoginForm', () => {
  let mockStore;
  let mockOnSuccess;
  let mockOnSwitchToSignup;

  beforeEach(() => {
    mockStore = createMockStore();
    mockOnSuccess = vi.fn();
    mockOnSwitchToSignup = vi.fn();
  });

  it('renders login form with all required fields', () => {
    renderWithProvider(
      <LoginForm onSuccess={mockOnSuccess} onSwitchToSignup={mockOnSwitchToSignup} />,
      mockStore
    );

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('validates email field correctly', async () => {
    renderWithProvider(
      <LoginForm onSuccess={mockOnSuccess} onSwitchToSignup={mockOnSwitchToSignup} />,
      mockStore
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Test empty email
    fireEvent.blur(emailInput);
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    // Test invalid email format
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    // Test valid email
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.blur(emailInput);
    await waitFor(() => {
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });
  });

  it('validates password field correctly', async () => {
    renderWithProvider(
      <LoginForm onSuccess={mockOnSuccess} onSwitchToSignup={mockOnSwitchToSignup} />,
      mockStore
    );

    const passwordInput = screen.getByLabelText(/password/i);

    // Test empty password
    fireEvent.blur(passwordInput);
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    // Test short password
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.blur(passwordInput);
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });

    // Test valid password
    fireEvent.change(passwordInput, { target: { value: 'validpassword123' } });
    fireEvent.blur(passwordInput);
    await waitFor(() => {
      expect(screen.queryByText('Password must be at least 8 characters long')).not.toBeInTheDocument();
    });
  });

  it('displays loading state during form submission', () => {
    const loadingStore = createMockStore({
      auth: { loading: true }
    });

    renderWithProvider(
      <LoginForm onSuccess={mockOnSuccess} onSwitchToSignup={mockOnSwitchToSignup} />,
      loadingStore
    );

    const submitButton = screen.getByRole('button', { name: /signing in/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Signing In...')).toBeInTheDocument();
  });

  it('displays error message when authentication fails', () => {
    const errorStore = createMockStore({
      auth: { error: 'Invalid credentials' }
    });

    renderWithProvider(
      <LoginForm onSuccess={mockOnSuccess} onSwitchToSignup={mockOnSwitchToSignup} />,
      errorStore
    );

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('calls onSwitchToSignup when signup link is clicked', () => {
    renderWithProvider(
      <LoginForm onSuccess={mockOnSuccess} onSwitchToSignup={mockOnSwitchToSignup} />,
      mockStore
    );

    const signupLink = screen.getByText('Sign up here');
    fireEvent.click(signupLink);

    expect(mockOnSwitchToSignup).toHaveBeenCalledTimes(1);
  });

  it('submits form with valid data', async () => {
    renderWithProvider(
      <LoginForm onSuccess={mockOnSuccess} onSwitchToSignup={mockOnSwitchToSignup} />,
      mockStore
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'validpassword123' } });
    fireEvent.click(submitButton);

    // The form should attempt to submit (Redux action will be dispatched)
    // We can't easily test the actual Redux action dispatch in this unit test
    // but we can verify the form doesn't show validation errors
    await waitFor(() => {
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
    });
  });
});