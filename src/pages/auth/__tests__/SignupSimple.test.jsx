import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import SignupSimple from '../SignupSimple';
import authReducer from '../../../store/slices/authSlice';

// Mock the auth service
vi.mock('../../../services/appwrite/auth.js', () => ({
  authService: {
    createAccount: vi.fn(),
    login: vi.fn(),
    getCurrentUser: vi.fn(),
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

const renderWithProviders = (component, { initialState = {} } = {}) => {
  const store = createTestStore(initialState);
  return {
    ...render(
      <Provider store={store}>
        {component}
      </Provider>
    ),
    store,
  };
};

describe('SignupSimple Page', () => {
  const mockOnSuccess = vi.fn();
  const mockOnSwitchToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders signup page with all elements', () => {
    renderWithProviders(
      <SignupSimple onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />
    );
    
    expect(screen.getByText('InterviewPrep AI')).toBeInTheDocument();
    expect(screen.getByText('AI-powered interview preparation platform')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with LinkedIn')).toBeInTheDocument();
    expect(screen.getAllByText(/already have an account/i)).toHaveLength(2);
  });

  it('calls onSuccess when already authenticated', () => {
    renderWithProviders(
      <SignupSimple onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />,
      {
        initialState: {
          auth: {
            isAuthenticated: true,
            user: { id: '1', email: 'test@example.com' },
          },
        },
      }
    );

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('calls onSwitchToLogin when login link is clicked', () => {
    renderWithProviders(
      <SignupSimple onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />
    );
    
    const loginLinks = screen.getAllByText('Sign in here');
    fireEvent.click(loginLinks[0]); // Click the first one (from the form)
    
    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });

  it('displays loading state during account creation', () => {
    renderWithProviders(
      <SignupSimple onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />,
      {
        initialState: {
          auth: {
            loading: true,
          },
        },
      }
    );

    expect(screen.getByText('Creating Account...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  });

  it('displays error message when signup fails', () => {
    const errorMessage = 'Email already exists';
    renderWithProviders(
      <SignupSimple onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />,
      {
        initialState: {
          auth: {
            error: errorMessage,
          },
        },
      }
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('handles form submission with valid data', async () => {
    const { store } = renderWithProviders(
      <SignupSimple onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />
    );
    
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getAllByLabelText(/password/i)[0];
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const state = store.getState();
      expect(state.auth.loading).toBe(true);
    });
  });

  it('shows validation errors for invalid form data', async () => {
    renderWithProviders(
      <SignupSimple onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />
    );
    
    // Get form fields and trigger blur to activate validation
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getAllByLabelText(/password/i)[0];
    
    // Focus and blur fields to trigger validation
    fireEvent.focus(nameInput);
    fireEvent.blur(nameInput);
    fireEvent.focus(emailInput);
    fireEvent.blur(emailInput);
    fireEvent.focus(passwordInput);
    fireEvent.blur(passwordInput);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('shows password mismatch error', async () => {
    renderWithProviders(
      <SignupSimple onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />
    );
    
    const passwordInput = screen.getAllByLabelText(/password/i)[0];
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword' } });
    fireEvent.blur(confirmPasswordInput);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('calls onSuccess after successful signup', async () => {
    const { store } = renderWithProviders(
      <SignupSimple onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />
    );

    // Simulate successful signup by updating the store state
    store.dispatch({ type: 'auth/signupUser/fulfilled', payload: { user: { id: '1' }, session: {} } });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('works without callback props', () => {
    expect(() => {
      renderWithProviders(<SignupSimple />);
    }).not.toThrow();

    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
  });
});