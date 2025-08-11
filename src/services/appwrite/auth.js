/**
 * Appwrite authentication service functions
 */

import { ID, OAuthProvider } from 'appwrite'
import { account } from './client.js'
import { 
  handleAppwriteError, 
  logSessionConflictError, 
  SESSION_CONFLICT_TYPES 
} from '../../utils/errorHandling.js'
import { getConfig } from '../../utils/envConfig.js'

// Configuration
const config = getConfig()

// Development mode removed - connecting directly to Appwrite

/**
 * Create a new user account with email and password
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.name - User full name
 * @returns {Promise<Object>} Created user account
 */
export const createAccount = async ({ email, password, name }) => {
  try {
    // Create account in Appwrite Auth
    const account_response = await account.create(ID.unique(), email, password, name)
    
    // Dynamically import database functions to avoid circular dependency
    const { createUser } = await import('./database.js')
    
    // Create user profile in database
    const userProfile = await createUser({
      id: account_response.$id,
      name: account_response.name,
      email: account_response.email,
      experienceLevel: 'Entry',
      targetRole: '',
      targetIndustry: '',
      isAdmin: false,
    })

    return {
      account: account_response,
      profile: userProfile,
    }
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to create account')
  }
}

/**
 * Handle session conflict by clearing current session and retrying login
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Function} dispatch - Redux dispatch function (optional)
 * @returns {Promise<Object>} Session data after conflict resolution
 */
const handleSessionConflict = async (email, password, dispatch = null) => {
  // Log resolution attempt
  logSessionConflictError(SESSION_CONFLICT_TYPES.RESOLUTION_IN_PROGRESS, null, {
    method: 'current_session_clear',
    email: email.substring(0, 3) + '***' // Partially mask email for privacy
  });

  // Dispatch session conflict start if dispatch is available
  if (dispatch) {
    const { sessionConflictStart } = await import('../../store/slices/authSlice.js')
    dispatch(sessionConflictStart({ method: 'CURRENT' }))
  }

  try {
    // Clear existing session
    await account.deleteSession('current')
    
    // Retry login with cleared session
    const session = await account.createEmailPasswordSession(email, password)
    
    // Log successful resolution
    logSessionConflictError(SESSION_CONFLICT_TYPES.RESOLUTION_SUCCESS, null, {
      method: 'current_session_clear',
      sessionId: session.$id
    });

    // Dispatch session conflict resolved if dispatch is available
    if (dispatch) {
      const { sessionConflictResolved } = await import('../../store/slices/authSlice.js')
      dispatch(sessionConflictResolved({ method: 'CURRENT' }))
    }
    
    return session
  } catch (clearError) {
    // Log current session clear failure
    logSessionConflictError(SESSION_CONFLICT_TYPES.CURRENT_SESSION_CLEAR_FAILED, clearError, {
      method: 'current_session_clear',
      fallbackMethod: 'all_sessions_clear'
    });

    // If clearing current session fails, try clearing all sessions
    if (clearError.code === 401) {
      return await handleAllSessionsClear(email, password, dispatch)
    }
    
    // Dispatch session conflict failed if dispatch is available
    if (dispatch) {
      const { sessionConflictFailed } = await import('../../store/slices/authSlice.js')
      dispatch(sessionConflictFailed())
    }
    
    throw handleAppwriteError(clearError, 'Failed to clear current session')
  }
}

/**
 * Handle session conflict by clearing all sessions as fallback mechanism
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Function} dispatch - Redux dispatch function (optional)
 * @returns {Promise<Object>} Session data after clearing all sessions
 */
const handleAllSessionsClear = async (email, password, dispatch = null) => {
  // Log fallback resolution attempt
  logSessionConflictError(SESSION_CONFLICT_TYPES.RESOLUTION_IN_PROGRESS, null, {
    method: 'all_sessions_clear',
    email: email.substring(0, 3) + '***' // Partially mask email for privacy
  });

  // Dispatch session conflict start for all sessions clear if dispatch is available
  if (dispatch) {
    const { sessionConflictStart } = await import('../../store/slices/authSlice.js')
    dispatch(sessionConflictStart({ method: 'ALL' }))
  }

  try {
    // Clear all sessions as last resort
    await account.deleteSessions()
    
    // Retry login after clearing all sessions
    const session = await account.createEmailPasswordSession(email, password)
    
    // Log successful resolution
    logSessionConflictError(SESSION_CONFLICT_TYPES.RESOLUTION_SUCCESS, null, {
      method: 'all_sessions_clear',
      sessionId: session.$id
    });

    // Dispatch session conflict resolved if dispatch is available
    if (dispatch) {
      const { sessionConflictResolved } = await import('../../store/slices/authSlice.js')
      dispatch(sessionConflictResolved({ method: 'ALL' }))
    }
    
    return session
  } catch (error) {
    // Log all sessions clear failure
    logSessionConflictError(SESSION_CONFLICT_TYPES.ALL_SESSIONS_CLEAR_FAILED, error, {
      method: 'all_sessions_clear',
      requiresManualIntervention: true
    });

    // Dispatch session conflict failed if dispatch is available
    if (dispatch) {
      const { sessionConflictFailed } = await import('../../store/slices/authSlice.js')
      dispatch(sessionConflictFailed())
    }

    throw handleAppwriteError(error, 'Failed to resolve session conflict')
  }
}

/**
 * Sign in with email and password
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @param {Function} credentials.dispatch - Redux dispatch function (optional)
 * @returns {Promise<Object>} Session data
 */
export const signInWithEmail = async ({ email, password, dispatch = null }) => {
  try {
    // First attempt - try direct login
    const session = await account.createEmailPasswordSession(email, password)
    return session
  } catch (error) {
    // Handle session conflict specifically
    if (error.code === 401 && error.type === 'user_session_already_exists') {
      return await handleSessionConflict(email, password, dispatch)
    }
    throw handleAppwriteError(error, 'Failed to sign in')
  }
}

/**
 * Sign in with OAuth provider
 * @param {string} provider - OAuth provider ('google' or 'linkedin')
 * @param {string} successUrl - Redirect URL on success
 * @param {string} failureUrl - Redirect URL on failure
 * @returns {Promise<void>} Redirects to OAuth provider
 */
export const signInWithOAuth = async (provider, successUrl, failureUrl) => {
  try {
    let oauthProvider
    
    switch (provider) {
      case 'google':
        oauthProvider = OAuthProvider.Google
        break
      case 'linkedin':
        oauthProvider = OAuthProvider.LinkedIn
        break
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`)
    }

    await account.createOAuth2Session(
      oauthProvider,
      successUrl,
      failureUrl
    )
  } catch (error) {
    throw handleAppwriteError(error, `Failed to sign in with ${provider}`)
  }
}

/**
 * Get current user session
 * @returns {Promise<Object|null>} Current session or null
 */
export const getCurrentSession = async () => {
  try {
    const session = await account.getSession('current')
    return session
  } catch (error) {
    // Return null if no session exists (user not logged in)
    if (error.code === 401) {
      return null
    }
    throw handleAppwriteError(error, 'Failed to get current session')
  }
}

/**
 * Get current user account
 * @returns {Promise<Object|null>} Current user account or null
 */
export const getCurrentUser = async () => {
  try {
    const user = await account.get()
    return user
  } catch (error) {
    // Return null if no user is logged in
    if (error.code === 401) {
      return null
    }
    throw handleAppwriteError(error, 'Failed to get current user')
  }
}

/**
 * Get current user with profile data
 * @returns {Promise<Object|null>} User with profile data or null
 */
export const getCurrentUserWithProfile = async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    // Dynamically import database functions to avoid circular dependency
    const { getUserById, createUser } = await import('./database.js')
    
    try {
      const profile = await getUserById(user.$id)
      console.log('Found existing user profile:', profile)
      return {
        ...user,
        profile,
      }
    } catch (profileError) {
      console.log('Profile error:', profileError)
      
      // If profile doesn't exist (404 error), create it automatically
      if (profileError.code === 404 || profileError.type === 'document_not_found') {
        console.log('User profile not found, creating new profile for user:', user.$id)
        
        // Create a new user profile with default values
        const userData = {
          id: user.$id,
          name: user.name || user.email?.split('@')[0] || 'User',
          email: user.email,
          experienceLevel: 'Entry',
          targetRole: '',
          targetIndustry: '',
          isAdmin: false,
        }
        
        console.log('Creating user with data:', userData)
        
        const newProfile = await createUser(userData)
        
        console.log('New profile created:', newProfile)
        
        return {
          ...user,
          profile: newProfile,
        }
      }
      
      // If it's a different error, re-throw it
      throw profileError
    }
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to get user with profile')
  }
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export const signOut = async () => {
  try {
    await account.deleteSession('current')
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to sign out')
  }
}

/**
 * Logout user (alias for signOut)
 * @returns {Promise<void>}
 */
export const logoutUser = signOut

/**
 * Sign out from all sessions
 * @returns {Promise<void>}
 */
export const signOutFromAllSessions = async () => {
  try {
    await account.deleteSessions()
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to sign out from all sessions')
  }
}

/**
 * Manual session clearing utility with enhanced error handling and user feedback
 * @param {Object} options - Configuration options
 * @param {Function} options.dispatch - Redux dispatch function (optional)
 * @param {Function} options.onConfirm - Confirmation callback (optional)
 * @param {Function} options.onSuccess - Success callback (optional)
 * @param {Function} options.onError - Error callback (optional)
 * @param {boolean} options.requireConfirmation - Whether to require user confirmation (default: true)
 * @returns {Promise<Object>} Result object with success status and message
 */
export const manualSessionClear = async (options = {}) => {
  const {
    dispatch = null,
    onConfirm = null,
    onSuccess = null,
    onError = null,
    requireConfirmation = true
  } = options

  try {
    // Step 1: User confirmation flow
    if (requireConfirmation) {
      const confirmationMessage = 'This will sign you out from all devices and sessions. You will need to log in again. Are you sure you want to continue?'
      
      let confirmed = false
      
      if (onConfirm && typeof onConfirm === 'function') {
        // Use custom confirmation handler
        confirmed = await onConfirm(confirmationMessage)
      } else if (typeof window !== 'undefined' && window.confirm) {
        // Use browser confirmation dialog as fallback
        confirmed = window.confirm(confirmationMessage)
      } else {
        // If no confirmation method available, assume confirmed for programmatic usage
        confirmed = true
      }
      
      if (!confirmed) {
        return {
          success: false,
          cancelled: true,
          message: 'Session clearing cancelled by user',
          userMessage: 'Operation cancelled'
        }
      }
    }

    // Step 2: Log the manual clearing attempt
    const { 
      logSessionConflictError, 
      SESSION_CONFLICT_TYPES 
    } = await import('../../utils/errorHandling.js')
    
    logSessionConflictError(SESSION_CONFLICT_TYPES.RESOLUTION_IN_PROGRESS, null, {
      method: 'manual_all_sessions_clear',
      userInitiated: true,
      requireConfirmation
    })

    // Step 3: Update Redux state if dispatch is available
    if (dispatch) {
      const { sessionConflictStart } = await import('../../store/slices/authSlice.js')
      dispatch(sessionConflictStart({ method: 'ALL' }))
    }

    // Step 4: Perform the session clearing
    await account.deleteSessions()

    // Step 5: Log successful clearing
    logSessionConflictError(SESSION_CONFLICT_TYPES.RESOLUTION_SUCCESS, null, {
      method: 'manual_all_sessions_clear',
      userInitiated: true,
      clearedAt: new Date().toISOString()
    })

    // Step 6: Update Redux state on success
    if (dispatch) {
      const { sessionConflictResolved, logout } = await import('../../store/slices/authSlice.js')
      dispatch(sessionConflictResolved({ method: 'ALL' }))
      // Clear the user state since all sessions are cleared
      dispatch(logout())
    }

    // Step 7: Success feedback
    const successResult = {
      success: true,
      cancelled: false,
      message: 'All sessions cleared successfully',
      userMessage: 'You have been signed out from all devices. Please log in again.',
      timestamp: new Date().toISOString()
    }

    if (onSuccess && typeof onSuccess === 'function') {
      await onSuccess(successResult)
    }

    return successResult

  } catch (error) {
    // Step 8: Enhanced error handling
    const { 
      logSessionConflictError, 
      SESSION_CONFLICT_TYPES,
      createSessionConflictError 
    } = await import('../../utils/errorHandling.js')
    
    // Log the failure
    logSessionConflictError(SESSION_CONFLICT_TYPES.ALL_SESSIONS_CLEAR_FAILED, error, {
      method: 'manual_all_sessions_clear',
      userInitiated: true,
      requiresSupport: true
    })

    // Update Redux state on failure
    if (dispatch) {
      const { sessionConflictFailed } = await import('../../store/slices/authSlice.js')
      dispatch(sessionConflictFailed())
    }

    // Create enhanced error object
    const enhancedError = createSessionConflictError(
      SESSION_CONFLICT_TYPES.ALL_SESSIONS_CLEAR_FAILED,
      error,
      {
        method: 'manual_all_sessions_clear',
        userInitiated: true,
        originalOperation: 'manualSessionClear'
      }
    )

    // Step 9: Error feedback
    const errorResult = {
      success: false,
      cancelled: false,
      message: enhancedError.message,
      userMessage: 'Failed to clear all sessions. Please try again or contact support.',
      error: enhancedError,
      timestamp: new Date().toISOString()
    }

    if (onError && typeof onError === 'function') {
      await onError(errorResult)
    }

    // Return error result instead of throwing to allow caller to handle gracefully
    return errorResult
  }
}

/**
 * Update user password
 * @param {string} newPassword - New password
 * @param {string} oldPassword - Current password
 * @returns {Promise<Object>} Updated user account
 */
export const updatePassword = async (newPassword, oldPassword) => {
  try {
    const user = await account.updatePassword(newPassword, oldPassword)
    return user
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to update password')
  }
}

/**
 * Update user email
 * @param {string} email - New email address
 * @param {string} password - Current password
 * @returns {Promise<Object>} Updated user account
 */
export const updateEmail = async (email, password) => {
  try {
    const user = await account.updateEmail(email, password)
    return user
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to update email')
  }
}

/**
 * Update user name
 * @param {string} name - New name
 * @returns {Promise<Object>} Updated user account
 */
export const updateName = async (name) => {
  try {
    const user = await account.updateName(name)
    return user
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to update name')
  }
}

/**
 * Send password recovery email
 * @param {string} email - User email
 * @param {string} url - Recovery URL
 * @returns {Promise<Object>} Recovery response
 */
export const sendPasswordRecovery = async (email, url) => {
  try {
    const recovery = await account.createRecovery(email, url)
    return recovery
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to send password recovery email')
  }
}

/**
 * Complete password recovery
 * @param {string} userId - User ID
 * @param {string} secret - Recovery secret
 * @param {string} password - New password
 * @returns {Promise<Object>} Recovery completion response
 */
export const completePasswordRecovery = async (userId, secret, password) => {
  try {
    const recovery = await account.updateRecovery(userId, secret, password)
    return recovery
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to complete password recovery')
  }
}

/**
 * Send email verification
 * @param {string} url - Verification URL
 * @returns {Promise<Object>} Verification response
 */
export const sendEmailVerification = async (url) => {
  try {
    const verification = await account.createVerification(url)
    return verification
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to send email verification')
  }
}

/**
 * Complete email verification
 * @param {string} userId - User ID
 * @param {string} secret - Verification secret
 * @returns {Promise<Object>} Verification completion response
 */
export const completeEmailVerification = async (userId, secret) => {
  try {
    const verification = await account.updateVerification(userId, secret)
    return verification
  } catch (error) {
    throw handleAppwriteError(error, 'Failed to complete email verification')
  }
}

/**
 * Check if user has admin privileges
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>} True if user is admin
 */
export const isUserAdmin = async (userId) => {
  try {
    // Dynamically import database functions to avoid circular dependency
    const { getUserById } = await import('./database.js')
    const profile = await getUserById(userId)
    return profile?.isAdmin === true
  } catch (error) {
    console.error('Failed to check admin status:', error)
    return false
  }
}

/**
 * Validate user session and permissions
 * @param {boolean} requireAdmin - Whether admin privileges are required
 * @returns {Promise<Object>} User data if valid
 */
export const validateUserSession = async (requireAdmin = false) => {
  try {
    const user = await getCurrentUserWithProfile()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    if (requireAdmin && !user.profile?.isAdmin) {
      throw new Error('Admin privileges required')
    }

    return user
  } catch (error) {
    throw handleAppwriteError(error, 'Session validation failed')
  }
}