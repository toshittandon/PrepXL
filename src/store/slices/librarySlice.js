import { createSlice, createSelector } from '@reduxjs/toolkit'
import { appwriteApi } from '../api/appwriteApi.js'

const initialState = {
  questions: [],
  filteredQuestions: [],
  searchTerm: '',
  selectedCategory: '',
  selectedRole: '',
  loading: false,
  error: null,
  categories: [],
  roles: []
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
      // Extract unique categories and roles
      librarySlice.caseReducers.extractCategoriesAndRoles(state)
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
    extractCategoriesAndRoles: (state) => {
      // Extract unique categories
      const categories = [...new Set(state.questions.map(q => q.category).filter(Boolean))]
      state.categories = categories.sort()
      
      // Extract unique roles
      const roles = [...new Set(state.questions.map(q => q.role).filter(Boolean))]
      state.roles = roles.sort()
    },
    applyFilters: (state) => {
      let filtered = [...state.questions]
      
      // Filter by search term (search in question text, category, and role)
      if (state.searchTerm) {
        const searchLower = state.searchTerm.toLowerCase()
        filtered = filtered.filter(question =>
          question.questionText?.toLowerCase().includes(searchLower) ||
          question.category?.toLowerCase().includes(searchLower) ||
          question.role?.toLowerCase().includes(searchLower) ||
          question.suggestedAnswer?.toLowerCase().includes(searchLower)
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
      librarySlice.caseReducers.extractCategoriesAndRoles(state)
      librarySlice.caseReducers.applyFilters(state)
    },
    updateQuestion: (state, action) => {
      const index = state.questions.findIndex(question => question.id === action.payload.id)
      if (index !== -1) {
        state.questions[index] = action.payload
        librarySlice.caseReducers.extractCategoriesAndRoles(state)
        librarySlice.caseReducers.applyFilters(state)
      }
    },
    removeQuestion: (state, action) => {
      state.questions = state.questions.filter(question => question.id !== action.payload)
      librarySlice.caseReducers.extractCategoriesAndRoles(state)
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
  },
  extraReducers: (builder) => {
    // Handle RTK Query states for getQuestions
    builder
      .addMatcher(
        appwriteApi.endpoints.getQuestions.matchPending,
        (state) => {
          state.loading = true
          state.error = null
        }
      )
      .addMatcher(
        appwriteApi.endpoints.getQuestions.matchFulfilled,
        (state, action) => {
          state.loading = false
          state.questions = action.payload || []
          librarySlice.caseReducers.extractCategoriesAndRoles(state)
          librarySlice.caseReducers.applyFilters(state)
        }
      )
      .addMatcher(
        appwriteApi.endpoints.getQuestions.matchRejected,
        (state, action) => {
          state.loading = false
          state.error = action.error?.message || 'Failed to fetch questions'
        }
      )
      // Handle question creation
      .addMatcher(
        appwriteApi.endpoints.createQuestion.matchFulfilled,
        (state, action) => {
          if (action.payload) {
            librarySlice.caseReducers.addQuestion(state, action)
          }
        }
      )
      // Handle question updates
      .addMatcher(
        appwriteApi.endpoints.updateQuestion.matchFulfilled,
        (state, action) => {
          if (action.payload) {
            librarySlice.caseReducers.updateQuestion(state, action)
          }
        }
      )
      // Handle question deletion
      .addMatcher(
        appwriteApi.endpoints.deleteQuestion.matchFulfilled,
        (state, action) => {
          // The action.meta.arg.originalArgs contains the questionId
          const questionId = action.meta?.arg?.originalArgs
          if (questionId) {
            librarySlice.caseReducers.removeQuestion(state, { payload: questionId })
          }
        }
      )
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

// Selectors
export const selectLibraryState = (state) => state.library

export const selectQuestions = createSelector(
  [selectLibraryState],
  (library) => library.questions
)

export const selectFilteredQuestions = createSelector(
  [selectLibraryState],
  (library) => library.filteredQuestions
)

export const selectSearchTerm = createSelector(
  [selectLibraryState],
  (library) => library.searchTerm
)

export const selectSelectedCategory = createSelector(
  [selectLibraryState],
  (library) => library.selectedCategory
)

export const selectSelectedRole = createSelector(
  [selectLibraryState],
  (library) => library.selectedRole
)

export const selectCategories = createSelector(
  [selectLibraryState],
  (library) => library.categories
)

export const selectRoles = createSelector(
  [selectLibraryState],
  (library) => library.roles
)

export const selectLibraryLoading = createSelector(
  [selectLibraryState],
  (library) => library.loading
)

export const selectLibraryError = createSelector(
  [selectLibraryState],
  (library) => library.error
)

// Advanced selectors
export const selectQuestionsByCategory = createSelector(
  [selectQuestions, (state, category) => category],
  (questions, category) => questions.filter(q => q.category === category)
)

export const selectQuestionsByRole = createSelector(
  [selectQuestions, (state, role) => role],
  (questions, role) => questions.filter(q => q.role === role)
)

export const selectFilteredQuestionsCount = createSelector(
  [selectFilteredQuestions],
  (filteredQuestions) => filteredQuestions.length
)

export const selectTotalQuestionsCount = createSelector(
  [selectQuestions],
  (questions) => questions.length
)

export const selectHasActiveFilters = createSelector(
  [selectSearchTerm, selectSelectedCategory, selectSelectedRole],
  (searchTerm, category, role) => Boolean(searchTerm || category || role)
)

export const selectQuestionById = createSelector(
  [selectQuestions, (state, questionId) => questionId],
  (questions, questionId) => questions.find(q => q.id === questionId)
)

export default librarySlice.reducer