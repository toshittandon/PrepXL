
import { memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, RefreshCw } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  selectFilteredQuestions, 
  selectLibraryLoading, 
  selectLibraryError,
  selectFilteredQuestionCount,
  selectQuestionCount,
  selectHasActiveFilters
} from '../../store/selectors'
import { clearError, clearFilters } from '../../store/slices/librarySlice.js'
import { useGetQuestionsQuery } from '../../store/api/appwriteApi.js'
import { SearchFilters, QuestionAccordion } from '../../components/library'
import { LoadingSpinner, LazyComponent } from '../../components/common'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import Button from '../../components/common/Button.jsx'
import { pageVariants, listVariants } from '../../utils/animations'

const QuestionLibrary = memo(() => {
  const dispatch = useDispatch()
  
  // Fetch questions on component mount
  const { isLoading: isQueryLoading, error: queryError, refetch } = useGetQuestionsQuery()
  
  // Get filtered questions and state from Redux
  const filteredQuestions = useSelector(selectFilteredQuestions)
  const isLoading = useSelector(selectLibraryLoading) || isQueryLoading
  const error = useSelector(selectLibraryError) || queryError
  const filteredCount = useSelector(selectFilteredQuestionCount)
  const totalCount = useSelector(selectQuestionCount)
  const hasActiveFilters = useSelector(selectHasActiveFilters)

  // Handle error retry
  const handleRetry = useCallback(() => {
    dispatch(clearError())
    refetch()
  }, [dispatch, refetch])

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters())
  }, [dispatch])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          className="text-center mb-6 sm:mb-8"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">
            Q&A Library
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2 px-4">
            Browse and search through our comprehensive collection of interview questions
          </p>
          
          {/* Question Count */}
          {!isLoading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs sm:text-sm text-gray-500 dark:text-gray-400"
            >
              {filteredCount === totalCount ? (
                <span>Showing all {totalCount} questions</span>
              ) : (
                <span>
                  Showing {filteredCount} of {totalCount} questions
                  {hasActiveFilters && (
                    <span className="ml-1 text-primary-600 dark:text-primary-400">
                      (filtered)
                    </span>
                  )}
                </span>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <SearchFilters />
        </motion.div>

        {/* Content Area */}
        <div className="mt-6 sm:mt-8">
          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col sm:flex-row justify-center items-center py-12 sm:py-16"
            >
              <LoadingSpinner size="lg" color="primary" />
              <span className="mt-3 sm:mt-0 sm:ml-3 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Loading questions...
              </span>
            </motion.div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-8"
            >
              <div className="max-w-md mx-auto text-center">
                <ErrorMessage 
                  message={error?.message || error || 'Failed to load questions'} 
                  className="mb-4"
                />
                <Button
                  onClick={handleRetry}
                  variant="primary"
                  size="sm"
                  className="inline-flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}

          {/* Questions List */}
          {!isLoading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {filteredQuestions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-12 sm:py-16"
                >
                  <div className="max-w-md mx-auto">
                    <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {hasActiveFilters ? 'No Questions Match Your Filters' : 'No Questions Available'}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 px-4">
                      {hasActiveFilters 
                        ? 'Try adjusting your search terms or filter criteria to find questions.'
                        : 'Questions will appear here once they are added to the library.'
                      }
                    </p>
                    {hasActiveFilters && (
                      <Button
                        onClick={handleClearFilters}
                        variant="secondary"
                        size="sm"
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <LazyComponent>
                  <QuestionAccordion 
                    questions={filteredQuestions} 
                    className="space-y-3 sm:space-y-4"
                  />
                </LazyComponent>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
})

QuestionLibrary.displayName = 'QuestionLibrary'

export default QuestionLibrary