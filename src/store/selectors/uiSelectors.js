import { createSelector } from 'reselect'

// Base selectors
const selectUiState = (state) => state.ui

// Memoized selectors
export const selectSidebarOpen = createSelector(
  [selectUiState],
  (ui) => ui.sidebarOpen
)

export const selectCurrentModal = createSelector(
  [selectUiState],
  (ui) => ui.currentModal
)

export const selectNotifications = createSelector(
  [selectUiState],
  (ui) => ui.notifications || []
)

export const selectTheme = createSelector(
  [selectUiState],
  (ui) => ui.theme || 'light'
)

export const selectIsDarkMode = createSelector(
  [selectTheme],
  (theme) => theme === 'dark'
)

export const selectIsLightMode = createSelector(
  [selectTheme],
  (theme) => theme === 'light'
)

export const selectUnreadNotifications = createSelector(
  [selectNotifications],
  (notifications) => notifications.filter(n => !n.read)
)

export const selectNotificationCount = createSelector(
  [selectNotifications],
  (notifications) => notifications.length
)

export const selectUnreadNotificationCount = createSelector(
  [selectUnreadNotifications],
  (unreadNotifications) => unreadNotifications.length
)

export const selectHasModal = createSelector(
  [selectCurrentModal],
  (currentModal) => !!currentModal
)

export const selectNotificationsByType = createSelector(
  [selectNotifications],
  (notifications) => {
    return notifications.reduce((acc, notification) => {
      const type = notification.type || 'info'
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(notification)
      return acc
    }, {})
  }
)

export const selectRecentNotifications = createSelector(
  [selectNotifications],
  (notifications) => {
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)
    
    return notifications
      .filter(n => new Date(n.timestamp) >= oneHourAgo)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }
)

export const selectUiStatus = createSelector(
  [selectSidebarOpen, selectHasModal, selectTheme],
  (sidebarOpen, hasModal, theme) => ({
    sidebarOpen,
    hasModal,
    theme,
    isDarkMode: theme === 'dark',
    isLightMode: theme === 'light'
  })
)