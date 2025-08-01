import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import Login from '../Login';
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

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
const mockLocation = { state: null };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

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
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    ),
    store,
  };
};

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders login page with all elements', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByText('InterviewPrep AI')).toBeInTheDocument();
    expect(screen.getByText('AI-powered interview preparation platform')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with LinkedIn')).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('redirects to dashboard if already authenticated', () => {
    renderWithProviders(<Login />, {
      initialState: {
        auth: {
          isAuthenticated: true,
          user: { id: '1', email: 'test@example.com' },
        },
      },
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('redirects to intended location after login', () => {
    const mockLocationWithState = {
      state: { from: { pathname: '/resume' } },
    };
    
    vi.mocked(require('react-router-dom').useLocation).mockReturnValue(mockLocationWithState);
    
    renderWithProviders(<Login />, {
      initialState: {
        auth: {
          isAuthenticated: true,
          user: { id: '1', email: 'test@example.com' },
        },
      },
    });

    expect(mockNavigate).toHaveBeenCalledWith('/resume', { replace: true });
  });

  it('navigates to signup page when signup link is clicked', () => {
    renderWithProviders(<Login />);
    
    const signupLink = screen.getByText('Sign up here');
    fireEvent.click(signupLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/auth/signup', {
      state: { from: null },
      replace: true,
    });
  });

  it('displays loading state during authentication', () => {
    renderWithProviders(<Login />, {
      initialState: {
        auth: {
          loading: true,
        },
      },
    });

    expect(screen.getByText('Signing In...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('displays error message when authentication fails', () => {
    const errorMessage = 'Invalid credentials';
    renderWithProviders(<Login />, {
      initialState: {
        auth: {
          error: errorMessage,
        },
      },
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const { store } = renderWithProviders(<Login />);
    
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

  it('preserves redirect location when switching to signup', () => {
    const mockLocationWithState = {
      state: { from: { pathname: '/interview' } },
    };
    
    vi.mocked(require('react-router-dom').useLocation).mockReturnValue(mockLocationWithState);
    
    renderWithProviders(<Login />);
    
    const signupLink = screen.getByText('Sign up here');
    fireEvent.click(signupLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/auth/signup', {
      state: { from: { pathname: '/interview' } },
      replace: true,
    });
  });
});