import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, X, Check } from 'lucide-react'
import { useEffect, useState } from 'react'

const SuccessMessage = ({ 
  message, 
  variant = 'default',
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

  const variants = {
    default: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    inline: 'bg-transparent border-transparent text-green-600 dark:text-green-400',
    banner: 'bg-green-500 text-white border-green-600',
    toast: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200'
  }

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
            ${variants[variant]}
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
              <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
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
              className="ml-2 flex-shrink-0 p-1 rounded-md hover:bg-green-100 dark:hover:bg-green-800/20 transition-colors"
              aria-label="Close success message"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SuccessMessage