import { BrowserRouter as Router } from 'react-router-dom';
import { useEffect, Suspense, memo } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuthStatus } from './store/slices/authSlice';
import { 
  LoadingSpinner, 
  RouteRenderer, 
  ErrorBoundary, 
  NotificationSystem, 
  OfflineIndicator 
} from './components/common';
import { logBundleInfo, logMemoryUsage } from './utils/performance';
import './App.css';

const App = memo(() => {
  const dispatch = useDispatch();

  console.log('App component is rendering');

  useEffect(() => {
    console.log('App useEffect - dispatching checkAuthStatus');
    // Check authentication status on app load
    dispatch(checkAuthStatus());
    
    // Initialize performance monitoring in development
    if (process.env.NODE_ENV === 'development') {
      // Log performance info after initial render
      const timer = setTimeout(() => {
        logBundleInfo();
        logMemoryUsage();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <OfflineIndicator />
          <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
            <RouteRenderer />
          </Suspense>
          <NotificationSystem />
        </div>
      </Router>
    </ErrorBoundary>
  );
});

App.displayName = 'App';

export default App;