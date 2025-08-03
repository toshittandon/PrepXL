import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sidebarOpen: false,
  currentModal: null,
  notifications: [],
  theme: 'light'
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setCurrentModal: (state, action) => {
      state.currentModal = action.payload
    },
    closeModal: (state) => {
      state.currentModal = null
    },
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...action.payload
      }
      state.notifications.push(notification)
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      )
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    setTheme: (state, action) => {
      state.theme = action.payload
      // Persist theme to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload)
        // Apply theme class to document
        if (action.payload === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    },
    toggleTheme: (state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light'
      state.theme = newTheme
      // Persist theme to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme)
        // Apply theme class to document
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    },
    initializeTheme: (state) => {
      // Initialize theme from localStorage or system preference
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme')
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light')
        state.theme = theme
        
        // Apply theme class to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    },
    reset: () => initialState
  }
})

export const {
  setSidebarOpen,
  toggleSidebar,
  setCurrentModal,
  closeModal,
  addNotification,
  removeNotification,
  clearNotifications,
  setTheme,
  toggleTheme,
  initializeTheme,
  reset
} = uiSlice.actions

export default uiSlice.reducer