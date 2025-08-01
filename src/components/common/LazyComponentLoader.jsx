import { Suspense, memo } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

const LazyComponentLoader = memo(({ 
  children, 
  fallback = null, 
  errorFallback = null,
  loadingMessage = "Loading component..."
}) => {
  const defaultFallback = fallback || (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner message={loadingMessage} />
    </div>
  );

  const defaultErrorFallback = errorFallback || (
    <div className="flex items-center justify-center p-8">
      <div className="text-center text-gray-500">
        <svg 
          className="w-12 h-12 mx-auto mb-4 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
        <p className="text-sm">Failed to load component</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-blue-600 hover:text-blue-500 text-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={defaultErrorFallback}>
      <Suspense fallback={defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
});

LazyComponentLoader.displayName = 'LazyComponentLoader';

export default LazyComponentLoader;