import { AppwriteException } from 'appwrite';

/**
 * Standard API response format
 */
export const createResponse = (success, data = null, error = null) => ({
  success,
  data,
  error,
  timestamp: new Date().toISOString(),
});

/**
 * Success response helper
 */
export const successResponse = (data) => createResponse(true, data, null);

/**
 * Error response helper
 */
export const errorResponse = (error) => createResponse(false, null, error);

/**
 * Handle Appwrite exceptions and format error messages
 */
export const handleAppwriteError = (error) => {
  console.error('Appwrite Error:', error);

  if (error instanceof AppwriteException) {
    const errorMap = {
      400: 'Bad request. Please check your input.',
      401: 'Authentication required. Please log in.',
      403: 'Access denied. You don\'t have permission to perform this action.',
      404: 'Resource not found.',
      409: 'Conflict. Resource already exists.',
      429: 'Too many requests. Please try again later.',
      500: 'Internal server error. Please try again.',
      503: 'Service unavailable. Please try again later.',
    };

    const message = errorMap[error.code] || error.message || 'An unexpected error occurred.';
    
    return {
      code: error.code,
      message,
      type: error.type || 'unknown_error',
      details: error.response || null,
    };
  }

  // Handle network errors
  if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
    return {
      code: 'network_error',
      message: 'Network error. Please check your internet connection.',
      type: 'network_error',
      details: null,
    };
  }

  // Handle generic errors
  return {
    code: 'unknown_error',
    message: error.message || 'An unexpected error occurred.',
    type: 'unknown_error',
    details: null,
  };
};

/**
 * Async wrapper that handles errors consistently
 */
export const asyncHandler = async (asyncFunction) => {
  try {
    const result = await asyncFunction();
    return successResponse(result);
  } catch (error) {
    const formattedError = handleAppwriteError(error);
    return errorResponse(formattedError);
  }
};

/**
 * Validate required environment variables
 */
export const validateConfig = () => {
  const requiredVars = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID',
    'VITE_APPWRITE_DATABASE_ID',
    'VITE_APPWRITE_USERS_COLLECTION_ID',
    'VITE_APPWRITE_RESUMES_COLLECTION_ID',
    'VITE_APPWRITE_SESSIONS_COLLECTION_ID',
    'VITE_APPWRITE_INTERACTIONS_COLLECTION_ID',
    'VITE_APPWRITE_STORAGE_BUCKET_ID',
  ];

  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

/**
 * Format user data for consistent structure
 */
export const formatUserData = (user) => ({
  id: user.$id,
  name: user.name,
  email: user.email,
  emailVerification: user.emailVerification,
  status: user.status,
  registration: user.registration,
  passwordUpdate: user.passwordUpdate,
  prefs: user.prefs || {},
});

/**
 * Format document data by removing Appwrite metadata
 */
export const formatDocumentData = (document) => {
  if (!document) return null;
  
  const { $id, $createdAt, $updatedAt, $permissions, $collectionId, $databaseId, ...data } = document;
  
  return {
    id: $id,
    createdAt: $createdAt,
    updatedAt: $updatedAt,
    ...data,
  };
};

/**
 * Format multiple documents
 */
export const formatDocuments = (documents) => {
  if (!documents || !Array.isArray(documents)) return [];
  return documents.map(formatDocumentData);
};

/**
 * Generate unique ID for documents
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Retry mechanism for failed requests
 */
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on authentication or permission errors
      if (error instanceof AppwriteException && [401, 403].includes(error.code)) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
};