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
  createAccount: vi.fn(),
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
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
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
    const toggleButtons = screen.getAllByRole('button', { name: /show password|hide password/i })
    
    expect(passwordInput.type).toBe('password')
    expect(confirmPasswordInput.type).toBe('password')
    
    fireEvent.click(toggleButtons[0])
    expect(passwordInput.type).toBe('text')
    
    fireEvent.click(toggleButtons[1])
    expect(confirmPasswordInput.type).toBe('text')
  })



  it('submits form with valid data', async () => {
    const mockOnSuccess = vi.fn()
    const { createAccount } = await import('../../../services/appwrite/auth.js')
    
    createAccount.mockResolvedValue({ 
      account: {
        $id: 'user-id', 
        name: 'John Doe',
        email: 'john@example.com'
      },
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
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(createAccount).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        name: 'John Doe'
      })
    })
  })

  it('shows loading state during submission', async () => {
    const { createAccount } = await import('../../../services/appwrite/auth.js')
    createAccount.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
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
    
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/creating account/i)).toBeInTheDocument()
  })

  it('handles signup error', async () => {
    const { createAccount } = await import('../../../services/appwrite/auth.js')
    createAccount.mockRejectedValue(new Error('Email already exists'))
    
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
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
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
    
    const signInTexts = screen.getAllByText(/already have an account/i)
    const signInLinks = screen.getAllByText(/sign in/i)
    
    expect(signInTexts.length).toBeGreaterThan(0)
    expect(signInLinks.length).toBeGreaterThan(0)
    expect(signInTexts[0]).toBeInTheDocument()
    expect(signInLinks[0]).toBeInTheDocument()
    expect(signInLinks[0].closest('a')).toHaveAttribute('href', '/login')
  })

  it('includes OAuth signup options', () => {
    render(
      <TestWrapper>
        <SignupForm />
      </TestWrapper>
    )
    
    const googleButtons = screen.getAllByRole('button', { name: /sign up with google/i })
    const linkedinButtons = screen.getAllByRole('button', { name: /sign up with linkedin/i })
    
    expect(googleButtons.length).toBeGreaterThan(0)
    expect(linkedinButtons.length).toBeGreaterThan(0)
    expect(googleButtons[0]).toBeInTheDocument()
    expect(linkedinButtons[0]).toBeInTheDocument()
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
    
    const privacyLinks = screen.getAllByRole('link', { name: /privacy policy/i })
    expect(privacyLinks.length).toBeGreaterThan(0)
    expect(privacyLinks[0]).toBeInTheDocument()
    expect(privacyLinks[0]).toHaveAttribute('href', '/privacy-policy')
  })
})