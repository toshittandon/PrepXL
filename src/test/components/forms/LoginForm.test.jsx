import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from '../../../contexts/ThemeContext.jsx'
import LoginForm from '../../../components/forms/LoginForm.jsx'
import authSlice from '../../../store/slices/authSlice.js'

const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice
    }
  })
}

const TestWrapper = ({ children }) => {
  const store = createTestStore()
  return (
    <Provider store={store}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </Provider>
  )
}

describe('LoginForm Component', () => {
  it('renders login form with all fields', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('handles form input changes', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    expect(emailInput.value).toBe('test@example.com')
    expect(passwordInput.value).toBe('password123')
  })

  it('shows validation errors for empty fields', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
  })

  it('calls onSubmit with form data when valid', async () => {
    const mockOnSubmit = vi.fn()
    
    render(
      <TestWrapper>
        <LoginForm onSubmit={mockOnSubmit} />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  it('shows loading state during submission', async () => {
    const mockOnSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(
      <TestWrapper>
        <LoginForm onSubmit={mockOnSubmit} />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
  })

  it('displays error message when submission fails', async () => {
    const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Login failed'))
    
    render(
      <TestWrapper>
        <LoginForm onSubmit={mockOnSubmit} />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument()
    })
  })

  it('has password visibility toggle', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButton = screen.getByRole('button', { name: /show password/i })
    
    expect(passwordInput.type).toBe('password')
    
    fireEvent.click(toggleButton)
    expect(passwordInput.type).toBe('text')
    
    fireEvent.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  // Note: OAuth buttons and signup links are not part of the current LoginForm implementation
  // These would be handled by the parent component or page

  it('applies proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('autocomplete', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
  })

  it('displays session conflict resolution status when in progress', () => {
    const store = configureStore({
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
            inProgress: true,
            method: 'CURRENT',
            resolved: false
          }
        }
      }
    })

    render(
      <Provider store={store}>
        <ThemeProvider>
          <LoginForm />
        </ThemeProvider>
      </Provider>
    )
    
    expect(screen.getByText(/resolving session conflict/i)).toBeInTheDocument()
    expect(screen.getByText(/clearing current session/i)).toBeInTheDocument()
  })

  it('displays session conflict resolution success message', () => {
    const store = configureStore({
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
            method: 'ALL',
            resolved: true
          }
        }
      }
    })

    render(
      <Provider store={store}>
        <ThemeProvider>
          <LoginForm />
        </ThemeProvider>
      </Provider>
    )
    
    expect(screen.getByText(/session conflict resolved/i)).toBeInTheDocument()
    expect(screen.getByText(/all sessions cleared successfully/i)).toBeInTheDocument()
  })

  it('shows manual session clear button for session conflict errors', async () => {
    const store = configureStore({
      reducer: {
        auth: authSlice
      },
      preloadedState: {
        auth: {
          user: null,
          session: null,
          loading: false,
          error: 'Failed to resolve session conflict',
          sessionConflictResolution: {
            inProgress: false,
            method: null,
            resolved: false
          }
        }
      }
    })

    render(
      <Provider store={store}>
        <ThemeProvider>
          <LoginForm />
        </ThemeProvider>
      </Provider>
    )
    
    expect(screen.getByText(/failed to resolve session conflict/i)).toBeInTheDocument()
    expect(screen.getByText(/clear all sessions/i)).toBeInTheDocument()
  })

  it('handles manual session clearing', async () => {
    const store = configureStore({
      reducer: {
        auth: authSlice
      },
      preloadedState: {
        auth: {
          user: null,
          session: null,
          loading: false,
          error: 'Session conflict detected',
          sessionConflictResolution: {
            inProgress: false,
            method: null,
            resolved: false
          }
        }
      }
    })

    render(
      <Provider store={store}>
        <ThemeProvider>
          <LoginForm />
        </ThemeProvider>
      </Provider>
    )
    
    const clearButton = screen.getByText(/clear all sessions/i)
    fireEvent.click(clearButton)
    
    await waitFor(() => {
      expect(screen.getByText(/clearing sessions/i)).toBeInTheDocument()
    })
  })

  it('displays different messages for different session conflict methods', () => {
    const storeWithCurrentMethod = configureStore({
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
            inProgress: true,
            method: 'CURRENT',
            resolved: false
          }
        }
      }
    })

    const { rerender } = render(
      <Provider store={storeWithCurrentMethod}>
        <ThemeProvider>
          <LoginForm />
        </ThemeProvider>
      </Provider>
    )
    
    expect(screen.getByText(/clearing current session/i)).toBeInTheDocument()

    const storeWithAllMethod = configureStore({
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
            inProgress: true,
            method: 'ALL',
            resolved: false
          }
        }
      }
    })

    rerender(
      <Provider store={storeWithAllMethod}>
        <ThemeProvider>
          <LoginForm />
        </ThemeProvider>
      </Provider>
    )
    
    expect(screen.getByText(/clearing all sessions for security/i)).toBeInTheDocument()
  })
})