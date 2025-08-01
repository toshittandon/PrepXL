/**
 * Redux middleware for global error handling
 */
import { addNotification, removeNotification } from '../slices/uiSlice';
import { 
  getUserFriendlyError, 
  logError, 
  categorizeError,
  ERROR_TYPES,
  ERROR_SEVERITY 
} from '../../utils/errorHandling';

/**
 * Error handling middleware for Redux
 * Catches rejected async thunks and handles them appropriately
 */
export const errorMiddleware = (store) => (next) => (action) => {
  // Handle rejected async thunks
  if (action.type.endsWith('/rejected')) {
    const error = action.payload || action.error;
    const errorType = categorizeError(error);
    const friendlyError = getUserFriendlyError(error);
    
    // Log error
    logError(error, {
      action: action.type,
      meta: action.meta
    });

    // Don't show notifications for certain error types that should be handled by components
    const skipNotification = [
      ERROR_TYPES.VALIDATION,
      ERROR_TYPES.AUTHENTICATION // Let auth components handle these
    ].includes(errorType);

    // Don't show notification if error is already handled by component
    const isHandledByComponent = action.meta?.arg?.skipErrorNotification;

    if (!skipNotification && !isHandledByComponent) {
      // Create notification based on error severity
      const notification = {
        type: 'error',
        title: friendlyError.title,
        message: friendlyError.message,
        duration: friendlyError.severity === ERROR_SEVERITY.CRITICAL ? null : 8000,
        persistent: friendlyError.severity === ERROR_SEVERITY.CRITICAL
      };

      // Add retry action if applicable
      if (errorType === ERROR_TYPES.NETWORK || errorType === ERROR_TYPES.SERVER) {
        notification.actions = [{
          label: 'Retry',
          handler: () => {
            // Re-dispatch the original action if possible
            if (action.meta?.arg && store.dispatch) {
              const originalAction = action.type.replace('/rejected', '');
              store.dispatch({ type: originalAction, payload: action.meta.arg });
            }
          },
          primary: true
        }];
      }

      store.dispatch(addNotification(notification));
    }
  }

  // Handle pending actions to clear previous errors
  if (action.type.endsWith('/pending')) {
    // Clear any existing error notifications for this action type
    const actionBase = action.type.replace('/pending', '');
    const currentNotifications = store.getState().ui.notifications;
    
    currentNotifications.forEach(notification => {
      if (notification.actionType === actionBase && notification.type === 'error') {
        store.dispatch(removeNotification(notification.id));
      }
    });
  }

  return next(action);
};

/**
 * Network status middleware
 * Monitors network-related actions and provides feedback
 */
export const networkStatusMiddleware = (store) => (next) => (action) => {
  // Monitor for network-related errors
  if (action.type.endsWith('/rejected')) {
    const error = action.payload || action.error;
    const errorType = categorizeError(error);
    
    if (errorType === ERROR_TYPES.NETWORK) {
      // Check if we're actually offline
      if (!navigator.onLine) {
        store.dispatch(addNotification({
          type: 'warning',
          title: 'Connection Lost',
          message: 'You appear to be offline. Please check your internet connection.',
          persistent: true,
          actions: [{
            label: 'Retry when online',
            handler: () => {
              // Queue action for when connection is restored
              if (action.meta?.arg) {
                // Store action in localStorage for retry
                const queuedActions = JSON.parse(localStorage.getItem('queuedActions') || '[]');
                queuedActions.push({
                  type: action.type.replace('/rejected', ''),
                  payload: action.meta.arg,
                  timestamp: Date.now()
                });
                localStorage.setItem('queuedActions', JSON.stringify(queuedActions));
              }
            }
          }]
        }));
      }
    }
  }

  return next(action);
};

/**
 * Performance monitoring middleware
 * Tracks slow operations and provides feedback
 */
export const performanceMiddleware = (store) => (next) => (action) => {
  const start = performance.now();
  
  const result = next(action);
  
  const duration = performance.now() - start;
  
  // Warn about slow operations (> 100ms for synchronous actions)
  if (duration > 100 && !action.type.includes('async')) {
    console.warn(`Slow Redux action detected: ${action.type} took ${duration.toFixed(2)}ms`);
    
    // In development, show notification for very slow operations
    if (process.env.NODE_ENV === 'development' && duration > 500) {
      store.dispatch(addNotification({
        type: 'warning',
        title: 'Performance Warning',
        message: `Action "${action.type}" took ${duration.toFixed(0)}ms to complete.`,
        duration: 3000
      }));
    }
  }
  
  return result;
};

/**
 * Action sanitization middleware
 * Prevents sensitive data from being logged or stored
 */
export const sanitizationMiddleware = (store) => (next) => (action) => {
  // List of sensitive fields to sanitize
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
  
  // Create sanitized action for logging
  const sanitizedAction = { ...action };
  
  if (action.payload && typeof action.payload === 'object') {
    sanitizedAction.payload = { ...action.payload };
    
    sensitiveFields.forEach(field => {
      if (sanitizedAction.payload[field]) {
        sanitizedAction.payload[field] = '[REDACTED]';
      }
    });
  }
  
  // Log sanitized action in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Redux Action:', sanitizedAction);
  }
  
  return next(action);
};