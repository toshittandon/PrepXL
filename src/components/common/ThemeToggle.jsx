import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center
        w-10 h-10 rounded-xl
        bg-secondary-100 hover:bg-secondary-200
        dark:bg-dark-800 dark:hover:bg-dark-700
        border border-secondary-200 dark:border-dark-600
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        dark:focus:ring-offset-dark-900
        shadow-md hover:shadow-lg
        ${className}
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <Sun
          className={`
            absolute inset-0 w-5 h-5
            text-amber-500
            transition-all duration-300 ease-in-out
            ${theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-90 scale-75'
            }
          `}
        />
        
        {/* Moon Icon */}
        <Moon
          className={`
            absolute inset-0 w-5 h-5
            text-slate-400 dark:text-slate-300
            transition-all duration-300 ease-in-out
            ${theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-75'
            }
          `}
        />
      </div>
    </button>
  )
}

export default ThemeToggle