import { forwardRef, memo } from 'react'
import { motion } from 'framer-motion'
import LoadingSpinner from './LoadingSpinner.jsx'
import { buttonVariants } from '../../utils/animations'

const Button = memo(forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}, ref) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-xl
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
  `

  const variants = {
    primary: `
      bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800
      text-white shadow-md hover:shadow-lg focus:ring-primary-500
      disabled:from-primary-400 disabled:to-primary-500
    `,
    secondary: `
      bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
      text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
      shadow-sm hover:shadow-md focus:ring-primary-500
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800
      text-white shadow-md hover:shadow-lg focus:ring-red-500
      disabled:from-red-400 disabled:to-red-500
    `,
    ghost: `
      text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
      focus:ring-primary-500
    `
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  }

  const isDisabled = disabled || loading

  return (
    <motion.button
      ref={ref}
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      onClick={onClick}
      variants={buttonVariants}
      initial="rest"
      whileHover={!isDisabled ? "hover" : "rest"}
      whileTap={!isDisabled ? "tap" : "rest"}
      {...props}
    >
      {loading && (
        <LoadingSpinner 
          size="sm" 
          className="mr-2" 
          color={variant === 'primary' || variant === 'danger' ? 'white' : 'current'}
        />
      )}
      {children}
    </motion.button>
  )
}))

Button.displayName = 'Button'

export default Button