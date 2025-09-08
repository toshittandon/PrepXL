import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import Card from '../common/Card.jsx'

const AnalysisCard = ({ 
  title, 
  icon: Icon, 
  variant = 'default', 
  data, 
  type = 'text' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Variant styles
  const variants = {
    default: {
      bg: 'bg-gray-50 dark:bg-gray-800',
      border: 'border-gray-200 dark:border-gray-700',
      icon: 'text-gray-600 dark:text-gray-400',
      iconBg: 'bg-gray-100 dark:bg-gray-700'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/10',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/10',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/20'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/20'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/10',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/20'
    }
  }

  const style = variants[variant] || variants.default

  // Render content based on type
  const renderContent = () => {
    if (!data) {
      return (
        <div className="text-gray-500 dark:text-gray-400 text-sm italic">
          No data available
        </div>
      )
    }

    switch (type) {
      case 'keywords': {
        if (!Array.isArray(data) || data.length === 0) {
          return (
            <div className="text-green-600 dark:text-green-400 text-sm font-medium">
              ✓ All important keywords are present in your resume
            </div>
          )
        }
        
        const displayKeywords = isExpanded ? data : data.slice(0, 6)
        const hasMore = data.length > 6

        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {displayKeywords.map((keyword, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-3 py-1 bg-white dark:bg-gray-700 border border-yellow-200 dark:border-yellow-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
                >
                  {keyword}
                </motion.span>
              ))}
            </div>
            
            {hasMore && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center space-x-1 text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors"
              >
                <span>
                  {isExpanded ? 'Show less' : `Show ${data.length - 6} more`}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
            
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {data.length} keyword{data.length !== 1 ? 's' : ''} missing from your resume
            </div>
          </div>
        )
      }

      case 'suggestions': {
        if (!Array.isArray(data) || data.length === 0) {
          return (
            <div className="text-green-600 dark:text-green-400 text-sm font-medium">
              ✓ Your resume format looks great!
            </div>
          )
        }

        const displaySuggestions = isExpanded ? data : data.slice(0, 3)
        const hasMoreSuggestions = data.length > 3

        return (
          <div className="space-y-3">
            <ul className="space-y-2">
              {displaySuggestions.map((suggestion, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span className="text-green-500 dark:text-green-400 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </motion.li>
              ))}
            </ul>
            
            {hasMoreSuggestions && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center space-x-1 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
              >
                <span>
                  {isExpanded ? 'Show less' : `Show ${data.length - 3} more suggestions`}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        )
      }

      case 'text':
      default: {
        if (typeof data !== 'string' || data.trim() === '') {
          return (
            <div className="text-gray-500 dark:text-gray-400 text-sm italic">
              No analysis available
            </div>
          )
        }

        const isLongText = data.length > 200
        const displayText = isExpanded ? data : data.substring(0, 200)

        return (
          <div className="space-y-3">
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {displayText}
              {!isExpanded && isLongText && '...'}
            </div>
            
            {isLongText && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <span>{isExpanded ? 'Show less' : 'Read more'}</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        )
      }
    }
  }

  // Get count for display
  const getCount = () => {
    if (type === 'keywords' && Array.isArray(data)) {
      return data.length
    }
    if (type === 'suggestions' && Array.isArray(data)) {
      return data.length
    }
    return null
  }

  const count = getCount()

  return (
    <Card className={`p-6 ${style.bg} border-2 ${style.border}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${style.iconBg} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${style.icon}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {count !== null && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {count} item{count !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {renderContent()}
      </div>
    </Card>
  )
}

export default AnalysisCard