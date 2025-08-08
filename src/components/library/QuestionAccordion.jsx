import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, MessageCircle, Tag, Briefcase, Lightbulb } from 'lucide-react'
import Card from '../common/Card.jsx'

const QuestionAccordionItem = ({ question, isOpen, onToggle }) => {
  const { questionText, category, role, suggestedAnswer } = question

  return (
    <Card variant="default" padding="none" className="overflow-hidden">
      {/* Question Header - Clickable */}
      <motion.button
        onClick={onToggle}
        className="w-full text-left p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
        whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
        whileTap={{ scale: 0.995 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-tight mb-2 sm:mb-3 pr-2">
                {questionText}
              </h3>
              
              {/* Question Metadata */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {category && (
                  <div className="flex items-center space-x-1">
                    <Tag className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                    <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                      {category}
                    </span>
                  </div>
                )}
                
                {role && (
                  <div className="flex items-center space-x-1">
                    <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
                    <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200">
                      {role}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Expand/Collapse Icon */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 ml-2 sm:ml-4"
          >
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </motion.div>
        </div>
      </motion.button>

      {/* Answer Content - Expandable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 sm:px-6 sm:pb-6 border-t border-gray-200 dark:border-gray-700">
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="pt-4 sm:pt-6"
              >
                {suggestedAnswer ? (
                  <div>
                    <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                      <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        Suggested Answer
                      </h4>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-3 sm:p-4">
                      <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {suggestedAnswer}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <Lightbulb className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 px-4">
                      No suggested answer available for this question.
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

const QuestionAccordion = ({ questions = [], className = '' }) => {
  const [openItems, setOpenItems] = useState(new Set())

  const toggleItem = (questionId) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(questionId)) {
      newOpenItems.delete(questionId)
    } else {
      newOpenItems.add(questionId)
    }
    setOpenItems(newOpenItems)
  }

  const toggleAll = () => {
    if (openItems.size === questions.length) {
      // Close all
      setOpenItems(new Set())
    } else {
      // Open all
      setOpenItems(new Set(questions.map(q => q.id)))
    }
  }

  if (!questions || questions.length === 0) {
    return null // Let the parent component handle empty state
  }

  return (
    <div className={className}>
      {/* Accordion Controls */}
      {questions.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-4 px-1"
        >
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={toggleAll}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
          >
            {openItems.size === questions.length ? 'Collapse All' : 'Expand All'}
          </button>
        </motion.div>
      )}

      {/* Question Items */}
      <div className="space-y-3 sm:space-y-4">
        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
          >
            <QuestionAccordionItem
              question={question}
              isOpen={openItems.has(question.id)}
              onToggle={() => toggleItem(question.id)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default QuestionAccordion