import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  users: [],
  analytics: {
    totalUsers: 0,
    totalSessions: 0,
    totalQuestions: 0,
    userGrowth: [],
    sessionCompletionRates: [],
    popularQuestions: []
  },
  loading: false,
  error: null
}

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setUsers: (state, action) => {
      state.users = action.payload
    },
    addUser: (state, action) => {
      state.users.push(action.payload)
    },
    updateUser: (state, action) => {
      const index = state.users.findIndex(user => user.id === action.payload.id)
      if (index !== -1) {
        state.users[index] = action.payload
      }
    },
    removeUser: (state, action) => {
      state.users = state.users.filter(user => user.id !== action.payload)
    },
    setAnalytics: (state, action) => {
      state.analytics = { ...state.analytics, ...action.payload }
    },
    updateAnalytics: (state, action) => {
      const { key, value } = action.payload
      state.analytics[key] = value
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    reset: () => initialState
  }
})

export const {
  setLoading,
  setUsers,
  addUser,
  updateUser,
  removeUser,
  setAnalytics,
  updateAnalytics,
  setError,
  clearError,
  reset
} = adminSlice.actions

export default adminSlice.reducer