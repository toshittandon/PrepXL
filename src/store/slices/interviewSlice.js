import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentSession: null,
  currentQuestion: null,
  interactions: [],
  isRecording: false,
  loading: false,
  error: null
}

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setCurrentSession: (state, action) => {
      state.currentSession = action.payload
    },
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload
    },
    addInteraction: (state, action) => {
      state.interactions.push(action.payload)
    },
    setInteractions: (state, action) => {
      state.interactions = action.payload
    },
    setIsRecording: (state, action) => {
      state.isRecording = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    endSession: (state) => {
      state.currentSession = null
      state.currentQuestion = null
      state.interactions = []
      state.isRecording = false
    },
    reset: () => initialState
  }
})

export const {
  setLoading,
  setCurrentSession,
  setCurrentQuestion,
  addInteraction,
  setInteractions,
  setIsRecording,
  setError,
  clearError,
  endSession,
  reset
} = interviewSlice.actions

export default interviewSlice.reducer