import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '../../contexts/ThemeContext.jsx'
import Button from '../../components/common/Button.jsx'

const TestWrapper = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
)

describe('Button Component', () => {
  it('renders with default props', () => {
    render(
      <TestWrapper>
        <Button>Click me</Button>
      </TestWrapper>
    )
    
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('from-primary-600') // primary variant default
  })

  it('renders different variants correctly', () => {
    const { rerender } = render(
      <TestWrapper>
        <Button variant="primary">Primary</Button>
      </TestWrapper>
    )
    
    expect(screen.getByRole('button')).toHaveClass('from-primary-600')
    
    rerender(
      <TestWrapper>
        <Button variant="secondary">Secondary</Button>
      </TestWrapper>
    )
    
    expect(screen.getByRole('button')).toHaveClass('bg-white')
    
    rerender(
      <TestWrapper>
        <Button variant="danger">Danger</Button>
      </TestWrapper>
    )
    
    expect(screen.getByRole('button')).toHaveClass('from-red-600')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    
    render(
      <TestWrapper>
        <Button onClick={handleClick}>Click me</Button>
      </TestWrapper>
    )
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state correctly', () => {
    render(
      <TestWrapper>
        <Button loading>Loading</Button>
      </TestWrapper>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })

  it('can be disabled', () => {
    render(
      <TestWrapper>
        <Button disabled>Disabled</Button>
      </TestWrapper>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })

  it('renders different sizes correctly', () => {
    const { rerender } = render(
      <TestWrapper>
        <Button size="sm">Small</Button>
      </TestWrapper>
    )
    
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-2', 'text-sm')
    
    rerender(
      <TestWrapper>
        <Button size="md">Medium</Button>
      </TestWrapper>
    )
    
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2.5', 'text-sm')
    
    rerender(
      <TestWrapper>
        <Button size="lg">Large</Button>
      </TestWrapper>
    )
    
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-base')
  })

  it('applies custom className', () => {
    render(
      <TestWrapper>
        <Button className="custom-class">Custom</Button>
      </TestWrapper>
    )
    
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    
    render(
      <TestWrapper>
        <Button ref={ref}>Ref test</Button>
      </TestWrapper>
    )
    
    expect(ref).toHaveBeenCalled()
  })
})