import { LogOut } from 'lucide-react'
import Button from './Button.jsx'
import SessionClearConfirmation from './SessionClearConfirmation.jsx'
import { useManualSessionClear } from '../../hooks/useManualSessionClear.js'
import { useEffect } from 'react'

/**
 * Session Clear Button Component
 * A ready-to-use button component that handles manual session clearing
 * with confirmation dialog and feedback
 */
const SessionClearButton = ({
  variant = 'secondary',
  size = 'md',
  className = '',
  children = 'Clear All Sessions',
  showIcon = true,
  onSuccess,
  onError,
  ...buttonProps
}) => {
  const {
    isConfirmationOpen,
    isClearing,
    result,
    showConfirmation,
    hideConfirmation,
    clearAllSessions,
    clearResult,
    hasError,
    hasSuccess
  } = useManualSessionClear()

  // Handle success/error callbacks
  useEffect(() => {
    if (hasSuccess && onSuccess) {
      onSuccess(result.details)
    }
    if (hasError && onError) {
      onError(result.details)
    }
  }, [hasSuccess, hasError, result, onSuccess, onError])

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={showConfirmation}
        disabled={isClearing}
        {...buttonProps}
      >
        {showIcon && <LogOut className="w-4 h-4 mr-2" />}
        {children}
      </Button>

      <SessionClearConfirmation
        isOpen={isConfirmationOpen}
        onClose={hideConfirmation}
        onConfirm={clearAllSessions}
        loading={isClearing}
      />

      {/* Optional: Show result feedback */}
      {result && (
        <div className="mt-2">
          {hasSuccess && (
            <div className="text-sm text-green-600 dark:text-green-400">
              {result.message}
            </div>
          )}
          {hasError && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {result.message}
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default SessionClearButton