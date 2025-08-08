import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import Button from './Button'
import { logError } from '../../services/errorLogging'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo
    })

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Log to external service in production
    this.logErrorToService(error, errorInfo)
  }

  logErrorToService = async (error, errorInfo) => {
    try {
      await logError(error, {
        component: 'ErrorBoundary',
        action: 'component_crash',
        userId: this.props.userId || 'anonymous',
        additionalData: {
          componentStack: errorInfo.componentStack,
          errorId: this.state.errorId,
          props: this.props
        }
      })
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError)
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  handleReportBug = () => {
    const errorDetails = {
      message: this.state.error?.message || 'Unknown error',
      stack: this.state.error?.stack || 'No stack trace',
      errorId: this.state.errorId,
      timestamp: new Date().toISOString()
    }

    // Create mailto link with error details
    const subject = encodeURIComponent(`Bug Report - Error ID: ${this.state.errorId}`)
    const body = encodeURIComponent(`
Error Details:
- Message: ${errorDetails.message}
- Error ID: ${errorDetails.errorId}
- Timestamp: ${errorDetails.timestamp}
- URL: ${window.location.href}

Please describe what you were doing when this error occurred:
[Your description here]

Technical Details:
${errorDetails.stack}
    `)

    window.open(`mailto:support@interviewprep.ai?subject=${subject}&body=${body}`)
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry)
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </motion.div>

            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Oops! Something went wrong
            </h1>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We encountered an unexpected error. Don't worry, our team has been notified and we're working on a fix.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <motion.details
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-6 text-left bg-gray-100 dark:bg-gray-700 rounded-lg p-3"
              >
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </motion.details>
            )}

            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                variant="primary"
                className="w-full"
                icon={RefreshCw}
              >
                Try Again
              </Button>

              <Button
                onClick={this.handleGoHome}
                variant="secondary"
                className="w-full"
                icon={Home}
              >
                Go to Dashboard
              </Button>

              <Button
                onClick={this.handleReportBug}
                variant="outline"
                className="w-full"
                icon={Bug}
              >
                Report Bug
              </Button>
            </div>

            {this.state.errorId && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Error ID: {this.state.errorId}
              </p>
            )}
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary