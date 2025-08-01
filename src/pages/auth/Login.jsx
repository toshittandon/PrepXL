import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginForm from '../../components/forms/LoginForm';
import OAuthButtons from '../../components/forms/OAuthButtons';
import { selectIsAuthenticated } from '../../store/slices/authSlice';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleLoginSuccess = () => {
    const from = location.state?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
  };

  const handleSwitchToSignup = () => {
    navigate('/auth/signup', { 
      state: { from: location.state?.from },
      replace: true 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            InterviewPrep AI
          </h1>
          <p className="text-sm text-gray-600">
            AI-powered interview preparation platform
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm 
          onSuccess={handleLoginSuccess}
          onSwitchToSignup={handleSwitchToSignup}
        />
        
        <div className="mt-6">
          <OAuthButtons 
            successUrl={`${window.location.origin}/dashboard`}
            failureUrl={`${window.location.origin}/auth/login?error=oauth_failed`}
          />
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/auth/signup"
              state={{ from: location.state?.from }}
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;