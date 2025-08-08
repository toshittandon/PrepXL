/**
 * AI Service Error Handling and Recovery
 */

import { 
  ERROR_TYPES, 
  ERROR_SEVERITY, 
  RECOVERY_STRATEGIES,
  categorizeError,
  getErrorSeverity,
  getRecoveryStrategy,
  logError 
} from '../../utils/errorHandling.js';

// AI-specific error types
export const AI_ERROR_TYPES = {
  ...ERROR_TYPES,
  RATE_LIMIT: 'RATE_LIMIT',
  TIMEOUT: 'TIMEOUT',
  INVALID_INPUT: 'INVALID_INPUT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  MODEL_ERROR: 'MODEL_ERROR',
  CONTENT_FILTER: 'CONTENT_FILTER',
};

// AI service error codes mapping
const AI_ERROR_CODE_MAP = {
  400: AI_ERROR_TYPES.INVALID_INPUT,
  401: AI_ERROR_TYPES.AUTHENTICATION,
  403: AI_ERROR_TYPES.PERMISSION,
  408: AI_ERROR_TYPES.TIMEOUT,
  413: AI_ERROR_TYPES.INVALID_INPUT, // Payload too large
  429: AI_ERROR_TYPES.RATE_LIMIT,
  500: AI_ERROR_TYPES.SERVER,
  502: AI_ERROR_TYPES.SERVICE_UNAVAILABLE,
  503: AI_ERROR_TYPES.SERVICE_UNAVAILABLE,
  504: AI_ERROR_TYPES.TIMEOUT,
};

/**
 * Categorize AI service specific errors
 * @param {Error|Object} error - Error object
 * @returns {string} Error type
 */
export const categorizeAiError = (error) => {
  if (!error) return AI_ERROR_TYPES.UNKNOWN;

  // Check for AI-specific error types first
  if (error.type) {
    switch (error.type) {
      case 'rate_limit_exceeded':
        return AI_ERROR_TYPES.RATE_LIMIT;
      case 'timeout':
        return AI_ERROR_TYPES.TIMEOUT;
      case 'validation_error':
        return AI_ERROR_TYPES.INVALID_INPUT;
      case 'service_unavailable':
        return AI_ERROR_TYPES.SERVICE_UNAVAILABLE;
      case 'quota_exceeded':
        return AI_ERROR_TYPES.QUOTA_EXCEEDED;
      case 'model_error':
        return AI_ERROR_TYPES.MODEL_ERROR;
      case 'content_filter':
        return AI_ERROR_TYPES.CONTENT_FILTER;
    }
  }

  // Check HTTP status codes
  if (error.code || error.status) {
    const code = error.code || error.status;
    if (AI_ERROR_CODE_MAP[code]) {
      return AI_ERROR_CODE_MAP[code];
    }
  }

  // Fall back to general error categorization
  return categorizeError(error);
};

/**
 * Get AI service specific error severity
 * @param {string} errorType - Error type from categorizeAiError
 * @param {Object} context - Additional context
 * @returns {string} Error severity
 */
export const getAiErrorSeverity = (errorType, context = {}) => {
  switch (errorType) {
    case AI_ERROR_TYPES.RATE_LIMIT:
      return ERROR_SEVERITY.MEDIUM;
    case AI_ERROR_TYPES.TIMEOUT:
      return context.isRetryable ? ERROR_SEVERITY.MEDIUM : ERROR_SEVERITY.HIGH;
    case AI_ERROR_TYPES.INVALID_INPUT:
      return ERROR_SEVERITY.LOW;
    case AI_ERROR_TYPES.SERVICE_UNAVAILABLE:
      return ERROR_SEVERITY.HIGH;
    case AI_ERROR_TYPES.QUOTA_EXCEEDED:
      return ERROR_SEVERITY.HIGH;
    case AI_ERROR_TYPES.MODEL_ERROR:
      return ERROR_SEVERITY.HIGH;
    case AI_ERROR_TYPES.CONTENT_FILTER:
      return ERROR_SEVERITY.MEDIUM;
    default:
      return getErrorSeverity(errorType, context);
  }
};

/**
 * Get AI service specific recovery strategy
 * @param {string} errorType - Error type
 * @param {Object} context - Additional context
 * @returns {string} Recovery strategy
 */
export const getAiRecoveryStrategy = (errorType, context = {}) => {
  switch (errorType) {
    case AI_ERROR_TYPES.RATE_LIMIT:
      return RECOVERY_STRATEGIES.RETRY; // With exponential backoff
    case AI_ERROR_TYPES.TIMEOUT:
      return RECOVERY_STRATEGIES.RETRY;
    case AI_ERROR_TYPES.INVALID_INPUT:
      return RECOVERY_STRATEGIES.IGNORE; // Let user fix input
    case AI_ERROR_TYPES.SERVICE_UNAVAILABLE:
      return context.hasFallback ? RECOVERY_STRATEGIES.FALLBACK : RECOVERY_STRATEGIES.RETRY;
    case AI_ERROR_TYPES.QUOTA_EXCEEDED:
      return RECOVERY_STRATEGIES.FALLBACK; // Use cached or mock responses
    case AI_ERROR_TYPES.MODEL_ERROR:
      return RECOVERY_STRATEGIES.FALLBACK;
    case AI_ERROR_TYPES.CONTENT_FILTER:
      return RECOVERY_STRATEGIES.IGNORE; // Let user modify content
    default:
      return getRecoveryStrategy(errorType, context);
  }
};

/**
 * Create user-friendly error messages for AI service errors
 * @param {Error|Object} error - Error object
 * @param {Object} context - Additional context
 * @returns {Object} User-friendly error message object
 */
export const getAiUserFriendlyError = (error, context = {}) => {
  const errorType = categorizeAiError(error);
  const severity = getAiErrorSeverity(errorType, context);
  const recoveryStrategy = getAiRecoveryStrategy(errorType, context);

  const aiErrorMessages = {
    [AI_ERROR_TYPES.RATE_LIMIT]: {
      title: 'Too Many Requests',
      message: 'You\'ve made too many requests. Please wait a moment and try again.',
      suggestion: `Please wait ${Math.ceil((error.resetTime || 60000) / 1000)} seconds before trying again`,
      icon: '⏱️',
    },
    [AI_ERROR_TYPES.TIMEOUT]: {
      title: 'Request Timeout',
      message: 'The AI service is taking longer than expected to respond.',
      suggestion: 'This usually resolves quickly. Please try again in a moment.',
      icon: '⏰',
    },
    [AI_ERROR_TYPES.INVALID_INPUT]: {
      title: 'Invalid Input',
      message: 'The provided input doesn\'t meet the requirements.',
      suggestion: 'Please check your input and make sure it meets the specified criteria.',
      icon: '❌',
    },
    [AI_ERROR_TYPES.SERVICE_UNAVAILABLE]: {
      title: 'Service Temporarily Unavailable',
      message: 'The AI service is currently unavailable.',
      suggestion: 'We\'re working to restore service. Please try again in a few minutes.',
      icon: '🔧',
    },
    [AI_ERROR_TYPES.QUOTA_EXCEEDED]: {
      title: 'Usage Limit Reached',
      message: 'You\'ve reached your usage limit for AI services.',
      suggestion: 'Your quota will reset soon, or consider upgrading your plan.',
      icon: '📊',
    },
    [AI_ERROR_TYPES.MODEL_ERROR]: {
      title: 'AI Model Error',
      message: 'The AI model encountered an error processing your request.',
      suggestion: 'This is usually temporary. Please try again with different input.',
      icon: '🤖',
    },
    [AI_ERROR_TYPES.CONTENT_FILTER]: {
      title: 'Content Not Allowed',
      message: 'Your content was flagged by our content filter.',
      suggestion: 'Please modify your content to comply with our guidelines and try again.',
      icon: '🛡️',
    },
  };

  // Get AI-specific message or fall back to general error handling
  const aiMessage = aiErrorMessages[errorType];
  if (aiMessage) {
    return {
      ...aiMessage,
      type: errorType,
      severity,
      recoveryStrategy,
      originalError: error,
      retryAfter: error.resetTime,
    };
  }

  // Fall back to general error handling
  const { getUserFriendlyError } = require('../../utils/errorHandling.js');
  return getUserFriendlyError(error, context);
};

/**
 * Enhanced retry logic for AI service errors
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Promise that resolves with the result or rejects with the last error
 */
export const retryAiRequest = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    jitterFactor = 0.1,
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorType = categorizeAiError(error);
      
      // Don't retry certain error types
      const nonRetryableErrors = [
        AI_ERROR_TYPES.INVALID_INPUT,
        AI_ERROR_TYPES.AUTHENTICATION,
        AI_ERROR_TYPES.PERMISSION,
        AI_ERROR_TYPES.CONTENT_FILTER,
      ];
      
      if (nonRetryableErrors.includes(errorType) || attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      let delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitter = delay * jitterFactor * Math.random();
      delay = delay + jitter;
      
      // For rate limit errors, respect the reset time
      if (errorType === AI_ERROR_TYPES.RATE_LIMIT && error.resetTime) {
        delay = Math.max(delay, error.resetTime);
      }
      
      console.warn(`AI request attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms:`, {
        error: error.message,
        type: errorType,
        attempt: attempt + 1,
        maxRetries: maxRetries + 1,
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Circuit breaker for AI service calls
 */
class AiServiceCircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 300000; // 5 minutes
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    this.requestCount = 0;
    
    // Reset counters periodically
    setInterval(() => {
      this.requestCount = 0;
      this.successCount = 0;
      if (this.state === 'CLOSED') {
        this.failureCount = 0;
      }
    }, this.monitoringPeriod);
  }
  
  async execute(fn) {
    this.requestCount++;
    
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
        console.log('Circuit breaker transitioning to HALF_OPEN state');
      } else {
        const error = new Error('AI service circuit breaker is OPEN');
        error.type = 'circuit_breaker_open';
        error.code = 503;
        throw error;
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.successCount++;
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.failureCount = 0;
      console.log('Circuit breaker transitioning to CLOSED state');
    }
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.warn(`Circuit breaker transitioning to OPEN state after ${this.failureCount} failures`);
    }
  }
  
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      requestCount: this.requestCount,
      failureRate: this.requestCount > 0 ? this.failureCount / this.requestCount : 0,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

// Global circuit breaker instance
export const aiServiceCircuitBreaker = new AiServiceCircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringPeriod: 300000, // 5 minutes
});

/**
 * Enhanced wrapper function with graceful degradation
 * @param {Function} fn - Function to execute
 * @param {Object} options - Options for retry and circuit breaker
 * @returns {Promise} Promise that resolves with the result
 */
export const executeWithErrorHandling = async (fn, options = {}) => {
  const {
    useCircuitBreaker = true,
    retryOptions = {},
    context = {},
    fallbackFn = null,
    gracefulDegradation = true,
  } = options;
  
  const executeFunction = useCircuitBreaker 
    ? () => aiServiceCircuitBreaker.execute(fn)
    : fn;
  
  try {
    return await retryAiRequest(executeFunction, retryOptions);
  } catch (error) {
    // Log error with context
    logError(error, {
      service: 'ai_service',
      circuitBreakerStatus: useCircuitBreaker ? aiServiceCircuitBreaker.getStatus() : null,
      ...context,
    });
    
    // Try fallback function if available
    if (fallbackFn && gracefulDegradation) {
      try {
        console.warn('AI service failed, attempting fallback:', error.message);
        const fallbackResult = await fallbackFn();
        
        // Mark result as fallback
        if (fallbackResult && typeof fallbackResult === 'object') {
          fallbackResult._fallback = true;
          fallbackResult._originalError = error.message;
        }
        
        return fallbackResult;
      } catch (fallbackError) {
        console.error('Fallback function also failed:', fallbackError.message);
        // Continue with original error handling
      }
    }
    
    // Transform error for user consumption
    const friendlyError = getAiUserFriendlyError(error, context);
    
    // Create enhanced error object
    const enhancedError = new Error(friendlyError.message);
    enhancedError.type = friendlyError.type;
    enhancedError.severity = friendlyError.severity;
    enhancedError.recoveryStrategy = friendlyError.recoveryStrategy;
    enhancedError.userMessage = friendlyError.message;
    enhancedError.suggestion = friendlyError.suggestion;
    enhancedError.icon = friendlyError.icon;
    enhancedError.retryAfter = friendlyError.retryAfter;
    enhancedError.originalError = error;
    enhancedError.hasFallback = !!fallbackFn;
    
    throw enhancedError;
  }
};

/**
 * Get circuit breaker status for monitoring
 * @returns {Object} Circuit breaker status
 */
export const getCircuitBreakerStatus = () => {
  return aiServiceCircuitBreaker.getStatus();
};