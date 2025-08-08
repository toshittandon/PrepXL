/**
 * AI API Configuration and Base Setup
 */

import { getConfig } from '../../utils/envConfig.js';
import { retryWithBackoff, categorizeError, ERROR_TYPES } from '../../utils/errorHandling.js';
import { executeWithErrorHandling } from './errorHandling.js';

// Get configuration
const config = getConfig();

// AI API Configuration
export const AI_API_CONFIG = {
  baseUrl: config.ai.baseUrl || 'https://api.openai.com/v1',
  apiKey: config.ai.apiKey,
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000,
  rateLimit: {
    maxRequests: 60,
    windowMs: 60000, // 1 minute
  },
};

// API Endpoints
export const AI_ENDPOINTS = {
  RATE_RESUME: '/api/rate-resume',
  GET_INTERVIEW_QUESTION: '/api/get-interview-question',
  HEALTH_CHECK: '/api/health',
};

// Request headers
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
  'User-Agent': `${config.appName}/${config.appVersion}`,
  'X-Request-ID': generateRequestId(),
});

// Generate unique request ID for tracking
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Enhanced rate limiting state with multiple windows
const rateLimitState = {
  requests: [],
  blocked: false,
  blockedUntil: null,
  consecutiveFailures: 0,
  lastFailureTime: null,
};

/**
 * Enhanced rate limiting with sliding window and adaptive throttling
 * @returns {Object} Rate limit check result
 */
const checkRateLimit = () => {
  const now = Date.now();
  const windowMs = AI_API_CONFIG.rateLimit.windowMs;
  const maxRequests = AI_API_CONFIG.rateLimit.maxRequests;
  
  // Remove old requests outside the window
  rateLimitState.requests = rateLimitState.requests.filter(
    timestamp => now - timestamp < windowMs
  );
  
  // Check if we're in a blocked state due to consecutive failures
  if (rateLimitState.blocked && rateLimitState.blockedUntil) {
    if (now < rateLimitState.blockedUntil) {
      return {
        allowed: false,
        reason: 'adaptive_throttling',
        retryAfter: rateLimitState.blockedUntil - now,
        remaining: 0,
        resetTime: rateLimitState.blockedUntil - now,
      };
    } else {
      // Reset blocked state
      rateLimitState.blocked = false;
      rateLimitState.blockedUntil = null;
      rateLimitState.consecutiveFailures = 0;
    }
  }
  
  // Check if within rate limits
  if (rateLimitState.requests.length >= maxRequests) {
    const oldestRequest = Math.min(...rateLimitState.requests);
    const resetTime = oldestRequest + windowMs - now;
    
    return {
      allowed: false,
      reason: 'rate_limit_exceeded',
      retryAfter: resetTime,
      remaining: 0,
      resetTime,
    };
  }
  
  // Add current request to the window
  rateLimitState.requests.push(now);
  
  return {
    allowed: true,
    remaining: maxRequests - rateLimitState.requests.length,
    resetTime: windowMs - (now - Math.min(...rateLimitState.requests)),
  };
};

/**
 * Handle request failure for adaptive throttling
 * @param {Error} error - The error that occurred
 */
const handleRequestFailure = (error) => {
  const now = Date.now();
  rateLimitState.consecutiveFailures++;
  rateLimitState.lastFailureTime = now;
  
  // Implement exponential backoff for consecutive failures
  if (rateLimitState.consecutiveFailures >= 3) {
    const backoffTime = Math.min(
      1000 * Math.pow(2, rateLimitState.consecutiveFailures - 3), // Exponential backoff
      300000 // Max 5 minutes
    );
    
    rateLimitState.blocked = true;
    rateLimitState.blockedUntil = now + backoffTime;
    
    console.warn(`AI service temporarily blocked due to ${rateLimitState.consecutiveFailures} consecutive failures. Retry after ${Math.ceil(backoffTime / 1000)} seconds.`);
  }
};

/**
 * Handle successful request for adaptive throttling
 */
const handleRequestSuccess = () => {
  // Reset failure count on successful request
  if (rateLimitState.consecutiveFailures > 0) {
    rateLimitState.consecutiveFailures = 0;
    rateLimitState.lastFailureTime = null;
  }
};

/**
 * Create enhanced rate limit error with detailed information
 * @param {Object} rateLimitResult - Rate limit check result
 * @returns {Error} Rate limit error
 */
const createRateLimitError = (rateLimitResult) => {
  const { reason, retryAfter, remaining } = rateLimitResult;
  
  let message;
  if (reason === 'adaptive_throttling') {
    message = `AI service temporarily unavailable due to repeated failures. Try again in ${Math.ceil(retryAfter / 1000)} seconds.`;
  } else {
    message = `Rate limit exceeded. Try again in ${Math.ceil(retryAfter / 1000)} seconds.`;
  }
  
  const error = new Error(message);
  error.code = 429;
  error.type = reason === 'adaptive_throttling' ? 'service_throttled' : 'rate_limit_exceeded';
  error.retryAfter = retryAfter;
  error.remaining = remaining;
  error.reason = reason;
  
  return error;
};

/**
 * Base fetch function with enhanced error handling and retry logic
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
const baseFetch = async (endpoint, options = {}) => {
  // Check enhanced rate limits
  const rateLimitCheck = checkRateLimit();
  if (!rateLimitCheck.allowed) {
    throw createRateLimitError(rateLimitCheck);
  }

  const url = `${AI_API_CONFIG.baseUrl}${endpoint}`;
  const requestOptions = {
    timeout: AI_API_CONFIG.timeout,
    headers: getHeaders(),
    ...options,
  };

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_API_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      ...requestOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle HTTP errors
    if (response && !response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.code = response.status;
      error.type = errorData.type || 'http_error';
      error.details = errorData;
      
      // Handle request failure for adaptive throttling
      handleRequestFailure(error);
      throw error;
    }

    // Handle successful request
    handleRequestSuccess();
    return response;
    
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle AbortError (timeout)
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout. The AI service is taking too long to respond.');
      timeoutError.code = 408;
      timeoutError.type = 'timeout';
      handleRequestFailure(timeoutError);
      throw timeoutError;
    }

    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Network error. Please check your internet connection.');
      networkError.code = 0;
      networkError.type = 'network_error';
      handleRequestFailure(networkError);
      throw networkError;
    }

    // Handle other errors
    handleRequestFailure(error);
    throw error;
  }
};

/**
 * Make API request with retry logic
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API response data
 */
export const makeApiRequest = async (endpoint, options = {}) => {
  const retryCondition = (error) => {
    const errorType = categorizeError(error);
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    
    return (
      errorType === ERROR_TYPES.NETWORK ||
      retryableStatuses.includes(error.code) ||
      error.type === 'timeout'
    );
  };

  const requestWithRetry = () => retryWithBackoff(
    () => baseFetch(endpoint, options),
    {
      maxRetries: AI_API_CONFIG.maxRetries,
      baseDelay: AI_API_CONFIG.retryDelay,
      retryCondition,
    }
  );

  try {
    const response = await requestWithRetry();
    
    // Check if response exists and has json method
    if (!response || typeof response.json !== 'function') {
      throw new Error('Invalid response received from AI service');
    }
    
    const data = await response.json();
    
    // Log successful request in development
    if (config.debug) {
      console.log(`AI API Request successful: ${endpoint}`, {
        status: response.status,
        data: data,
      });
    }
    
    return data;
  } catch (error) {
    // Log error in development
    if (config.debug) {
      console.error(`AI API Request failed: ${endpoint}`, error);
    }
    
    // Enhance error with context
    error.endpoint = endpoint;
    error.timestamp = new Date().toISOString();
    
    throw error;
  }
};

/**
 * Health check for AI API
 * @returns {Promise<Object>} Health status
 */
export const checkApiHealth = async () => {
  try {
    const response = await makeApiRequest(AI_ENDPOINTS.HEALTH_CHECK, {
      method: 'GET',
    });
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      ...response,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Get current enhanced rate limit status
 * @returns {Object} Rate limit information
 */
export const getRateLimitStatus = () => {
  const now = Date.now();
  const windowMs = AI_API_CONFIG.rateLimit.windowMs;
  const maxRequests = AI_API_CONFIG.rateLimit.maxRequests;
  
  // Clean up old requests
  rateLimitState.requests = rateLimitState.requests.filter(
    timestamp => now - timestamp < windowMs
  );
  
  const remaining = Math.max(0, maxRequests - rateLimitState.requests.length);
  const oldestRequest = rateLimitState.requests.length > 0 ? Math.min(...rateLimitState.requests) : now;
  const resetTime = Math.max(0, windowMs - (now - oldestRequest));
  
  return {
    limit: maxRequests,
    remaining,
    resetTime,
    resetAt: new Date(now + resetTime).toISOString(),
    blocked: rateLimitState.blocked,
    blockedUntil: rateLimitState.blockedUntil ? new Date(rateLimitState.blockedUntil).toISOString() : null,
    consecutiveFailures: rateLimitState.consecutiveFailures,
    adaptiveThrottling: {
      enabled: rateLimitState.consecutiveFailures > 0,
      failureCount: rateLimitState.consecutiveFailures,
      lastFailure: rateLimitState.lastFailureTime ? new Date(rateLimitState.lastFailureTime).toISOString() : null,
    },
  };
};

/**
 * Validate API configuration
 * @returns {Object} Validation result
 */
export const validateApiConfig = () => {
  const issues = [];
  
  if (!AI_API_CONFIG.baseUrl) {
    issues.push('AI API base URL is not configured');
  }
  
  if (!AI_API_CONFIG.apiKey && !config.mockAiResponses) {
    issues.push('AI API key is not configured and mock responses are disabled');
  }
  
  if (AI_API_CONFIG.timeout < 5000) {
    issues.push('AI API timeout is too low (minimum 5 seconds recommended)');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    config: {
      baseUrl: AI_API_CONFIG.baseUrl,
      hasApiKey: !!AI_API_CONFIG.apiKey,
      timeout: AI_API_CONFIG.timeout,
      maxRetries: AI_API_CONFIG.maxRetries,
      mockMode: config.mockAiResponses,
    },
  };
};

/**
 * Reset rate limiting and adaptive throttling state
 * @returns {Object} Reset result
 */
export const resetRateLimitState = () => {
  try {
    rateLimitState.requests = [];
    rateLimitState.blocked = false;
    rateLimitState.blockedUntil = null;
    rateLimitState.consecutiveFailures = 0;
    rateLimitState.lastFailureTime = null;
    
    console.log('Rate limiting state reset successfully');
    
    return {
      success: true,
      message: 'Rate limiting state reset successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to reset rate limiting state:', error);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Get detailed service configuration for debugging
 * @returns {Object} Detailed configuration
 */
export const getDetailedConfig = () => {
  return {
    api: {
      baseUrl: AI_API_CONFIG.baseUrl,
      hasApiKey: !!AI_API_CONFIG.apiKey,
      timeout: AI_API_CONFIG.timeout,
      maxRetries: AI_API_CONFIG.maxRetries,
    },
    rateLimit: {
      maxRequests: AI_API_CONFIG.rateLimit.maxRequests,
      windowMs: AI_API_CONFIG.rateLimit.windowMs,
      currentState: {
        requestCount: rateLimitState.requests.length,
        blocked: rateLimitState.blocked,
        consecutiveFailures: rateLimitState.consecutiveFailures,
      },
    },
    environment: {
      mockMode: config.mockAiResponses,
      debug: config.debug,
      environment: config.environment,
    },
    timestamp: new Date().toISOString(),
  };
};