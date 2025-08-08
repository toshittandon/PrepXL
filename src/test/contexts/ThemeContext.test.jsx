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
const matchMediaMock = vi.fn()
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
    document.documentElement.className = ''
  })

  it('provides default light theme when no stored preference', () => {
    localStorageMock.getItem.mockReturnValue(null)
    matchMediaMock.mockReturnValue({ matches: false })
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('uses stored theme preference', () => {
    localStorageMock.getItem.mockReturnValue('dark')
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('uses system preference when no stored preference', () => {
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

  it('toggles theme correctly', () => {
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
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
  })

  it('sets specific theme correctly', () => {
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
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
    
    act(() => {
      fireEvent.click(screen.getByTestId('set-light'))
    })
    
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')
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

  it('applies dark class to document element', () => {
    localStorageMock.getItem.mockReturnValue('dark')
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    
    expect(document.documentElement).toHaveClass('dark')
    
    act(() => {
      fireEvent.click(screen.getByTestId('set-light'))
    })
    
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('handles invalid stored theme gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-theme')
    matchMediaMock.mockReturnValue({ matches: false })
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('throws error when useTheme is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTheme must be used within a ThemeProvider')
    
    consoleSpy.mockRestore()
  })

  it('listens to system theme changes', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const mediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
    
    matchMediaMock.mockReturnValue(mediaQueryList)
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    
    expect(mediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    
    // Simulate system theme change
    const changeHandler = mediaQueryList.addEventListener.mock.calls[0][1]
    act(() => {
      changeHandler({ matches: true })
    })
    
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
  })

  it('cleans up event listeners on unmount', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const mediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
    
    matchMediaMock.mockReturnValue(mediaQueryList)
    
    const { unmount } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    
    unmount()
    
    expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('provides initial theme immediately', () => {
    localStorageMock.getItem.mockReturnValue('dark')
    
    const { container } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    
    // Theme should be applied immediately, not after a delay
    expect(container.querySelector('[data-testid="current-theme"]')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('handles localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage not available')
    })
    matchMediaMock.mockReturnValue({ matches: false })
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
  })

  it('handles localStorage setItem errors gracefully', () => {
    localStorageMock.getItem.mockReturnValue('light')
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage quota exceeded')
    })
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    
    // Should still toggle theme even if localStorage fails
    act(() => {
      fireEvent.click(screen.getByTestId('toggle-button'))
    })
    
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
  })
})