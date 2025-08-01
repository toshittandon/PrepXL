import { useState } from 'react';
import { authService } from '../../services/appwrite/auth.js';

const OAuthButtons = ({ successUrl, failureUrl }) => {
  const [loading, setLoading] = useState({ google: false, linkedin: false, apple: false, github: false });

  const handleGoogleLogin = async () => {
    try {
      setLoading(prev => ({ ...prev, google: true }));
      
      // Set default URLs if not provided
      const defaultSuccessUrl = successUrl || `${window.location.origin}/dashboard`;
      const defaultFailureUrl = failureUrl || `${window.location.origin}/auth?error=oauth_failed`;
      
      console.log('Google OAuth URLs:', {
        successUrl: defaultSuccessUrl,
        failureUrl: defaultFailureUrl,
        origin: window.location.origin
      });
      
      await authService.loginWithGoogle(defaultSuccessUrl, defaultFailureUrl);
    } catch (error) {
      console.error('Google OAuth failed:', error);
      setLoading(prev => ({ ...prev, google: false }));
    }
  };

  const handleLinkedInLogin = async () => {
    try {
      setLoading(prev => ({ ...prev, linkedin: true }));
      
      // Set default URLs if not provided
      const defaultSuccessUrl = successUrl || `${window.location.origin}/dashboard`;
      const defaultFailureUrl = failureUrl || `${window.location.origin}/auth?error=oauth_failed`;
      
      await authService.loginWithLinkedIn(defaultSuccessUrl, defaultFailureUrl);
    } catch (error) {
      console.error('LinkedIn OAuth failed:', error);
      setLoading(prev => ({ ...prev, linkedin: false }));
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLoading(prev => ({ ...prev, apple: true }));
      
      // Set default URLs if not provided
      const defaultSuccessUrl = successUrl || `${window.location.origin}/dashboard`;
      const defaultFailureUrl = failureUrl || `${window.location.origin}/auth?error=oauth_failed`;
      
      await authService.loginWithApple(defaultSuccessUrl, defaultFailureUrl);
    } catch (error) {
      console.error('Apple OAuth failed:', error);
      setLoading(prev => ({ ...prev, apple: false }));
    }
  };

  const handleGitHubLogin = async () => {
    try {
      setLoading(prev => ({ ...prev, github: true }));
      
      // Set default URLs if not provided
      const defaultSuccessUrl = successUrl || `${window.location.origin}/dashboard`;
      const defaultFailureUrl = failureUrl || `${window.location.origin}/auth?error=oauth_failed`;
      
      await authService.loginWithGitHub(defaultSuccessUrl, defaultFailureUrl);
    } catch (error) {
      console.error('GitHub OAuth failed:', error);
      setLoading(prev => ({ ...prev, github: false }));
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={Object.values(loading).some(Boolean)}
          className={`w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            Object.values(loading).some(Boolean) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading.google ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
          ) : (
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Continue with Google
        </button>

        <button
          type="button"
          onClick={handleLinkedInLogin}
          disabled={Object.values(loading).some(Boolean)}
          className={`w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            Object.values(loading).some(Boolean) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading.linkedin ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
          ) : (
            <svg className="w-4 h-4 mr-2" fill="#0077B5" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          )}
          Continue with LinkedIn
        </button>

        <button
          type="button"
          onClick={handleAppleLogin}
          disabled={Object.values(loading).some(Boolean)}
          className={`w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            Object.values(loading).some(Boolean) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading.apple ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
          ) : (
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
            </svg>
          )}
          Continue with Apple
        </button>

        <button
          type="button"
          onClick={handleGitHubLogin}
          disabled={Object.values(loading).some(Boolean)}
          className={`w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            Object.values(loading).some(Boolean) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading.github ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
          ) : (
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          )}
          Continue with GitHub
        </button>
      </div>
    </div>
  );
};

export default OAuthButtons;