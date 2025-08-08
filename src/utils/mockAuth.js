/**
 * Mock authentication utilities for development and testing
 */

/**
 * Create a mock user object for testing
 * @returns {Object} Mock user object
 */
export const createMockUser = () => ({
  id: 'mock-user-123',
  $id: 'mock-user-123',
  email: 'test@example.com',
  name: 'Test User',
  profile: {
    experienceLevel: 'Mid',
    targetRole: 'Software Engineer',
    targetIndustry: 'Technology',
    isAdmin: false
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

/**
 * Create a mock session object for testing
 * @returns {Object} Mock session object
 */
export const createMockSession = () => ({
  $id: 'mock-session-123',
  userId: 'mock-user-123',
  expire: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  provider: 'email',
  providerUid: 'test@example.com',
  current: true
})

/**
 * Set mock authentication state in Redux store
 * @param {Function} dispatch - Redux dispatch function
 */
export const setMockAuthState = async (dispatch) => {
  const { setUser, setSession } = await import('../store/slices/authSlice.js')
  
  const mockUser = createMockUser()
  const mockSession = createMockSession()
  
  dispatch(setUser(mockUser))
  dispatch(setSession(mockSession))
  
  console.log('🔧 Mock authentication state set:', { mockUser, mockSession })
}

/**
 * Check if we should use mock authentication
 * @returns {boolean} True if mock auth should be used
 */
export const shouldUseMockAuth = () => {
  return process.env.NODE_ENV === 'development' && 
         (window.location.search.includes('mock-auth') || 
          localStorage.getItem('use-mock-auth') === 'true')
}

/**
 * Toggle mock authentication mode
 */
export const toggleMockAuth = () => {
  const currentState = localStorage.getItem('use-mock-auth') === 'true'
  localStorage.setItem('use-mock-auth', (!currentState).toString())
  window.location.reload()
}

/**
 * Get mock auth controls HTML (for development)
 * This returns a function that creates the controls component
 */
export const getMockAuthControlsComponent = () => {
  // This will be imported as a React component from a separate file
  return null
}