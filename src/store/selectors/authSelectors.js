import { createSelector } from 'reselect'

// Base selectors
const selectAuthState = (state) => state.auth

// Memoized selectors
export const selectUser = createSelector(
  [selectAuthState],
  (auth) => auth.user
)

export const selectSession = createSelector(
  [selectAuthState],
  (auth) => auth.session
)

export const selectAuthLoading = createSelector(
  [selectAuthState],
  (auth) => auth.loading
)

export const selectAuthError = createSelector(
  [selectAuthState],
  (auth) => auth.error
)

export const selectIsAuthenticated = createSelector(
  [selectUser, selectSession],
  (user, session) => !!(user && session)
)

export const selectIsAdmin = createSelector(
  [selectUser],
  (user) => user?.isAdmin || false
)

export const selectUserProfile = createSelector(
  [selectUser],
  (user) => user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    experienceLevel: user.experienceLevel,
    targetRole: user.targetRole,
    targetIndustry: user.targetIndustry
  } : null
)

export const selectAuthStatus = createSelector(
  [selectIsAuthenticated, selectAuthLoading, selectAuthError],
  (isAuthenticated, loading, error) => ({
    isAuthenticated,
    loading,
    error,
    hasError: !!error
  })
)