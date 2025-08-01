import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SignupForm from '../SignupForm.jsx';
import authReducer from '../../../store/slices/authSlice.js';

// Mock the auth service
vi.mock('../../../services/appwrite/auth.js', () => ({
  authService: {
    createAccount: vi.fn(),
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

describe('SignupForm', () => {
  let mockStore;
  let mockOnSuccess;
  let mockOnSwitchToLogin;

  beforeEach(() => {
    mockStore = createMockStore();
    mockOnSuccess = vi.fn();
    mockOnSwitchToLogin = vi.fn();
  });

  it('renders signup form with all required fields', () => {
    renderWithProvider(
      <SignupForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />,
      mockStore
    );

    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('validates name field correctly', async () => {
    renderWithProvider(
      <SignupForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />,
      mockStore
    );

    const nameInput = screen.getByLabelText(/full name/i);

    // Test empty name
    fireEvent.blur(nameInput);
    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
    });

    // Test short name
    fireEvent.change(nameInput, { target: { value: 'A' } });
    fireEvent.blur(nameInput);
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters long')).toBeInTheDocument();
    });

    // Test valid name
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.blur(nameInput);
    await waitFor(() => {
      expect(screen.queryByText('Name must be at least 2 characters long')).not.toBeInTheDocument();
    });
  });

  it('validates email field correctly', async () => {
    renderWithProvider(
      <SignupForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />,
      mockStore
    );

    const emailInput = screen.getByLabelText(/email address/i);

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
  });

  it('validates password field with complexity requirements', async () => {
    renderWithProvider(
      <SignupForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />,
      mockStore
    );

    const passwordInput = screen.getByLabelText(/^password$/i);

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

    // Test password without complexity
    fireEvent.change(passwordInput, { target: { value: 'simplepassword' } });
    fireEvent.blur(passwordInput);
    await waitFor(() => {
      expect(screen.getByText('Password must contain at least one uppercase letter, one lowercase letter, and one number')).toBeInTheDocument();
    });

    // Test valid password
    fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
    fireEvent.blur(passwordInput);
    await waitFor(() => {
      expect(screen.queryByText('Password must contain at least one uppercase letter, one lowercase letter, and one number')).not.toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    renderWithProvider(
      <SignupForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />,
      mockStore
    );

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    // Set password
    fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
    
    // Test non-matching confirmation
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123' } });
    fireEvent.blur(confirmPasswordInput);
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    // Test matching confirmation
    fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123' } });
    fireEvent.blur(confirmPasswordInput);
    await waitFor(() => {
      expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
    });
  });

  it('displays loading state during form submission', () => {
    const loadingStore = createMockStore({
      auth: { loading: true }
    });

    renderWithProvider(
      <SignupForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />,
      loadingStore
    );

    const submitButton = screen.getByRole('button', { name: /creating account/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Creating Account...')).toBeInTheDocument();
  });

  it('displays error message when signup fails', () => {
    const errorStore = createMockStore({
      auth: { error: 'Email already exists' }
    });

    renderWithProvider(
      <SignupForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />,
      errorStore
    );

    expect(screen.getByText('Email already exists')).toBeInTheDocument();
  });

  it('calls onSwitchToLogin when login link is clicked', () => {
    renderWithProvider(
      <SignupForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />,
      mockStore
    );

    const loginLink = screen.getByText('Sign in here');
    fireEvent.click(loginLink);

    expect(mockOnSwitchToLogin).toHaveBeenCalledTimes(1);
  });
});