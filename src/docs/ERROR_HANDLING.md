# Comprehensive Error Handling System

This document describes the comprehensive error handling and user feedback system implemented in the InterviewPrep AI application.

## Overview

The error handling system provides:
- Global error boundary for unhandled React errors
- Notification system with animations and user feedback
- Error recovery mechanisms and retry logic
- User-friendly error messages for all failure scenarios
- Offline detection and graceful degradation
- Error logging and monitoring integration

## Components

### 1. ErrorBoundary (`src/components/common/ErrorBoundary.jsx`)

A React Error Boundary component that catches unhandled JavaScript errors in the component tree.

**Features:**
- Catches and displays user-friendly error messages
- Provides retry, go home, and report bug actions
- Logs errors to external monitoring services
- Shows error details in development mode
- Generates unique error IDs for tracking

**Usage:**
```jsx
<ErrorBoundary userId={user?.id}>
  <App />
</ErrorBoundary>
```

### 2. NotificationSystem (`src/components/common/NotificationSystem.jsx`)

A global notification system that displays toast notifications for user feedback.

**Features:**
- Success, error, warning, and info notifications
- Auto-hide functionality with customizable duration
- Persistent notifications that require manual dismissal
- Action buttons for user interaction
- Smooth animations with Framer Motion

**Notification Types:**
- `success`: Green notifications for successful operations
- `error`: Red notifications for errors
- `warning`: Yellow notifications for warnings
- `info`: Blue notifications for information

### 3. ServiceUnavailable Components (`src/components/common/ServiceUnavailable.jsx`)

Components for graceful degradation when services are unavailable.

**Components:**
- `ServiceUnavailable`: Generic service unavailable message
- `AIServiceUnavailable`: Specific for AI analysis service
- `DatabaseUnavailable`: For database connection issues
- `SpeechServiceUnavailable`: For speech recognition issues
- `OfflineMode`: For offline state indication

### 4. Error Utilities (`src/utils/errorUtils.js`)

Utility functions for error handling, categorization, and user-friendly messaging.

**Key Functions:**
- `categorizeError()`: Categorizes errors by type (network, auth, validation, etc.)
- `getUserFriendlyMessage()`: Converts technical errors to user-friendly messages
- `getErrorSeverity()`: Determines error severity level
- `isRetryableError()`: Checks if an error can be retried
- `retryWithBackoff()`: Implements exponential backoff retry logic
- `handleError()`: Main error handler that dispatches notifications

**Error Types:**
- `NETWORK`: Network connectivity issues
- `AUTHENTICATION`: Authentication failures
- `AUTHORIZATION`: Permission denied errors
- `VALIDATION`: Input validation errors
- `SERVER`: Server-side errors (5xx)
- `CLIENT`: Client-side errors (4xx)
- `UNKNOWN`: Unclassified errors

### 5. API Error Handler (`src/utils/apiErrorHandler.js`)

Specialized error handling for API operations and RTK Query.

**Features:**
- RTK Query error logging middleware
- Enhanced fetch base query with retry logic
- Context-specific error handlers (auth, file upload, interview, resume analysis)
- Graceful degradation helpers
- Fallback data creation

**Specialized Handlers:**
- `handleAuthError()`: Authentication-specific error handling
- `handleFileUploadError()`: File upload error handling
- `handleInterviewError()`: Interview session error handling
- `handleResumeAnalysisError()`: Resume analysis error handling

### 6. Error Logging Service (`src/services/errorLogging.js`)

Comprehensive error logging and monitoring service.

**Features:**
- Rate limiting to prevent spam
- Error context collection (user, browser, performance data)
- Integration with external monitoring services (Sentry, LogRocket, Bugsnag)
- Console logging for development
- Performance issue logging
- User action logging

**Configuration:**
```javascript
const ERROR_LOGGING_CONFIG = {
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableRemoteLogging: process.env.NODE_ENV === 'production',
  errorSamplingRate: 1.0,
  performanceSamplingRate: 0.1,
  maxErrorsPerMinute: 10,
  maxErrorsPerSession: 50
}
```

## Hooks

### 1. useErrorHandler (`src/hooks/useErrorHandler.js`)

Custom hook that provides error handling functionality to components.

**Methods:**
- `handleError()`: Handle errors with notifications
- `withRetry()`: Wrap operations with retry logic
- `notifySuccess()`: Show success notifications
- `notifyWarning()`: Show warning notifications
- `notifyInfo()`: Show info notifications
- `createContextHandler()`: Create context-specific error handlers
- `handleAsyncOperation()`: Handle async operations with loading states

**Usage:**
```jsx
const { handleError, withRetry, notifySuccess } = useErrorHandler()

const handleSubmit = async () => {
  try {
    const result = await withRetry(apiCall, {
      maxRetries: 3,
      context: 'Form Submission'
    })
    notifySuccess('Form submitted successfully!')
  } catch (error) {
    handleError(error, 'Form Submission')
  }
}
```

### 2. useOfflineDetection (`src/hooks/useOfflineDetection.js`)

Hook for detecting online/offline status and showing appropriate notifications.

**Features:**
- Automatic online/offline detection
- Persistent offline notifications
- Connection restored notifications
- Periodic connection checks when offline
- Retry functionality for connection testing

**Usage:**
```jsx
const { isOnline, wasOffline } = useOfflineDetection()
```

## Integration

### Redux Store Integration

The error handling system is integrated with Redux through:

1. **UI Slice**: Manages notification state
2. **Error Middleware**: RTK Query error logging middleware
3. **Enhanced Base Query**: Retry logic for API calls

### Global Setup

Error handling is initialized in `src/main.jsx`:

```jsx
import { initializeErrorLogging } from './services/errorLogging.js'

// Initialize error logging
initializeErrorLogging()
```

### App-Level Integration

The main App component includes:

```jsx
<ErrorBoundary userId={user?.id}>
  <Router>
    {/* App content */}
    <NotificationSystem />
  </Router>
</ErrorBoundary>
```

## Error Recovery Mechanisms

### 1. Automatic Retry

- Network errors are automatically retried with exponential backoff
- Configurable retry attempts and delays
- Smart retry logic that avoids retrying non-retryable errors

### 2. Graceful Degradation

- Service unavailable components for when APIs are down
- Fallback data for critical functionality
- Offline mode support with limited functionality

### 3. User-Initiated Recovery

- Retry buttons in error notifications
- "Try Again" actions in error boundaries
- Manual refresh options for failed operations

## User Experience Features

### 1. Progressive Error Disclosure

- Simple error messages for users
- Detailed error information for developers (development mode)
- Error IDs for support ticket correlation

### 2. Contextual Error Messages

- Error messages tailored to the specific operation
- Actionable suggestions for error resolution
- Clear next steps for users

### 3. Visual Feedback

- Animated notifications with smooth transitions
- Color-coded error severity (red for errors, yellow for warnings)
- Loading states during retry operations

## Testing

### Error Handling Test Suite

A comprehensive test component (`src/components/debug/ErrorHandlingTest.jsx`) is available for testing all error handling functionality:

- Error type tests (network, auth, validation, server)
- Notification type tests (success, warning, info, persistent)
- Advanced functionality tests (retry mechanism, error logging, error boundary)
- Service unavailable component tests

### Usage in Development

1. Navigate to the test component in development mode
2. Click test buttons to trigger different error scenarios
3. Observe notifications and error handling behavior
4. Check console for error logging output

## Configuration

### Environment Variables

```env
# Error Monitoring Services (Production)
VITE_SENTRY_DSN=your-sentry-dsn
VITE_LOGROCKET_APP_ID=your-logrocket-app-id
VITE_BUGSNAG_API_KEY=your-bugsnag-api-key
```

### Customization

Error handling behavior can be customized through:

1. **Error Utils Configuration**: Modify error categorization and messages
2. **Logging Configuration**: Adjust sampling rates and rate limits
3. **Notification Settings**: Customize auto-hide durations and styles
4. **Retry Configuration**: Modify retry attempts and backoff strategies

## Best Practices

### 1. Error Handling in Components

```jsx
const MyComponent = () => {
  const { handleAsyncOperation } = useErrorHandler()

  const handleAction = () => {
    handleAsyncOperation(
      () => apiCall(),
      {
        context: 'My Action',
        successMessage: 'Action completed successfully!',
        onError: (error) => {
          // Custom error handling if needed
        }
      }
    )
  }
}
```

### 2. API Error Handling

```jsx
// In RTK Query endpoints
const api = createApi({
  baseQuery: createEnhancedBaseQuery(fetchBaseQuery({
    baseUrl: '/api'
  })),
  endpoints: (builder) => ({
    getData: builder.query({
      query: () => '/data',
      // Errors are automatically handled by middleware
    })
  })
})
```

### 3. Custom Error Types

```jsx
// Create custom error types for specific scenarios
class ValidationError extends Error {
  constructor(message, field) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.type = 'document_invalid'
  }
}
```

## Monitoring and Analytics

The error handling system provides comprehensive monitoring capabilities:

1. **Error Frequency**: Track error rates and patterns
2. **Error Categories**: Monitor different types of errors
3. **User Impact**: Understand how errors affect user experience
4. **Recovery Success**: Track retry success rates
5. **Performance Impact**: Monitor error handling performance

## Future Enhancements

Potential improvements to the error handling system:

1. **Machine Learning**: Predictive error detection and prevention
2. **A/B Testing**: Test different error message strategies
3. **User Feedback**: Collect user feedback on error experiences
4. **Advanced Analytics**: Deeper insights into error patterns
5. **Automated Recovery**: More sophisticated automatic error recovery