import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from '../../../contexts/ThemeContext.jsx'
import SignupForm from '../../../components/forms/SignupForm.jsx'
import authSlice from '../../../store/slices/authSlice.js'
import uiSlice from '../../../store/slices/uiSlice.js'

// Mock the auth service
vi.mock('../../../services/appwrite/auth.js', () => ({
  signUpWithEmail: vi.fn(),
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

describe('SignupForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders signup form with all required fields', () => {
    render(
      <TestWrapper>
        <SignupForm />
      </TestWrapper>
    )
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(
      <TestWrapper>
        <SignupForm />
      </TestWrapper>
    )
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email format', async () => {
    render(
      <TestWrapper>
        <SignupForm />
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
        <SignupForm />
      </TestWrapper>
    )
    
    const passwordInput = screen.getByLabelText(/^password$/i)
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.blur(passwordInput)
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for password mismatch', async () => {
    render(
      <TestWrapper>
        <SignupForm />
      </TestWrapper>
    )
    
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } })
    fireEvent.blur(confirmPasswordInput)
    
    await waitFor(() => {
      expect(screen.getByText(/passwords must match/i)).toBeInTheDocument()
    })
  })

  it('shows password strength indicator', async () => {
    render(
      <TestWrapper>
        <SignupForm />
      </TestWrapper>
    )
    
    const passwordInput = screen.getByLabelText(/^password$/i)
    
    // Weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } })
    await waitFor(() => {
      expect(screen.getByText(/weak/i)).toBeInTheDocument()
    })
    
    // Strong password
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } })
    await waitFor(() => {
      expect(screen.getByText(/strong/i)).toBeInTheDocument()
    })
  })

  it('toggles password visibility', () => {
    render(
      <TestWrapper>
        <SignupForm />
      </TestWrapper>
    )
    
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const toggleButtons = screen.getAllByRole('button', { name: /toggle password visibility/i })
    
    expect(passwordInput.type).toBe('password')
    expect(confirmPasswordInput.type).toBe('password')
    
    fireEvent.click(toggleButtons[0])
    expect(passwordInput.type).toBe('text')
    
    fireEvent.click(toggleButtons[1])
    expect(confirmPasswordInput.type).toBe('text')
  })

  it('requires terms and conditions acceptance', async () => {
    render(
      <TestWrapper>
        <SignupForm />
      </TestWrapper>
    )
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/you must accept the terms and conditions/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const mockOnSuccess = vi.fn()
    const { signUpWithEmail, getCurrentUserWithProfile } = await import('../../../services/appwrite/auth.js')
    
    signUpWithEmail.mockResolvedValue({ $id: 'user-id' })
    getCurrentUserWithProfile.mockResolvedValue({ 
      $id: 'user-id', 
      name: 'John Doe',
      email: 'john@example.com',
      profile: { isAdmin: false }
    })
    
    render(
      <TestWrapper>
        <SignupForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    )
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const termsCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(termsCheckbox)
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(signUpWithEmail).toHaveBeenCalledWith('john@example.com', 'password123', 'John Doe')
      expect(mockOnSuccess).toHaveBeenCalledWith({
        $id: 'user-id',
        name: 'John Doe',
        email: 'john@example.com',
        profile: { isAdmin: false }
      })
    })
  })

  it('shows loading state during submission', async () => {
    const { signUpWithEmail } = await import('../../../services/appwrite/auth.js')
    signUpWithEmail.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(
      <TestWrapper>
        <SignupForm />
      </TestWrapper>
    )
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const termsCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(termsCheckbox)
    fireEvent.click(submitButton)
    
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/creating account/i)).toBeInTheDocument()
  })

  it('handles signup error', async () => {
    const { signUpWithEmail } = await import('../../../services/appwrite/auth.js')
    signUpWithEmail.mockRejectedValue(new Error('Email already exists'))
    
    render(
      <TestWrapper>
        <SignupForm />
      </TestWrapper>
    )
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const termsCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(termsCheckbox)
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
    })
  })

  it('shows sign in link', () => {
    render(
      <TestWrapper>
        <SignupForm />
      </TestWrapper>
    )
    
    const signInText = screen.getByText(/already have an account/i)
    const signInLink = screen.getByText(/sign in/i)
    
    expect(signInText).toBeInTheDocument()
    expect(signInLink).toBeInTheDocument()
    expect(signInLink.closest('a')).toHaveAttribute('href', '/auth/login')
  })

  it('includes OAuth signup options', () => {
    render(
      <TestWrapper>
        <SignupForm />
      </TestWrapper>
    )
    
    expect(screen.getByText(/sign up with google/i)).toBeInTheDocument()
    expect(screen.getByText(/sign up with linkedin/i)).toBeInTheDocument()
  })

  it('validates name length', async () => {
    render(
      <TestWrapper>
        <SignupForm />
      </TestWrapper>
    )
    
    const nameInput = screen.getByLabelText(/full name/i)
    fireEvent.change(nameInput, { target: { value: 'A' } })
    fireEvent.blur(nameInput)
    
    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument()
    })
  })

  it('shows privacy policy link', () => {
    render(
      <TestWrapper>
        <SignupForm />
      </TestWrapper>
    )
    
    const privacyLink = screen.getByText(/privacy policy/i)
    expect(privacyLink).toBeInTheDocument()
    expect(privacyLink.closest('a')).toHaveAttribute('href', '/privacy-policy')
  })
})