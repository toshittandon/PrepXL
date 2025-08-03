/**
 * Mock authentication service for development
 */

// Mock user data
const MOCK_USERS = {
  'admin@interviewprep.com': {
    $id: 'mock-admin-id',
    name: 'Admin User',
    email: 'admin@interviewprep.com',
    password: 'admin123',
    profile: {
      id: 'mock-admin-id',
      name: 'Admin User',
      email: 'admin@interviewprep.com',
      experienceLevel: 'Senior',
      targetRole: 'System Administrator',
      targetIndustry: 'Technology',
      isAdmin: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  'user@interviewprep.com': {
    $id: 'mock-user-id',
    name: 'Test User',
    email: 'user@interviewprep.com',
    password: 'user123',
    profile: {
      id: 'mock-user-id',
      name: 'Test User',
      email: 'user@interviewprep.com',
      experienceLevel: 'Mid-level',
      targetRole: 'Software Developer',
      targetIndustry: 'Technology',
      isAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
}

// Mock session storage
let currentSession = null
let currentUser = null

/**
 * Mock delay to simulate network requests
 */
const mockDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Create a new user account with email and password
 */
export const createAccount = async ({ email, password, name }) => {
  await mockDelay()
  
  if (MOCK_USERS[email]) {
    throw new Error('An account with this email already exists')
  }
  
  const userId = `mock-${Date.now()}`
  const newUser = {
    $id: userId,
    name,
    email,
    password,
    profile: {
      id: userId,
      name,
      email,
      experienceLevel: 'Entry',
      targetRole: '',
      targetIndustry: '',
      isAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
  
  MOCK_USERS[email] = newUser
  
  return {
    account: newUser,
    profile: newUser.profile
  }
}

/**
 * Sign in with email and password
 */
export const signInWithEmail = async ({ email, password }) => {
  await mockDelay()
  
  const user = MOCK_USERS[email]
  if (!user || user.password !== password) {
    throw new Error('Invalid email or password')
  }
  
  currentSession = {
    $id: `session-${Date.now()}`,
    userId: user.$id,
    expire: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  }
  
  currentUser = user
  
  return currentSession
}

/**
 * Sign in with OAuth provider (mock)
 */
export const signInWithOAuth = async (provider, successUrl, failureUrl) => {
  await mockDelay()
  
  // For mock, just redirect to success URL
  window.location.href = successUrl
}

/**
 * Get current user session
 */
export const getCurrentSession = async () => {
  await mockDelay(100)
  
  if (!currentSession) {
    const error = new Error('Authentication required')
    error.code = 401
    throw error
  }
  
  return currentSession
}

/**
 * Get current user account
 */
export const getCurrentUser = async () => {
  await mockDelay(100)
  
  if (!currentUser) {
    const error = new Error('Authentication required')
    error.code = 401
    throw error
  }
  
  return currentUser
}

/**
 * Get current user with profile data
 */
export const getCurrentUserWithProfile = async () => {
  await mockDelay(100)
  
  if (!currentUser) {
    const error = new Error('Authentication required')
    error.code = 401
    throw error
  }
  
  return {
    ...currentUser,
    profile: currentUser.profile
  }
}

/**
 * Sign out current user
 */
export const signOut = async () => {
  await mockDelay(100)
  
  currentSession = null
  currentUser = null
}

/**
 * Logout user (alias for signOut)
 */
export const logoutUser = signOut

/**
 * Sign out from all sessions
 */
export const signOutFromAllSessions = async () => {
  await signOut()
}

/**
 * Update user password
 */
export const updatePassword = async (newPassword, oldPassword) => {
  await mockDelay()
  
  if (!currentUser) {
    throw new Error('Authentication required')
  }
  
  if (currentUser.password !== oldPassword) {
    throw new Error('Current password is incorrect')
  }
  
  currentUser.password = newPassword
  MOCK_USERS[currentUser.email].password = newPassword
  
  return currentUser
}

/**
 * Update user email
 */
export const updateEmail = async (email, password) => {
  await mockDelay()
  
  if (!currentUser) {
    throw new Error('Authentication required')
  }
  
  if (currentUser.password !== password) {
    throw new Error('Current password is incorrect')
  }
  
  if (MOCK_USERS[email] && email !== currentUser.email) {
    throw new Error('An account with this email already exists')
  }
  
  // Remove old email entry
  delete MOCK_USERS[currentUser.email]
  
  // Update user data
  currentUser.email = email
  currentUser.profile.email = email
  
  // Add new email entry
  MOCK_USERS[email] = currentUser
  
  return currentUser
}

/**
 * Update user name
 */
export const updateName = async (name) => {
  await mockDelay()
  
  if (!currentUser) {
    throw new Error('Authentication required')
  }
  
  currentUser.name = name
  currentUser.profile.name = name
  MOCK_USERS[currentUser.email].name = name
  MOCK_USERS[currentUser.email].profile.name = name
  
  return currentUser
}

/**
 * Send password recovery email (mock)
 */
export const sendPasswordRecovery = async (email, url) => {
  await mockDelay()
  
  if (!MOCK_USERS[email]) {
    throw new Error('User not found')
  }
  
  console.log(`Mock: Password recovery email sent to ${email}`)
  console.log(`Mock: Recovery URL: ${url}?userId=${MOCK_USERS[email].$id}&secret=mock-secret`)
  
  return { $id: 'mock-recovery-id' }
}

/**
 * Complete password recovery (mock)
 */
export const completePasswordRecovery = async (userId, secret, password) => {
  await mockDelay()
  
  if (secret !== 'mock-secret') {
    throw new Error('Invalid recovery secret')
  }
  
  const user = Object.values(MOCK_USERS).find(u => u.$id === userId)
  if (!user) {
    throw new Error('User not found')
  }
  
  user.password = password
  
  return { $id: 'mock-recovery-completion-id' }
}

/**
 * Send email verification (mock)
 */
export const sendEmailVerification = async (url) => {
  await mockDelay()
  
  if (!currentUser) {
    throw new Error('Authentication required')
  }
  
  console.log(`Mock: Email verification sent to ${currentUser.email}`)
  console.log(`Mock: Verification URL: ${url}?userId=${currentUser.$id}&secret=mock-verification-secret`)
  
  return { $id: 'mock-verification-id' }
}

/**
 * Complete email verification (mock)
 */
export const completeEmailVerification = async (userId, secret) => {
  await mockDelay()
  
  if (secret !== 'mock-verification-secret') {
    throw new Error('Invalid verification secret')
  }
  
  const user = Object.values(MOCK_USERS).find(u => u.$id === userId)
  if (!user) {
    throw new Error('User not found')
  }
  
  // Mark email as verified (in a real app, you'd have an emailVerified field)
  console.log(`Mock: Email verified for user ${user.email}`)
  
  return { $id: 'mock-verification-completion-id' }
}

/**
 * Check if user has admin privileges
 */
export const isUserAdmin = async (userId) => {
  await mockDelay(100)
  
  const user = Object.values(MOCK_USERS).find(u => u.$id === userId)
  return user?.profile?.isAdmin === true
}

/**
 * Validate user session and permissions
 */
export const validateUserSession = async (requireAdmin = false) => {
  const user = await getCurrentUserWithProfile()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  if (requireAdmin && !user.profile?.isAdmin) {
    throw new Error('Admin privileges required')
  }
  
  return user
}

// Initialize with a default session for development convenience
if (typeof window !== 'undefined' && window.location.search.includes('mockLogin=admin')) {
  signInWithEmail({ email: 'admin@interviewprep.com', password: 'admin123' })
    .then(() => console.log('Mock admin user logged in automatically'))
    .catch(console.error)
} else if (typeof window !== 'undefined' && window.location.search.includes('mockLogin=user')) {
  signInWithEmail({ email: 'user@interviewprep.com', password: 'user123' })
    .then(() => console.log('Mock regular user logged in automatically'))
    .catch(console.error)
}