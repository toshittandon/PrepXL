import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, AlertTriangle, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

const ErrorMessage = ({ 
  message, 
  variant = 'default', 
  severity = 'error',
  className = '', 
  onClose,
  showIcon = true,
  autoHide = false,
  autoHideDelay = 5000,
  persistent = false,
  actions = null,
  title = null
}) => {
  const [isVisible, setIsVisible] = useState(true)

  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && !persistent) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onClose) {
          setTimeout(onClose, 200) // Wait for animation to complete
        }
      }, autoHideDelay)

      return () => clearTimeout(timer)
    }
  }, [autoHide, autoHideDelay, persistent, onClose])

  if (!message || !isVisible) return null

  const severityConfig = {
    error: {
      icon: XCircle,
      colors: {
        default: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
        inline: 'bg-transparent border-transparent text-red-600 dark:text-red-400',
        banner: 'bg-red-500 text-white border-red-600',
        toast: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
      }
    },
    warning: {
      icon: AlertTriangle,
      colors: {
        default: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
        inline: 'bg-transparent border-transparent text-yellow-600 dark:text-yellow-400',
        banner: 'bg-yellow-500 text-white border-yellow-600',
        toast: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200'
      }
    },
    info: {
      icon: AlertCircle,
      colors: {
        default: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
        inline: 'bg-transparent border-transparent text-blue-600 dark:text-blue-400',
        banner: 'bg-blue-500 text-white border-blue-600',
        toast: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200'
      }
    }
  }

  const config = severityConfig[severity] || severityConfig.error
  const Icon = config.icon
  const colorClass = config.colors[variant] || config.colors.default

  const handleClose = () => {
    setIsVisible(false)
    if (onClose) {
      setTimeout(onClose, 200) // Wait for animation to complete
    }
  }

  const animationVariants = {
    default: {
      initial: { opacity: 0, y: -10, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -10, scale: 0.95 }
    },
    inline: {
      initial: { opacity: 0, height: 0 },
      animate: { opacity: 1, height: 'auto' },
      exit: { opacity: 0, height: 0 }
    },
    banner: {
      initial: { opacity: 0, y: -50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -50 }
    },
    toast: {
      initial: { opacity: 0, x: 300, scale: 0.9 },
      animate: { opacity: 1, x: 0, scale: 1 },
      exit: { opacity: 0, x: 300, scale: 0.9 }
    }
  }

  const animation = animationVariants[variant] || animationVariants.default

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={animation.initial}
          animate={animation.animate}
          exit={animation.exit}
          transition={{ 
            duration: variant === 'inline' ? 0.15 : 0.2,
            ease: 'easeOut'
          }}
          className={`
            flex items-start border rounded-lg
            ${variant === 'inline' ? 'p-1' : 'p-3'}
            ${variant === 'banner' ? 'rounded-none border-x-0' : ''}
            ${variant === 'toast' ? 'shadow-lg' : ''}
            ${colorClass}
            ${className}
          `}
          role="alert"
          aria-live="polite"
        >
          {showIcon && variant !== 'inline' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            >
              <Icon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            </motion.div>
          )}
          
          <div className="flex-1 min-w-0">
            {title && variant !== 'inline' && (
              <h4 className="font-semibold mb-1">
                {title}
              </h4>
            )}
            
            <div className={variant === 'inline' ? 'text-sm' : 'text-sm'}>
              {typeof message === 'string' ? (
                <p>{message}</p>
              ) : Array.isArray(message) ? (
                <ul className="list-disc list-inside space-y-1">
                  {message.map((msg, index) => (
                    <li key={index}>{msg}</li>
                  ))}
                </ul>
              ) : (
                <p>{String(message)}</p>
              )}
            </div>

            {actions && variant !== 'inline' && (
              <div className="mt-3 flex space-x-2">
                {actions}
              </div>
            )}
          </div>

          {(onClose || !persistent) && variant !== 'inline' && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              onClick={handleClose}
              className={`
                ml-2 flex-shrink-0 p-1 rounded-md transition-colors
                ${severity === 'error' 
                  ? 'hover:bg-red-100 dark:hover:bg-red-800/20' 
                  : severity === 'warning'
                  ? 'hover:bg-yellow-100 dark:hover:bg-yellow-800/20'
                  : 'hover:bg-blue-100 dark:hover:bg-blue-800/20'
                }
              `}
              aria-label="Close error message"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ErrorMessage