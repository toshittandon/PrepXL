/**
 * Enhanced API wrapper with comprehensive error handling
 */
import { 
  retryWithBackoff, 
  categorizeError, 
  ERROR_TYPES,
  logError 
} from '../utils/errorHandling';

/**
 * Enhanced fetch wrapper with error handling and retry logic
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @param {Object} config - Additional configuration
 * @returns {Promise} Enhanced fetch promise
 */
export const enhancedFetch = async (url, options = {}, config = {}) => {
  const {
    retries = 3,
    timeout = 30000,
    retryCondition = (error) => {
      const errorType = categorizeError(error);
      return errorType === ERROR_TYPES.NETWORK || errorType === ERROR_TYPES.SERVER;
    },
    logErrors = true
  } = config;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fetchWithTimeout = async () => {
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        
        // Try to parse error body
        try {
          const errorBody = await response.text();
          if (errorBody) {
            try {
              const parsedError = JSON.parse(errorBody);
              error.details = parsedError;
              error.message = parsedError.message || error.message;
            } catch {
              error.details = { body: errorBody };
            }
          }
        } catch {
          // Ignore error body parsing failures
        }
        
        throw error;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle abort/timeout
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        timeoutError.type = 'TIMEOUT';
        throw timeoutError;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new Error('Network error - please check your connection');
        networkError.type = 'NETWORK';
        networkError.originalError = error;
        throw networkError;
      }
      
      throw error;
    }
  };

  try {
    return await retryWithBackoff(fetchWithTimeout, {
      maxRetries: retries,
      retryCondition
    });
  } catch (error) {
    if (logErrors) {
      logError(error, { url, options, config });
    }
    throw error;
  }
};

/**
 * Create API client with base configuration
 * @param {Object} baseConfig - Base configuration
 * @returns {Object} API client
 */
export const createApiClient = (baseConfig = {}) => {
  const {
    baseURL = '',
    defaultHeaders = {},
    timeout = 30000,
    retries = 3
  } = baseConfig;

  const client = {
    async get(endpoint, options = {}) {
      const url = `${baseURL}${endpoint}`;
      const response = await enhancedFetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...defaultHeaders,
          ...options.headers
        },
        ...options
      }, { timeout, retries });

      return response.json();
    },

    async post(endpoint, data, options = {}) {
      const url = `${baseURL}${endpoint}`;
      const response = await enhancedFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...defaultHeaders,
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      }, { timeout, retries });

      return response.json();
    },

    async put(endpoint, data, options = {}) {
      const url = `${baseURL}${endpoint}`;
      const response = await enhancedFetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...defaultHeaders,
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      }, { timeout, retries });

      return response.json();
    },

    async delete(endpoint, options = {}) {
      const url = `${baseURL}${endpoint}`;
      const response = await enhancedFetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...defaultHeaders,
          ...options.headers
        },
        ...options
      }, { timeout, retries });

      return response.json();
    },

    async upload(endpoint, file, options = {}) {
      const url = `${baseURL}${endpoint}`;
      const formData = new FormData();
      formData.append('file', file);

      const response = await enhancedFetch(url, {
        method: 'POST',
        headers: {
          ...defaultHeaders,
          ...options.headers
          // Don't set Content-Type for FormData, let browser set it
        },
        body: formData,
        ...options
      }, { timeout: timeout * 2, retries }); // Longer timeout for uploads

      return response.json();
    }
  };

  return client;
};

/**
 * Appwrite service wrapper with enhanced error handling
 * @param {Function} appwriteMethod - Appwrite method to wrap
 * @param {Object} config - Configuration options
 * @returns {Function} Wrapped method
 */
export const wrapAppwriteMethod = (appwriteMethod, config = {}) => {
  const {
    retries = 2,
    logErrors = true,
    transformError = null
  } = config;

  return async (...args) => {
    const operation = async () => {
      try {
        return await appwriteMethod(...args);
      } catch (error) {
        // Transform Appwrite errors to standard format
        const transformedError = transformError ? transformError(error) : error;
        
        // Add additional error context
        if (error.type) {
          transformedError.appwriteType = error.type;
        }
        if (error.code) {
          transformedError.status = error.code;
        }
        
        throw transformedError;
      }
    };

    try {
      return await retryWithBackoff(operation, {
        maxRetries: retries,
        retryCondition: (error) => {
          // Retry on network errors and some server errors
          const errorType = categorizeError(error);
          return errorType === ERROR_TYPES.NETWORK || 
                 (errorType === ERROR_TYPES.SERVER && error.status >= 500);
        }
      });
    } catch (error) {
      if (logErrors) {
        logError(error, { method: appwriteMethod.name, args });
      }
      throw error;
    }
  };
};

/**
 * Create enhanced service wrapper for any service
 * @param {Object} service - Service object to wrap
 * @param {Object} config - Configuration options
 * @returns {Object} Enhanced service
 */
export const enhanceService = (service, config = {}) => {
  const enhanced = {};
  
  Object.keys(service).forEach(key => {
    if (typeof service[key] === 'function') {
      enhanced[key] = wrapAppwriteMethod(service[key], config);
    } else {
      enhanced[key] = service[key];
    }
  });
  
  return enhanced;
};

/**
 * Batch operation wrapper with error handling
 * @param {Array} operations - Array of operations to execute
 * @param {Object} config - Configuration options
 * @returns {Promise} Promise resolving to results array
 */
export const batchOperations = async (operations, config = {}) => {
  const {
    concurrency = 3,
    failFast = false,
    logErrors = true
  } = config;

  const results = [];
  const errors = [];

  // Process operations in batches
  for (let i = 0; i < operations.length; i += concurrency) {
    const batch = operations.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (operation, index) => {
      try {
        const result = await operation();
        return { success: true, result, index: i + index };
      } catch (error) {
        if (logErrors) {
          logError(error, { batchIndex: i + index, operation });
        }
        
        const errorResult = { success: false, error, index: i + index };
        
        if (failFast) {
          throw errorResult;
        }
        
        return errorResult;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach(result => {
      if (result.success) {
        results[result.index] = result.result;
      } else {
        errors[result.index] = result.error;
      }
    });
  }

  return {
    results,
    errors,
    hasErrors: errors.some(error => error !== undefined),
    successCount: results.filter(result => result !== undefined).length,
    errorCount: errors.filter(error => error !== undefined).length
  };
};