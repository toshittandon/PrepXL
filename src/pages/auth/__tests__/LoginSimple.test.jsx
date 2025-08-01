import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import LoginSimple from '../LoginSimple';
import authReducer from '../../../store/slices/authSlice';

// Mock the auth service
vi.mock('../../../services/appwrite/auth.js', () => ({
  authService: {
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

describe('LoginSimple Page', () => {
  const mockOnSuccess = vi.fn();
  const mockOnSwitchToSignup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login page with all elements', () => {
    renderWithProviders(
      <LoginSimple onSuccess={mockOnSuccess} onSwitchToSignup={mockOnSwitchToSignup} />
    );
    
    expect(screen.getByText('InterviewPrep AI')).toBeInTheDocument();
    expect(screen.getByText('AI-powered interview preparation platform')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with LinkedIn')).toBeInTheDocument();
    expect(screen.getAllByText(/don't have an account/i)).toHaveLength(2);
  });

  it('calls onSuccess when already authenticated', () => {
    renderWithProviders(
      <LoginSimple onSuccess={mockOnSuccess} onSwitchToSignup={mockOnSwitchToSignup} />,
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

  it('calls onSwitchToSignup when signup link is clicked', () => {
    renderWithProviders(
      <LoginSimple onSuccess={mockOnSuccess} onSwitchToSignup={mockOnSwitchToSignup} />
    );
    
    const signupLinks = screen.getAllByText('Sign up here');
    fireEvent.click(signupLinks[0]); // Click the first one (from the form)
    
    expect(mockOnSwitchToSignup).toHaveBeenCalled();
  });

  it('displays loading state during authentication', () => {
    renderWithProviders(
      <LoginSimple onSuccess={mockOnSuccess} onSwitchToSignup={mockOnSwitchToSignup} />,
      {
        initialState: {
          auth: {
            loading: true,
          },
        },
      }
    );

    expect(screen.getByText('Signing In...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('displays error message when authentication fails', () => {
    const errorMessage = 'Invalid credentials';
    renderWithProviders(
      <LoginSimple onSuccess={mockOnSuccess} onSwitchToSignup={mockOnSwitchToSignup} />,
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

  it('handles form submission', async () => {
    const { store } = renderWithProviders(
      <LoginSimple onSuccess={mockOnSuccess} onSwitchToSignup={mockOnSwitchToSignup} />
    );
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const state = store.getState();
      expect(state.auth.loading).toBe(true);
    });
  });

  it('calls onSuccess after successful login', async () => {
    const { store } = renderWithProviders(
      <LoginSimple onSuccess={mockOnSuccess} onSwitchToSignup={mockOnSwitchToSignup} />
    );

    // Simulate successful login by updating the store state
    store.dispatch({ type: 'auth/loginUser/fulfilled', payload: { user: { id: '1' }, session: {} } });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('works without callback props', () => {
    expect(() => {
      renderWithProviders(<LoginSimple />);
    }).not.toThrow();

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
  });
});