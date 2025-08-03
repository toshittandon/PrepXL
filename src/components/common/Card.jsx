import { forwardRef } from 'react'
import { motion } from 'framer-motion'

const Card = forwardRef(({
  children,
  className = '',
  variant = 'default',
  padding = 'default',
  hover = false,
  ...props
}, ref) => {
  const variants = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700',
    outlined: 'bg-transparent border-2 border-gray-300 dark:border-gray-600'
  }

  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8'
  }

  const baseClasses = `
    rounded-xl transition-all duration-200
    ${variants[variant]}
    ${paddings[padding]}
    ${hover ? 'hover:shadow-md hover:-translate-y-0.5' : ''}
    ${className}
  `

  const MotionCard = motion.div

  return (
    <MotionCard
      ref={ref}
      className={baseClasses}
      {...props}
    >
      {children}
    </MotionCard>
  )
})

Card.displayName = 'Card'

export default Card