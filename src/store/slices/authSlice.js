import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  session: null,
  loading: false,
  error: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
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
    logout: (state) => {
      state.user = null
      state.session = null
      state.error = null
    },
    reset: () => initialState
  }
})

export const {
  setLoading,
  setUser,
  setSession,
  setError,
  clearError,
  logout,
  reset
} = authSlice.actions

export default authSlice.reducer