import { createSelector } from 'reselect'

// Base selectors
const selectAdminState = (state) => state.admin

// Memoized selectors
export const selectUsers = createSelector(
  [selectAdminState],
  (admin) => admin.users || []
)

export const selectAnalytics = createSelector(
  [selectAdminState],
  (admin) => admin.analytics
)

export const selectAdminLoading = createSelector(
  [selectAdminState],
  (admin) => admin.loading
)

export const selectAdminError = createSelector(
  [selectAdminState],
  (admin) => admin.error
)

export const selectUserCount = createSelector(
  [selectUsers],
  (users) => users.length
)

export const selectAdminUsers = createSelector(
  [selectUsers],
  (users) => users.filter(user => user.isAdmin)
)

export const selectRegularUsers = createSelector(
  [selectUsers],
  (users) => users.filter(user => !user.isAdmin)
)

export const selectUsersByExperienceLevel = createSelector(
  [selectUsers],
  (users) => {
    return users.reduce((acc, user) => {
      const level = user.experienceLevel || 'Unknown'
      if (!acc[level]) {
        acc[level] = []
      }
      acc[level].push(user)
      return acc
    }, {})
  }
)

export const selectUserGrowthData = createSelector(
  [selectUsers],
  (users) => {
    // Group users by month for growth chart
    const monthlyData = users.reduce((acc, user) => {
      const date = new Date(user.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!acc[monthKey]) {
        acc[monthKey] = 0
      }
      acc[monthKey]++
      return acc
    }, {})

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month,
        users: count
      }))
  }
)

export const selectRecentUsers = createSelector(
  [selectUsers],
  (users) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    return users
      .filter(user => new Date(user.createdAt) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
)

export const selectAdminStats = createSelector(
  [selectUsers, selectAnalytics],
  (users, analytics) => ({
    totalUsers: users.length,
    adminUsers: users.filter(u => u.isAdmin).length,
    regularUsers: users.filter(u => !u.isAdmin).length,
    recentUsers: users.filter(u => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(u.createdAt) >= weekAgo
    }).length,
    ...analytics
  })
)

export const selectAdminStatus = createSelector(
  [selectAdminLoading, selectAdminError, selectUserCount],
  (loading, error, userCount) => ({
    loading,
    error,
    hasError: !!error,
    hasUsers: userCount > 0,
    isEmpty: userCount === 0
  })
)