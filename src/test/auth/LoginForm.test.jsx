import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import LoginForm from '../../components/forms/LoginForm.jsx'
import authSlice from '../../store/slices/authSlice.js'

// Mock the auth service
vi.mock('../../services/appwrite/auth.js', () => ({
  signInWithEmail: vi.fn(),
  getCurrentUserWithProfile: vi.fn()
}))

const createMockStore = (initialState = {}) => {
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
        ...initialState
      }
    }
  })
}

const renderWithProvider = (component, store = createMockStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  )
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with email and password fields', () => {
    renderWithProvider(<LoginForm />)
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    renderWithProvider(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email format', async () => {
    renderWithProvider(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
    })
  })

  it('toggles password visibility', () => {
    renderWithProvider(<LoginForm />)
    
    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButton = screen.getByRole('button', { name: '' }) // Eye icon button
    
    expect(passwordInput.type).toBe('password')
    
    fireEvent.click(toggleButton)
    expect(passwordInput.type).toBe('text')
    
    fireEvent.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  it('calls onSuccess callback when login is successful', async () => {
    const mockOnSuccess = vi.fn()
    const { signInWithEmail, getCurrentUserWithProfile } = await import('../../services/appwrite/auth.js')
    
    signInWithEmail.mockResolvedValue({ $id: 'session-id' })
    getCurrentUserWithProfile.mockResolvedValue({ 
      $id: 'user-id', 
      name: 'Test User',
      profile: { isAdmin: false }
    })
    
    renderWithProvider(<LoginForm onSuccess={mockOnSuccess} />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith({
        $id: 'user-id',
        name: 'Test User',
        profile: { isAdmin: false }
      })
    })
  })
})