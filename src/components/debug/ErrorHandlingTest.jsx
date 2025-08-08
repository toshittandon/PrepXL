import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Bug, AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import Button from '../common/Button'
import Card from '../common/Card'
import { addNotification } from '../../store/slices/uiSlice'
import useErrorHandler from '../../hooks/useErrorHandler'
import { logError } from '../../services/errorLogging'
import { ServiceUnavailable, AIServiceUnavailable, SpeechServiceUnavailable } from '../common/ServiceUnavailable'

const ErrorHandlingTest = () => {
  const dispatch = useDispatch()
  const { handleError, notifySuccess, notifyWarning, notifyInfo, withRetry } = useErrorHandler()
  const [testResults, setTestResults] = useState([])

  const addTestResult = (test, success, message) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      test,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  // Test different error types
  const testNetworkError = () => {
    const error = new Error('Network request failed')
    error.name = 'NetworkError'
    error.code = 'NETWORK_ERROR'
    
    handleError(error, 'Network Test')
    addTestResult('Network Error', true, 'Network error notification shown')
  }

  const testAuthError = () => {
    const error = new Error('Unauthorized access')
    error.status = 401
    
    handleError(error, 'Authentication Test')
    addTestResult('Auth Error', true, 'Authentication error notification shown')
  }

  const testValidationError = () => {
    const error = new Error('Invalid input data')
    error.type = 'document_invalid'
    
    handleError(error, 'Validation Test')
    addTestResult('Validation Error', true, 'Validation error notification shown')
  }

  const testServerError = () => {
    const error = new Error('Internal server error')
    error.status = 500
    
    handleError(error, 'Server Test')
    addTestResult('Server Error', true, 'Server error notification shown')
  }

  // Test notification types
  const testSuccessNotification = () => {
    notifySuccess('Test operation completed successfully!', {
      title: 'Success Test',
      duration: 3000
    })
    addTestResult('Success Notification', true, 'Success notification shown')
  }

  const testWarningNotification = () => {
    notifyWarning('This is a test warning message', {
      title: 'Warning Test',
      duration: 4000
    })
    addTestResult('Warning Notification', true, 'Warning notification shown')
  }

  const testInfoNotification = () => {
    notifyInfo('This is a test information message', {
      title: 'Info Test',
      duration: 3000
    })
    addTestResult('Info Notification', true, 'Info notification shown')
  }

  const testPersistentNotification = () => {
    dispatch(addNotification({
      type: 'error',
      title: 'Persistent Error Test',
      message: 'This error will stay until manually dismissed',
      persistent: true,
      actions: [
        {
          label: 'Dismiss',
          onClick: () => {
            addTestResult('Persistent Notification', true, 'Persistent notification dismissed')
          },
          variant: 'secondary'
        }
      ]
    }))
    addTestResult('Persistent Notification', true, 'Persistent notification shown')
  }

  // Test retry functionality
  const testRetryMechanism = async () => {
    let attempts = 0
    const failingOperation = async () => {
      attempts++
      if (attempts < 3) {
        throw new Error(`Attempt ${attempts} failed`)
      }
      return 'Success after retries'
    }

    try {
      const result = await withRetry(failingOperation, {
        maxRetries: 3,
        context: 'Retry Test',
        showRetryNotification: true
      })
      addTestResult('Retry Mechanism', true, `${result} (${attempts} attempts)`)
    } catch (error) {
      addTestResult('Retry Mechanism', false, `Failed after ${attempts} attempts`)
    }
  }

  // Test error logging
  const testErrorLogging = async () => {
    const testError = new Error('Test error for logging')
    testError.stack = 'Test stack trace'
    
    try {
      await logError(testError, {
        component: 'ErrorHandlingTest',
        action: 'test_error_logging',
        userId: 'test-user',
        additionalData: { testData: 'test value' }
      })
      addTestResult('Error Logging', true, 'Error logged successfully (check console)')
    } catch (error) {
      addTestResult('Error Logging', false, 'Error logging failed')
    }
  }

  // Test React Error Boundary (this will crash the component)
  const testErrorBoundary = () => {
    throw new Error('Test error boundary - this should be caught!')
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Error Handling Test Suite
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Test all error handling components and functionality
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Type Tests */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Error Type Tests
          </h2>
          <div className="space-y-2">
            <Button onClick={testNetworkError} variant="outline" size="sm" className="w-full">
              Test Network Error
            </Button>
            <Button onClick={testAuthError} variant="outline" size="sm" className="w-full">
              Test Auth Error
            </Button>
            <Button onClick={testValidationError} variant="outline" size="sm" className="w-full">
              Test Validation Error
            </Button>
            <Button onClick={testServerError} variant="outline" size="sm" className="w-full">
              Test Server Error
            </Button>
          </div>
        </Card>

        {/* Notification Tests */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Bug className="w-5 h-5 mr-2 text-blue-500" />
            Notification Tests
          </h2>
          <div className="space-y-2">
            <Button onClick={testSuccessNotification} variant="outline" size="sm" className="w-full">
              Test Success Notification
            </Button>
            <Button onClick={testWarningNotification} variant="outline" size="sm" className="w-full">
              Test Warning Notification
            </Button>
            <Button onClick={testInfoNotification} variant="outline" size="sm" className="w-full">
              Test Info Notification
            </Button>
            <Button onClick={testPersistentNotification} variant="outline" size="sm" className="w-full">
              Test Persistent Notification
            </Button>
          </div>
        </Card>

        {/* Advanced Tests */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <RefreshCw className="w-5 h-5 mr-2 text-green-500" />
            Advanced Tests
          </h2>
          <div className="space-y-2">
            <Button onClick={testRetryMechanism} variant="outline" size="sm" className="w-full">
              Test Retry Mechanism
            </Button>
            <Button onClick={testErrorLogging} variant="outline" size="sm" className="w-full">
              Test Error Logging
            </Button>
            <Button onClick={testErrorBoundary} variant="danger" size="sm" className="w-full">
              Test Error Boundary (Crashes!)
            </Button>
          </div>
        </Card>

        {/* Service Unavailable Components */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Service Unavailable Components</h2>
          <div className="space-y-4">
            <ServiceUnavailable
              service="Test Service"
              onRetry={() => addTestResult('Service Unavailable', true, 'Retry clicked')}
            />
            <AIServiceUnavailable
              onRetry={() => addTestResult('AI Service', true, 'AI service retry clicked')}
            />
            <SpeechServiceUnavailable
              onRetry={() => addTestResult('Speech Service', true, 'Speech retry clicked')}
              onSwitchToText={() => addTestResult('Speech Service', true, 'Switch to text clicked')}
            />
          </div>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card className="p-4 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Test Results</h2>
            <Button onClick={clearResults} variant="outline" size="sm">
              Clear Results
            </Button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {testResults.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-2 rounded border-l-4 ${
                  result.success 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                    : 'border-red-500 bg-red-50 dark:bg-red-900/10'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{result.test}</span>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {result.message}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {result.timestamp}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default ErrorHandlingTest