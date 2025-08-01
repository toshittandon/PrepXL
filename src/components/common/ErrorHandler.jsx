import { useEffect, useState } from 'react';
import { useErrorHandler } from '../../hooks/useErrorHandler.jsx';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import ErrorMessage from './ErrorMessage';
import Button from './Button';
import ErrorBoundary from './ErrorBoundary';

/**
 * Generic error display component with retry functionality
 */
export const ErrorDisplay = ({ 
  error, 
  onRetry, 
  showRetry = true, 
  variant = 'default',
  className = '' 
}) => {
  const { handleError, createRetryHandler } = useErrorHandler();

  useEffect(() => {
    if (error) {
      handleError(error, { component: 'ErrorDisplay' });
    }
  }, [error, handleError]);

  if (!error) return null;

  const retryHandler = onRetry && showRetry ? createRetryHandler(onRetry) : null;

  return (
    <div className={`space-y-4 ${className}`}>
      <ErrorMessage
        message={error.message || 'An error occurred'}
        title={error.title}
        variant={variant}
      />
      
      {retryHandler && (
        <div className="flex justify-center">
          <Button
            onClick={retryHandler}
            variant="secondary"
            size="sm"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * Error boundary wrapper for specific components
 */
export const ComponentErrorBoundary = ({ 
  children, 
  fallback, 
  onError,
  resetKeys = [] 
}) => {
  const { createErrorFallback } = useErrorHandler();

  const defaultFallback = createErrorFallback({
    title: 'Component Error',
    message: 'This component encountered an error.',
    showRetry: true,
    showReload: false
  });

  return (
    <ErrorBoundary
      fallback={fallback || defaultFallback}
      onError={onError}
      resetKeys={resetKeys}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Async operation wrapper with error handling
 */
export const AsyncOperationWrapper = ({ 
  children, 
  operation, 
  loadingComponent,
  errorComponent,
  onSuccess,
  onError 
}) => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    data: null
  });

  const { withErrorHandling } = useErrorHandler();

  const wrappedOperation = withErrorHandling(operation, {
    showLoading: false,
    errorContext: { component: 'AsyncOperationWrapper' }
  });

  const executeOperation = async (...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await wrappedOperation(...args);
      setState({ loading: false, error: null, data: result });
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error }));
      
      if (onError) {
        onError(error);
      }
    }
  };

  if (state.loading && loadingComponent) {
    return loadingComponent;
  }

  if (state.error && errorComponent) {
    return errorComponent(state.error, executeOperation);
  }

  return children({ 
    execute: executeOperation, 
    loading: state.loading, 
    error: state.error, 
    data: state.data 
  });
};

/**
 * Form error handler component
 */
export const FormErrorHandler = ({ 
  errors, 
  touched, 
  onRetry,
  className = '' 
}) => {
  if (!errors || Object.keys(errors).length === 0) {
    return null;
  }

  // Handle root-level errors (general form errors)
  const rootError = errors.root;
  if (rootError && touched?.root) {
    return (
      <div className={className}>
        <ErrorDisplay
          error={rootError}
          onRetry={onRetry}
          variant="inline"
        />
      </div>
    );
  }

  // Handle field-specific errors
  const fieldErrors = Object.entries(errors)
    .filter(([key]) => key !== 'root')
    .filter(([key]) => touched?.[key]);

  if (fieldErrors.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {fieldErrors.map(([field, error]) => (
        <ErrorMessage
          key={field}
          message={error.message || error}
          variant="inline"
          className="text-sm"
        />
      ))}
    </div>
  );
};

/**
 * Network status aware component wrapper
 */
export const NetworkAwareWrapper = ({ 
  children, 
  offlineComponent,
  slowConnectionComponent 
}) => {
  const { isOnline, quality } = useNetworkStatus();

  if (!isOnline && offlineComponent) {
    return offlineComponent;
  }

  if (quality === 'poor' && slowConnectionComponent) {
    return slowConnectionComponent;
  }

  return children;
};

/**
 * Retry button component with exponential backoff visualization
 */
export const RetryButton = ({ 
  onRetry, 
  maxRetries = 3, 
  disabled = false,
  className = '' 
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (retryCount >= maxRetries || isRetrying) return;

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      await onRetry();
      setRetryCount(0); // Reset on success
    } catch (error) {
      // Error will be handled by parent component
    } finally {
      setIsRetrying(false);
    }
  };

  const isMaxRetriesReached = retryCount >= maxRetries;

  return (
    <Button
      onClick={handleRetry}
      disabled={disabled || isRetrying || isMaxRetriesReached}
      variant={isMaxRetriesReached ? 'secondary' : 'primary'}
      size="sm"
      className={className}
    >
      {isRetrying ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Retrying...
        </>
      ) : isMaxRetriesReached ? (
        'Max Retries Reached'
      ) : (
        `Try Again ${retryCount > 0 ? `(${retryCount}/${maxRetries})` : ''}`
      )}
    </Button>
  );
};

export default {
  ErrorDisplay,
  ComponentErrorBoundary,
  AsyncOperationWrapper,
  FormErrorHandler,
  NetworkAwareWrapper,
  RetryButton
};