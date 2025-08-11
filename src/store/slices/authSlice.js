import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  session: null,
  loading: false,
  error: null,
  sessionConflictResolution: {
    inProgress: false,
    method: null, // 'CURRENT' | 'ALL' | null
    resolved: false
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.user = action.payload.user
      state.session = action.payload.session
      state.error = null
    },
    loginFailure: (state, action) => {
      state.loading = false
      state.user = null
      state.session = null
      state.error = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setUser: (state, action) => {
      state.user = action.payload
    },
    setSession: (state, action) => {
      state.session = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    updateProfile: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          profile: {
            ...state.user.profile,
            ...action.payload
          }
        }
      }
    },
    logout: (state) => {
      state.user = null
      state.session = null
      state.error = null
      state.sessionConflictResolution = {
        inProgress: false,
        method: null,
        resolved: false
      }
    },
    sessionConflictStart: (state, action) => {
      state.sessionConflictResolution = {
        inProgress: true,
        method: action.payload.method, // 'CURRENT' | 'ALL'
        resolved: false
      }
    },
    sessionConflictResolved: (state, action) => {
      state.sessionConflictResolution = {
        inProgress: false,
        method: action.payload.method,
        resolved: true
      }
    },
    sessionConflictFailed: (state) => {
      state.sessionConflictResolution = {
        inProgress: false,
        method: null,
        resolved: false
      }
    },
    clearSessionConflictResolution: (state) => {
      state.sessionConflictResolution = {
        inProgress: false,
        method: null,
        resolved: false
      }
    },
    reset: () => initialState
  }
})

export const {
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
  reset
} = authSlice.actions

// Selectors
export const selectCurrentUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => !!state.auth.user && !!state.auth.session
export const selectIsAdmin = (state) => state.auth.user?.isAdmin || false
export const selectAuthLoading = (state) => state.auth.loading
export const selectAuthError = (state) => state.auth.error
export const selectSessionConflictResolution = (state) => state.auth.sessionConflictResolution
export const selectIsSessionConflictInProgress = (state) => state.auth.sessionConflictResolution.inProgress
export const selectSessionConflictMethod = (state) => state.auth.sessionConflictResolution.method
export const selectIsSessionConflictResolved = (state) => state.auth.sessionConflictResolution.resolved

export default authSlice.reducer