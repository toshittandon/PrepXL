import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import AuthGuard from '../../components/common/AuthGuard.jsx'
import authSlice from '../../store/slices/authSlice.js'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

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
      {children}
    </BrowserRouter>
  </Provider>
)

describe('AuthGuard Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders children when user is authenticated', () => {
    const store = createTestStore({
      user: { id: '1', name: 'Test User', isAdmin: false },
      session: { token: 'valid-token' }
    })

    render(
      <TestWrapper store={store}>
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      </TestWrapper>
    )

    expect(screen.getByText('Protected content')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('redirects to login when user is not authenticated', () => {
    const store = createTestStore({
      user: null,
      session: null
    })

    render(
      <TestWrapper store={store}>
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      </TestWrapper>
    )

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('shows loading spinner when authentication is loading', () => {
    const store = createTestStore({
      user: null,
      session: null,
      loading: true
    })

    render(
      <TestWrapper store={store}>
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      </TestWrapper>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('allows admin access when requireAdmin is true and user is admin', () => {
    const store = createTestStore({
      user: { id: '1', name: 'Admin User', isAdmin: true },
      session: { token: 'valid-token' }
    })

    render(
      <TestWrapper store={store}>
        <AuthGuard requireAdmin={true}>
          <div>Admin content</div>
        </AuthGuard>
      </TestWrapper>
    )

    expect(screen.getByText('Admin content')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('redirects to dashboard when requireAdmin is true but user is not admin', () => {
    const store = createTestStore({
      user: { id: '1', name: 'Regular User', isAdmin: false },
      session: { token: 'valid-token' }
    })

    render(
      <TestWrapper store={store}>
        <AuthGuard requireAdmin={true}>
          <div>Admin content</div>
        </AuthGuard>
      </TestWrapper>
    )

    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('redirects to custom path when redirectTo is provided', () => {
    const store = createTestStore({
      user: null,
      session: null
    })

    render(
      <TestWrapper store={store}>
        <AuthGuard redirectTo="/custom-login">
          <div>Protected content</div>
        </AuthGuard>
      </TestWrapper>
    )

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    expect(mockNavigate).toHaveBeenCalledWith('/custom-login')
  })

  it('handles user without isAdmin property gracefully', () => {
    const store = createTestStore({
      user: { id: '1', name: 'User Without Admin Flag' }, // Missing isAdmin
      session: { token: 'valid-token' }
    })

    render(
      <TestWrapper store={store}>
        <AuthGuard requireAdmin={true}>
          <div>Admin content</div>
        </AuthGuard>
      </TestWrapper>
    )

    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('handles session without user gracefully', () => {
    const store = createTestStore({
      user: null,
      session: { token: 'valid-token' } // Session exists but no user
    })

    render(
      <TestWrapper store={store}>
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      </TestWrapper>
    )

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})