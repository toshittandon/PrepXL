import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import App from '../../../App';

// Mock the auth slice
const mockAuthSlice = {
  name: 'auth',
  initialState: {
    user: null,
    session: null,
    loading: false,
    error: null,
    isInitialized: true
  },
  reducers: {},
  extraReducers: () => {}
};

// Mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = mockAuthSlice.initialState) => state
    },
    preloadedState: initialState
  });
};

// Mock the checkAuthStatus action
jest.mock('../../../store/slices/authSlice', () => ({
  checkAuthStatus: () => ({ type: 'auth/checkAuthStatus' }),
  selectIsAuthenticated: (state) => !!state.auth.user,
  selectAuthLoading: (state) => state.auth.loading,
  selectIsInitialized: (state) => state.auth.isInitialized
}));

// Mock lazy-loaded components to avoid import issues
jest.mock('../../../pages/resume/ResumeUpload', () => {
  return function ResumeUpload() {
    return <div data-testid="resume-upload">Resume Upload Page</div>;
  };
});

jest.mock('../../../pages/resume/ResumeAnalysis', () => {
  return function ResumeAnalysis() {
    return <div data-testid="resume-analysis">Resume Analysis Page</div>;
  };
});

jest.mock('../../../pages/interview/InterviewSetup', () => {
  return function InterviewSetup() {
    return <div data-testid="interview-setup">Interview Setup Page</div>;
  };
});

jest.mock('../../../pages/interview/LiveInterview', () => {
  return function LiveInterview() {
    return <div data-testid="live-interview">Live Interview Page</div>;
  };
});

jest.mock('../../../pages/interview/FeedbackReport', () => {
  return function FeedbackReport() {
    return <div data-testid="feedback-report">Feedback Report Page</div>;
  };
});

// Mock auth pages
jest.mock('../../../pages/auth', () => ({
  Login: function Login() {
    return <div data-testid="login-page">Login Page</div>;
  },
  Signup: function Signup() {
    return <div data-testid="signup-page">Signup Page</div>;
  }
}));

// Mock dashboard page
jest.mock('../../../pages/dashboard', () => ({
  Dashboard: function Dashboard() {
    return <div data-testid="dashboard-page">Dashboard Page</div>;
  }
}));

const renderWithProviders = (component, { initialState = {}, route = '/' } = {}) => {
  const store = createMockStore(initialState);
  
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        {component}
      </MemoryRouter>
    </Provider>
  );
};

describe('App Routing', () => {
  test('redirects unauthenticated users to login', async () => {
    renderWithProviders(<App />, {
      initialState: {
        auth: { ...mockAuthSlice.initialState, user: null }
      },
      route: '/dashboard'
    });

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  test('allows authenticated users to access dashboard', async () => {
    renderWithProviders(<App />, {
      initialState: {
        auth: { 
          ...mockAuthSlice.initialState, 
          user: { id: '1', email: 'test@example.com' }
        }
      },
      route: '/dashboard'
    });

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  test('redirects authenticated users away from auth pages', async () => {
    renderWithProviders(<App />, {
      initialState: {
        auth: { 
          ...mockAuthSlice.initialState, 
          user: { id: '1', email: 'test@example.com' }
        }
      },
      route: '/auth/login'
    });

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  test('shows loading spinner while checking auth status', async () => {
    renderWithProviders(<App />, {
      initialState: {
        auth: { 
          ...mockAuthSlice.initialState, 
          loading: true,
          isInitialized: false
        }
      },
      route: '/dashboard'
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('handles unknown routes by redirecting to login', async () => {
    renderWithProviders(<App />, {
      initialState: {
        auth: { ...mockAuthSlice.initialState, user: null }
      },
      route: '/unknown-route'
    });

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  test('root path redirects to dashboard', async () => {
    renderWithProviders(<App />, {
      initialState: {
        auth: { 
          ...mockAuthSlice.initialState, 
          user: { id: '1', email: 'test@example.com' }
        }
      },
      route: '/'
    });

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });
});