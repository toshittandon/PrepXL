import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AuthGuard, { ProtectedRoute, PublicRoute } from '../AuthGuard.jsx';
import authReducer from '../../../store/slices/authSlice.js';

// Mock the auth service
vi.mock('../../../services/appwrite/auth.js', () => ({
  authService: {
    getCurrentSession: vi.fn(),
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

const TestComponent = () => <div>Test Component</div>;
const AuthPage = () => <div>Auth Page</div>;
const DashboardPage = () => <div>Dashboard Page</div>;

const renderWithProviders = (component, store, initialRoute = '/') => {
  window.history.pushState({}, 'Test page', initialRoute);
  
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/protected" element={component} />
          <Route path="/public" element={component} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

describe('AuthGuard', () => {
  describe('when not initialized', () => {
    it('shows loading spinner', () => {
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
  });

  describe('when initialized and authenticated', () => {
    it('renders children for protected routes', () => {
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

      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    it('redirects to dashboard for public routes', () => {
      const store = createMockStore({
        auth: { 
          isInitialized: true, 
          isAuthenticated: true,
          loading: false 
        }
      });

      renderWithProviders(
        <AuthGuard requireAuth={false}>
          <TestComponent />
        </AuthGuard>,
        store,
        '/public'
      );

      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });
  });

  describe('when initialized but not authenticated', () => {
    it('redirects to auth page for protected routes', () => {
      const store = createMockStore({
        auth: { 
          isInitialized: true, 
          isAuthenticated: false,
          loading: false 
        }
      });

      renderWithProviders(
        <AuthGuard requireAuth={true}>
          <TestComponent />
        </AuthGuard>,
        store,
        '/protected'
      );

      expect(screen.getByText('Auth Page')).toBeInTheDocument();
    });

    it('renders children for public routes', () => {
      const store = createMockStore({
        auth: { 
          isInitialized: true, 
          isAuthenticated: false,
          loading: false 
        }
      });

      render(
        <Provider store={store}>
          <AuthGuard requireAuth={false}>
            <TestComponent />
          </AuthGuard>
        </Provider>
      );

      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });
});

describe('ProtectedRoute', () => {
  it('works as a wrapper for AuthGuard with requireAuth=true', () => {
    const store = createMockStore({
      auth: { 
        isInitialized: true, 
        isAuthenticated: true,
        loading: false 
      }
    });

    render(
      <Provider store={store}>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </Provider>
    );

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
});

describe('PublicRoute', () => {
  it('works as a wrapper for AuthGuard with requireAuth=false', () => {
    const store = createMockStore({
      auth: { 
        isInitialized: true, 
        isAuthenticated: false,
        loading: false 
        }
    });

    render(
      <Provider store={store}>
        <PublicRoute>
          <TestComponent />
        </PublicRoute>
      </Provider>
    );

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
});