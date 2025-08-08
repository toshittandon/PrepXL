import { motion } from 'framer-motion'

const ProgressBar = ({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'primary',
  showLabel = false,
  label,
  showPercentage = false,
  className = '',
  animated = true,
  striped = false,
  indeterminate = false
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizes = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
    xl: 'h-6'
  }

  const variants = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
  }

  const backgroundVariants = {
    primary: 'bg-primary-100 dark:bg-primary-900/20',
    secondary: 'bg-secondary-100 dark:bg-secondary-900/20',
    success: 'bg-green-100 dark:bg-green-900/20',
    warning: 'bg-yellow-100 dark:bg-yellow-900/20',
    error: 'bg-red-100 dark:bg-red-900/20',
    info: 'bg-blue-100 dark:bg-blue-900/20'
  }

  const stripedPattern = striped ? `
    background-image: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.15) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.15) 75%,
      transparent 75%,
      transparent
    );
    background-size: 1rem 1rem;
  ` : ''

  const indeterminateAnimation = indeterminate ? {
    x: ['-100%', '100%'],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'easeInOut'
    }
  } : {}

  return (
    <div className={`w-full ${className}`}>
      {/* Label and Percentage */}
      {(showLabel || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {showLabel && label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showPercentage && !indeterminate && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar Container */}
      <div 
        className={`
          w-full rounded-full overflow-hidden
          ${sizes[size]}
          ${backgroundVariants[variant]}
        `}
      >
        {/* Progress Bar Fill */}
        <motion.div
          className={`
            h-full rounded-full transition-all duration-300
            ${variants[variant]}
            ${animated ? 'transition-all duration-500 ease-out' : ''}
          `}
          style={{
            width: indeterminate ? '30%' : `${percentage}%`,
            ...(striped && { backgroundImage: stripedPattern })
          }}
          initial={animated ? { width: 0 } : false}
          animate={
            animated 
              ? { 
                  width: indeterminate ? '30%' : `${percentage}%`,
                  ...indeterminateAnimation
                }
              : {}
          }
          transition={
            animated && !indeterminate 
              ? { duration: 0.5, ease: 'easeOut' }
              : {}
          }
        />
      </div>

      {/* Value Display for Screen Readers */}
      <div className="sr-only">
        {indeterminate 
          ? 'Loading...' 
          : `Progress: ${Math.round(percentage)}% of ${max}`
        }
      </div>
    </div>
  )
}

export default ProgressBar