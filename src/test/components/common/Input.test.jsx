import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '../../../contexts/ThemeContext.jsx'
import Input from '../../../components/common/Input.jsx'

const TestWrapper = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
)

describe('Input Component', () => {
  it('renders with label', () => {
    render(
      <TestWrapper>
        <Input label="Test Label" />
      </TestWrapper>
    )
    
    expect(screen.getByText('Test Label')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders without label', () => {
    render(
      <TestWrapper>
        <Input placeholder="Enter text" />
      </TestWrapper>
    )
    
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    expect(screen.queryByRole('label')).not.toBeInTheDocument()
  })

  it('handles value and onChange', () => {
    const handleChange = vi.fn()
    
    render(
      <TestWrapper>
        <Input value="test value" onChange={handleChange} />
      </TestWrapper>
    )
    
    const input = screen.getByRole('textbox')
    expect(input.value).toBe('test value')
    
    fireEvent.change(input, { target: { value: 'new value' } })
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: 'new value' })
    }))
  })

  it('shows error state', () => {
    render(
      <TestWrapper>
        <Input label="Test Input" error="This field is required" />
      </TestWrapper>
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-red-500')
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('shows success state', () => {
    render(
      <TestWrapper>
        <Input label="Test Input" success="Valid input" />
      </TestWrapper>
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-green-500')
    expect(screen.getByText('Valid input')).toBeInTheDocument()
  })

  it('handles disabled state', () => {
    render(
      <TestWrapper>
        <Input label="Test Input" disabled />
      </TestWrapper>
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('opacity-50', 'cursor-not-allowed')
  })

  it('handles required state', () => {
    render(
      <TestWrapper>
        <Input label="Test Input" required />
      </TestWrapper>
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toBeRequired()
    expect(screen.getByText('Test Input *')).toBeInTheDocument()
  })

  it('renders with different types', () => {
    const { rerender } = render(
      <TestWrapper>
        <Input type="email" />
      </TestWrapper>
    )
    
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
    
    rerender(
      <TestWrapper>
        <Input type="password" />
      </TestWrapper>
    )
    
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')
    
    rerender(
      <TestWrapper>
        <Input type="number" />
      </TestWrapper>
    )
    
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number')
  })

  it('renders with help text', () => {
    render(
      <TestWrapper>
        <Input label="Test Input" helpText="This is help text" />
      </TestWrapper>
    )
    
    expect(screen.getByText('This is help text')).toBeInTheDocument()
  })

  it('renders with prefix icon', () => {
    const PrefixIcon = () => <span data-testid="prefix-icon">@</span>
    
    render(
      <TestWrapper>
        <Input label="Test Input" prefixIcon={<PrefixIcon />} />
      </TestWrapper>
    )
    
    expect(screen.getByTestId('prefix-icon')).toBeInTheDocument()
  })

  it('renders with suffix icon', () => {
    const SuffixIcon = () => <span data-testid="suffix-icon">✓</span>
    
    render(
      <TestWrapper>
        <Input label="Test Input" suffixIcon={<SuffixIcon />} />
      </TestWrapper>
    )
    
    expect(screen.getByTestId('suffix-icon')).toBeInTheDocument()
  })

  it('handles focus and blur events', () => {
    const handleFocus = vi.fn()
    const handleBlur = vi.fn()
    
    render(
      <TestWrapper>
        <Input label="Test Input" onFocus={handleFocus} onBlur={handleBlur} />
      </TestWrapper>
    )
    
    const input = screen.getByRole('textbox')
    
    fireEvent.focus(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)
    
    fireEvent.blur(input)
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    
    render(
      <TestWrapper>
        <Input ref={ref} label="Test Input" />
      </TestWrapper>
    )
    
    expect(ref).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(
      <TestWrapper>
        <Input label="Test Input" className="custom-class" />
      </TestWrapper>
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-class')
  })

  it('handles password visibility toggle', () => {
    render(
      <TestWrapper>
        <Input type="password" label="Password" showPasswordToggle />
      </TestWrapper>
    )
    
    const input = screen.getByLabelText('Password')
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })
    
    expect(input).toHaveAttribute('type', 'password')
    
    fireEvent.click(toggleButton)
    expect(input).toHaveAttribute('type', 'text')
    
    fireEvent.click(toggleButton)
    expect(input).toHaveAttribute('type', 'password')
  })

  it('shows character count when maxLength is provided', () => {
    render(
      <TestWrapper>
        <Input label="Test Input" maxLength={100} value="Hello" showCharCount />
      </TestWrapper>
    )
    
    expect(screen.getByText('5/100')).toBeInTheDocument()
  })

  it('handles textarea variant', () => {
    render(
      <TestWrapper>
        <Input label="Test Textarea" variant="textarea" rows={4} />
      </TestWrapper>
    )
    
    const textarea = screen.getByRole('textbox')
    expect(textarea.tagName).toBe('TEXTAREA')
    expect(textarea).toHaveAttribute('rows', '4')
  })
})