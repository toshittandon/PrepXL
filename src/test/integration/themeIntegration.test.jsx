import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from '../../contexts/ThemeContext.jsx'
import ThemeToggle from '../../components/common/ThemeToggle.jsx'
import Button from '../../components/common/Button.jsx'
import Card from '../../components/common/Card.jsx'
import authReducer, { setUser, setSession, logout } from '../../store/slices/authSlice.js'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock matchMedia
const matchMediaMock = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock
})

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer
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

describe('Theme Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.documentElement.className = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Theme Persistence Across Components', () => {
    it('should apply theme consistently across all components', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      const store = createTestStore()

      const ThemedApp = () => (
        <div>
          <ThemeToggle />
          <Button>Test Button</Button>
          <Card>
            <p>Card content</p>
          </Card>
        </div>
      )

      render(
        <TestWrapper store={store}>
          <ThemedApp />
        </TestWrapper>
      )

      // Document should have dark class
      expect(document.documentElement).toHaveClass('dark')

      // Theme toggle should show moon icon (dark mode)
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument()

      // Components should have dark theme classes
      const button = screen.getByRole('button', { name: 'Test Button' })
      expect(button).toHaveClass('dark:focus:ring-offset-gray-900')
    })

    it('should toggle theme across all components simultaneously', () => {
      localStorageMock.getItem.mockReturnValue('light')
      const store = createTestStore()

      const ThemedApp = () => (
        <div>
          <ThemeToggle />
          <Button>Test Button</Button>
          <Card>
            <p>Card content</p>
          </Card>
        </div>
      )

      render(
        <TestWrapper store={store}>
          <ThemedApp />
        </TestWrapper>
      )

      // Initially light mode
      expect(document.documentElement).not.toHaveClass('dark')
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument()

      // Toggle to dark mode
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
      act(() => {
        fireEvent.click(themeToggle)
      })

      // Should switch to dark mode
      expect(document.documentElement).toHaveClass('dark')
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')

      // Toggle back to light mode
      act(() => {
        fireEvent.click(themeToggle)
      })

      // Should switch back to light mode
      expect(document.documentElement).not.toHaveClass('dark')
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')
    })
  })

  describe('Theme with Authentication State', () => {
    it('should maintain theme when user logs in', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      const store = createTestStore()

      const AuthenticatedApp = () => {
        const state = store.getState()
        
        const handleLogin = () => {
          store.dispatch(setUser({
            id: '1',
            name: 'Test User',
            email: 'test@example.com'
          }))
          store.dispatch(setSession({ token: 'test-token' }))
        }

        return (
          <div>
            <ThemeToggle />
            {state.auth.user ? (
              <div data-testid="authenticated-content">
                Welcome, {state.auth.user.name}!
                <Button>Authenticated Button</Button>
              </div>
            ) : (
              <div data-testid="unauthenticated-content">
                <Button onClick={handleLogin}>Login</Button>
              </div>
            )}
          </div>
        )
      }

      const { rerender } = render(
        <TestWrapper store={store}>
          <AuthenticatedApp />
        </TestWrapper>
      )

      // Initially dark mode and not authenticated
      expect(document.documentElement).toHaveClass('dark')
      expect(screen.getByTestId('unauthenticated-content')).toBeInTheDocument()

      // Login
      fireEvent.click(screen.getByText('Login'))

      rerender(
        <TestWrapper store={store}>
          <AuthenticatedApp />
        </TestWrapper>
      )

      // Should still be in dark mode after login
      expect(document.documentElement).toHaveClass('dark')
      expect(screen.getByTestId('authenticated-content')).toBeInTheDocument()
      expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument()
    })

    it('should maintain theme when user logs out', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      const store = createTestStore({
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        session: { token: 'test-token' }
      })

      const AuthenticatedApp = () => {
        const state = store.getState()
        
        const handleLogout = () => {
          store.dispatch(logout())
        }

        return (
          <div>
            <ThemeToggle />
            {state.auth.user ? (
              <div data-testid="authenticated-content">
                Welcome, {state.auth.user.name}!
                <Button onClick={handleLogout}>Logout</Button>
              </div>
            ) : (
              <div data-testid="unauthenticated-content">
                Please log in
              </div>
            )}
          </div>
        )
      }

      const { rerender } = render(
        <TestWrapper store={store}>
          <AuthenticatedApp />
        </TestWrapper>
      )

      // Initially dark mode and authenticated
      expect(document.documentElement).toHaveClass('dark')
      expect(screen.getByTestId('authenticated-content')).toBeInTheDocument()

      // Logout
      fireEvent.click(screen.getByText('Logout'))

      rerender(
        <TestWrapper store={store}>
          <AuthenticatedApp />
        </TestWrapper>
      )

      // Should still be in dark mode after logout
      expect(document.documentElement).toHaveClass('dark')
      expect(screen.getByTestId('unauthenticated-content')).toBeInTheDocument()
    })
  })

  describe('System Theme Detection Integration', () => {
    it('should detect system theme preference when no stored preference', () => {
      localStorageMock.getItem.mockReturnValue(null)
      matchMediaMock.mockReturnValue({ matches: true }) // System prefers dark
      
      const store = createTestStore()

      render(
        <TestWrapper store={store}>
          <div>
            <ThemeToggle />
            <Button>Test Button</Button>
          </div>
        </TestWrapper>
      )

      // Should detect system dark preference
      expect(document.documentElement).toHaveClass('dark')
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
    })

    it('should respond to system theme changes', () => {
      localStorageMock.getItem.mockReturnValue(null)
      let changeHandler
      
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: (event, handler) => {
          changeHandler = handler
        },
        removeEventListener: vi.fn()
      })

      const store = createTestStore()

      render(
        <TestWrapper store={store}>
          <div>
            <ThemeToggle />
            <Button>Test Button</Button>
          </div>
        </TestWrapper>
      )

      // Initially light mode
      expect(document.documentElement).not.toHaveClass('dark')
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument()

      // Simulate system theme change to dark
      act(() => {
        changeHandler({ matches: true })
      })

      // Should switch to dark mode
      expect(document.documentElement).toHaveClass('dark')
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
    })
  })

  describe('Theme Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      
      const store = createTestStore()

      // Should not throw and should default to light theme
      expect(() => {
        render(
          <TestWrapper store={store}>
            <div>
              <ThemeToggle />
              <Button>Test Button</Button>
            </div>
          </TestWrapper>
        )
      }).not.toThrow()

      expect(document.documentElement).not.toHaveClass('dark')
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
    })

    it('should handle matchMedia errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null)
      matchMediaMock.mockImplementation(() => {
        throw new Error('matchMedia not supported')
      })
      
      const store = createTestStore()

      // Should not throw and should default to light theme
      expect(() => {
        render(
          <TestWrapper store={store}>
            <div>
              <ThemeToggle />
              <Button>Test Button</Button>
            </div>
          </TestWrapper>
        )
      }).not.toThrow()

      expect(document.documentElement).not.toHaveClass('dark')
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
    })

    it('should handle invalid stored theme values', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme')
      
      const store = createTestStore()

      render(
        <TestWrapper store={store}>
          <div>
            <ThemeToggle />
            <Button>Test Button</Button>
          </div>
        </TestWrapper>
      )

      // Should default to light theme for invalid values
      expect(document.documentElement).not.toHaveClass('dark')
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
    })
  })

  describe('Theme Performance', () => {
    it('should not cause unnecessary re-renders when theme changes', () => {
      localStorageMock.getItem.mockReturnValue('light')
      const store = createTestStore()
      
      let renderCount = 0
      const TestComponent = () => {
        renderCount++
        return <div data-testid="test-component">Render count: {renderCount}</div>
      }

      render(
        <TestWrapper store={store}>
          <div>
            <ThemeToggle />
            <TestComponent />
          </div>
        </TestWrapper>
      )

      const initialRenderCount = renderCount
      expect(screen.getByText(`Render count: ${initialRenderCount}`)).toBeInTheDocument()

      // Toggle theme
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
      act(() => {
        fireEvent.click(themeToggle)
      })

      // Component should not re-render unnecessarily
      // (Theme changes are handled at the document level)
      expect(renderCount).toBe(initialRenderCount)
    })
  })

  describe('Theme Accessibility', () => {
    it('should maintain accessibility attributes across theme changes', () => {
      localStorageMock.getItem.mockReturnValue('light')
      const store = createTestStore()

      render(
        <TestWrapper store={store}>
          <div>
            <ThemeToggle />
            <Button>Accessible Button</Button>
          </div>
        </TestWrapper>
      )

      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
      const button = screen.getByRole('button', { name: 'Accessible Button' })

      // Check initial accessibility attributes
      expect(themeToggle).toHaveAttribute('aria-label')
      expect(button).toHaveAttribute('type', 'button')

      // Toggle theme
      act(() => {
        fireEvent.click(themeToggle)
      })

      // Accessibility attributes should be maintained
      expect(themeToggle).toHaveAttribute('aria-label')
      expect(button).toHaveAttribute('type', 'button')
    })
  })
})