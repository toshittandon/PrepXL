import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import {
  checkAuthStatus,
  selectIsAuthenticated,
  selectAuthLoading,
  selectIsInitialized
} from '../../store/slices/authSlice.js';
import { navigationHelpers, ROUTES } from '../../utils/navigation.js';
import LoadingSpinner from './LoadingSpinner.jsx';

const AuthGuard = ({ children, requireAuth = true, redirectTo = null }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const isInitialized = useSelector(selectIsInitialized);

  console.log('AuthGuard - Current state:', {
    requireAuth,
    isAuthenticated,
    loading,
    isInitialized,
    location: location.pathname
  });

  useEffect(() => {
    // Check authentication status on mount if not initialized
    if (!isInitialized) {
      console.log('AuthGuard - Dispatching checkAuthStatus');
      dispatch(checkAuthStatus());
    }
  }, [dispatch, isInitialized]);

  // Show loading spinner while checking authentication
  if (!isInitialized || loading) {
    console.log('AuthGuard - Showing loading spinner');
    return (
      <div style={{ padding: '20px', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 2s linear infinite'
          }}></div>
          <p style={{ marginTop: '10px' }}>Checking authentication...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    const redirectPath = redirectTo || navigationHelpers.getUnauthenticatedRedirect();
    console.log('AuthGuard - Redirecting to login:', redirectPath);
    // Save the attempted location for redirect after login
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If authentication is not required but user is authenticated (e.g., auth pages)
  if (!requireAuth && isAuthenticated) {
    // Redirect to dashboard or the intended destination
    const intendedPath = location.state?.from?.pathname;
    const redirectPath = navigationHelpers.getAuthenticatedRedirect(intendedPath);
    console.log('AuthGuard - Authenticated user on public route, redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  // Render children if all conditions are met
  console.log('AuthGuard - Rendering children');
  return children;
};

// Higher-order component for protected routes
export const ProtectedRoute = ({ children, redirectTo = null }) => {
  return (
    <AuthGuard requireAuth={true} redirectTo={redirectTo}>
      {children}
    </AuthGuard>
  );
};

// Higher-order component for public routes (redirect if authenticated)
export const PublicRoute = ({ children, redirectTo = null }) => {
  return (
    <AuthGuard requireAuth={false} redirectTo={redirectTo}>
      {children}
    </AuthGuard>
  );
};

export default AuthGuard;