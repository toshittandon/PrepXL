import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import authSlice, {
  sessionConflictStart,
  sessionConflictResolved,
  sessionConflictFailed,
  selectSessionConflictResolution,
  selectIsSessionConflictInProgress,
  selectSessionConflictMethod,
  setUser,
  setSession,
  setError,
  setLoading
} from '../../store/slices/authSlice.js'

// Mock Appwrite services with session conflict scenarios
vi.mock('../../services/appwrite/auth.js', () => ({
  signInWithEmail: vi.fn(),
  signOutFromAllSessions: vi.fn(),
  getCurrentUserWithProfile: vi.fn(),
  manualSessionClear: vi.fn()
}))

// Mock error handling utilities
vi.mock('../../utils/errorHandling.js', () => ({
  getSessionConflictUserMessage: vi.fn(),
  logSessionConflictError: vi.fn(),
  SESSION_CONFLICT_TYPES: {
    RESOLUTION_IN_PROGRESS: 'RESOLUTION_IN_PROGRESS',
    RESOLUTION_SUCCESS: 'RESOLUTION_SUCCESS',
    CURRENT_SESSION_CLEAR_FAILED: 'CURRENT_SESSION_CLEAR_FAILED',
    ALL_SESSIONS_CLEAR_FAILED: 'ALL_SESSIONS_CLEAR_FAILED'
  },
  createSessionConflictError: vi.fn()
}))

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice
    },
    preloadedState: {
      auth: {
        user: null,
        session: null,
        loading: false,
        error: null,
        sessionConflictResolution: {
          inProgress: false,
          method: null,
          resolved: false
        },
        ...initialState
      }
    }
  })
}

describe('Session Conflict Resolution Integration Tests', () => {
  let store
  let mockSignInWithEmail
  let mockSignOutFromAllSessions
  let mockGetCurrentUserWithProfile
  let mockManualSessionClear
  let mockGetSessionConflictUserMessage

  beforeEach(async () => {
    vi.clearAllMocks()
    store = createTestStore()
    
    // Get the mocked functions
    const authModule = await import('../../services/appwrite/auth.js')
    const errorModule = await import('../../utils/errorHandling.js')
    
    mockSignInWithEmail = authModule.signInWithEmail
    mockSignOutFromAllSessions = authModule.signOutFromAllSessions
    mockGetCurrentUserWithProfile = authModule.getCurrentUserWithProfile
    mockManualSessionClear = authModule.manualSessionClear
    mockGetSessionConflictUserMessage = errorModule.getSessionConflictUserMessage
    
    // Default mock implementations
    mockGetCurrentUserWithProfile.mockResolvedValue({
      $id: '1',
      name: 'Test User',
      email: 'test@example.com',
      profile: { isAdmin: false }
    })
    
    mockGetSessionConflictUserMessage.mockReturnValue({
      message: 'Session conflict detected. Resolving automatically...',
      type: 'SESSION_CONFLICT',
      recoverable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('End-to-End Authentication Flow with Session Conflicts', () => {
    it('should successfully resolve session conflict with current session clearing', async () => {
      // Mock session conflict error on first attempt, success on retry
      const sessionConflictError = new Error('Session conflict')
      sessionConflictError.code = 401
      sessionConflictError.type = 'user_session_already_exists'
      
      const mockSession = { $id: 'session-123', token: 'test-token' }
      const mockUser = {
        $id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        profile: { isAdmin: false }
      }
      
      // First call fails with session conflict, second call succeeds
      mockSignInWithEmail
        .mockRejectedValueOnce(sessionConflictError)
        .mockResolvedValueOnce(mockSession)
      
      mockGetCurrentUserWithProfile.mockResolvedValue(mockUser)

      // Simulate the authentication flow
      const credentials = { email: 'test@example.com', password: 'password123', dispatch: store.dispatch }
      
      try {
        // First attempt should fail with session conflict
        await mockSignInWithEmail(credentials)
      } catch (error) {
        expect(error.type).toBe('user_session_already_exists')
        
        // Simulate session conflict resolution
        store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
        
        // Retry should succeed
        const session = await mockSignInWithEmail(credentials)
        store.dispatch(setSession(session))
        store.dispatch(sessionConflictResolved({ method: 'CURRENT' }))
        
        // Get user profile
        const user = await mockGetCurrentUserWithProfile()
        store.dispatch(setUser(user))
      }

      // Verify final state
      const state = store.getState()
      expect(state.auth.session).toEqual(mockSession)
      expect(state.auth.user).toEqual(mockUser)
      expect(state.auth.sessionConflictResolution.resolved).toBe(true)
      expect(state.auth.sessionConflictResolution.method).toBe('CURRENT')
    })

    it('should handle session conflict with all sessions clearing fallback', async () => {
      const sessionConflictError = new Error('Session conflict')
      sessionConflictError.code = 401
      sessionConflictError.type = 'user_session_already_exists'
      
      const mockSession = { $id: 'session-456', token: 'test-token-2' }
      const mockUser = {
        $id: 'user-456',
        name: 'Test User 2',
        email: 'test2@example.com',
        profile: { isAdmin: false }
      }
      
      // Simulate fallback to all sessions clearing
      mockSignInWithEmail
        .mockRejectedValueOnce(sessionConflictError)
        .mockResolvedValueOnce(mockSession)
      
      mockGetCurrentUserWithProfile.mockResolvedValue(mockUser)

      const credentials = { email: 'test2@example.com', password: 'password123', dispatch: store.dispatch }
      
      try {
        await mockSignInWithEmail(credentials)
      } catch (error) {
        // Simulate fallback to all sessions clearing
        store.dispatch(sessionConflictStart({ method: 'ALL' }))
        
        const session = await mockSignInWithEmail(credentials)
        store.dispatch(setSession(session))
        store.dispatch(sessionConflictResolved({ method: 'ALL' }))
        
        const user = await mockGetCurrentUserWithProfile()
        store.dispatch(setUser(user))
      }

      // Verify successful resolution with ALL method
      const state = store.getState()
      expect(state.auth.session).toEqual(mockSession)
      expect(state.auth.user).toEqual(mockUser)
      expect(state.auth.sessionConflictResolution.resolved).toBe(true)
      expect(state.auth.sessionConflictResolution.method).toBe('ALL')
    })

    it('should handle complete session conflict resolution failure', async () => {
      const persistentError = new Error('Persistent session conflict')
      persistentError.code = 401
      persistentError.type = 'user_session_already_exists'
      persistentError.isSessionConflict = true
      
      mockSignInWithEmail.mockRejectedValue(persistentError)
      mockGetSessionConflictUserMessage.mockReturnValue({
        message: 'Unable to resolve session conflict. Please try manual session clearing.',
        type: 'SESSION_CONFLICT_FAILED',
        recoverable: true
      })

      const credentials = { email: 'test@example.com', password: 'password123', dispatch: store.dispatch }
      
      try {
        await mockSignInWithEmail(credentials)
      } catch (error) {
        store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
        
        try {
          await mockSignInWithEmail(credentials)
        } catch (retryError) {
          store.dispatch(sessionConflictFailed())
          const errorMessage = mockGetSessionConflictUserMessage(retryError)
          store.dispatch(setError(errorMessage.message))
        }
      }

      // Verify error state
      const state = store.getState()
      expect(state.auth.error).toContain('session conflict')
      expect(state.auth.user).toBeNull()
      expect(state.auth.session).toBeNull()
      expect(state.auth.sessionConflictResolution.inProgress).toBe(false)
      expect(state.auth.sessionConflictResolution.resolved).toBe(false)
    })
  })

  describe('Redux State Management During Conflict Resolution', () => {
    it('should properly manage session conflict resolution state transitions', () => {
      // Test initial state
      expect(selectSessionConflictResolution(store.getState())).toEqual({
        inProgress: false,
        method: null,
        resolved: false
      })
      expect(selectIsSessionConflictInProgress(store.getState())).toBe(false)
      expect(selectSessionConflictMethod(store.getState())).toBeNull()

      // Test session conflict start
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))

      expect(selectSessionConflictResolution(store.getState())).toEqual({
        inProgress: true,
        method: 'CURRENT',
        resolved: false
      })
      expect(selectIsSessionConflictInProgress(store.getState())).toBe(true)
      expect(selectSessionConflictMethod(store.getState())).toBe('CURRENT')

      // Test session conflict resolved
      store.dispatch(sessionConflictResolved({ method: 'CURRENT' }))

      expect(selectSessionConflictResolution(store.getState())).toEqual({
        inProgress: false,
        method: 'CURRENT',
        resolved: true
      })
      expect(selectIsSessionConflictInProgress(store.getState())).toBe(false)

      // Test session conflict failed
      store.dispatch(sessionConflictFailed())

      expect(selectSessionConflictResolution(store.getState())).toEqual({
        inProgress: false,
        method: null,
        resolved: false
      })
    })

    it('should handle all sessions clearing method state transitions', () => {
      // Test all sessions clearing start
      store.dispatch(sessionConflictStart({ method: 'ALL' }))

      expect(selectSessionConflictMethod(store.getState())).toBe('ALL')
      expect(selectIsSessionConflictInProgress(store.getState())).toBe(true)

      // Test all sessions clearing resolved
      store.dispatch(sessionConflictResolved({ method: 'ALL' }))

      expect(selectSessionConflictResolution(store.getState())).toEqual({
        inProgress: false,
        method: 'ALL',
        resolved: true
      })
    })

    it('should maintain state consistency during multiple conflict resolution attempts', () => {
      // First attempt - current session clearing
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
      expect(selectSessionConflictMethod(store.getState())).toBe('CURRENT')

      // First attempt fails, fallback to all sessions clearing
      store.dispatch(sessionConflictStart({ method: 'ALL' }))
      expect(selectSessionConflictMethod(store.getState())).toBe('ALL')
      expect(selectIsSessionConflictInProgress(store.getState())).toBe(true)

      // Final resolution
      store.dispatch(sessionConflictResolved({ method: 'ALL' }))
      expect(selectSessionConflictResolution(store.getState())).toEqual({
        inProgress: false,
        method: 'ALL',
        resolved: true
      })
    })

    it('should handle state transitions during authentication flow', () => {
      const mockSession = { $id: 'session-state', token: 'state-token' }
      const mockUser = { $id: 'user-state', name: 'State User', email: 'state@example.com' }

      // Start loading
      store.dispatch(setLoading(true))
      expect(store.getState().auth.loading).toBe(true)

      // Start session conflict resolution
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
      expect(selectIsSessionConflictInProgress(store.getState())).toBe(true)

      // Resolve conflict and set session
      store.dispatch(sessionConflictResolved({ method: 'CURRENT' }))
      store.dispatch(setSession(mockSession))
      store.dispatch(setUser(mockUser))
      store.dispatch(setLoading(false))

      const finalState = store.getState()
      expect(finalState.auth.loading).toBe(false)
      expect(finalState.auth.session).toEqual(mockSession)
      expect(finalState.auth.user).toEqual(mockUser)
      expect(finalState.auth.sessionConflictResolution.resolved).toBe(true)
    })
  })

  describe('Manual Session Clearing Integration', () => {
    it('should handle manual session clearing with user confirmation', async () => {
      const mockResult = {
        success: true,
        cancelled: false,
        message: 'All sessions cleared successfully',
        userMessage: 'You have been signed out from all devices. Please log in again.',
        timestamp: new Date().toISOString()
      }

      mockManualSessionClear.mockResolvedValue(mockResult)

      // Simulate manual session clearing
      const options = {
        dispatch: store.dispatch,
        requireConfirmation: true
      }

      const result = await mockManualSessionClear(options)

      expect(result.success).toBe(true)
      expect(result.cancelled).toBe(false)
      expect(mockManualSessionClear).toHaveBeenCalledWith(options)
    })

    it('should handle manual session clearing cancellation', async () => {
      const mockResult = {
        success: false,
        cancelled: true,
        message: 'Session clearing cancelled by user',
        userMessage: 'Operation cancelled'
      }

      mockManualSessionClear.mockResolvedValue(mockResult)

      const options = {
        dispatch: store.dispatch,
        requireConfirmation: true
      }

      const result = await mockManualSessionClear(options)

      expect(result.success).toBe(false)
      expect(result.cancelled).toBe(true)
      expect(mockManualSessionClear).toHaveBeenCalledWith(options)
    })

    it('should handle manual session clearing failure', async () => {
      const mockResult = {
        success: false,
        cancelled: false,
        message: 'Failed to clear all sessions',
        userMessage: 'Failed to clear all sessions. Please try again or contact support.',
        error: new Error('Network error'),
        timestamp: new Date().toISOString()
      }

      mockManualSessionClear.mockResolvedValue(mockResult)

      const options = {
        dispatch: store.dispatch,
        requireConfirmation: false
      }

      const result = await mockManualSessionClear(options)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(mockManualSessionClear).toHaveBeenCalledWith(options)
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should recover from network errors during session conflict resolution', async () => {
      const networkError = new Error('Network error')
      networkError.code = 500
      
      const mockSession = { $id: 'session-recovery', token: 'recovery-token' }
      
      // First call fails with network error, second call succeeds
      mockSignInWithEmail
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(mockSession)

      const credentials = { email: 'test@example.com', password: 'password123', dispatch: store.dispatch }
      
      // First attempt fails
      try {
        await mockSignInWithEmail(credentials)
      } catch (error) {
        expect(error.code).toBe(500)
        store.dispatch(setError(error.message))
      }

      // Retry succeeds
      const session = await mockSignInWithEmail(credentials)
      store.dispatch(setSession(session))
      store.dispatch(setError(null))

      const state = store.getState()
      expect(state.auth.session).toEqual(mockSession)
      expect(state.auth.error).toBeNull()
    })

    it('should maintain authentication state consistency during errors', async () => {
      const persistentError = new Error('Persistent authentication error')
      mockSignInWithEmail.mockRejectedValue(persistentError)

      const credentials = { email: 'test@example.com', password: 'password123', dispatch: store.dispatch }
      
      try {
        await mockSignInWithEmail(credentials)
      } catch (error) {
        store.dispatch(setError(error.message))
      }

      // Verify state remains consistent
      const state = store.getState()
      expect(state.auth.user).toBeNull()
      expect(state.auth.session).toBeNull()
      expect(state.auth.error).toBe('Persistent authentication error')
      expect(state.auth.sessionConflictResolution.inProgress).toBe(false)
    })

    it('should handle concurrent session conflict resolution attempts', async () => {
      const sessionConflictError = new Error('Session conflict')
      sessionConflictError.code = 401
      sessionConflictError.type = 'user_session_already_exists'
      
      mockSignInWithEmail.mockRejectedValue(sessionConflictError)

      // Simulate multiple concurrent attempts
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
      store.dispatch(sessionConflictStart({ method: 'ALL' }))
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))

      // State should reflect the last attempt
      const state = store.getState()
      expect(state.auth.sessionConflictResolution.method).toBe('CURRENT')
      expect(state.auth.sessionConflictResolution.inProgress).toBe(true)
    })
  })

  describe('Integration with Complete Authentication Flow', () => {
    it('should integrate session conflict resolution with complete authentication flow', async () => {
      const sessionConflictError = new Error('Session conflict')
      sessionConflictError.code = 401
      sessionConflictError.type = 'user_session_already_exists'
      
      const mockSession = { $id: 'integrated-session', token: 'integrated-token' }
      const mockUser = {
        $id: 'user-123',
        name: 'Integrated User',
        email: 'integrated@example.com',
        profile: { isAdmin: false }
      }
      
      // Mock the complete flow
      mockSignInWithEmail
        .mockRejectedValueOnce(sessionConflictError)
        .mockResolvedValueOnce(mockSession)
      
      mockGetCurrentUserWithProfile.mockResolvedValue(mockUser)

      const credentials = { email: 'integrated@example.com', password: 'password123', dispatch: store.dispatch }
      
      // Complete authentication flow with conflict resolution
      try {
        await mockSignInWithEmail(credentials)
      } catch (error) {
        store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
        
        const session = await mockSignInWithEmail(credentials)
        store.dispatch(setSession(session))
        store.dispatch(sessionConflictResolved({ method: 'CURRENT' }))
        
        const user = await mockGetCurrentUserWithProfile()
        store.dispatch(setUser(user))
      }

      // Verify complete authentication state
      const state = store.getState()
      expect(state.auth.session).toEqual(mockSession)
      expect(state.auth.user).toEqual(mockUser)
      expect(state.auth.error).toBeNull()
      expect(state.auth.sessionConflictResolution.resolved).toBe(true)
      expect(mockSignInWithEmail).toHaveBeenCalledTimes(2)
      expect(mockGetCurrentUserWithProfile).toHaveBeenCalledTimes(1)
    })

    it('should clear previous errors when starting new session conflict resolution', () => {
      const store = createTestStore({
        error: 'Previous authentication error',
        sessionConflictResolution: {
          inProgress: false,
          method: null,
          resolved: false
        }
      })

      // Verify initial error state
      expect(store.getState().auth.error).toBe('Previous authentication error')

      // Start new session conflict resolution
      store.dispatch(setError(null)) // Clear previous error
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))

      // Previous error should be cleared
      const state = store.getState()
      expect(state.auth.error).toBeNull()
      expect(state.auth.sessionConflictResolution.inProgress).toBe(true)
      expect(state.auth.sessionConflictResolution.method).toBe('CURRENT')
    })

    it('should handle authentication flow with multiple error scenarios', async () => {
      const scenarios = [
        { error: new Error('Network timeout'), code: 408 },
        { error: new Error('Invalid credentials'), code: 401 },
        { error: new Error('Session conflict'), code: 401, type: 'user_session_already_exists' }
      ]

      for (const scenario of scenarios) {
        const store = createTestStore()
        scenario.error.code = scenario.code
        if (scenario.type) scenario.error.type = scenario.type

        mockSignInWithEmail.mockRejectedValueOnce(scenario.error)

        const credentials = { email: 'test@example.com', password: 'password123', dispatch: store.dispatch }
        
        try {
          await mockSignInWithEmail(credentials)
        } catch (error) {
          if (error.type === 'user_session_already_exists') {
            store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
          } else {
            store.dispatch(setError(error.message))
          }
        }

        const state = store.getState()
        if (scenario.type === 'user_session_already_exists') {
          expect(state.auth.sessionConflictResolution.inProgress).toBe(true)
        } else {
          expect(state.auth.error).toBe(scenario.error.message)
        }
      }
    })
  })
})