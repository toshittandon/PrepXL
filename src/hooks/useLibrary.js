/**
 * Custom hook for managing Q&A library data and operations
 */

import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  useGetQuestionsQuery,
  useGetQuestionsByCategoryQuery,
  useGetQuestionsByRoleQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation
} from '../store/api/appwriteApi.js'
import {
  setSearchTerm,
  setSelectedCategory,
  setSelectedRole,
  clearFilters,
  setError,
  clearError,
  selectFilteredQuestions,
  selectSearchTerm,
  selectSelectedCategory,
  selectSelectedRole,
  selectCategories,
  selectRoles,
  selectLibraryLoading,
  selectLibraryError,
  selectFilteredQuestionsCount,
  selectTotalQuestionsCount,
  selectHasActiveFilters,
  selectQuestionById
} from '../store/slices/librarySlice.js'

/**
 * Main hook for Q&A library management
 * @param {Object} options - Configuration options
 * @param {Object} options.filters - Initial filters to apply
 * @param {boolean} options.autoFetch - Whether to automatically fetch questions
 * @returns {Object} Library state and operations
 */
export const useLibrary = (options = {}) => {
  const dispatch = useDispatch()
  const { filters = {}, autoFetch = true } = options

  // RTK Query hooks
  const {
    data: questions = [],
    isLoading: isQuestionsLoading,
    error: questionsError,
    refetch: refetchQuestions
  } = useGetQuestionsQuery(filters, {
    skip: !autoFetch
  })

  const [createQuestion, {
    isLoading: isCreating,
    error: createError
  }] = useCreateQuestionMutation()

  const [updateQuestion, {
    isLoading: isUpdating,
    error: updateError
  }] = useUpdateQuestionMutation()

  const [deleteQuestion, {
    isLoading: isDeleting,
    error: deleteError
  }] = useDeleteQuestionMutation()

  // Redux selectors
  const filteredQuestions = useSelector(selectFilteredQuestions)
  const searchTerm = useSelector(selectSearchTerm)
  const selectedCategory = useSelector(selectSelectedCategory)
  const selectedRole = useSelector(selectSelectedRole)
  const categories = useSelector(selectCategories)
  const roles = useSelector(selectRoles)
  const libraryLoading = useSelector(selectLibraryLoading)
  const libraryError = useSelector(selectLibraryError)
  const filteredCount = useSelector(selectFilteredQuestionsCount)
  const totalCount = useSelector(selectTotalQuestionsCount)
  const hasActiveFilters = useSelector(selectHasActiveFilters)

  // Memoized loading state
  const isLoading = useMemo(() => 
    isQuestionsLoading || libraryLoading || isCreating || isUpdating || isDeleting,
    [isQuestionsLoading, libraryLoading, isCreating, isUpdating, isDeleting]
  )

  // Memoized error state
  const error = useMemo(() => 
    questionsError?.message || 
    libraryError || 
    createError?.message || 
    updateError?.message || 
    deleteError?.message || 
    null,
    [questionsError, libraryError, createError, updateError, deleteError]
  )

  // Action dispatchers
  const handleSearchChange = useCallback((term) => {
    dispatch(setSearchTerm(term))
  }, [dispatch])

  const handleCategoryChange = useCallback((category) => {
    dispatch(setSelectedCategory(category))
  }, [dispatch])

  const handleRoleChange = useCallback((role) => {
    dispatch(setSelectedRole(role))
  }, [dispatch])

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters())
  }, [dispatch])

  const handleClearError = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  // Question operations
  const handleCreateQuestion = useCallback(async (questionData) => {
    try {
      dispatch(clearError())
      const result = await createQuestion(questionData).unwrap()
      return result
    } catch (error) {
      dispatch(setError(error.message || 'Failed to create question'))
      throw error
    }
  }, [createQuestion, dispatch])

  const handleUpdateQuestion = useCallback(async (questionId, questionData) => {
    try {
      dispatch(clearError())
      const result = await updateQuestion({ questionId, ...questionData }).unwrap()
      return result
    } catch (error) {
      dispatch(setError(error.message || 'Failed to update question'))
      throw error
    }
  }, [updateQuestion, dispatch])

  const handleDeleteQuestion = useCallback(async (questionId) => {
    try {
      dispatch(clearError())
      await deleteQuestion(questionId).unwrap()
      return true
    } catch (error) {
      dispatch(setError(error.message || 'Failed to delete question'))
      throw error
    }
  }, [deleteQuestion, dispatch])

  const handleRefresh = useCallback(() => {
    refetchQuestions()
  }, [refetchQuestions])

  return {
    // Data
    questions: filteredQuestions,
    allQuestions: questions,
    categories,
    roles,
    
    // Filters
    searchTerm,
    selectedCategory,
    selectedRole,
    hasActiveFilters,
    
    // Counts
    filteredCount,
    totalCount,
    
    // State
    isLoading,
    error,
    
    // Filter actions
    setSearchTerm: handleSearchChange,
    setSelectedCategory: handleCategoryChange,
    setSelectedRole: handleRoleChange,
    clearFilters: handleClearFilters,
    
    // Question operations
    createQuestion: handleCreateQuestion,
    updateQuestion: handleUpdateQuestion,
    deleteQuestion: handleDeleteQuestion,
    
    // Utility actions
    refresh: handleRefresh,
    clearError: handleClearError
  }
}

/**
 * Hook for getting questions by category
 * @param {string} category - Category to filter by
 * @param {Object} options - Query options
 * @returns {Object} Category-specific questions and state
 */
export const useQuestionsByCategory = (category, options = {}) => {
  const { limit = 50, ...queryOptions } = options
  
  const {
    data: questions = [],
    isLoading,
    error,
    refetch
  } = useGetQuestionsByCategoryQuery(
    { category, limit },
    {
      skip: !category,
      ...queryOptions
    }
  )

  return {
    questions,
    isLoading,
    error: error?.message || null,
    refetch
  }
}

/**
 * Hook for getting questions by role
 * @param {string} role - Role to filter by
 * @param {Object} options - Query options
 * @returns {Object} Role-specific questions and state
 */
export const useQuestionsByRole = (role, options = {}) => {
  const { limit = 50, ...queryOptions } = options
  
  const {
    data: questions = [],
    isLoading,
    error,
    refetch
  } = useGetQuestionsByRoleQuery(
    { role, limit },
    {
      skip: !role,
      ...queryOptions
    }
  )

  return {
    questions,
    isLoading,
    error: error?.message || null,
    refetch
  }
}

/**
 * Hook for getting a single question by ID
 * @param {string} questionId - Question ID
 * @returns {Object} Question data and state
 */
export const useQuestionById = (questionId) => {
  const question = useSelector(state => selectQuestionById(state, questionId))
  
  return {
    question,
    isLoading: !question && questionId,
    error: null
  }
}

/**
 * Hook for search functionality with debouncing
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Object} Search state and handlers
 */
export const useLibrarySearch = (delay = 300) => {
  const dispatch = useDispatch()
  const searchTerm = useSelector(selectSearchTerm)
  const filteredQuestions = useSelector(selectFilteredQuestions)
  const filteredCount = useSelector(selectFilteredQuestionsCount)

  const handleSearch = useCallback((term) => {
    dispatch(setSearchTerm(term))
  }, [dispatch])

  const clearSearch = useCallback(() => {
    dispatch(setSearchTerm(''))
  }, [dispatch])

  return {
    searchTerm,
    results: filteredQuestions,
    resultCount: filteredCount,
    search: handleSearch,
    clearSearch
  }
}

/**
 * Hook for filter management
 * @returns {Object} Filter state and handlers
 */
export const useLibraryFilters = () => {
  const dispatch = useDispatch()
  
  const selectedCategory = useSelector(selectSelectedCategory)
  const selectedRole = useSelector(selectSelectedRole)
  const categories = useSelector(selectCategories)
  const roles = useSelector(selectRoles)
  const hasActiveFilters = useSelector(selectHasActiveFilters)

  const setCategory = useCallback((category) => {
    dispatch(setSelectedCategory(category))
  }, [dispatch])

  const setRole = useCallback((role) => {
    dispatch(setSelectedRole(role))
  }, [dispatch])

  const clearAllFilters = useCallback(() => {
    dispatch(clearFilters())
  }, [dispatch])

  return {
    selectedCategory,
    selectedRole,
    categories,
    roles,
    hasActiveFilters,
    setCategory,
    setRole,
    clearFilters: clearAllFilters
  }
}

export default useLibrary