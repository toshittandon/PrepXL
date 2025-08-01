import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormSelect from '../../../components/forms/FormSelect.jsx';

describe('FormSelect', () => {
  const defaultProps = {
    label: 'Test Select',
    name: 'testSelect',
    options: ['Option 1', 'Option 2', 'Option 3']
  };

  it('should render with basic props', () => {
    render(<FormSelect {...defaultProps} />);
    
    expect(screen.getByLabelText('Test Select')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should render string options correctly', () => {
    render(<FormSelect {...defaultProps} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    // Check that options are present
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('should render object options correctly', () => {
    const objectOptions = [
      { value: 'opt1', label: 'Option 1' },
      { value: 'opt2', label: 'Option 2', disabled: true },
      { value: 'opt3', label: 'Option 3' }
    ];

    render(<FormSelect {...defaultProps} options={objectOptions} />);
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
    
    // Check disabled option
    const option2 = screen.getByText('Option 2').closest('option');
    expect(option2).toBeDisabled();
  });

  it('should show placeholder when provided', () => {
    render(
      <FormSelect 
        {...defaultProps} 
        placeholder="Choose an option..." 
      />
    );
    
    expect(screen.getByText('Choose an option...')).toBeInTheDocument();
  });

  it('should show required indicator when required', () => {
    render(<FormSelect {...defaultProps} required />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should display error message when error and touched', () => {
    render(
      <FormSelect 
        {...defaultProps} 
        error="This field is required" 
        touched={true} 
      />
    );
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveClass('border-red-500');
  });

  it('should show valid state when touched and no error', () => {
    render(
      <FormSelect 
        {...defaultProps} 
        touched={true} 
        showValidIcon={true} 
      />
    );
    
    expect(screen.getByRole('combobox')).toHaveClass('border-green-500');
  });

  it('should display help text when provided', () => {
    render(
      <FormSelect 
        {...defaultProps} 
        helpText="This is helpful information" 
      />
    );
    
    expect(screen.getByText('This is helpful information')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<FormSelect {...defaultProps} disabled />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
    expect(select).toHaveClass('bg-gray-50', 'cursor-not-allowed');
  });

  it('should handle onChange events', () => {
    const handleChange = vi.fn();
    render(<FormSelect {...defaultProps} onChange={handleChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Option 1' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('should forward ref correctly', () => {
    const ref = vi.fn();
    render(<FormSelect {...defaultProps} ref={ref} />);
    
    expect(ref).toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<FormSelect {...defaultProps} className="custom-class" />);
    
    const outerContainer = screen.getByRole('combobox').closest('.custom-class');
    expect(outerContainer).toBeInTheDocument();
  });

  it('should set aria attributes correctly', () => {
    render(
      <FormSelect 
        {...defaultProps} 
        error="Error message"
        touched={true}
      />
    );
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAttribute('aria-describedby', 'testSelect-error');
  });

  it('should show dropdown arrow icon', () => {
    render(<FormSelect {...defaultProps} />);
    
    // The ChevronDownIcon should be present (we can't easily test for the specific icon, 
    // but we can check that the container with the icon classes exists)
    const iconContainer = screen.getByRole('combobox').parentElement.querySelector('.pointer-events-none');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should handle empty options array', () => {
    render(<FormSelect {...defaultProps} options={[]} placeholder="" />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    // Should have no options when empty array and no placeholder
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(0);
  });

  it('should not show placeholder when not provided', () => {
    render(<FormSelect {...defaultProps} placeholder="" />);
    
    expect(screen.queryByText('Select an option...')).not.toBeInTheDocument();
  });
});