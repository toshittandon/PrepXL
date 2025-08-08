import { forwardRef, memo } from 'react'
import { motion } from 'framer-motion'
import { cardHoverVariants } from '../../utils/animations'

const Card = memo(forwardRef(({
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
    rounded-xl shadow-md
    ${variants[variant]}
    ${paddings[padding]}
    ${className}
  `

  return (
    <motion.div
      ref={ref}
      className={baseClasses}
      variants={hover ? cardHoverVariants : undefined}
      initial={hover ? "rest" : undefined}
      whileHover={hover ? "hover" : undefined}
      {...props}
    >
      {children}
    </motion.div>
  )
}))

Card.displayName = 'Card'

export default Card