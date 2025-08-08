import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '../../../contexts/ThemeContext.jsx'
import Button from '../../../components/common/Button.jsx'

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
    expect(button).toHaveClass('bg-blue-600') // primary variant default
  })

  it('renders different variants correctly', () => {
    const { rerender } = render(
      <TestWrapper>
        <Button variant="primary">Primary</Button>
      </TestWrapper>
    )
    
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600')
    
    rerender(
      <TestWrapper>
        <Button variant="secondary">Secondary</Button>
      </TestWrapper>
    )
    
    expect(screen.getByRole('button')).toHaveClass('bg-gray-200')
    
    rerender(
      <TestWrapper>
        <Button variant="danger">Danger</Button>
      </TestWrapper>
    )
    
    expect(screen.getByRole('button')).toHaveClass('bg-red-600')
  })

  it('renders different sizes correctly', () => {
    const { rerender } = render(
      <TestWrapper>
        <Button size="sm">Small</Button>
      </TestWrapper>
    )
    
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm')
    
    rerender(
      <TestWrapper>
        <Button size="md">Medium</Button>
      </TestWrapper>
    )
    
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2', 'text-base')
    
    rerender(
      <TestWrapper>
        <Button size="lg">Large</Button>
      </TestWrapper>
    )
    
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-lg')
  })

  it('shows loading state correctly', () => {
    render(
      <TestWrapper>
        <Button loading>Loading Button</Button>
      </TestWrapper>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('opacity-75')
    
    // Check for loading spinner
    const spinner = button.querySelector('svg')
    expect(spinner).toBeInTheDocument()
  })

  it('handles disabled state', () => {
    render(
      <TestWrapper>
        <Button disabled>Disabled Button</Button>
      </TestWrapper>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    
    render(
      <TestWrapper>
        <Button onClick={handleClick}>Click me</Button>
      </TestWrapper>
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not trigger click when disabled', () => {
    const handleClick = vi.fn()
    
    render(
      <TestWrapper>
        <Button onClick={handleClick} disabled>Disabled Button</Button>
      </TestWrapper>
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('does not trigger click when loading', () => {
    const handleClick = vi.fn()
    
    render(
      <TestWrapper>
        <Button onClick={handleClick} loading>Loading Button</Button>
      </TestWrapper>
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('renders with custom className', () => {
    render(
      <TestWrapper>
        <Button className="custom-class">Custom Button</Button>
      </TestWrapper>
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    
    render(
      <TestWrapper>
        <Button ref={ref}>Button with ref</Button>
      </TestWrapper>
    )
    
    expect(ref).toHaveBeenCalled()
  })

  it('supports fullWidth prop', () => {
    render(
      <TestWrapper>
        <Button fullWidth>Full Width Button</Button>
      </TestWrapper>
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('w-full')
  })

  it('renders with icon', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>
    
    render(
      <TestWrapper>
        <Button icon={<TestIcon />}>Button with icon</Button>
      </TestWrapper>
    )
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByText('Button with icon')).toBeInTheDocument()
  })

  it('renders icon-only button', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>
    
    render(
      <TestWrapper>
        <Button icon={<TestIcon />} />
      </TestWrapper>
    )
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveClass('p-2') // icon-only padding
  })
})