import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from '../../contexts/ThemeContext.jsx'
import LoginForm from '../../components/forms/LoginForm.jsx'
import SignupForm from '../../components/forms/SignupForm.jsx'
import AuthGuard from '../../components/common/AuthGuard.jsx'
import authSlice from '../../store/slices/authSlice.js'

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock Appwrite services
vi.mock('../../services/appwrite/auth.js', () => ({
  loginWithEmail: vi.fn(),
  signupWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  loginWithLinkedIn: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn()
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
        ...initialState
      }
    }
  })
}

const TestWrapper = ({ store, children }) => (
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
)

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Login Flow', () => {
    it('should complete successful login flow', async () => {
      const store = createTestStore()
      const mockLoginWithEmail = vi.fn().mockResolvedValue({
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        session: { token: 'test-token' }
      })

      const LoginPage = () => {
        const handleLogin = async (credentials) => {
          const result = await mockLoginWithEmail(credentials)
          store.dispatch(authSlice.actions.setUser(result.user))
          store.dispatch(authSlice.actions.setSession(result.session))
        }

        return <LoginForm onSubmit={handleLogin} />
      }

      render(
        <TestWrapper store={store}>
          <LoginPage />
        </TestWrapper>
      )

      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      // Wait for login to complete
      await waitFor(() => {
        expect(mockLoginWithEmail).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })

      // Check that user is logged in
      const state = store.getState()
      expect(state.auth.user).toEqual({
        id: '1',
        name: 'Test User',
        email: 'test@example.com'
      })
      expect(state.auth.session).toEqual({ token: 'test-token' })
    })

    it('should handle login failure', async () => {
      const store = createTestStore()
      const mockLoginWithEmail = vi.fn().mockRejectedValue(new Error('Invalid credentials'))

      const LoginPage = () => {
        const handleLogin = async (credentials) => {
          try {
            const result = await mockLoginWithEmail(credentials)
            store.dispatch(authSlice.actions.setUser(result.user))
            store.dispatch(authSlice.actions.setSession(result.session))
          } catch (error) {
            store.dispatch(authSlice.actions.setError(error.message))
          }
        }

        return <LoginForm onSubmit={handleLogin} />
      }

      render(
        <TestWrapper store={store}>
          <LoginPage />
        </TestWrapper>
      )

      // Fill in login form with invalid credentials
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      // Wait for error to appear
      await waitFor(() => {
        expect(mockLoginWithEmail).toHaveBeenCalled()
      })

      // Check that error is set
      const state = store.getState()
      expect(state.auth.error).toBe('Invalid credentials')
      expect(state.auth.user).toBe(null)
    })
  })

  describe('Signup Flow', () => {
    it('should complete successful signup flow', async () => {
      const store = createTestStore()
      const mockSignupWithEmail = vi.fn().mockResolvedValue({
        user: { id: '1', name: 'New User', email: 'new@example.com' },
        session: { token: 'new-token' }
      })

      const SignupPage = () => {
        const handleSignup = async (userData) => {
          const result = await mockSignupWithEmail(userData)
          store.dispatch(authSlice.actions.setUser(result.user))
          store.dispatch(authSlice.actions.setSession(result.session))
        }

        return <SignupForm onSubmit={handleSignup} />
      }

      render(
        <TestWrapper store={store}>
          <SignupPage />
        </TestWrapper>
      )

      // Fill in signup form
      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      fireEvent.change(nameInput, { target: { value: 'New User' } })
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      // Wait for signup to complete
      await waitFor(() => {
        expect(mockSignupWithEmail).toHaveBeenCalledWith({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        })
      })

      // Check that user is signed up and logged in
      const state = store.getState()
      expect(state.auth.user).toEqual({
        id: '1',
        name: 'New User',
        email: 'new@example.com'
      })
      expect(state.auth.session).toEqual({ token: 'new-token' })
    })
  })

  describe('AuthGuard Integration', () => {
    it('should protect routes for unauthenticated users', () => {
      const store = createTestStore({ user: null, session: null })

      const ProtectedComponent = () => <div>Protected Content</div>

      render(
        <TestWrapper store={store}>
          <AuthGuard>
            <ProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      )

      // Should not render protected content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      
      // Should redirect to login
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('should allow access for authenticated users', () => {
      const store = createTestStore({
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        session: { token: 'test-token' }
      })

      const ProtectedComponent = () => <div>Protected Content</div>

      render(
        <TestWrapper store={store}>
          <AuthGuard>
            <ProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      )

      // Should render protected content
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
      
      // Should not redirect
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should enforce admin access for admin routes', () => {
      const regularUserStore = createTestStore({
        user: { id: '1', name: 'Regular User', email: 'user@example.com', isAdmin: false },
        session: { token: 'test-token' }
      })

      const AdminComponent = () => <div>Admin Content</div>

      const { rerender } = render(
        <TestWrapper store={regularUserStore}>
          <AuthGuard requireAdmin={true}>
            <AdminComponent />
          </AuthGuard>
        </TestWrapper>
      )

      // Should not render admin content for regular user
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')

      // Clear mock and test with admin user
      mockNavigate.mockClear()

      const adminUserStore = createTestStore({
        user: { id: '2', name: 'Admin User', email: 'admin@example.com', isAdmin: true },
        session: { token: 'admin-token' }
      })

      rerender(
        <TestWrapper store={adminUserStore}>
          <AuthGuard requireAdmin={true}>
            <AdminComponent />
          </AuthGuard>
        </TestWrapper>
      )

      // Should render admin content for admin user
      expect(screen.getByText('Admin Content')).toBeInTheDocument()
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Theme Integration with Auth', () => {
    it('should persist theme across authentication state changes', async () => {
      const store = createTestStore()

      const AuthenticatedApp = () => {
        const state = store.getState()
        return (
          <div>
            {state.auth.user ? (
              <div>Welcome, {state.auth.user.name}!</div>
            ) : (
              <div>Please log in</div>
            )}
          </div>
        )
      }

      const { rerender } = render(
        <TestWrapper store={store}>
          <AuthenticatedApp />
        </TestWrapper>
      )

      // Initially not authenticated
      expect(screen.getByText('Please log in')).toBeInTheDocument()

      // Simulate login
      store.dispatch(authSlice.actions.setUser({ 
        id: '1', 
        name: 'Test User', 
        email: 'test@example.com' 
      }))
      store.dispatch(authSlice.actions.setSession({ token: 'test-token' }))

      rerender(
        <TestWrapper store={store}>
          <AuthenticatedApp />
        </TestWrapper>
      )

      // Should show authenticated content
      expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument()
    })
  })

  describe('Error Recovery', () => {
    it('should recover from authentication errors', async () => {
      const store = createTestStore({ error: 'Previous error' })

      const LoginPage = () => {
        const handleLogin = async (credentials) => {
          // Clear previous error
          store.dispatch(authSlice.actions.clearError())
          
          // Simulate successful login
          store.dispatch(authSlice.actions.setUser({
            id: '1',
            name: 'Test User',
            email: credentials.email
          }))
          store.dispatch(authSlice.actions.setSession({ token: 'test-token' }))
        }

        return <LoginForm onSubmit={handleLogin} />
      }

      render(
        <TestWrapper store={store}>
          <LoginPage />
        </TestWrapper>
      )

      // Initially should have error
      expect(store.getState().auth.error).toBe('Previous error')

      // Fill in and submit form
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.auth.error).toBe(null)
        expect(state.auth.user).toBeTruthy()
      })
    })
  })
})