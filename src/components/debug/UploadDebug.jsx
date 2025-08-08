import { useSelector } from 'react-redux'

const UploadDebug = () => {
  const { uploading, uploadProgress, error } = useSelector(state => state.resume)
  const { user } = useSelector(state => state.auth)
  
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed top-20 right-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-3 shadow-lg z-40 max-w-sm">
      <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">
        📤 Upload Debug (Dev Only)
      </h3>
      
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-blue-600 dark:text-blue-400">Status:</span>
          <span className={uploading ? 'text-yellow-600' : 'text-green-600'}>
            {uploading ? 'Uploading...' : 'Ready'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-blue-600 dark:text-blue-400">Progress:</span>
          <span className="text-blue-800 dark:text-blue-200">
            {uploadProgress}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-blue-600 dark:text-blue-400">User Type:</span>
          <span className="text-blue-800 dark:text-blue-200">
            {user?.id?.startsWith('mock-') ? 'Mock' : 'Real'}
          </span>
        </div>
        
        {error && (
          <div className="mt-2 pt-2 border-t border-red-200">
            <div className="text-red-600 text-xs">
              Error: {error}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadDebug