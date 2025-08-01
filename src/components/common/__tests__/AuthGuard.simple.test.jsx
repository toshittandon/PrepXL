import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi, describe, it, expect } from 'vitest';
import AuthGuard from '../AuthGuard.jsx';
import authReducer from '../../../store/slices/authSlice.js';

// Mock React Router
vi.mock('react-router-dom', () => ({
  Navigate: ({ to }) => <div data-testid="navigate">Redirecting to {to}</div>,
  useLocation: () => ({ pathname: '/test', state: null }),
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

const TestComponent = () => <div>Protected Content</div>;

describe('AuthGuard (Simple)', () => {
  it('shows loading when not initialized', () => {
    const store = createMockStore({
      auth: { isInitialized: false, loading: true }
    });

    render(
      <Provider store={store}>
        <AuthGuard>
          <TestComponent />
        </AuthGuard>
      </Provider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders children when authenticated and requireAuth is true', () => {
    const store = createMockStore({
      auth: { 
        isInitialized: true, 
        isAuthenticated: true,
        loading: false 
      }
    });

    render(
      <Provider store={store}>
        <AuthGuard requireAuth={true}>
          <TestComponent />
        </AuthGuard>
      </Provider>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects when not authenticated and requireAuth is true', () => {
    const store = createMockStore({
      auth: { 
        isInitialized: true, 
        isAuthenticated: false,
        loading: false 
      }
    });

    render(
      <Provider store={store}>
        <AuthGuard requireAuth={true}>
          <TestComponent />
        </AuthGuard>
      </Provider>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByText('Redirecting to /auth')).toBeInTheDocument();
  });
});