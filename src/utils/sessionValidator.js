/**
 * Session validation utilities for ensuring user authentication
 */

import { getCurrentSession, getCurrentUserWithProfile } from '../services/appwrite/auth.js'
import { handleAppwriteError } from './errorHandling.js'

/**
 * Validate current user session before API operations
 * @param {Object} options - Validation options
 * @param {boolean} options.requireAuth - Whether authentication is required (default: true)
 * @param {boolean} options.requireAdmin - Whether admin privileges are required (default: false)
 * @param {Function} options.onAuthError - Callback for authentication errors
 * @returns {Promise<Object>} User data if valid
 */
export const validateSession = async (options = {}) => {
  const {
    requireAuth = true,
    requireAdmin = false,
    onAuthError = null
  } = options

  try {
    // Check if authentication is required
    if (!requireAuth) {
      return { valid: true, user: null, session: null }
    }

    // Get current session
    const session = await getCurrentSession()
    if (!session) {
      const error = new Error('No active session found. Please log in again.')
      error.code = 401
      error.type = 'session_not_found'
      
      if (onAuthError) {
        onAuthError(error)
      }
      
      throw handleAppwriteError(error, 'Authentication required')
    }

    // Get current user with profile
    const user = await getCurrentUserWithProfile()
    if (!user) {
      const error = new Error('User profile not found. Please log in again.')
      error.code = 401
      error.type = 'user_not_found'
      
      if (onAuthError) {
        onAuthError(error)
      }
      
      throw handleAppwriteError(error, 'User authentication failed')
    }

    // Check admin requirement
    if (requireAdmin && !user.profile?.isAdmin) {
      const error = new Error('Admin privileges required for this operation.')
      error.code = 403
      error.type = 'insufficient_privileges'
      
      if (onAuthError) {
        onAuthError(error)
      }
      
      throw handleAppwriteError(error, 'Admin access required')
    }

    return {
      valid: true,
      user,
      session,
      userId: user.id || user.$id
    }

  } catch (error) {
    // Handle authentication errors
    if (error.code === 401 || error.message?.includes('Authentication required')) {
      if (onAuthError) {
        onAuthError(error)
      }
    }
    
    throw error
  }
}

/**
 * Create a wrapper function that validates session before execution
 * @param {Function} fn - Function to wrap with session validation
 * @param {Object} validationOptions - Session validation options
 * @returns {Function} Wrapped function with session validation
 */
export const withSessionValidation = (fn, validationOptions = {}) => {
  return async (...args) => {
    const sessionData = await validateSession(validationOptions)
    
    // Pass session data as the first argument to the wrapped function
    return fn(sessionData, ...args)
  }
}

/**
 * Validate session and get user ID for API operations
 * @param {Object} options - Validation options
 * @returns {Promise<string>} User ID
 */
export const validateAndGetUserId = async (options = {}) => {
  const sessionData = await validateSession(options)
  
  if (!sessionData.userId) {
    throw new Error('User ID not found in session data')
  }
  
  return sessionData.userId
}

/**
 * Check if current session is valid without throwing errors
 * @returns {Promise<Object>} Session validity status
 */
export const checkSessionValidity = async () => {
  try {
    const sessionData = await validateSession({ requireAuth: true })
    return {
      valid: true,
      user: sessionData.user,
      session: sessionData.session,
      userId: sessionData.userId
    }
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      code: error.code,
      type: error.type
    }
  }
}

/**
 * Refresh session data and validate
 * @param {Object} options - Refresh options
 * @returns {Promise<Object>} Refreshed session data
 */
export const refreshAndValidateSession = async (options = {}) => {
  try {
    // Force refresh by getting fresh data
    const session = await getCurrentSession()
    const user = await getCurrentUserWithProfile()
    
    if (!session || !user) {
      throw new Error('Failed to refresh session data')
    }
    
    return await validateSession(options)
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to refresh session')
  }
}

/**
 * Session validation middleware for Redux thunks
 * @param {Object} validationOptions - Validation options
 * @returns {Function} Middleware function
 */
export const createSessionValidationMiddleware = (validationOptions = {}) => {
  return (store) => (next) => async (action) => {
    // Only validate for async thunks that require authentication
    if (action.type?.endsWith('/pending') && action.meta?.requireAuth !== false) {
      try {
        await validateSession(validationOptions)
      } catch (error) {
        // Dispatch authentication error
        store.dispatch({
          type: action.type.replace('/pending', '/rejected'),
          payload: error.message,
          error: true,
          meta: action.meta
        })
        return
      }
    }
    
    return next(action)
  }
}

export default {
  validateSession,
  withSessionValidation,
  validateAndGetUserId,
  checkSessionValidity,
  refreshAndValidateSession,
  createSessionValidationMiddleware
}