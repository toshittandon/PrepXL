import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import Button from './Button'

const ServiceUnavailable = ({ 
  service = 'Service',
  message,
  onRetry,
  showRetry = true,
  isOffline = false,
  className = ''
}) => {
  const defaultMessage = isOffline 
    ? `${service} requires an internet connection. Please check your network and try again.`
    : `${service} is temporarily unavailable. Our team is working to restore it as quickly as possible.`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex flex-col items-center justify-center p-8 text-center
        bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed 
        border-gray-300 dark:border-gray-600 min-h-[200px]
        ${className}
      `}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className={`
          w-16 h-16 rounded-full flex items-center justify-center mb-4
          ${isOffline 
            ? 'bg-orange-100 dark:bg-orange-900/20' 
            : 'bg-yellow-100 dark:bg-yellow-900/20'
          }
        `}
      >
        {isOffline ? (
          <WifiOff className="w-8 h-8 text-orange-600 dark:text-orange-400" />
        ) : (
          <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
        )}
      </motion.div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {service} Unavailable
      </h3>

      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
        {message || defaultMessage}
      </p>

      {showRetry && onRetry && (
        <Button
          onClick={onRetry}
          variant="primary"
          icon={isOffline ? Wifi : RefreshCw}
          className="min-w-[120px]"
        >
          {isOffline ? 'Check Connection' : 'Try Again'}
        </Button>
      )}
    </motion.div>
  )
}

// Specific service unavailable components
export const AIServiceUnavailable = ({ onRetry, className }) => (
  <ServiceUnavailable
    service="AI Analysis"
    message="Our AI analysis service is temporarily unavailable. Please try again in a few moments."
    onRetry={onRetry}
    className={className}
  />
)

export const DatabaseUnavailable = ({ onRetry, className }) => (
  <ServiceUnavailable
    service="Database"
    message="We're having trouble connecting to our database. Your data is safe, please try again."
    onRetry={onRetry}
    className={className}
  />
)

export const SpeechServiceUnavailable = ({ onRetry, onSwitchToText, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`
      flex flex-col items-center justify-center p-6 text-center
      bg-blue-50 dark:bg-blue-900/10 rounded-xl border 
      border-blue-200 dark:border-blue-800 min-h-[180px]
      ${className}
    `}
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring" }}
      className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4"
    >
      <AlertTriangle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
    </motion.div>

    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      Speech Recognition Unavailable
    </h3>

    <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md">
      Having trouble with voice input? You can continue the interview by typing your answers.
    </p>

    <div className="flex space-x-3">
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="secondary"
          icon={RefreshCw}
          size="sm"
        >
          Try Voice Again
        </Button>
      )}
      
      {onSwitchToText && (
        <Button
          onClick={onSwitchToText}
          variant="primary"
          size="sm"
        >
          Switch to Text
        </Button>
      )}
    </div>
  </motion.div>
)

export const OfflineMode = ({ className }) => (
  <ServiceUnavailable
    service="Online Features"
    message="You're currently offline. Some features may not be available until your connection is restored."
    showRetry={false}
    isOffline={true}
    className={className}
  />
)

export default ServiceUnavailable