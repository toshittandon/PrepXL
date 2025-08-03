import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  resumes: [],
  currentAnalysis: null,
  uploading: false,
  analyzing: false,
  error: null
}

const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    setUploading: (state, action) => {
      state.uploading = action.payload
    },
    setAnalyzing: (state, action) => {
      state.analyzing = action.payload
    },
    addResume: (state, action) => {
      state.resumes.push(action.payload)
    },
    setResumes: (state, action) => {
      state.resumes = action.payload
    },
    setCurrentAnalysis: (state, action) => {
      state.currentAnalysis = action.payload
    },
    updateResume: (state, action) => {
      const index = state.resumes.findIndex(resume => resume.id === action.payload.id)
      if (index !== -1) {
        state.resumes[index] = action.payload
      }
    },
    removeResume: (state, action) => {
      state.resumes = state.resumes.filter(resume => resume.id !== action.payload)
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
  setUploading,
  setAnalyzing,
  addResume,
  setResumes,
  setCurrentAnalysis,
  updateResume,
  removeResume,
  setError,
  clearError,
  reset
} = resumeSlice.actions

export default resumeSlice.reducer