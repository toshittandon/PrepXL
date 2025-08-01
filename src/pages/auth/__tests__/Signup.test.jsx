import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import Signup from '../Signup';
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

describe('Signup Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders signup page with all elements', () => {
    renderWithProviders(<Signup />);
    
    expect(screen.getByText('InterviewPrep AI')).toBeInTheDocument();
    expect(screen.getByText('AI-powered interview preparation platform')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with LinkedIn')).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('redirects to dashboard if already authenticated', () => {
    renderWithProviders(<Signup />, {
      initialState: {
        auth: {
          isAuthenticated: true,
          user: { id: '1', email: 'test@example.com' },
        },
      },
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('redirects to intended location after signup', () => {
    const mockLocationWithState = {
      state: { from: { pathname: '/resume' } },
    };
    
    vi.mocked(require('react-router-dom').useLocation).mockReturnValue(mockLocationWithState);
    
    renderWithProviders(<Signup />, {
      initialState: {
        auth: {
          isAuthenticated: true,
          user: { id: '1', email: 'test@example.com' },
        },
      },
    });

    expect(mockNavigate).toHaveBeenCalledWith('/resume', { replace: true });
  });

  it('navigates to login page when login link is clicked', () => {
    renderWithProviders(<Signup />);
    
    const loginLink = screen.getByText('Sign in here');
    fireEvent.click(loginLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login', {
      state: { from: null },
      replace: true,
    });
  });

  it('displays loading state during account creation', () => {
    renderWithProviders(<Signup />, {
      initialState: {
        auth: {
          loading: true,
        },
      },
    });

    expect(screen.getByText('Creating Account...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  });

  it('displays error message when signup fails', () => {
    const errorMessage = 'Email already exists';
    renderWithProviders(<Signup />, {
      initialState: {
        auth: {
          error: errorMessage,
        },
      },
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('handles form submission with valid data', async () => {
    const { store } = renderWithProviders(<Signup />);
    
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
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
    renderWithProviders(<Signup />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('shows password mismatch error', async () => {
    renderWithProviders(<Signup />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword' } });
    fireEvent.blur(confirmPasswordInput);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('preserves redirect location when switching to login', () => {
    const mockLocationWithState = {
      state: { from: { pathname: '/interview' } },
    };
    
    vi.mocked(require('react-router-dom').useLocation).mockReturnValue(mockLocationWithState);
    
    renderWithProviders(<Signup />);
    
    const loginLink = screen.getByText('Sign in here');
    fireEvent.click(loginLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login', {
      state: { from: { pathname: '/interview' } },
      replace: true,
    });
  });
});