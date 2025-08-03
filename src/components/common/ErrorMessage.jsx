import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

const ErrorMessage = ({ 
  message, 
  className = '',
  showIcon = true,
  variant = 'default'
}) => {
  if (!message) return null

  const variants = {
    default: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    inline: 'text-red-600 dark:text-red-400'
  }

  if (variant === 'inline') {
    return (
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`text-sm ${variants[variant]} ${className}`}
      >
        {message}
      </motion.p>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`
        p-3 rounded-xl border text-sm
        ${variants[variant]} ${className}
      `}
    >
      <div className="flex items-start">
        {showIcon && (
          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
        )}
        <span>{message}</span>
      </div>
    </motion.div>
  )
}

export default ErrorMessage