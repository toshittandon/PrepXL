import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormField from '../../../components/forms/FormField.jsx';

describe('FormField', () => {
  const defaultProps = {
    label: 'Test Field',
    name: 'testField',
    placeholder: 'Enter test value'
  };

  it('should render with basic props', () => {
    render(<FormField {...defaultProps} />);
    
    expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter test value')).toBeInTheDocument();
  });

  it('should show required indicator when required', () => {
    render(<FormField {...defaultProps} required />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should display error message when error and touched', () => {
    render(
      <FormField 
        {...defaultProps} 
        error="This field is required" 
        touched={true} 
      />
    );
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('should not display error message when not touched', () => {
    render(
      <FormField 
        {...defaultProps} 
        error="This field is required" 
        touched={false} 
      />
    );
    
    expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
  });

  it('should show valid state when touched and no error', () => {
    render(
      <FormField 
        {...defaultProps} 
        touched={true} 
        showValidIcon={true} 
      />
    );
    
    expect(screen.getByRole('textbox')).toHaveClass('border-green-500');
  });

  it('should display help text when provided', () => {
    render(
      <FormField 
        {...defaultProps} 
        helpText="This is helpful information" 
      />
    );
    
    expect(screen.getByText('This is helpful information')).toBeInTheDocument();
  });

  it('should hide help text when error is shown', () => {
    render(
      <FormField 
        {...defaultProps} 
        error="Error message"
        touched={true}
        helpText="This is helpful information" 
      />
    );
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('This is helpful information')).not.toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<FormField {...defaultProps} disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('bg-gray-50', 'cursor-not-allowed');
  });

  it('should handle different input types', () => {
    render(<FormField {...defaultProps} type="email" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should forward ref correctly', () => {
    const ref = vi.fn();
    render(<FormField {...defaultProps} ref={ref} />);
    
    expect(ref).toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<FormField {...defaultProps} className="custom-class" />);
    
    const outerContainer = screen.getByRole('textbox').closest('.custom-class');
    expect(outerContainer).toBeInTheDocument();
  });

  it('should apply custom input className', () => {
    render(<FormField {...defaultProps} inputClassName="custom-input-class" />);
    
    expect(screen.getByRole('textbox')).toHaveClass('custom-input-class');
  });

  it('should handle onChange events', () => {
    const handleChange = vi.fn();
    render(<FormField {...defaultProps} onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('should set aria attributes correctly', () => {
    render(
      <FormField 
        {...defaultProps} 
        error="Error message"
        touched={true}
        helpText="Help text"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'testField-error');
  });

  it('should set aria-describedby for help text when no error', () => {
    render(
      <FormField 
        {...defaultProps} 
        helpText="Help text"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'testField-help');
  });

  it('should render custom children instead of input', () => {
    render(
      <FormField {...defaultProps}>
        <select name="testField">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </select>
      </FormField>
    );
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});