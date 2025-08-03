import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  questions: [],
  filteredQuestions: [],
  searchTerm: '',
  selectedCategory: '',
  selectedRole: '',
  loading: false,
  error: null
}

const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setQuestions: (state, action) => {
      state.questions = action.payload
      // Apply current filters when questions are set
      librarySlice.caseReducers.applyFilters(state)
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload
      librarySlice.caseReducers.applyFilters(state)
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload
      librarySlice.caseReducers.applyFilters(state)
    },
    setSelectedRole: (state, action) => {
      state.selectedRole = action.payload
      librarySlice.caseReducers.applyFilters(state)
    },
    applyFilters: (state) => {
      let filtered = [...state.questions]
      
      // Filter by search term
      if (state.searchTerm) {
        filtered = filtered.filter(question =>
          question.questionText.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
          question.category.toLowerCase().includes(state.searchTerm.toLowerCase())
        )
      }
      
      // Filter by category
      if (state.selectedCategory) {
        filtered = filtered.filter(question => question.category === state.selectedCategory)
      }
      
      // Filter by role
      if (state.selectedRole) {
        filtered = filtered.filter(question => question.role === state.selectedRole)
      }
      
      state.filteredQuestions = filtered
    },
    addQuestion: (state, action) => {
      state.questions.push(action.payload)
      librarySlice.caseReducers.applyFilters(state)
    },
    updateQuestion: (state, action) => {
      const index = state.questions.findIndex(question => question.id === action.payload.id)
      if (index !== -1) {
        state.questions[index] = action.payload
        librarySlice.caseReducers.applyFilters(state)
      }
    },
    removeQuestion: (state, action) => {
      state.questions = state.questions.filter(question => question.id !== action.payload)
      librarySlice.caseReducers.applyFilters(state)
    },
    clearFilters: (state) => {
      state.searchTerm = ''
      state.selectedCategory = ''
      state.selectedRole = ''
      state.filteredQuestions = [...state.questions]
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
  setQuestions,
  setSearchTerm,
  setSelectedCategory,
  setSelectedRole,
  applyFilters,
  addQuestion,
  updateQuestion,
  removeQuestion,
  clearFilters,
  setError,
  clearError,
  reset
} = librarySlice.actions

export default librarySlice.reducer