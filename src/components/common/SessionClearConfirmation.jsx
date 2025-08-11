import { useState } from 'react'
import { AlertTriangle, LogOut } from 'lucide-react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'

/**
 * Session Clear Confirmation Dialog Component
 * Provides a user-friendly confirmation dialog for manual session clearing
 */
const SessionClearConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title = 'Clear All Sessions',
  message = 'This will sign you out from all devices and sessions. You will need to log in again.',
  confirmText = 'Clear All Sessions',
  cancelText = 'Cancel'
}) => {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
    } finally {
      setIsConfirming(false)
    }
  }

  const handleCancel = () => {
    if (!isConfirming && !loading) {
      onClose()
    }
  }

  const isProcessing = loading || isConfirming

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size="sm"
      closeOnBackdrop={!isProcessing}
      closeOnEscape={!isProcessing}
      showCloseButton={!isProcessing}
    >
      <div className="space-y-4">
        {/* Warning Icon and Message */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {message}
            </p>
          </div>
        </div>

        {/* Additional Warning */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <LogOut className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              Are you sure you want to continue?
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCancel}
            disabled={isProcessing}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            loading={isProcessing}
            disabled={isProcessing}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default SessionClearConfirmation