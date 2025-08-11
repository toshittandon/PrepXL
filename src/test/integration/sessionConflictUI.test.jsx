import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import authSlice from '../../store/slices/authSlice.js'

// Mock theme context to avoid matchMedia issues
vi.mock('../../contexts/ThemeContext.jsx', () => ({
  ThemeProvider: ({ children }) => children,
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    systemTheme: 'light'
  })
}))

// Mock Appwrite services
vi.mock('../../services/appwrite/auth.js', () => ({
  signInWithEmail: vi.fn(),
  signOutFromAllSessions: vi.fn(),
  getCurrentUserWithProfile: vi.fn()
}))

// Mock error handling utilities
vi.mock('../../utils/errorHandling.js', () => ({
  getSessionConflictUserMessage: vi.fn(),
  logSessionConflictError: vi.fn(),
  SESSION_CONFLICT_TYPES: {
    RESOLUTION_IN_PROGRESS: 'RESOLUTION_IN_PROGRESS',
    RESOLUTION_SUCCESS: 'RESOLUTION_SUCCESS',
    CURRENT_SESSION_CLEAR_FAILED: 'CURRENT_SESSION_CLEAR_FAILED',
    ALL_SESSIONS_CLEAR_FAILED: 'ALL_SESSIONS_CLEAR_FAILED'
  },
  createSessionConflictError: vi.fn()
}))

// Mock validation schemas
vi.mock('../../utils/validationSchemas.js', () => ({
  loginSchema: {
    parse: vi.fn((data) => data)
  }
}))

// Mock form validation hook with working implementation
vi.mock('../../hooks/useFormValidation.js', () => ({
  useFormValidation: ({ onSubmit, onError }) => {
    const mockRegister = vi.fn((name) => ({
      name,
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn()
    }))

    const mockHandleSubmit = vi.fn((callback) => async (e) => {
      if (e && e.preventDefault) e.preventDefault()
      try {
        await onSubmit({
          email: 'test@example.com',
          password: 'password123'
        })
      } catch (error) {
        if (onError) onError(error)
      }
    })

    return {
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: { errors: {} },
      isSubmitting: false,
      submitError: null,
      submitSuccess: false,
      clearAllErrors: vi.fn(),
      resetForm: vi.fn()
    }
  }
}))

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice
    },
    preloadedState: {
      auth: {
        user: null,
        session: null,
        loading: false,
        error: null,
        sessionConflictResolution: {
          inProgress: false,
          method: null,
          resolved: false
        },
        ...initialState
      }
    }
  })
}

const TestWrapper = ({ store, children }) => (
  <Provider store={store}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
)

// Simple test component that displays session conflict resolution state
const SessionConflictDisplay = () => {
  const { useSelector } = require('react-redux')
  const { 
    selectIsSessionConflictInProgress,
    selectSessionConflictMethod,
    selectSessionConflictResolution
  } = require('../../store/slices/authSlice.js')
  
  const isInProgress = useSelector(selectIsSessionConflictInProgress)
  const method = useSelector(selectSessionConflictMethod)
  const resolution = useSelector(selectSessionConflictResolution)

  if (isInProgress) {
    return (
      <div data-testid="session-conflict-progress">
        <h4>Resolving Session Conflict</h4>
        <p>
          {method === 'CURRENT' 
            ? 'Clearing current session and logging you in...'
            : method === 'ALL'
            ? 'Clearing all sessions for security and logging you in...'
            : 'Detecting session conflict and resolving...'
          }
        </p>
      </div>
    )
  }

  if (resolution.resolved && !isInProgress) {
    return (
      <div data-testid="session-conflict-resolved">
        <h4>Session Conflict Resolved</h4>
        <p>
          {method === 'ALL' 
            ? 'All sessions cleared successfully. You can now log in.'
            : 'Previous session cleared successfully. You can now log in.'
          }
        </p>
      </div>
    )
  }

  return <div data-testid="no-session-conflict">No session conflict</div>
}

describe('Session Conflict Resolution UI Integration Tests', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    store = createTestStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('User Experience During Conflict Scenarios', () => {
    it('should display session conflict resolution progress to user', async () => {
      const store = createTestStore({
        sessionConflictResolution: {
          inProgress: true,
          method: 'CURRENT',
          resolved: false
        }
      })

      render(
        <TestWrapper store={store}>
          <SessionConflictDisplay />
        </TestWrapper>
      )

      // Should show resolution progress
      expect(screen.getByTestId('session-conflict-progress')).toBeInTheDocument()
      expect(screen.getByText('Resolving Session Conflict')).toBeInTheDocument()
      expect(screen.getByText('Clearing current session and logging you in...')).toBeInTheDocument()
    })

    it('should display all sessions clearing progress', async () => {
      const store = createTestStore({
        sessionConflictResolution: {
          inProgress: true,
          method: 'ALL',
          resolved: false
        }
      })

      render(
        <TestWrapper store={store}>
          <SessionConflictDisplay />
        </TestWrapper>
      )

      // Should show all sessions clearing progress
      expect(screen.getByTestId('session-conflict-progress')).toBeInTheDocument()
      expect(screen.getByText('Resolving Session Conflict')).toBeInTheDocument()
      expect(screen.getByText('Clearing all sessions for security and logging you in...')).toBeInTheDocument()
    })

    it('should display session conflict resolution success message', async () => {
      const store = createTestStore({
        sessionConflictResolution: {
          inProgress: false,
          method: 'CURRENT',
          resolved: true
        }
      })

      render(
        <TestWrapper store={store}>
          <SessionConflictDisplay />
        </TestWrapper>
      )

      // Should show success message
      expect(screen.getByTestId('session-conflict-resolved')).toBeInTheDocument()
      expect(screen.getByText('Session Conflict Resolved')).toBeInTheDocument()
      expect(screen.getByText('Previous session cleared successfully. You can now log in.')).toBeInTheDocument()
    })

    it('should display all sessions clearing success message', async () => {
      const store = createTestStore({
        sessionConflictResolution: {
          inProgress: false,
          method: 'ALL',
          resolved: true
        }
      })

      render(
        <TestWrapper store={store}>
          <SessionConflictDisplay />
        </TestWrapper>
      )

      // Should show all sessions success message
      expect(screen.getByTestId('session-conflict-resolved')).toBeInTheDocument()
      expect(screen.getByText('Session Conflict Resolved')).toBeInTheDocument()
      expect(screen.getByText('All sessions cleared successfully. You can now log in.')).toBeInTheDocument()
    })

    it('should show no conflict state when no session conflict is active', () => {
      const store = createTestStore({
        sessionConflictResolution: {
          inProgress: false,
          method: null,
          resolved: false
        }
      })

      render(
        <TestWrapper store={store}>
          <SessionConflictDisplay />
        </TestWrapper>
      )

      expect(screen.getByTestId('no-session-conflict')).toBeInTheDocument()
      expect(screen.getByText('No session conflict')).toBeInTheDocument()
    })
  })

  describe('State Transitions in UI', () => {
    it('should update UI when session conflict resolution state changes', async () => {
      const { rerender } = render(
        <TestWrapper store={store}>
          <SessionConflictDisplay />
        </TestWrapper>
      )

      // Initially no conflict
      expect(screen.getByTestId('no-session-conflict')).toBeInTheDocument()

      // Start session conflict resolution
      const { sessionConflictStart } = require('../../store/slices/authSlice.js')
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))

      rerender(
        <TestWrapper store={store}>
          <SessionConflictDisplay />
        </TestWrapper>
      )

      // Should show progress
      expect(screen.getByTestId('session-conflict-progress')).toBeInTheDocument()
      expect(screen.getByText('Clearing current session and logging you in...')).toBeInTheDocument()

      // Resolve conflict
      const { sessionConflictResolved } = require('../../store/slices/authSlice.js')
      store.dispatch(sessionConflictResolved({ method: 'CURRENT' }))

      rerender(
        <TestWrapper store={store}>
          <SessionConflictDisplay />
        </TestWrapper>
      )

      // Should show resolved state
      expect(screen.getByTestId('session-conflict-resolved')).toBeInTheDocument()
      expect(screen.getByText('Previous session cleared successfully. You can now log in.')).toBeInTheDocument()
    })

    it('should handle transition from current session to all sessions clearing', async () => {
      const { rerender } = render(
        <TestWrapper store={store}>
          <SessionConflictDisplay />
        </TestWrapper>
      )

      const { sessionConflictStart } = require('../../store/slices/authSlice.js')

      // Start with current session clearing
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))

      rerender(
        <TestWrapper store={store}>
          <SessionConflictDisplay />
        </TestWrapper>
      )

      expect(screen.getByText('Clearing current session and logging you in...')).toBeInTheDocument()

      // Fallback to all sessions clearing
      store.dispatch(sessionConflictStart({ method: 'ALL' }))

      rerender(
        <TestWrapper store={store}>
          <SessionConflictDisplay />
        </TestWrapper>
      )

      expect(screen.getByText('Clearing all sessions for security and logging you in...')).toBeInTheDocument()
    })

    it('should handle session conflict failure state', async () => {
      const { rerender } = render(
        <TestWrapper store={store}>
          <SessionConflictDisplay />
        </TestWrapper>
      )

      const { sessionConflictStart, sessionConflictFailed } = require('../../store/slices/authSlice.js')

      // Start session conflict resolution
      store.dispatch(sessionConflictStart({ method: 'CURRENT' }))

      rerender(
        <TestWrapper store={store}>
          <SessionConflictDisplay />
        </TestWrapper>
      )

      expect(screen.getByTestId('session-conflict-progress')).toBeInTheDocument()

      // Fail the resolution
      store.dispatch(sessionConflictFailed())

      rerender(
        <TestWrapper store={store}>
          <SessionConflictDisplay />
        </TestWrapper>
      )

      // Should return to no conflict state
      expect(screen.getByTestId('no-session-conflict')).toBeInTheDocument()
    })
  })

  describe('Manual Session Clearing UI Integration', () => {
    it('should provide manual session clearing functionality', async () => {
      const ManualClearComponent = () => {
        const { useState } = require('react')
        const { useDispatch } = require('react-redux')
        const [clearing, setClearing] = useState(false)
        const dispatch = useDispatch()

        const handleManualClear = async () => {
          setClearing(true)
          const { signOutFromAllSessions } = await import('../../services/appwrite/auth.js')
          const { sessionConflictStart, sessionConflictResolved } = await import('../../store/slices/authSlice.js')
          
          try {
            dispatch(sessionConflictStart({ method: 'ALL' }))
            await signOutFromAllSessions()
            dispatch(sessionConflictResolved({ method: 'ALL' }))
          } catch (error) {
            console.error('Manual clear failed:', error)
          } finally {
            setClearing(false)
          }
        }

        return (
          <div>
            <button 
              onClick={handleManualClear}
              disabled={clearing}
              data-testid="manual-clear-button"
            >
              {clearing ? 'Clearing Sessions...' : 'Clear All Sessions'}
            </button>
          </div>
        )
      }

      const mockSignOutFromAllSessions = vi.fn().mockResolvedValue()
      const authModule = await import('../../services/appwrite/auth.js')
      authModule.signOutFromAllSessions.mockImplementation(mockSignOutFromAllSessions)

      render(
        <TestWrapper store={store}>
          <ManualClearComponent />
        </TestWrapper>
      )

      const clearButton = screen.getByTestId('manual-clear-button')
      expect(clearButton).toBeInTheDocument()
      expect(clearButton).toHaveTextContent('Clear All Sessions')

      // Click the manual clear button
      fireEvent.click(clearButton)

      // Should show clearing state
      await waitFor(() => {
        expect(clearButton).toHaveTextContent('Clearing Sessions...')
        expect(clearButton).toBeDisabled()
      })

      // Wait for completion
      await waitFor(() => {
        expect(mockSignOutFromAllSessions).toHaveBeenCalled()
      })

      // Should return to normal state
      await waitFor(() => {
        expect(clearButton).toHaveTextContent('Clear All Sessions')
        expect(clearButton).not.toBeDisabled()
      })
    })
  })

  describe('Error Display Integration', () => {
    it('should display session conflict error messages', () => {
      const ErrorDisplayComponent = () => {
        const { useSelector } = require('react-redux')
        const error = useSelector(state => state.auth.error)

        if (!error) return <div data-testid="no-error">No error</div>

        return (
          <div data-testid="error-display">
            <p>{error}</p>
            {error.includes('session conflict') && (
              <button data-testid="manual-clear-option">
                Clear All Sessions
              </button>
            )}
          </div>
        )
      }

      const storeWithError = createTestStore({
        error: 'Unable to resolve session conflict. Please try manual session clearing.'
      })

      render(
        <TestWrapper store={storeWithError}>
          <ErrorDisplayComponent />
        </TestWrapper>
      )

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Unable to resolve session conflict. Please try manual session clearing.')).toBeInTheDocument()
      expect(screen.getByTestId('manual-clear-option')).toBeInTheDocument()
    })

    it('should not show manual clear option for non-session-conflict errors', () => {
      const ErrorDisplayComponent = () => {
        const { useSelector } = require('react-redux')
        const error = useSelector(state => state.auth.error)

        if (!error) return <div data-testid="no-error">No error</div>

        return (
          <div data-testid="error-display">
            <p>{error}</p>
            {error.includes('session conflict') && (
              <button data-testid="manual-clear-option">
                Clear All Sessions
              </button>
            )}
          </div>
        )
      }

      const storeWithError = createTestStore({
        error: 'Invalid credentials. Please try again.'
      })

      render(
        <TestWrapper store={storeWithError}>
          <ErrorDisplayComponent />
        </TestWrapper>
      )

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Invalid credentials. Please try again.')).toBeInTheDocument()
      expect(screen.queryByTestId('manual-clear-option')).not.toBeInTheDocument()
    })
  })

  describe('Loading States Integration', () => {
    it('should display loading states during session conflict resolution', () => {
      const LoadingDisplayComponent = () => {
        const { useSelector } = require('react-redux')
        const loading = useSelector(state => state.auth.loading)
        const isSessionConflictInProgress = useSelector(state => state.auth.sessionConflictResolution.inProgress)

        if (loading || isSessionConflictInProgress) {
          return <div data-testid="loading-state">Processing...</div>
        }

        return <div data-testid="not-loading">Ready</div>
      }

      // Test loading state
      const loadingStore = createTestStore({
        loading: true,
        sessionConflictResolution: {
          inProgress: false,
          method: null,
          resolved: false
        }
      })

      const { rerender } = render(
        <TestWrapper store={loadingStore}>
          <LoadingDisplayComponent />
        </TestWrapper>
      )

      expect(screen.getByTestId('loading-state')).toBeInTheDocument()

      // Test session conflict in progress
      const conflictStore = createTestStore({
        loading: false,
        sessionConflictResolution: {
          inProgress: true,
          method: 'CURRENT',
          resolved: false
        }
      })

      rerender(
        <TestWrapper store={conflictStore}>
          <LoadingDisplayComponent />
        </TestWrapper>
      )

      expect(screen.getByTestId('loading-state')).toBeInTheDocument()

      // Test not loading
      const readyStore = createTestStore({
        loading: false,
        sessionConflictResolution: {
          inProgress: false,
          method: null,
          resolved: false
        }
      })

      rerender(
        <TestWrapper store={readyStore}>
          <LoadingDisplayComponent />
        </TestWrapper>
      )

      expect(screen.getByTestId('not-loading')).toBeInTheDocument()
    })
  })
})