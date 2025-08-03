/**
 * Appwrite authentication service functions
 */

import { ID, OAuthProvider } from 'appwrite'
import { account } from './client.js'
import { handleAppwriteError } from '../../utils/errorHandling.js'
import { getConfig } from '../../utils/envConfig.js'

// Check if we should use mock auth
const shouldUseMockAuth = () => {
  const config = getConfig()
  return config.environment === 'development' && import.meta.env.VITE_MOCK_AUTH === 'true'
}

// Lazy load mock auth when needed
let mockAuth = null
const getMockAuth = async () => {
  if (!mockAuth && shouldUseMockAuth()) {
    mockAuth = await import('../auth/mockAuth.js')
  }
  return mockAuth
}

/**
 * Create a new user account with email and password
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.name - User full name
 * @returns {Promise<Object>} Created user account
 */
export const createAccount = async ({ email, password, name }) => {
  if (shouldUseMockAuth()) {
    const mock = await getMockAuth()
    return mock.createAccount({ email, password, name })
  }

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
 * Sign in with email and password
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} Session data
 */
export const signInWithEmail = async ({ email, password }) => {
  if (shouldUseMockAuth()) {
    const mock = await getMockAuth()
    return mock.signInWithEmail({ email, password })
  }

  try {
    const session = await account.createEmailPasswordSession(email, password)
    return session
  } catch (error) {
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
  if (shouldUseMockAuth()) {
    const mock = await getMockAuth()
    return mock.getCurrentSession()
  }

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
  if (shouldUseMockAuth()) {
    const mock = await getMockAuth()
    return mock.getCurrentUser()
  }

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
  if (shouldUseMockAuth()) {
    const mock = await getMockAuth()
    return mock.getCurrentUserWithProfile()
  }

  try {
    const user = await getCurrentUser()
    if (!user) return null

    // Dynamically import database functions to avoid circular dependency
    const { getUserById } = await import('./database.js')
    const profile = await getUserById(user.$id)
    return {
      ...user,
      profile,
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
  if (shouldUseMockAuth()) {
    const mock = await getMockAuth()
    return mock.signOut()
  }

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