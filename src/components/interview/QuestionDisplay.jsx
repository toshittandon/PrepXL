import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, 
  Clock, 
  Target, 
  TrendingUp,
  Lightbulb,
  AlertCircle
} from 'lucide-react'

const QuestionDisplay = ({
  question,
  questionNumber,
  totalQuestions,
  category,
  difficulty = 'medium',
  timeLimit,
  className = ''
}) => {
  const getDifficultyColor = (level) => {
    switch (level) {
      case 'easy':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20'
      case 'hard':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
      default:
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20'
    }
  }

  const getDifficultyIcon = (level) => {
    switch (level) {
      case 'easy':
        return <Lightbulb className="w-4 h-4" />
      case 'hard':
        return <TrendingUp className="w-4 h-4" />
      default:
        return <Target className="w-4 h-4" />
    }
  }

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Technical':
        return <Target className="w-5 h-5" />
      case 'Behavioral':
        return <MessageSquare className="w-5 h-5" />
      case 'Case Study':
        return <TrendingUp className="w-5 h-5" />
      default:
        return <MessageSquare className="w-5 h-5" />
    }
  }

  if (!question) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Loading your next question...
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Question Number */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {questionNumber}
                </span>
              </div>
              {totalQuestions && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  of {totalQuestions}
                </span>
              )}
            </div>

            {/* Category */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
              {getCategoryIcon(category)}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {category}
              </span>
            </div>

            {/* Difficulty */}
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
              {getDifficultyIcon(difficulty)}
              <span className="capitalize">{difficulty}</span>
            </div>
          </div>

          {/* Time Limit */}
          {timeLimit && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{timeLimit} min suggested</span>
            </div>
          )}
        </div>
      </div>

      {/* Question Content */}
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed">
            {question}
          </h2>
        </motion.div>

        {/* Question Tips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Tips for answering:
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                {category === 'Behavioral' && (
                  <>
                    <li>• Use the STAR method (Situation, Task, Action, Result)</li>
                    <li>• Provide specific examples from your experience</li>
                    <li>• Focus on your role and contributions</li>
                  </>
                )}
                {category === 'Technical' && (
                  <>
                    <li>• Think through your approach step by step</li>
                    <li>• Explain your reasoning and trade-offs</li>
                    <li>• Consider edge cases and scalability</li>
                  </>
                )}
                {category === 'Case Study' && (
                  <>
                    <li>• Break down the problem systematically</li>
                    <li>• Ask clarifying questions if needed</li>
                    <li>• Show your analytical thinking process</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        {totalQuestions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Interview Progress</span>
              <span>{Math.round((questionNumber / totalQuestions) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-primary-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default QuestionDisplay