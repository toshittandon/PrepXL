import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext.jsx'

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

// Test component that uses the theme context
const TestComponent = () => {
  const { theme, toggleTheme, setTheme } = useTheme()
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button onClick={toggleTheme} data-testid="toggle-button">
        Toggle Theme
      </button>
      <button onClick={() => setTheme('light')} data-testid="set-light">
        Set Light
      </button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">
        Set Dark
      </button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset document class
    document.documentElement.className = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('ThemeProvider', () => {
    it('provides default light theme', () => {
      localStorageMock.getItem.mockReturnValue(null)
      matchMediaMock.mockReturnValue({ matches: false })
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    })

    it('loads theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(document.documentElement).toHaveClass('dark')
    })

    it('detects system dark mode preference when no localStorage value', () => {
      localStorageMock.getItem.mockReturnValue(null)
      matchMediaMock.mockReturnValue({ matches: true })
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(document.documentElement).toHaveClass('dark')
    })

    it('applies dark class to document element for dark theme', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )
      
      expect(document.documentElement).toHaveClass('dark')
    })

    it('removes dark class from document element for light theme', () => {
      // Start with dark class
      document.documentElement.classList.add('dark')
      localStorageMock.getItem.mockReturnValue('light')
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )
      
      expect(document.documentElement).not.toHaveClass('dark')
    })
  })

  describe('Theme Functions', () => {
    it('toggles theme from light to dark', () => {
      localStorageMock.getItem.mockReturnValue('light')
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
      
      act(() => {
        fireEvent.click(screen.getByTestId('toggle-button'))
      })
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
      expect(document.documentElement).toHaveClass('dark')
    })

    it('toggles theme from dark to light', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      
      act(() => {
        fireEvent.click(screen.getByTestId('toggle-button'))
      })
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')
      expect(document.documentElement).not.toHaveClass('dark')
    })

    it('sets theme directly to light', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )
      
      act(() => {
        fireEvent.click(screen.getByTestId('set-light'))
      })
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')
      expect(document.documentElement).not.toHaveClass('dark')
    })

    it('sets theme directly to dark', () => {
      localStorageMock.getItem.mockReturnValue('light')
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )
      
      act(() => {
        fireEvent.click(screen.getByTestId('set-dark'))
      })
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
      expect(document.documentElement).toHaveClass('dark')
    })

    it('persists theme changes to localStorage', () => {
      localStorageMock.getItem.mockReturnValue('light')
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )
      
      act(() => {
        fireEvent.click(screen.getByTestId('toggle-button'))
      })
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
      
      act(() => {
        fireEvent.click(screen.getByTestId('toggle-button'))
      })
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')
    })
  })

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      
      // Should not throw and should default to light theme
      expect(() => {
        render(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>
        )
      }).not.toThrow()
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    })

    it('handles matchMedia errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null)
      matchMediaMock.mockImplementation(() => {
        throw new Error('matchMedia not supported')
      })
      
      // Should not throw and should default to light theme
      expect(() => {
        render(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>
        )
      }).not.toThrow()
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    })

    it('handles invalid localStorage values', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme')
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )
      
      // Should default to light theme for invalid values
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    })
  })

  describe('useTheme Hook', () => {
    it('throws error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useTheme must be used within a ThemeProvider')
      
      consoleSpy.mockRestore()
    })

    it('provides theme context values', () => {
      localStorageMock.getItem.mockReturnValue('light')
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )
      
      // All buttons should be present, indicating all context values are available
      expect(screen.getByTestId('toggle-button')).toBeInTheDocument()
      expect(screen.getByTestId('set-light')).toBeInTheDocument()
      expect(screen.getByTestId('set-dark')).toBeInTheDocument()
      expect(screen.getByTestId('current-theme')).toBeInTheDocument()
    })
  })

  describe('System Theme Detection', () => {
    it('listens for system theme changes', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const mockAddEventListener = vi.fn()
      const mockRemoveEventListener = vi.fn()
      
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener
      })
      
      const { unmount } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )
      
      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function))
      
      unmount()
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('updates theme when system preference changes', () => {
      localStorageMock.getItem.mockReturnValue(null)
      let changeHandler
      
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: (event, handler) => {
          changeHandler = handler
        },
        removeEventListener: vi.fn()
      })
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
      
      // Simulate system theme change to dark
      act(() => {
        changeHandler({ matches: true })
      })
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(document.documentElement).toHaveClass('dark')
    })
  })
})