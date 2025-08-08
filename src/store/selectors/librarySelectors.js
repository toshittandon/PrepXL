import { createSelector } from 'reselect'

// Base selectors
const selectLibraryState = (state) => state.library

// Memoized selectors
export const selectQuestions = createSelector(
  [selectLibraryState],
  (library) => library.questions || []
)

export const selectFilteredQuestions = createSelector(
  [selectLibraryState],
  (library) => library.filteredQuestions || []
)

export const selectSearchTerm = createSelector(
  [selectLibraryState],
  (library) => library.searchTerm || ''
)

export const selectSelectedCategory = createSelector(
  [selectLibraryState],
  (library) => library.selectedCategory || ''
)

export const selectSelectedRole = createSelector(
  [selectLibraryState],
  (library) => library.selectedRole || ''
)

export const selectLibraryLoading = createSelector(
  [selectLibraryState],
  (library) => library.loading
)

export const selectLibraryError = createSelector(
  [selectLibraryState],
  (library) => library.error
)

export const selectQuestionCount = createSelector(
  [selectQuestions],
  (questions) => questions.length
)

export const selectFilteredQuestionCount = createSelector(
  [selectFilteredQuestions],
  (filteredQuestions) => filteredQuestions.length
)

export const selectUniqueCategories = createSelector(
  [selectQuestions],
  (questions) => {
    const categories = new Set(questions.map(q => q.category))
    return Array.from(categories).sort()
  }
)

export const selectUniqueRoles = createSelector(
  [selectQuestions],
  (questions) => {
    const roles = new Set(questions.map(q => q.role))
    return Array.from(roles).sort()
  }
)

export const selectQuestionsByCategory = createSelector(
  [selectQuestions],
  (questions) => {
    return questions.reduce((acc, question) => {
      const category = question.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(question)
      return acc
    }, {})
  }
)

export const selectHasActiveFilters = createSelector(
  [selectSearchTerm, selectSelectedCategory, selectSelectedRole],
  (searchTerm, category, role) => 
    searchTerm.length > 0 || category.length > 0 || role.length > 0
)

export const selectLibraryStatus = createSelector(
  [selectLibraryLoading, selectLibraryError, selectQuestionCount],
  (loading, error, questionCount) => ({
    loading,
    error,
    hasError: !!error,
    isEmpty: questionCount === 0,
    hasQuestions: questionCount > 0
  })
)