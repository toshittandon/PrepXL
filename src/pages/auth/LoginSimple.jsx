import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import LoginForm from '../../components/forms/LoginForm';
import OAuthButtons from '../../components/forms/OAuthButtons';
import { selectIsAuthenticated } from '../../store/slices/authSlice';

const LoginSimple = ({ onSuccess, onSwitchToSignup }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && onSuccess) {
      onSuccess();
    }
  }, [isAuthenticated, onSuccess]);

  const handleLoginSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleSwitchToSignup = () => {
    if (onSwitchToSignup) {
      onSwitchToSignup();
    }
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
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <div className="mt-6">
            <OAuthButtons 
              successUrl={`${window.location.origin}/dashboard`}
              failureUrl={`${window.location.origin}/auth/login?error=oauth_failed`}
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={handleSwitchToSignup}
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginSimple;