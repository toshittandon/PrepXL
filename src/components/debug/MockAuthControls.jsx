import { setMockAuthState, shouldUseMockAuth, toggleMockAuth } from '../../utils/mockAuth.js'

const MockAuthControls = ({ dispatch }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const isMockAuthEnabled = shouldUseMockAuth()

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 shadow-lg z-50">
      <div className="text-xs text-yellow-800 dark:text-yellow-200 mb-2 font-medium">
        🔧 Dev Tools
      </div>
      
      <div className="space-y-2">
        <button
          onClick={() => setMockAuthState(dispatch).catch(console.error)}
          className="block w-full text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
        >
          Set Mock User
        </button>
        
        <button
          onClick={toggleMockAuth}
          className={`block w-full text-xs px-2 py-1 rounded transition-colors ${
            isMockAuthEnabled 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isMockAuthEnabled ? 'Disable Mock Auth' : 'Enable Mock Auth'}
        </button>
      </div>
    </div>
  )
}

export default MockAuthControls