import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from '../../../contexts/ThemeContext.jsx'
import LoginForm from '../../../components/forms/LoginForm.jsx'
import authSlice from '../../../store/slices/authSlice.js'
import uiSlice from '../../../store/slices/uiSlice.js'

// Mock the auth service
vi.mock('../../../services/appwrite/auth.js', () => ({
  signInWithEmail: vi.fn(),
  getCurrentUserWithProfile: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithLinkedIn: vi.fn()
}))

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice
    },
    preloadedState: {
      auth: {
        user: null,
        session: null,
        loading: false,
        error: null,
        ...initialState.auth
      },
      ui: {
        theme: 'light',
        sidebarOpen: false,
        currentModal: null,
        notifications: [],
        ...initialState.ui
      }
    }
  })
}

const TestWrapper = ({ children, store = createMockStore() }) => (
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
)

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with all required fields', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument()
    expect(screen.getByText(/sign in with linkedin/i)).toBeInTheDocument()
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

  it('shows validation error for invalid email format', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email address/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for short password', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const passwordInput = screen.getByLabelText(/password/i)
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.blur(passwordInput)
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('toggles password visibility', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })
    
    expect(passwordInput.type).toBe('password')
    
    fireEvent.click(toggleButton)
    expect(passwordInput.type).toBe('text')
    
    fireEvent.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  it('submits form with valid data', async () => {
    const mockOnSuccess = vi.fn()
    const { signInWithEmail, getCurrentUserWithProfile } = await import('../../../services/appwrite/auth.js')
    
    signInWithEmail.mockResolvedValue({ $id: 'session-id' })
    getCurrentUserWithProfile.mockResolvedValue({ 
      $id: 'user-id', 
      name: 'Test User',
      email: 'test@example.com',
      profile: { isAdmin: false }
    })
    
    render(
      <TestWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockOnSuccess).toHaveBeenCalledWith({
        $id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        profile: { isAdmin: false }
      })
    })
  })

  it('shows loading state during submission', async () => {
    const { signInWithEmail } = await import('../../../services/appwrite/auth.js')
    signInWithEmail.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
  })

  it('handles login error', async () => {
    const { signInWithEmail } = await import('../../../services/appwrite/auth.js')
    signInWithEmail.mockRejectedValue(new Error('Invalid credentials'))
    
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('handles Google OAuth login', async () => {
    const mockOnSuccess = vi.fn()
    const { signInWithGoogle } = await import('../../../services/appwrite/auth.js')
    
    signInWithGoogle.mockResolvedValue({
      user: { $id: 'user-id', name: 'Google User' },
      session: { $id: 'session-id' }
    })
    
    render(
      <TestWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    )
    
    const googleButton = screen.getByText(/sign in with google/i)
    fireEvent.click(googleButton)
    
    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalled()
    })
  })

  it('handles LinkedIn OAuth login', async () => {
    const mockOnSuccess = vi.fn()
    const { signInWithLinkedIn } = await import('../../../services/appwrite/auth.js')
    
    signInWithLinkedIn.mockResolvedValue({
      user: { $id: 'user-id', name: 'LinkedIn User' },
      session: { $id: 'session-id' }
    })
    
    render(
      <TestWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    )
    
    const linkedinButton = screen.getByText(/sign in with linkedin/i)
    fireEvent.click(linkedinButton)
    
    await waitFor(() => {
      expect(signInWithLinkedIn).toHaveBeenCalled()
    })
  })

  it('remembers user preference with remember me checkbox', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const rememberCheckbox = screen.getByLabelText(/remember me/i)
    expect(rememberCheckbox).not.toBeChecked()
    
    fireEvent.click(rememberCheckbox)
    expect(rememberCheckbox).toBeChecked()
  })

  it('shows forgot password link', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const forgotPasswordLink = screen.getByText(/forgot password/i)
    expect(forgotPasswordLink).toBeInTheDocument()
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/auth/forgot-password')
  })

  it('shows sign up link', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )
    
    const signUpText = screen.getByText(/don't have an account/i)
    const signUpLink = screen.getByText(/sign up/i)
    
    expect(signUpText).toBeInTheDocument()
    expect(signUpLink).toBeInTheDocument()
    expect(signUpLink.closest('a')).toHaveAttribute('href', '/auth/signup')
  })

  it('disables form during loading state', async () => {
    const store = createMockStore({
      auth: { loading: true }
    })
    
    render(
      <TestWrapper store={store}>
        <LoginForm />
      </TestWrapper>
    )
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('displays auth error from store', () => {
    const store = createMockStore({
      auth: { error: 'Authentication failed' }
    })
    
    render(
      <TestWrapper store={store}>
        <LoginForm />
      </TestWrapper>
    )
    
    expect(screen.getByText('Authentication failed')).toBeInTheDocument()
  })
})