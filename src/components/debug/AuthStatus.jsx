import { useSelector } from 'react-redux'

const AuthStatus = () => {
  const { user, session, loading, error } = useSelector(state => state.auth)
  
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed top-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
        🔍 Auth Debug (Dev Only)
      </h3>
      
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Loading:</span>
          <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
            {loading ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">User:</span>
          <span className={user ? 'text-green-600' : 'text-red-600'}>
            {user ? 'Authenticated' : 'Not authenticated'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Session:</span>
          <span className={session ? 'text-green-600' : 'text-red-600'}>
            {session ? 'Active' : 'None'}
          </span>
        </div>
        
        {user && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="text-gray-600 dark:text-gray-400 mb-1">User Info:</div>
            <div className="text-gray-800 dark:text-gray-200">
              ID: {user.id || user.$id || 'No ID'}
            </div>
            <div className="text-gray-800 dark:text-gray-200">
              Email: {user.email || 'No email'}
            </div>
            <div className="text-gray-800 dark:text-gray-200">
              Name: {user.name || 'No name'}
            </div>
          </div>
        )}
        
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

export default AuthStatus