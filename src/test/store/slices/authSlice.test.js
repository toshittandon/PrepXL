import { describe, it, expect, vi, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import authSlice, {
  loginStart,
  loginSuccess,
  loginFailure,
  setLoading,
  setUser,
  setSession,
  setError,
  clearError,
  updateProfile,
  logout,
  sessionConflictStart,
  sessionConflictResolved,
  sessionConflictFailed,
  clearSessionConflictResolution,
  reset,
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsAdmin,
  selectAuthLoading,
  selectAuthError,
  selectSessionConflictResolution,
  selectIsSessionConflictInProgress,
  selectSessionConflictMethod,
  selectIsSessionConflictResolved
} from '../../../store/slices/authSlice.js'

// Mock user data
const mockUser = {
  $id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  profile: {
    isAdmin: false,
    experienceLevel: 'Mid',
    targetRole: 'Software Engineer',
    targetIndustry: 'Technology'
  }
}

const mockAdminUser = {
  ...mockUser,
  isAdmin: true,
  profile: {
    ...mockUser.profile
  }
}

const mockSession = {
  $id: 'session-123',
  userId: 'user-123',
  expire: '2024-12-31T23:59:59.000Z'
}

// Helper function to create test store
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
  let store

  beforeEach(() => {
    store = createTestStore()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
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

  describe('Auth Actions', () => {
    it('should handle setLoading', () => {
      store.dispatch(setLoading(true))
      
      const state = store.getState().auth
      expect(state.loading).toBe(true)
    })

    it('should handle setUser', () => {
      store.dispatch(setUser(mockUser))
      
      const state = store.getState().auth
      expect(state.user).toEqual(mockUser)
    })

    it('should handle setSession', () => {
      store.dispatch(setSession(mockSession))
      
      const state = store.getState().auth
      expect(state.session).toEqual(mockSession)
    })

    it('should handle setError', () => {
      const errorMessage = 'Invalid credentials'
      store.dispatch(setError(errorMessage))
      
      const state = store.getState().auth
      expect(state.error).toBe(errorMessage)
    })
  })

  describe('Logout Action', () => {
    it('should handle logout', () => {
      // First set user and session
      store.dispatch(setUser(mockUser))
      store.dispatch(setSession(mockSession))
      
      // Then logout
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
  })

  describe('Session Conflict Resolution Actions', () => {
    it('should handle sessionConflictStart with CURRENT method', () => {
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
      
      const state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: true,
        method: 'CURRENT',
        resolved: false
      })
    })

    it('should handle sessionConflictStart with ALL method', () => {
      store.dispatch(sessionConflictStart({ method: 'ALL' }))
      
      const state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: true,
        method: 'ALL',
        resolved: false
      })
    })

    it('should handle sessionConflictResolved', () => {
      // First start a conflict resolution
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
      
      // Then resolve it
      store.dispatch(sessionConflictResolved({ method: 'CURRENT' }))
      
      const state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: 'CURRENT',
        resolved: true
      })
    })

    it('should handle sessionConflictFailed', () => {
      // First start a conflict resolution
      store.dispatch(sessionConflictStart({ method: 'ALL' }))
      
      // Then fail it
      store.dispatch(sessionConflictFailed())
      
      const state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: null,
        resolved: false
      })
    })

    it('should handle clearSessionConflictResolution', () => {
      // First set some conflict resolution state
      store.dispatch(sessionConflictResolved({ method: 'CURRENT' }))
      
      // Then clear it
      store.dispatch(clearSessionConflictResolution())
      
      const state = store.getState().auth
      expect(state.sessionConflictResolution).toEqual({
        inProgress: false,
        method: null,
        resolved: false
      })
    })
  })

  describe('Utility Actions', () => {
    it('should handle clearError', () => {
      // Set an error first
      store.dispatch(setError('Some error'))
      expect(store.getState().auth.error).toBe('Some error')
      
      // Clear the error
      store.dispatch(clearError())
      expect(store.getState().auth.error).toBe(null)
    })

    it('should handle reset', () => {
      // Set some state first
      store.dispatch(setUser(mockUser))
      store.dispatch(setSession(mockSession))
      store.dispatch(setError('Some error'))
      store.dispatch(setLoading(true))
      
      // Reset everything
      store.dispatch(reset())
      
      const state = store.getState().auth
      expect(state.user).toBe(null)
      expect(state.session).toBe(null)
      expect(state.error).toBe(null)
      expect(state.loading).toBe(false)
    })
  })

  describe('Selectors', () => {
    it('should select current user', () => {
      store.dispatch(loginSuccess({ user: mockUser, session: mockSession }))
      
      const state = store.getState()
      const currentUser = selectCurrentUser(state)
      
      expect(currentUser).toEqual(mockUser)
    })

    it('should select authentication status', () => {
      let state = store.getState()
      expect(selectIsAuthenticated(state)).toBe(false)
      
      store.dispatch(loginSuccess({ user: mockUser, session: mockSession }))
      state = store.getState()
      expect(selectIsAuthenticated(state)).toBe(true)
    })

    it('should select admin status for regular user', () => {
      store.dispatch(loginSuccess({ user: mockUser, session: mockSession }))
      
      const state = store.getState()
      const isAdmin = selectIsAdmin(state)
      
      expect(isAdmin).toBe(false)
    })

    it('should select admin status for admin user', () => {
      store.dispatch(loginSuccess({ user: mockAdminUser, session: mockSession }))
      
      const state = store.getState()
      const isAdmin = selectIsAdmin(state)
      
      expect(isAdmin).toBe(true)
    })

    it('should select loading state', () => {
      let state = store.getState()
      expect(selectAuthLoading(state)).toBe(false)
      
      store.dispatch(loginStart())
      state = store.getState()
      expect(selectAuthLoading(state)).toBe(true)
    })

    it('should select error state', () => {
      let state = store.getState()
      expect(selectAuthError(state)).toBe(null)
      
      store.dispatch(loginFailure('Login failed'))
      state = store.getState()
      expect(selectAuthError(state)).toBe('Login failed')
    })

    it('should select session conflict resolution state', () => {
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
      let state = store.getState()
      expect(selectIsSessionConflictInProgress(state)).toBe(false)
      
      store.dispatch(sessionConflictStart({ method: 'ALL' }))
      state = store.getState()
      expect(selectIsSessionConflictInProgress(state)).toBe(true)
    })

    it('should select session conflict method', () => {
      let state = store.getState()
      expect(selectSessionConflictMethod(state)).toBe(null)
      
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))
      state = store.getState()
      expect(selectSessionConflictMethod(state)).toBe('CURRENT')
    })

    it('should select session conflict resolved state', () => {
      let state = store.getState()
      expect(selectIsSessionConflictResolved(state)).toBe(false)
      
      store.dispatch(sessionConflictResolved({ method: 'CURRENT' }))
      state = store.getState()
      expect(selectIsSessionConflictResolved(state)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle updateProfile when user is null', () => {
      const updatedProfile = { experienceLevel: 'Senior' }
      
      store.dispatch(updateProfile(updatedProfile))
      
      const state = store.getState().auth
      expect(state.user).toBe(null)
    })

    it('should handle updateProfile when user has no profile', () => {
      const userWithoutProfile = {
        $id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com'
      }
      
      store.dispatch(loginSuccess({ user: userWithoutProfile, session: mockSession }))
      
      const updatedProfile = { experienceLevel: 'Senior' }
      store.dispatch(updateProfile(updatedProfile))
      
      const state = store.getState().auth
      expect(state.user.profile).toEqual(updatedProfile)
    })

    it('should handle selectIsAdmin when user is null', () => {
      const state = store.getState()
      const isAdmin = selectIsAdmin(state)
      
      expect(isAdmin).toBe(false)
    })

    it('should handle selectIsAdmin when user has no profile', () => {
      const userWithoutProfile = {
        $id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com'
      }
      
      store.dispatch(loginSuccess({ user: userWithoutProfile, session: mockSession }))
      
      const state = store.getState()
      const isAdmin = selectIsAdmin(state)
      
      expect(isAdmin).toBe(false)
    })

    it('should handle multiple login attempts', () => {
      // First login
      store.dispatch(loginStart())
      store.dispatch(loginSuccess({ user: mockUser, session: mockSession }))
      
      // Second login (should replace first)
      const newUser = { ...mockUser, name: 'Jane Doe' }
      const newSession = { ...mockSession, $id: 'session-456' }
      
      store.dispatch(loginStart())
      store.dispatch(loginSuccess({ user: newUser, session: newSession }))
      
      const state = store.getState().auth
      expect(state.user.name).toBe('Jane Doe')
      expect(state.session.$id).toBe('session-456')
    })

    it('should handle login failure after successful login', () => {
      // First successful login
      store.dispatch(loginSuccess({ user: mockUser, session: mockSession }))
      
      // Then login failure (should clear user and session)
      store.dispatch(loginFailure('Session expired'))
      
      const state = store.getState().auth
      expect(state.user).toBe(null)
      expect(state.session).toBe(null)
      expect(state.error).toBe('Session expired')
    })
  })

  describe('State Persistence', () => {
    it('should maintain state consistency across actions', () => {
      // Login
      store.dispatch(loginStart())
      expect(store.getState().auth.loading).toBe(true)
      
      store.dispatch(loginSuccess({ user: mockUser, session: mockSession }))
      expect(store.getState().auth.loading).toBe(false)
      expect(store.getState().auth.user).toEqual(mockUser)
      
      // Update profile
      store.dispatch(updateProfile({ experienceLevel: 'Senior' }))
      expect(store.getState().auth.user.profile.experienceLevel).toBe('Senior')
      expect(store.getState().auth.session).toEqual(mockSession) // Should not affect session
      
      // Logout
      store.dispatch(logout())
      expect(store.getState().auth.user).toBe(null)
      expect(store.getState().auth.session).toBe(null)
    })
  })
})