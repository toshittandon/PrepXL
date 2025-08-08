import { motion } from 'framer-motion'
import { MessageCircle, Tag, Briefcase } from 'lucide-react'
import Card from '../common/Card.jsx'

const QuestionCard = ({ question, className = '' }) => {
  if (!question) return null

  const { questionText, category, role, suggestedAnswer } = question

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card 
        variant="default" 
        padding="default" 
        hover={true}
        className="h-full"
      >
        {/* Question Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                {questionText}
              </h3>
            </div>
          </div>
        </div>

        {/* Question Metadata */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {category && (
            <div className="flex items-center space-x-1">
              <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                {category}
              </span>
            </div>
          )}
          
          {role && (
            <div className="flex items-center space-x-1">
              <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200">
                {role}
              </span>
            </div>
          )}
        </div>

        {/* Suggested Answer Preview */}
        {suggestedAnswer && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Suggested Answer:
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
              {suggestedAnswer}
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

export default QuestionCard