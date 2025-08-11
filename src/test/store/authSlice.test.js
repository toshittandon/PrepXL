import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import authSlice, {
  setUser,
  setSession,
  setLoading,
  setError,
  clearError,
  logout,
  reset,
  sessionConflictStart,
  sessionConflictResolved,
  sessionConflictFailed,
  clearSessionConflictResolution,
  selectSessionConflictResolution,
  selectIsSessionConflictInProgress,
  selectSessionConflictMethod,
  selectIsSessionConflictResolved
} from '../../store/slices/authSlice.js'

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

describe('Auth Slice', () => {
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = createTestStore()
      const state = store.getState().auth
      
      expect(state.user).toBe(null)
      expect(state.session).toBe(null)
      expect(state.loading).toBe(false)
      expect(state.error).toBe(null)
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: null,
        resolved: false
      })
    })
  })

  describe('Actions', () => {
    it('should set user', () => {
      const store = createTestStore()
      const user = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        isAdmin: false
      }
      
      store.dispatch(setUser(user))
      
      const state = store.getState().auth
      expect(state.user).toEqual(user)
    })

    it('should set session', () => {
      const store = createTestStore()
      const session = {
        token: 'test-token',
        expires: '2024-12-31T23:59:59Z'
      }
      
      store.dispatch(setSession(session))
      
      const state = store.getState().auth
      expect(state.session).toEqual(session)
    })

    it('should set loading state', () => {
      const store = createTestStore()
      
      store.dispatch(setLoading(true))
      expect(store.getState().auth.loading).toBe(true)
      
      store.dispatch(setLoading(false))
      expect(store.getState().auth.loading).toBe(false)
    })

    it('should set error', () => {
      const store = createTestStore()
      const error = 'Authentication failed'
      
      store.dispatch(setError(error))
      
      const state = store.getState().auth
      expect(state.error).toBe(error)
    })

    it('should clear error', () => {
      const store = createTestStore({ error: 'Some error' })
      
      store.dispatch(clearError())
      
      const state = store.getState().auth
      expect(state.error).toBe(null)
    })

    it('should logout user', () => {
      const store = createTestStore({
        user: { id: '1', name: 'Test User' },
        session: { token: 'test-token' },
        error: 'Some error',
        sessionConflictResolution: {
          inProgress: true,
          method: 'CURRENT',
          resolved: true
        }
      })
      
      store.dispatch(logout())
      
      const state = store.getState().auth
      expect(state.user).toBe(null)
      expect(state.session).toBe(null)
      expect(state.error).toBe(null)
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: null,
        resolved: false
      })
    })

    it('should reset to initial state', () => {
      const store = createTestStore({
        user: { id: '1', name: 'Test User' },
        session: { token: 'test-token' },
        loading: true,
        error: 'Some error',
        sessionConflictResolution: {
          inProgress: true,
          method: 'ALL',
          resolved: true
        }
      })
      
      store.dispatch(reset())
      
      const state = store.getState().auth
      expect(state.user).toBe(null)
      expect(state.session).toBe(null)
      expect(state.loading).toBe(false)
      expect(state.error).toBe(null)
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: null,
        resolved: false
      })
    })

    it('should start session conflict resolution with CURRENT method', () => {
      const store = createTestStore()
      
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
      
      const state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: true,
        method: 'CURRENT',
        resolved: false
      })
    })

    it('should start session conflict resolution with ALL method', () => {
      const store = createTestStore()
      
      store.dispatch(sessionConflictStart({ method: 'ALL' }))
      
      const state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: true,
        method: 'ALL',
        resolved: false
      })
    })

    it('should resolve session conflict with CURRENT method', () => {
      const store = createTestStore({
        sessionConflictResolution: {
          inProgress: true,
          method: 'CURRENT',
          resolved: false
        }
      })
      
      store.dispatch(sessionConflictResolved({ method: 'CURRENT' }))
      
      const state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: 'CURRENT',
        resolved: true
      })
    })

    it('should resolve session conflict with ALL method', () => {
      const store = createTestStore({
        sessionConflictResolution: {
          inProgress: true,
          method: 'ALL',
          resolved: false
        }
      })
      
      store.dispatch(sessionConflictResolved({ method: 'ALL' }))
      
      const state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: 'ALL',
        resolved: true
      })
    })

    it('should handle session conflict failure', () => {
      const store = createTestStore({
        sessionConflictResolution: {
          inProgress: true,
          method: 'CURRENT',
          resolved: false
        }
      })
      
      store.dispatch(sessionConflictFailed())
      
      const state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: null,
        resolved: false
      })
    })

    it('should clear session conflict resolution', () => {
      const store = createTestStore({
        sessionConflictResolution: {
          inProgress: false,
          method: 'ALL',
          resolved: true
        }
      })
      
      store.dispatch(clearSessionConflictResolution())
      
      const state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: null,
        resolved: false
      })
    })
  })

  describe('State Management', () => {
    it('should handle multiple actions in sequence', () => {
      const store = createTestStore()
      
      // Set loading
      store.dispatch(setLoading(true))
      expect(store.getState().auth.loading).toBe(true)
      
      // Set user and session
      const user = { id: '1', name: 'Test User' }
      const session = { token: 'test-token' }
      
      store.dispatch(setUser(user))
      store.dispatch(setSession(session))
      store.dispatch(setLoading(false))
      
      const state = store.getState().auth
      expect(state.user).toEqual(user)
      expect(state.session).toEqual(session)
      expect(state.loading).toBe(false)
      expect(state.error).toBe(null)
    })

    it('should handle error scenarios', () => {
      const store = createTestStore()
      
      // Set error
      store.dispatch(setError('Login failed'))
      expect(store.getState().auth.error).toBe('Login failed')
      
      // Clear error
      store.dispatch(clearError())
      expect(store.getState().auth.error).toBe(null)
      
      // Set another error
      store.dispatch(setError('Network error'))
      expect(store.getState().auth.error).toBe('Network error')
      
      // Logout should clear error
      store.dispatch(logout())
      expect(store.getState().auth.error).toBe(null)
    })
  })

  describe('Session Conflict Resolution', () => {
    it('should handle complete session conflict resolution workflow with CURRENT method', () => {
      const store = createTestStore()
      
      // Start session conflict resolution
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
      let state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: true,
        method: 'CURRENT',
        resolved: false
      })
      
      // Resolve session conflict
      store.dispatch(sessionConflictResolved({ method: 'CURRENT' }))
      state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: 'CURRENT',
        resolved: true
      })
      
      // Clear resolution state
      store.dispatch(clearSessionConflictResolution())
      state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: null,
        resolved: false
      })
    })

    it('should handle complete session conflict resolution workflow with ALL method', () => {
      const store = createTestStore()
      
      // Start session conflict resolution
      store.dispatch(sessionConflictStart({ method: 'ALL' }))
      let state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: true,
        method: 'ALL',
        resolved: false
      })
      
      // Resolve session conflict
      store.dispatch(sessionConflictResolved({ method: 'ALL' }))
      state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: 'ALL',
        resolved: true
      })
      
      // Clear resolution state
      store.dispatch(clearSessionConflictResolution())
      state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: null,
        resolved: false
      })
    })

    it('should handle session conflict failure workflow', () => {
      const store = createTestStore()
      
      // Start session conflict resolution
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
      let state = store.getState().auth
      expect(state.sessionConflictResolution.inProgress).toBe(true)
      expect(state.sessionConflictResolution.method).toBe('CURRENT')
      
      // Fail session conflict resolution
      store.dispatch(sessionConflictFailed())
      state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: null,
        resolved: false
      })
    })

    it('should handle escalation from CURRENT to ALL method', () => {
      const store = createTestStore()
      
      // Start with CURRENT method
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
      let state = store.getState().auth
      expect(state.sessionConflictResolution.method).toBe('CURRENT')
      
      // Escalate to ALL method (simulating fallback)
      store.dispatch(sessionConflictStart({ method: 'ALL' }))
      state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: true,
        method: 'ALL',
        resolved: false
      })
      
      // Resolve with ALL method
      store.dispatch(sessionConflictResolved({ method: 'ALL' }))
      state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: 'ALL',
        resolved: true
      })
    })

    it('should reset session conflict resolution on logout', () => {
      const store = createTestStore({
        user: { id: '1', name: 'Test User' },
        session: { token: 'test-token' },
        sessionConflictResolution: {
          inProgress: true,
          method: 'CURRENT',
          resolved: false
        }
      })
      
      store.dispatch(logout())
      
      const state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: null,
        resolved: false
      })
    })

    it('should reset session conflict resolution on reset', () => {
      const store = createTestStore({
        sessionConflictResolution: {
          inProgress: true,
          method: 'ALL',
          resolved: true
        }
      })
      
      store.dispatch(reset())
      
      const state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: null,
        resolved: false
      })
    })

    it('should handle multiple session conflict attempts', () => {
      const store = createTestStore()
      
      // First attempt with CURRENT
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
      store.dispatch(sessionConflictFailed())
      
      // Second attempt with ALL
      store.dispatch(sessionConflictStart({ method: 'ALL' }))
      let state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: true,
        method: 'ALL',
        resolved: false
      })
      
      // Successful resolution
      store.dispatch(sessionConflictResolved({ method: 'ALL' }))
      state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: 'ALL',
        resolved: true
      })
    })
  })

  describe('Selectors', () => {
    it('should select session conflict resolution state', () => {
      const store = createTestStore()
      let state = store.getState()
      expect(selectSessionConflictResolution(state)).toEqual({
        inProgress: false,
        method: null,
        resolved: false
      })
      
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
      state = store.getState()
      expect(selectSessionConflictResolution(state)).toEqual({
        inProgress: true,
        method: 'CURRENT',
        resolved: false
      })
    })

    it('should select session conflict in progress state', () => {
      const store = createTestStore()
      let state = store.getState()
      expect(selectIsSessionConflictInProgress(state)).toBe(false)
      
      store.dispatch(sessionConflictStart({ method: 'ALL' }))
      state = store.getState()
      expect(selectIsSessionConflictInProgress(state)).toBe(true)
    })

    it('should select session conflict method', () => {
      const store = createTestStore()
      let state = store.getState()
      expect(selectSessionConflictMethod(state)).toBe(null)
      
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
      state = store.getState()
      expect(selectSessionConflictMethod(state)).toBe('CURRENT')
    })

    it('should select session conflict resolved state', () => {
      const store = createTestStore()
      let state = store.getState()
      expect(selectIsSessionConflictResolved(state)).toBe(false)
      
      store.dispatch(sessionConflictResolved({ method: 'CURRENT' }))
      state = store.getState()
      expect(selectIsSessionConflictResolved(state)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null values gracefully', () => {
      const store = createTestStore()
      
      store.dispatch(setUser(null))
      store.dispatch(setSession(null))
      store.dispatch(setError(null))
      
      const state = store.getState().auth
      expect(state.user).toBe(null)
      expect(state.session).toBe(null)
      expect(state.error).toBe(null)
    })

    it('should handle undefined values gracefully', () => {
      const store = createTestStore()
      
      store.dispatch(setUser(undefined))
      store.dispatch(setSession(undefined))
      store.dispatch(setError(undefined))
      
      const state = store.getState().auth
      expect(state.user).toBe(undefined)
      expect(state.session).toBe(undefined)
      expect(state.error).toBe(undefined)
    })

    it('should handle empty objects', () => {
      const store = createTestStore()
      
      store.dispatch(setUser({}))
      store.dispatch(setSession({}))
      
      const state = store.getState().auth
      expect(state.user).toEqual({})
      expect(state.session).toEqual({})
    })

    it('should preserve state immutability', () => {
      const store = createTestStore()
      const user = { id: '1', name: 'Test User' }
      
      store.dispatch(setUser(user))
      
      const state1 = store.getState().auth
      const state2 = store.getState().auth
      
      expect(state1).toBe(state2) // Same reference
      expect(state1.user).toEqual(user)
      
      // Create a new user object to test immutability
      const newUser = { id: '2', name: 'New User' }
      store.dispatch(setUser(newUser))
      
      // State should be updated with new user
      expect(store.getState().auth.user.name).toBe('New User')
      expect(store.getState().auth.user.id).toBe('2')
    })
  })
})