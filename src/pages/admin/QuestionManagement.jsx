import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  MoreVertical,
  CheckSquare,
  Square,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  useGetQuestionsQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation
} from '../../store/api/appwriteApi.js'
import { 
  selectFilteredQuestions, 
  selectCategories, 
  selectRoles,
  selectLibraryLoading,
  selectLibraryError,
  setSearchTerm,
  setSelectedCategory,
  setSelectedRole,
  clearFilters,
  clearError
} from '../../store/slices/librarySlice.js'
import Button from '../../components/common/Button.jsx'
import Modal from '../../components/common/Modal.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import SuccessMessage from '../../components/common/SuccessMessage.jsx'
import QuestionForm from '../../components/admin/QuestionForm.jsx'
import QuestionTable from '../../components/admin/QuestionTable.jsx'
import BulkActions from '../../components/admin/BulkActions.jsx'
import QuestionFilters from '../../components/admin/QuestionFilters.jsx'

const QuestionManagement = () => {
  const dispatch = useDispatch()
  
  // Local state
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  // Fetch questions
  const { isLoading: isQueryLoading, error: queryError, refetch } = useGetQuestionsQuery()
  
  // Redux state
  const filteredQuestions = useSelector(selectFilteredQuestions)
  const categories = useSelector(selectCategories)
  const roles = useSelector(selectRoles)
  const isLoading = useSelector(selectLibraryLoading) || isQueryLoading
  const error = useSelector(selectLibraryError) || queryError
  
  // Mutations
  const [createQuestion, { isLoading: isCreating }] = useCreateQuestionMutation()
  const [updateQuestion, { isLoading: isUpdating }] = useUpdateQuestionMutation()
  const [deleteQuestion, { isLoading: isDeleting }] = useDeleteQuestionMutation()

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  // Handle question creation
  const handleCreateQuestion = async (questionData) => {
    try {
      await createQuestion(questionData).unwrap()
      setShowCreateModal(false)
      setSuccessMessage('Question created successfully!')
    } catch (error) {
      setErrorMessage(error?.message || 'Failed to create question')
    }
  }

  // Handle question update
  const handleUpdateQuestion = async (questionData) => {
    try {
      await updateQuestion({
        questionId: currentQuestion.id,
        ...questionData
      }).unwrap()
      setShowEditModal(false)
      setCurrentQuestion(null)
      setSuccessMessage('Question updated successfully!')
    } catch (error) {
      setErrorMessage(error?.message || 'Failed to update question')
    }
  }

  // Handle single question deletion
  const handleDeleteQuestion = async () => {
    try {
      await deleteQuestion(currentQuestion.id).unwrap()
      setShowDeleteModal(false)
      setCurrentQuestion(null)
      setSuccessMessage('Question deleted successfully!')
    } catch (error) {
      setErrorMessage(error?.message || 'Failed to delete question')
    }
  }

  // Handle bulk deletion
  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedQuestions.map(questionId => deleteQuestion(questionId).unwrap())
      )
      setSelectedQuestions([])
      setSuccessMessage(`${selectedQuestions.length} questions deleted successfully!`)
    } catch (error) {
      setErrorMessage('Failed to delete some questions')
    }
  }

  // Handle question selection
  const handleQuestionSelect = (questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([])
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q.id))
    }
  }

  // Handle view question
  const handleViewQuestion = (question) => {
    setCurrentQuestion(question)
    setShowViewModal(true)
  }

  // Handle edit question
  const handleEditQuestion = (question) => {
    setCurrentQuestion(question)
    setShowEditModal(true)
  }

  // Handle delete confirmation
  const handleDeleteConfirmation = (question) => {
    setCurrentQuestion(question)
    setShowDeleteModal(true)
  }

  // Handle retry
  const handleRetry = () => {
    dispatch(clearError())
    refetch()
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Question Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage the Q&A library content and interview questions
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            className="inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
      </motion.div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <SuccessMessage 
              message={successMessage} 
              onClose={() => setSuccessMessage('')}
            />
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <ErrorMessage 
              message={errorMessage} 
              onClose={() => setErrorMessage('')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters and Search */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="mb-6"
      >
        <QuestionFilters />
      </motion.div>

      {/* Bulk Actions */}
      {selectedQuestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <BulkActions
            selectedCount={selectedQuestions.length}
            onBulkDelete={handleBulkDelete}
            onClearSelection={() => setSelectedQuestions([])}
            isDeleting={isDeleting}
          />
        </motion.div>
      )}

      {/* Content Area */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
      >
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner size="lg" color="primary" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading questions...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="py-16 text-center">
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
        )}

        {/* Questions Table */}
        {!isLoading && !error && (
          <QuestionTable
            questions={filteredQuestions}
            selectedQuestions={selectedQuestions}
            onQuestionSelect={handleQuestionSelect}
            onSelectAll={handleSelectAll}
            onViewQuestion={handleViewQuestion}
            onEditQuestion={handleEditQuestion}
            onDeleteQuestion={handleDeleteConfirmation}
          />
        )}
      </motion.div>

      {/* Create Question Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Question"
        size="lg"
      >
        <QuestionForm
          onSubmit={handleCreateQuestion}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isCreating}
          categories={categories}
          roles={roles}
        />
      </Modal>

      {/* Edit Question Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setCurrentQuestion(null)
        }}
        title="Edit Question"
        size="lg"
      >
        <QuestionForm
          question={currentQuestion}
          onSubmit={handleUpdateQuestion}
          onCancel={() => {
            setShowEditModal(false)
            setCurrentQuestion(null)
          }}
          isLoading={isUpdating}
          categories={categories}
          roles={roles}
        />
      </Modal>

      {/* View Question Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setCurrentQuestion(null)
        }}
        title="Question Details"
        size="lg"
      >
        {currentQuestion && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question
              </label>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-900 dark:text-white">
                  {currentQuestion.questionText}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  {currentQuestion.category}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  {currentQuestion.role}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Suggested Answer
              </label>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg max-h-64 overflow-y-auto">
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {currentQuestion.suggestedAnswer}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setShowViewModal(false)
                  handleEditQuestion(currentQuestion)
                }}
                variant="primary"
                size="sm"
                className="inline-flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Question
              </Button>
              <Button
                onClick={() => {
                  setShowViewModal(false)
                  setCurrentQuestion(null)
                }}
                variant="secondary"
                size="sm"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setCurrentQuestion(null)
        }}
        title="Delete Question"
        size="md"
      >
        {currentQuestion && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="text-lg font-medium text-red-900 dark:text-red-100">
                  Confirm Deletion
                </h3>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Are you sure you want to delete this question?
              </p>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  "{currentQuestion.questionText.substring(0, 100)}
                  {currentQuestion.questionText.length > 100 ? '...' : ''}"
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setShowDeleteModal(false)
                  setCurrentQuestion(null)
                }}
                variant="secondary"
                size="sm"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteQuestion}
                variant="danger"
                size="sm"
                loading={isDeleting}
                className="inline-flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Question
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default QuestionManagement