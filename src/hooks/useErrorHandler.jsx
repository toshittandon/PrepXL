import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification, removeNotification } from '../store/slices/uiSlice';
import { 
  getUserFriendlyError, 
  logError, 
  createErrorNotification,
  retryWithBackoff,
  categorizeError,
  ERROR_TYPES
} from '../utils/errorHandling';
import { useNetworkStatus } from './useNetworkStatus';

/**
 * Comprehensive error handling hook
 * @param {Object} options - Configuration options
 * @returns {Object} Error handling utilities
 */
export const useErrorHandler = (options = {}) => {
  const {
    context = {},
    enableRetry = true,
    enableNotifications = true,
    logErrors = true
  } = options;

  const dispatch = useDispatch();
  const { isOnline } = useNetworkStatus();

  /**
   * Handle error with comprehensive error processing
   * @param {Error} error - Error to handle
   * @param {Object} errorContext - Additional context for error handling
   */
  const handleError = useCallback((error, errorContext = {}) => {
    const fullContext = { ...context, ...errorContext, isOnline };

    // Log error if enabled
    if (logErrors) {
      logError(error, fullContext);
    }

    // Create and dispatch notification if enabled
    if (enableNotifications) {
      const notification = createErrorNotification(error, fullContext);
      dispatch(addNotification(notification));
    }

    // Return error info for component use
    return getUserFriendlyError(error, fullContext);
  }, [context, isOnline, logErrors, enableNotifications, dispatch]);

  /**
   * Create a retry handler for failed operations
   * @param {Function} operation - Operation to retry
   * @param {Object} retryOptions - Retry configuration
   * @returns {Function} Retry handler function
   */
  const createRetryHandler = useCallback((operation, retryOptions = {}) => {
    if (!enableRetry) return null;

    return async () => {
      try {
        await retryWithBackoff(operation, {
          maxRetries: 3,
          retryCondition: (error) => {
            const errorType = categorizeError(error);
            return errorType === ERROR_TYPES.NETWORK || errorType === ERROR_TYPES.SERVER;
          },
          ...retryOptions
        });

        // Success notification
        dispatch(addNotification({
          type: 'success',
          title: 'Success',
          message: 'Operation completed successfully.',
          duration: 3000
        }));
      } catch (retryError) {
        handleError(retryError, { isRetry: true });
      }
    };
  }, [enableRetry, dispatch, handleError]);

  /**
   * Wrap an async operation with error handling
   * @param {Function} operation - Async operation to wrap
   * @param {Object} wrapOptions - Wrapping options
   * @returns {Function} Wrapped operation
   */
  const withErrorHandling = useCallback((operation, wrapOptions = {}) => {
    const {
      showLoading = false,
      loadingMessage = 'Processing...',
      successMessage = null,
      errorContext = {}
    } = wrapOptions;

    return async (...args) => {
      try {
        // Show loading notification if requested
        let loadingNotificationId = null;
        if (showLoading) {
          const loadingNotification = {
            type: 'info',
            title: 'Loading',
            message: loadingMessage,
            persistent: true
          };
          dispatch(addNotification(loadingNotification));
          loadingNotificationId = loadingNotification.id;
        }

        // Execute operation
        const result = await operation(...args);

        // Remove loading notification
        if (loadingNotificationId) {
          dispatch(removeNotification(loadingNotificationId));
        }

        // Show success message if provided
        if (successMessage) {
          dispatch(addNotification({
            type: 'success',
            title: 'Success',
            message: successMessage,
            duration: 3000
          }));
        }

        return result;
      } catch (error) {
        // Remove loading notification on error
        if (loadingNotificationId) {
          dispatch(removeNotification(loadingNotificationId));
        }

        // Handle error
        const errorInfo = handleError(error, errorContext);
        
        // Re-throw error for component handling if needed
        throw { ...error, userFriendly: errorInfo };
      }
    };
  }, [dispatch, handleError]);

  /**
   * Create error boundary fallback component
   * @param {Object} fallbackOptions - Fallback options
   * @returns {Function} Fallback component
   */
  const createErrorFallback = useCallback((fallbackOptions = {}) => {
    const {
      title = 'Something went wrong',
      message = 'An unexpected error occurred.',
      showRetry = true,
      showReload = true,
      customActions = []
    } = fallbackOptions;

    return (error, retry) => (
      <div className="min-h-64 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showRetry && (
              <button
                onClick={retry}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            )}
            
            {showReload && (
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reload Page
              </button>
            )}
            
            {customActions.map((action, index) => (
              <button
                key={index}
                onClick={action.handler}
                className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  action.primary
                    ? 'border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }, []);

  /**
   * Handle form errors specifically
   * @param {Object} error - Form error object
   * @param {Function} setError - Form setError function
   */
  const handleFormError = useCallback((error, setError) => {
    const errorType = categorizeError(error);
    
    if (errorType === ERROR_TYPES.VALIDATION && error.details) {
      // Handle validation errors by setting field-specific errors
      Object.entries(error.details).forEach(([field, message]) => {
        setError(field, { type: 'server', message });
      });
    } else {
      // Handle general form errors
      const friendlyError = getUserFriendlyError(error);
      setError('root', { type: 'server', message: friendlyError.message });
    }

    // Also show notification for severe errors
    if (errorType !== ERROR_TYPES.VALIDATION) {
      handleError(error, { isFormError: true });
    }
  }, [handleError]);

  return {
    handleError,
    createRetryHandler,
    withErrorHandling,
    createErrorFallback,
    handleFormError,
    isOnline
  };
};