# Manual Session Clearing Utility

This document describes the manual session clearing utility that allows users to clear all active sessions with proper confirmation and feedback.

## Overview

The manual session clearing utility provides a comprehensive solution for handling session conflicts by allowing users to manually clear all sessions when automatic resolution fails. It includes:

- Enhanced error handling with detailed logging
- User confirmation flow with customizable dialogs
- Success/failure feedback mechanisms
- Redux state integration
- React hooks for easy UI integration

## Core Function

### `manualSessionClear(options)`

The core function that handles manual session clearing with enhanced error handling.

```javascript
import { manualSessionClear } from '../services/appwrite/auth.js'

const result = await manualSessionClear({
  dispatch: dispatch,                    // Redux dispatch function (optional)
  onConfirm: confirmationHandler,        // Custom confirmation handler (optional)
  onSuccess: successHandler,             // Success callback (optional)
  onError: errorHandler,                 // Error callback (optional)
  requireConfirmation: true              // Whether to require user confirmation (default: true)
})
```

#### Options

- `dispatch` (Function, optional): Redux dispatch function for state management
- `onConfirm` (Function, optional): Custom confirmation handler that receives a message and returns a boolean
- `onSuccess` (Function, optional): Callback called on successful session clearing
- `onError` (Function, optional): Callback called on error
- `requireConfirmation` (boolean, optional): Whether to require user confirmation (default: true)

#### Return Value

Returns a result object with the following structure:

```javascript
{
  success: boolean,           // Whether the operation succeeded
  cancelled: boolean,         // Whether the user cancelled the operation
  message: string,           // Technical message
  userMessage: string,       // User-friendly message
  timestamp: string,         // ISO timestamp
  error?: Error             // Error object if operation failed
}
```

## React Hooks

### `useManualSessionClear()`

A React hook that provides state management and UI integration for manual session clearing.

```javascript
import { useManualSessionClear } from '../hooks/useManualSessionClear.js'

function MyComponent() {
  const {
    // State
    isConfirmationOpen,
    isClearing,
    result,
    hasError,
    hasSuccess,
    isProcessing,
    
    // Actions
    showConfirmation,
    hideConfirmation,
    clearAllSessions,
    clearResult,
    reset
  } = useManualSessionClear()

  const handleClearSessions = () => {
    showConfirmation()
  }

  return (
    <div>
      <button onClick={handleClearSessions}>
        Clear All Sessions
      </button>
      
      {/* Use SessionClearConfirmation component */}
      <SessionClearConfirmation
        isOpen={isConfirmationOpen}
        onClose={hideConfirmation}
        onConfirm={clearAllSessions}
        loading={isClearing}
      />
      
      {/* Show result feedback */}
      {result && (
        <div className={hasError ? 'error' : 'success'}>
          {result.message}
        </div>
      )}
    </div>
  )
}
```

### `useSessionClear()`

A simplified hook for programmatic session clearing without UI components.

```javascript
import { useSessionClear } from '../hooks/useManualSessionClear.js'

function MyComponent() {
  const { clearSessions, isClearing, lastResult } = useSessionClear()

  const handleProgrammaticClear = async () => {
    const result = await clearSessions({
      onSuccess: (result) => console.log('Success:', result),
      onError: (error) => console.error('Error:', error)
    })
    
    if (result.success) {
      // Handle success
    } else {
      // Handle error
    }
  }

  return (
    <button onClick={handleProgrammaticClear} disabled={isClearing}>
      {isClearing ? 'Clearing...' : 'Clear Sessions'}
    </button>
  )
}
```

## UI Components

### `SessionClearConfirmation`

A confirmation dialog component specifically designed for session clearing.

```javascript
import { SessionClearConfirmation } from '../components/common'

<SessionClearConfirmation
  isOpen={isConfirmationOpen}
  onClose={hideConfirmation}
  onConfirm={clearAllSessions}
  loading={isClearing}
  title="Clear All Sessions"                    // Optional: Custom title
  message="Custom confirmation message..."      // Optional: Custom message
  confirmText="Clear Sessions"                  // Optional: Custom confirm button text
  cancelText="Cancel"                          // Optional: Custom cancel button text
/>
```

### `SessionClearButton`

A ready-to-use button component that handles the entire session clearing flow.

```javascript
import { SessionClearButton } from '../components/common'

<SessionClearButton
  variant="secondary"
  size="md"
  onSuccess={(result) => console.log('Sessions cleared:', result)}
  onError={(error) => console.error('Failed to clear sessions:', error)}
>
  Clear All Sessions
</SessionClearButton>
```

## Usage Examples

### Basic Usage with Confirmation

```javascript
import { manualSessionClear } from '../services/appwrite/auth.js'
import { useDispatch } from 'react-redux'

function LoginPage() {
  const dispatch = useDispatch()

  const handleClearSessions = async () => {
    const result = await manualSessionClear({
      dispatch,
      requireConfirmation: true
    })
    
    if (result.success) {
      alert('All sessions cleared successfully!')
    } else if (result.cancelled) {
      console.log('User cancelled session clearing')
    } else {
      alert('Failed to clear sessions: ' + result.userMessage)
    }
  }

  return (
    <button onClick={handleClearSessions}>
      Clear All Sessions
    </button>
  )
}
```

### Custom Confirmation Handler

```javascript
const customConfirmation = async (message) => {
  // Use a custom modal or confirmation dialog
  return await showCustomConfirmDialog({
    title: 'Clear Sessions',
    message,
    confirmText: 'Yes, Clear All',
    cancelText: 'Cancel'
  })
}

const result = await manualSessionClear({
  dispatch,
  onConfirm: customConfirmation,
  onSuccess: (result) => {
    showNotification('Sessions cleared successfully!', 'success')
  },
  onError: (error) => {
    showNotification('Failed to clear sessions', 'error')
  }
})
```

### Integration with Error Handling

```javascript
import { useManualSessionClear } from '../hooks/useManualSessionClear.js'
import { useNotification } from '../hooks/useNotification.js'

function SessionManagement() {
  const { showNotification } = useNotification()
  const {
    showConfirmation,
    hideConfirmation,
    clearAllSessions,
    isConfirmationOpen,
    isClearing,
    result,
    hasError,
    hasSuccess
  } = useManualSessionClear()

  // Show notifications based on result
  useEffect(() => {
    if (hasSuccess) {
      showNotification(result.message, 'success')
    } else if (hasError) {
      showNotification(result.message, 'error')
    }
  }, [hasSuccess, hasError, result])

  return (
    <div>
      <button onClick={showConfirmation}>
        Clear All Sessions
      </button>
      
      <SessionClearConfirmation
        isOpen={isConfirmationOpen}
        onClose={hideConfirmation}
        onConfirm={clearAllSessions}
        loading={isClearing}
      />
    </div>
  )
}
```

## Error Handling

The utility provides comprehensive error handling with different types of errors:

### Session Conflict Types

- `RESOLUTION_IN_PROGRESS`: Session clearing is in progress
- `RESOLUTION_SUCCESS`: Session clearing completed successfully
- `ALL_SESSIONS_CLEAR_FAILED`: Failed to clear all sessions

### Error Recovery

When session clearing fails, the utility:

1. Logs detailed error information for debugging
2. Provides user-friendly error messages
3. Updates Redux state appropriately
4. Calls error callbacks with detailed information
5. Returns structured error results for programmatic handling

## Requirements Satisfied

This implementation satisfies the following requirements:

- **Requirement 3.1**: Users can sign out from all sessions when encountering conflicts
- **Requirement 3.3**: System confirms the action and prompts for fresh login after clearing all sessions

The utility provides:

1. **Enhanced Error Handling**: Comprehensive error logging and user-friendly messages
2. **User Confirmation Flow**: Customizable confirmation dialogs with proper UX
3. **Success/Failure Feedback**: Clear feedback mechanisms for all operation outcomes
4. **Redux Integration**: Proper state management during session clearing operations
5. **Flexible API**: Multiple usage patterns from simple function calls to full UI integration

## Testing

The utility includes comprehensive tests covering:

- Successful session clearing with and without confirmation
- User cancellation scenarios
- Error handling for various failure modes
- Callback execution and state management
- Edge cases and error recovery

Run tests with:

```bash
npm test -- src/test/auth/manualSessionClear.test.js
npm test -- src/test/hooks/useManualSessionClear.test.jsx
```