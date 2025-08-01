import { useState } from 'react';
import { LoginForm, SignupForm, OAuthButtons } from './index.js';

const AuthDemo = () => {
  const [currentView, setCurrentView] = useState('login'); // 'login' or 'signup'

  const handleAuthSuccess = (result) => {
    console.log('Authentication successful:', result);
    // In a real app, this would redirect to dashboard
    alert('Authentication successful! Check console for details.');
  };

  const handleSwitchToSignup = () => {
    setCurrentView('signup');
  };

  const handleSwitchToLogin = () => {
    setCurrentView('login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
          InterviewPrep AI
        </h1>
        
        {currentView === 'login' ? (
          <LoginForm 
            onSuccess={handleAuthSuccess}
            onSwitchToSignup={handleSwitchToSignup}
          />
        ) : (
          <SignupForm 
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={handleSwitchToLogin}
          />
        )}
        
        <div className="mt-6">
          <OAuthButtons 
            successUrl="/dashboard"
            failureUrl="/auth?error=oauth_failed"
          />
        </div>
      </div>
    </div>
  );
};

export default AuthDemo;