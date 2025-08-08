import { motion } from 'framer-motion'
import { MessageSquare, Clock, User, Bot } from 'lucide-react'

const InteractionItem = ({ 
  interaction, 
  index = 0,
  showTimestamp = true,
  className = '' 
}) => {
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDuration = (timestamp, startTime) => {
    if (!startTime) return null
    
    const interactionTime = new Date(timestamp)
    const sessionStart = new Date(startTime)
    const diffInSeconds = Math.floor((interactionTime - sessionStart) / 1000)
    
    const minutes = Math.floor(diffInSeconds / 60)
    const seconds = diffInSeconds % 60
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden interaction-item page-break-avoid ${className}`}
    >
      {/* Header with Question Number and Timestamp */}
      <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full">
              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                {interaction.order || index + 1}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Question {interaction.order || index + 1}
            </span>
          </div>
          
          {showTimestamp && interaction.timestamp && (
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formatTimestamp(interaction.timestamp)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Question Section */}
      <div className="p-6 space-y-4">
        <div className="flex items-start space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0">
            <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Interviewer
              </span>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-gray-900 dark:text-white leading-relaxed question-text">
                {interaction.questionText}
              </p>
            </div>
          </div>
        </div>

        {/* Answer Section */}
        <div className="flex items-start space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex-shrink-0">
            <User className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Your Answer
              </span>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              {interaction.userAnswerText ? (
                <p className="text-gray-900 dark:text-white leading-relaxed answer-text">
                  {interaction.userAnswerText}
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic answer-text">
                  No answer provided
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Answer Quality Indicator */}
        {interaction.userAnswerText && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Answer length: {interaction.userAnswerText.split(' ').length} words
              </span>
            </div>
            
            {/* Simple quality indicator based on answer length */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Quality:</span>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                interaction.userAnswerText.split(' ').length >= 50 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  : interaction.userAnswerText.split(' ').length >= 20
                  ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                  : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              }`}>
                {interaction.userAnswerText.split(' ').length >= 50 
                  ? 'Detailed'
                  : interaction.userAnswerText.split(' ').length >= 20
                  ? 'Adequate'
                  : 'Brief'
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default InteractionItem