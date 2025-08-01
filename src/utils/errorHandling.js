/**
 * Error handling utilities for the application
 */

/**
 * Safely extract error message from error object or string
 * @param {Error|Object|string} error - Error to extract message from
 * @param {string} fallback - Fallback message if no message found
 * @returns {string} Error message string
 */
export const getErrorMessage = (error, fallback = 'An unexpected error occurred') => {
  if (!error) return fallback;
  
  // If it's already a string, return it
  if (typeof error === 'string') return error;
  
  // If it's an object, try to extract message
  if (typeof error === 'object') {
    // Try common error message properties
    if (error.message) return error.message;
    if (error.error) return error.error;
    if (error.details) return error.details;
    if (error.description) return error.description;
    
    // For Appwrite errors
    if (error.type && error.code) {
      return `${error.type}: ${error.message || 'Unknown error'}`;
    }
  }
  
  return fallback;
};

// Error types for categorization
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION',
  VALIDATION: 'VALIDATION',
  PERMISSION: 'PERMISSION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  CLIENT: 'CLIENT',
  UNKNOWN: 'UNKNOWN'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Categorize error based on error object or status code
 * @param {Error|Object} error - Error object or response
 * @returns {string} Error type
 */
export const categorizeError = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;

  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
    return ERROR_TYPES.NETWORK;
  }

  // HTTP status code based categorization
  if (error.status || error.code) {
    const status = error.status || error.code;
    
    if (status === 401 || status === 403) {
      return ERROR_TYPES.AUTHENTICATION;
    }
    if (status === 404) {
      return ERROR_TYPES.NOT_FOUND;
    }
    if (status === 400 || status === 422) {
      return ERROR_TYPES.VALIDATION;
    }
    if (status >= 500) {
      return ERROR_TYPES.SERVER;
    }
    if (status >= 400 && status < 500) {
      return ERROR_TYPES.CLIENT;
    }
  }

  // Appwrite specific errors
  if (error.type) {
    if (error.type.includes('user_') || error.type.includes('account_')) {
      return ERROR_TYPES.AUTHENTICATION;
    }
    if (error.type.includes('document_') || error.type.includes('collection_')) {
      return ERROR_TYPES.PERMISSION;
    }
  }

  return ERROR_TYPES.UNKNOWN;
};

/**
 * Get error severity based on error type and context
 * @param {string} errorType - Error type from categorizeError
 * @param {Object} context - Additional context
 * @returns {string} Error severity
 */
export const getErrorSeverity = (errorType, context = {}) => {
  switch (errorType) {
    case ERROR_TYPES.AUTHENTICATION:
      return context.isLoginPage ? ERROR_SEVERITY.MEDIUM : ERROR_SEVERITY.HIGH;
    case ERROR_TYPES.NETWORK:
      return ERROR_SEVERITY.MEDIUM;
    case ERROR_TYPES.SERVER:
      return ERROR_SEVERITY.HIGH;
    case ERROR_TYPES.VALIDATION:
      return ERROR_SEVERITY.LOW;
    case ERROR_TYPES.PERMISSION:
      return ERROR_SEVERITY.MEDIUM;
    case ERROR_TYPES.NOT_FOUND:
      return ERROR_SEVERITY.LOW;
    default:
      return ERROR_SEVERITY.MEDIUM;
  }
};

/**
 * Generate user-friendly error messages
 * @param {Error|Object} error - Error object
 * @param {Object} context - Additional context
 * @returns {Object} User-friendly error message object
 */
export const getUserFriendlyError = (error, context = {}) => {
  const errorType = categorizeError(error);
  const severity = getErrorSeverity(errorType, context);

  const baseMessages = {
    [ERROR_TYPES.NETWORK]: {
      title: 'Connection Problem',
      message: 'Please check your internet connection and try again.',
      suggestion: 'Make sure you\'re connected to the internet'
    },
    [ERROR_TYPES.AUTHENTICATION]: {
      title: 'Authentication Required',
      message: 'Please log in to continue.',
      suggestion: 'Your session may have expired'
    },
    [ERROR_TYPES.VALIDATION]: {
      title: 'Invalid Input',
      message: 'Please check your input and try again.',
      suggestion: 'Make sure all required fields are filled correctly'
    },
    [ERROR_TYPES.PERMISSION]: {
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action.',
      suggestion: 'Contact support if you believe this is an error'
    },
    [ERROR_TYPES.NOT_FOUND]: {
      title: 'Not Found',
      message: 'The requested resource could not be found.',
      suggestion: 'The item may have been moved or deleted'
    },
    [ERROR_TYPES.SERVER]: {
      title: 'Server Error',
      message: 'Something went wrong on our end. Please try again later.',
      suggestion: 'Our team has been notified and is working on a fix'
    },
    [ERROR_TYPES.CLIENT]: {
      title: 'Request Error',
      message: 'There was a problem with your request.',
      suggestion: 'Please try again or contact support'
    },
    [ERROR_TYPES.UNKNOWN]: {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred.',
      suggestion: 'Please try again or refresh the page'
    }
  };

  // Override with specific error message if available
  let message = baseMessages[errorType];
  if (error.message && !error.message.includes('fetch')) {
    message = {
      ...message,
      message: error.message
    };
  }

  return {
    ...message,
    type: errorType,
    severity,
    originalError: error
  };
};

/**
 * Retry mechanism with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Promise that resolves with the result or rejects with the last error
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = (error) => categorizeError(error) === ERROR_TYPES.NETWORK
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if condition is not met or if it's the last attempt
      if (!retryCondition(error) || attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;
      
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${jitteredDelay}ms:`, error);
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  throw lastError;
};

/**
 * Create a retry wrapper for async functions
 * @param {Function} fn - Function to wrap
 * @param {Object} options - Retry options
 * @returns {Function} Wrapped function with retry logic
 */
export const withRetry = (fn, options = {}) => {
  return async (...args) => {
    return retryWithBackoff(() => fn(...args), options);
  };
};

/**
 * Error recovery strategies
 */
export const RECOVERY_STRATEGIES = {
  RETRY: 'RETRY',
  REFRESH: 'REFRESH',
  REDIRECT: 'REDIRECT',
  FALLBACK: 'FALLBACK',
  IGNORE: 'IGNORE'
};

/**
 * Get recommended recovery strategy for an error
 * @param {string} errorType - Error type
 * @param {Object} context - Additional context
 * @returns {string} Recovery strategy
 */
export const getRecoveryStrategy = (errorType, context = {}) => {
  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      return RECOVERY_STRATEGIES.RETRY;
    case ERROR_TYPES.AUTHENTICATION:
      return context.isPublicPage ? RECOVERY_STRATEGIES.REDIRECT : RECOVERY_STRATEGIES.REFRESH;
    case ERROR_TYPES.NOT_FOUND:
      return RECOVERY_STRATEGIES.REDIRECT;
    case ERROR_TYPES.SERVER:
      return RECOVERY_STRATEGIES.RETRY;
    case ERROR_TYPES.VALIDATION:
      return RECOVERY_STRATEGIES.IGNORE; // Let form handle it
    default:
      return RECOVERY_STRATEGIES.FALLBACK;
  }
};

/**
 * Log error for monitoring/debugging
 * @param {Error} error - Error to log
 * @param {Object} context - Additional context
 */
export const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    type: categorizeError(error),
    severity: getErrorSeverity(categorizeError(error), context),
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    context
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorInfo);
  }

  // In production, you might want to send this to an error monitoring service
  // Example: sendToErrorService(errorInfo);
};

/**
 * Create error notification object for the notification system
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 * @returns {Object} Notification object
 */
export const createErrorNotification = (error, context = {}) => {
  const friendlyError = getUserFriendlyError(error, context);
  const recoveryStrategy = getRecoveryStrategy(friendlyError.type, context);
  
  const notification = {
    type: 'error',
    title: friendlyError.title,
    message: friendlyError.message,
    duration: friendlyError.severity === ERROR_SEVERITY.CRITICAL ? null : 8000,
    persistent: friendlyError.severity === ERROR_SEVERITY.CRITICAL
  };

  // Add recovery actions based on strategy
  const actions = [];
  
  if (recoveryStrategy === RECOVERY_STRATEGIES.RETRY && context.retryAction) {
    actions.push({
      label: 'Try Again',
      handler: context.retryAction,
      primary: true
    });
  }
  
  if (recoveryStrategy === RECOVERY_STRATEGIES.REFRESH) {
    actions.push({
      label: 'Refresh Page',
      handler: () => window.location.reload(),
      primary: true
    });
  }
  
  if (recoveryStrategy === RECOVERY_STRATEGIES.REDIRECT && context.redirectAction) {
    actions.push({
      label: 'Go Back',
      handler: context.redirectAction,
      primary: true
    });
  }

  if (actions.length > 0) {
    notification.actions = actions;
  }

  return notification;
};