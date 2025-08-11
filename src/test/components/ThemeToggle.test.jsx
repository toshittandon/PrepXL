import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '../../contexts/ThemeContext.jsx'
import ThemeToggle from '../../components/common/ThemeToggle.jsx'

describe('ThemeToggle Component', () => {
  it('renders theme toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )
    
    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toBeInTheDocument()
  })

  it('shows sun icon in light mode', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )
    
    // In light mode, should show sun icon (indicating current state)
    const sunIcon = screen.getByTestId('sun-icon')
    expect(sunIcon).toBeInTheDocument()
  })

  it('toggles theme when clicked', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )
    
    const button = screen.getByRole('button', { name: /toggle theme/i })
    
    // Initially should show sun icon (light mode)
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
    
    // Click to toggle to dark mode
    fireEvent.click(button)
    
    // Should now show moon icon (dark mode)
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument()
  })

  it('applies correct accessibility attributes', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )
    
    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toHaveAttribute('aria-label')
    expect(button).toHaveAttribute('type', 'button')
  })

  it('has proper hover and focus states', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )
    
    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toHaveClass('hover:bg-gray-100')
    expect(button).toHaveClass('focus:outline-none')
    expect(button).toHaveClass('focus:ring-2')
  })

  it('maintains theme state across re-renders', () => {
    const { rerender } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )
    
    const button = screen.getByRole('button', { name: /toggle theme/i })
    
    // Toggle to dark mode
    fireEvent.click(button)
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
    
    // Re-render component
    rerender(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )
    
    // Should still be in dark mode
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
  })
})