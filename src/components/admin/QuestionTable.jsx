import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import Button from '../common/Button.jsx'

const QuestionTable = ({
  questions = [],
  selectedQuestions = [],
  onQuestionSelect,
  onSelectAll,
  onViewQuestion,
  onEditQuestion,
  onDeleteQuestion
}) => {
  const [sortField, setSortField] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')
  const [expandedRows, setExpandedRows] = useState([])

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Sort questions
  const sortedQuestions = [...questions].sort((a, b) => {
    let aValue = a[sortField]
    let bValue = b[sortField]

    // Handle date sorting
    if (sortField === 'createdAt' || sortField === 'updatedAt') {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    }

    // Handle string sorting
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Toggle row expansion
  const toggleRowExpansion = (questionId) => {
    setExpandedRows(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  // Truncate text
  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get category badge color
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Behavioral':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'Technical':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'Case Study':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
    >
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ? 
          <ChevronUp className="w-4 h-4" /> : 
          <ChevronDown className="w-4 h-4" />
      )}
    </button>
  )

  if (questions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Questions Found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          No questions match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onSelectAll}
              className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-primary-500 transition-colors"
            >
              {selectedQuestions.length === questions.length && questions.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-primary-600" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedQuestions.length > 0 
                ? `${selectedQuestions.length} selected`
                : `${questions.length} questions`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {sortedQuestions.map((question, index) => {
          const isSelected = selectedQuestions.includes(question.id)
          const isExpanded = expandedRows.includes(question.id)
          
          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`
                ${isSelected ? 'bg-primary-50 dark:bg-primary-900/10' : 'bg-white dark:bg-gray-800'}
                hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
              `}
            >
              {/* Main Row */}
              <div className="px-6 py-4">
                <div className="flex items-start space-x-4">
                  {/* Selection Checkbox */}
                  <button
                    onClick={() => onQuestionSelect(question.id)}
                    className="flex items-center justify-center w-5 h-5 mt-1 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-primary-500 transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {/* Question Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Question Text */}
                        <div className="mb-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                            {isExpanded ? question.questionText : truncateText(question.questionText, 150)}
                          </p>
                          {question.questionText.length > 150 && (
                            <button
                              onClick={() => toggleRowExpansion(question.id)}
                              className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 mt-1"
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(question.category)}`}>
                            {question.category}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            {question.role}
                          </span>
                          <span>
                            Created {formatDate(question.createdAt)}
                          </span>
                          {question.updatedAt !== question.createdAt && (
                            <span>
                              Updated {formatDate(question.updatedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          onClick={() => onViewQuestion(question)}
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          title="View question"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => onEditQuestion(question)}
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          title="Edit question"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => onDeleteQuestion(question)}
                          variant="ghost"
                          size="sm"
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 ml-9 pl-4 border-l-2 border-gray-200 dark:border-gray-600"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Suggested Answer:
                      </h4>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                          {truncateText(question.suggestedAnswer, 300)}
                        </p>
                        {question.suggestedAnswer.length > 300 && (
                          <button
                            onClick={() => onViewQuestion(question)}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 mt-2"
                          >
                            View full answer
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default QuestionTable