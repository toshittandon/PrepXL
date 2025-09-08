import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Trash2, 
  X, 
  Download,
  AlertTriangle
} from 'lucide-react'
import Button from '../common/Button.jsx'
import Modal from '../common/Modal.jsx'

const BulkActions = ({
  selectedCount,
  onBulkDelete,
  onClearSelection,
  isDeleting = false
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleBulkDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmBulkDelete = async () => {
    await onBulkDelete()
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                  {selectedCount}
                </span>
              </div>
              <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
                {selectedCount === 1 ? '1 question selected' : `${selectedCount} questions selected`}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Export Selected */}
              <Button
                variant="secondary"
                size="sm"
                className="inline-flex items-center text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700"
                title="Export selected questions"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              {/* Bulk Delete */}
              <Button
                onClick={handleBulkDelete}
                variant="danger"
                size="sm"
                loading={isDeleting}
                className="inline-flex items-center"
                title="Delete selected questions"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {/* Clear Selection */}
          <Button
            onClick={onClearSelection}
            variant="ghost"
            size="sm"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Multiple Questions"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-red-900 dark:text-red-100">
                Confirm Bulk Deletion
              </h3>
              <p className="text-red-700 dark:text-red-300 text-sm">
                This action cannot be undone.
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to delete {selectedCount} question{selectedCount !== 1 ? 's' : ''}? 
              This will permanently remove {selectedCount === 1 ? 'this question' : 'these questions'} from the library.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Trash2 className="w-4 h-4" />
                <span>
                  {selectedCount} question{selectedCount !== 1 ? 's' : ''} will be permanently deleted
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowDeleteConfirm(false)}
              variant="secondary"
              size="sm"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBulkDelete}
              variant="danger"
              size="sm"
              loading={isDeleting}
              className="inline-flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete {selectedCount} Question{selectedCount !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default BulkActions