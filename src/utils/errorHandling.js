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
  // Don't log expected 401 errors during session checks
  if (error.code === 401 && (
    context.operation === 'session_check' || 
    context.operation === 'getCurrentUser' || 
    context.operation === 'getCurrentSession' ||
    context.suppressAuth401
  )) {
    return; // Silently ignore expected authentication failures
  }

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
 * Session conflict error types for detailed handling
 */
export const SESSION_CONFLICT_TYPES = {
  EXISTING_SESSION: 'EXISTING_SESSION',
  CURRENT_SESSION_CLEAR_FAILED: 'CURRENT_SESSION_CLEAR_FAILED',
  ALL_SESSIONS_CLEAR_FAILED: 'ALL_SESSIONS_CLEAR_FAILED',
  RESOLUTION_IN_PROGRESS: 'RESOLUTION_IN_PROGRESS',
  RESOLUTION_SUCCESS: 'RESOLUTION_SUCCESS'
};

/**
 * Generate specific error messages for session conflict scenarios
 * @param {string} conflictType - Type of session conflict
 * @param {Object} context - Additional context for error message
 * @returns {Object} Error message details
 */
export const getSessionConflictMessage = (conflictType, context = {}) => {
  const messages = {
    [SESSION_CONFLICT_TYPES.EXISTING_SESSION]: {
      title: 'Session Conflict Detected',
      message: 'You already have an active session. We\'ll clear it and log you in.',
      userMessage: 'Resolving session conflict...',
      debugMessage: 'Detected existing session during login attempt',
      recoverable: true,
      severity: ERROR_SEVERITY.MEDIUM
    },
    [SESSION_CONFLICT_TYPES.CURRENT_SESSION_CLEAR_FAILED]: {
      title: 'Session Clear Failed',
      message: 'Failed to clear current session. Trying to clear all sessions.',
      userMessage: 'Attempting alternative session resolution...',
      debugMessage: 'Current session clearing failed, falling back to all sessions clear',
      recoverable: true,
      severity: ERROR_SEVERITY.MEDIUM
    },
    [SESSION_CONFLICT_TYPES.ALL_SESSIONS_CLEAR_FAILED]: {
      title: 'Session Resolution Failed',
      message: 'Unable to resolve session conflict automatically.',
      userMessage: 'Please try signing out from all sessions manually or contact support.',
      debugMessage: 'All session clearing attempts failed',
      recoverable: false,
      severity: ERROR_SEVERITY.HIGH
    },
    [SESSION_CONFLICT_TYPES.RESOLUTION_IN_PROGRESS]: {
      title: 'Resolving Session Conflict',
      message: 'Clearing existing session and logging you in...',
      userMessage: 'Please wait while we resolve the session conflict.',
      debugMessage: 'Session conflict resolution in progress',
      recoverable: true,
      severity: ERROR_SEVERITY.LOW
    },
    [SESSION_CONFLICT_TYPES.RESOLUTION_SUCCESS]: {
      title: 'Session Resolved',
      message: 'Session conflict resolved successfully.',
      userMessage: 'You have been logged in successfully.',
      debugMessage: 'Session conflict resolved and new session created',
      recoverable: true,
      severity: ERROR_SEVERITY.LOW
    }
  };

  const baseMessage = messages[conflictType] || messages[SESSION_CONFLICT_TYPES.EXISTING_SESSION];

  return {
    ...baseMessage,
    type: 'SESSION_CONFLICT',
    conflictType,
    context,
    timestamp: new Date().toISOString()
  };
};

/**
 * Enhanced logging for session conflict scenarios
 * @param {string} conflictType - Type of session conflict
 * @param {Object} error - Original error object
 * @param {Object} context - Additional context
 */
export const logSessionConflictError = (conflictType, error, context = {}) => {
  const conflictMessage = getSessionConflictMessage(conflictType, context);

  const logData = {
    type: 'SESSION_CONFLICT',
    conflictType,
    severity: conflictMessage.severity,
    message: conflictMessage.debugMessage,
    userMessage: conflictMessage.userMessage,
    originalError: error,
    context: {
      ...context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }
  };

  // Log with appropriate detail level based on severity
  if (conflictMessage.severity === ERROR_SEVERITY.HIGH || conflictMessage.severity === ERROR_SEVERITY.CRITICAL) {
    console.error('Session Conflict Error:', logData);
  } else if (conflictMessage.severity === ERROR_SEVERITY.MEDIUM) {
    console.warn('Session Conflict Warning:', logData);
  } else {
    console.info('Session Conflict Info:', logData);
  }

  // In production, send to error monitoring service for high severity issues
  if (process.env.NODE_ENV === 'production' &&
    (conflictMessage.severity === ERROR_SEVERITY.HIGH || conflictMessage.severity === ERROR_SEVERITY.CRITICAL)) {
    // Example: sendToErrorService(logData);
  }
};

/**
 * Handle Appwrite-specific errors with proper error transformation
 * @param {Error|Object} error - Appwrite error object
 * @param {string} fallbackMessage - Fallback message if error parsing fails
 * @returns {Error} Standardized error object
 */
export const handleAppwriteError = (error, fallbackMessage = 'An error occurred') => {
  // If it's already a standard Error, return it
  if (error instanceof Error && !error.type) {
    return error;
  }

  let message = fallbackMessage;
  let code = null;
  let type = null;

  // Handle Appwrite error structure
  if (error && typeof error === 'object') {
    // Appwrite errors have a specific structure
    if (error.message) {
      message = error.message;
    }

    if (error.code) {
      code = error.code;
    }

    if (error.type) {
      type = error.type;
    }

    // Handle specific Appwrite error types with user-friendly messages
    switch (error.code) {
      case 401:
        message = 'Authentication required. Please log in again.';
        // Dispatch global auth error event for the AuthErrorBoundary to handle
        // Use setTimeout to avoid React warning about updating components during render
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            const authErrorEvent = new CustomEvent('authError', {
              detail: {
                code: 401,
                message,
                type: type || 'authentication_required',
                originalError: error
              }
            });
            window.dispatchEvent(authErrorEvent);
          }, 0);
        }
        break;
      case 403:
        message = 'You don\'t have permission to perform this action.';
        break;
      case 404:
        message = 'The requested resource was not found.';
        break;
      case 409:
        message = 'This resource already exists or there\'s a conflict.';
        break;
      case 429:
        message = 'Too many requests. Please wait a moment and try again.';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        break;
      case 503:
        message = 'Service temporarily unavailable. Please try again later.';
        break;
    }

    // Handle specific Appwrite error types with enhanced session conflict handling
    if (error.type) {
      switch (error.type) {
        case 'user_invalid_credentials':
          message = 'Invalid email or password. Please check your credentials.';
          break;
        case 'user_already_exists':
          message = 'An account with this email already exists.';
          break;
        case 'user_not_found':
          message = 'User account not found.';
          break;
        case 'user_email_not_whitelisted':
          message = 'This email is not authorized to create an account.';
          break;
        case 'user_password_mismatch':
          message = 'Current password is incorrect.';
          break;
        case 'user_session_already_exists':
          // Enhanced session conflict handling
          message = 'A session is already active. Attempting to resolve session conflict.';
          logSessionConflictError(SESSION_CONFLICT_TYPES.EXISTING_SESSION, error, {
            fallbackMessage,
            detectedAt: 'handleAppwriteError'
          });
          break;
        case 'document_not_found':
          message = 'The requested document was not found.';
          break;
        case 'document_invalid_structure':
          message = 'Invalid data structure provided.';
          break;
        case 'storage_file_not_found':
          message = 'The requested file was not found.';
          break;
        case 'storage_invalid_file_size':
          message = 'File size exceeds the allowed limit.';
          break;
        case 'storage_invalid_file_type':
          message = 'File type is not supported.';
          break;
        case 'database_invalid_query':
          message = 'Invalid database query.';
          break;
        case 'collection_not_found':
          message = 'Database collection not found.';
          break;
      }
    }
  }

  // Create a new Error object with enhanced properties
  const enhancedError = new Error(message);
  enhancedError.code = code;
  enhancedError.type = type;
  enhancedError.originalError = error;
  enhancedError.timestamp = new Date().toISOString();

  // Enhanced logging for session conflicts
  if (type === 'user_session_already_exists') {
    enhancedError.isSessionConflict = true;
    enhancedError.conflictType = SESSION_CONFLICT_TYPES.EXISTING_SESSION;
  } else {
    // Log other errors normally
    logError(enhancedError, {
      appwriteError: true,
      originalError: error,
      fallbackMessage
    });
  }

  return enhancedError;
};

/**
 * Create session conflict notification object for the notification system
 * @param {string} conflictType - Type of session conflict
 * @param {Object} context - Additional context
 * @returns {Object} Notification object
 */
export const createSessionConflictNotification = (conflictType, context = {}) => {
  const conflictMessage = getSessionConflictMessage(conflictType, context);

  const notification = {
    type: conflictMessage.severity === ERROR_SEVERITY.HIGH ? 'error' : 'info',
    title: conflictMessage.title,
    message: conflictMessage.userMessage,
    duration: conflictMessage.recoverable ? 5000 : null,
    persistent: !conflictMessage.recoverable
  };

  // Add recovery actions based on conflict type
  const actions = [];

  if (conflictType === SESSION_CONFLICT_TYPES.ALL_SESSIONS_CLEAR_FAILED && context.manualClearAction) {
    actions.push({
      label: 'Clear All Sessions',
      handler: context.manualClearAction,
      primary: true
    });
  }

  if (!conflictMessage.recoverable && context.supportAction) {
    actions.push({
      label: 'Contact Support',
      handler: context.supportAction,
      primary: false
    });
  }

  if (actions.length > 0) {
    notification.actions = actions;
  }

  return notification;
};

/**
 * Create enhanced error object for session conflicts with detailed context
 * @param {string} conflictType - Type of session conflict
 * @param {Object} originalError - Original error that caused the conflict
 * @param {Object} context - Additional context
 * @returns {Error} Enhanced error object
 */
export const createSessionConflictError = (conflictType, originalError = null, context = {}) => {
  const conflictMessage = getSessionConflictMessage(conflictType, context);

  const error = new Error(conflictMessage.userMessage);
  error.type = 'SESSION_CONFLICT';
  error.conflictType = conflictType;
  error.isSessionConflict = true;
  error.severity = conflictMessage.severity;
  error.recoverable = conflictMessage.recoverable;
  error.originalError = originalError;
  error.context = context;
  error.timestamp = new Date().toISOString();

  // Log the session conflict error
  logSessionConflictError(conflictType, originalError, context);

  return error;
};

/**
 * Generate user-friendly error messages for different session conflict scenarios
 * @param {Error} error - Session conflict error
 * @param {Object} context - Additional context
 * @returns {Object} User-friendly error details
 */
export const getSessionConflictUserMessage = (error, context = {}) => {
  if (!error.isSessionConflict) {
    return getUserFriendlyError(error, context);
  }

  const conflictMessage = getSessionConflictMessage(error.conflictType, error.context);

  return {
    title: conflictMessage.title,
    message: conflictMessage.userMessage,
    suggestion: getSessionConflictSuggestion(error.conflictType),
    type: 'SESSION_CONFLICT',
    severity: conflictMessage.severity,
    recoverable: conflictMessage.recoverable
  };
};

/**
 * Get recovery suggestions for session conflicts
 * @param {string} conflictType - Type of session conflict
 * @returns {string} Recovery suggestion
 */
export const getSessionConflictSuggestion = (conflictType) => {
  const suggestions = {
    [SESSION_CONFLICT_TYPES.EXISTING_SESSION]: 'We\'re automatically resolving this for you.',
    [SESSION_CONFLICT_TYPES.CURRENT_SESSION_CLEAR_FAILED]: 'Trying alternative resolution method.',
    [SESSION_CONFLICT_TYPES.ALL_SESSIONS_CLEAR_FAILED]: 'Please try manually clearing all sessions or contact support.',
    [SESSION_CONFLICT_TYPES.RESOLUTION_IN_PROGRESS]: 'Please wait while we resolve the session conflict.',
    [SESSION_CONFLICT_TYPES.RESOLUTION_SUCCESS]: 'Session conflict resolved successfully.'
  };

  return suggestions[conflictType] || 'Please try again or contact support if the issue persists.';
};

/**
 * Create error notification object for the notification system
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 * @returns {Object} Notification object
 */
export const createErrorNotification = (error, context = {}) => {
  // Handle session conflicts with specialized notifications
  if (error.isSessionConflict && error.conflictType) {
    return createSessionConflictNotification(error.conflictType, context);
  }

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