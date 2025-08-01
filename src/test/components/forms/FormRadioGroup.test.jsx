import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormRadioGroup from '../../../components/forms/FormRadioGroup.jsx';

describe('FormRadioGroup', () => {
  const defaultProps = {
    label: 'Test Radio Group',
    name: 'testRadio',
    options: ['Option 1', 'Option 2', 'Option 3']
  };

  it('should render with basic props', () => {
    render(<FormRadioGroup {...defaultProps} />);
    
    expect(screen.getByText('Test Radio Group')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('should render string options correctly', () => {
    render(<FormRadioGroup {...defaultProps} />);
    
    expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Option 3')).toBeInTheDocument();
    
    // Check that all are radio inputs
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
  });

  it('should render object options with descriptions', () => {
    const objectOptions = [
      { value: 'opt1', label: 'Option 1', description: 'Description for option 1' },
      { value: 'opt2', label: 'Option 2', description: 'Description for option 2' },
      { value: 'opt3', label: 'Option 3' }
    ];

    render(<FormRadioGroup {...defaultProps} options={objectOptions} />);
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Description for option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Description for option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('should show required indicator when required', () => {
    render(<FormRadioGroup {...defaultProps} required />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should display error message when error and touched', () => {
    render(
      <FormRadioGroup 
        {...defaultProps} 
        error="This field is required" 
        touched={true} 
      />
    );
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should display help text when provided', () => {
    render(
      <FormRadioGroup 
        {...defaultProps} 
        helpText="This is helpful information" 
      />
    );
    
    expect(screen.getByText('This is helpful information')).toBeInTheDocument();
  });

  it('should hide help text when error is shown', () => {
    render(
      <FormRadioGroup 
        {...defaultProps} 
        error="Error message"
        touched={true}
        helpText="This is helpful information" 
      />
    );
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('This is helpful information')).not.toBeInTheDocument();
  });

  it('should handle horizontal orientation', () => {
    render(<FormRadioGroup {...defaultProps} orientation="horizontal" />);
    
    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toHaveClass('flex', 'flex-wrap', 'gap-4');
  });

  it('should handle vertical orientation (default)', () => {
    render(<FormRadioGroup {...defaultProps} orientation="vertical" />);
    
    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toHaveClass('space-y-3');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<FormRadioGroup {...defaultProps} disabled />);
    
    const radios = screen.getAllByRole('radio');
    radios.forEach(radio => {
      expect(radio).toBeDisabled();
    });
  });

  it('should handle individual option disabled state', () => {
    const optionsWithDisabled = [
      { value: 'opt1', label: 'Option 1' },
      { value: 'opt2', label: 'Option 2', disabled: true },
      { value: 'opt3', label: 'Option 3' }
    ];

    render(<FormRadioGroup {...defaultProps} options={optionsWithDisabled} />);
    
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).not.toBeDisabled();
    expect(radios[1]).toBeDisabled();
    expect(radios[2]).not.toBeDisabled();
  });

  it('should handle onChange events', () => {
    const handleChange = vi.fn();
    render(<FormRadioGroup {...defaultProps} onChange={handleChange} />);
    
    const firstRadio = screen.getByLabelText('Option 1');
    fireEvent.click(firstRadio);
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('should forward ref to first radio input', () => {
    const ref = vi.fn();
    render(<FormRadioGroup {...defaultProps} ref={ref} />);
    
    expect(ref).toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<FormRadioGroup {...defaultProps} className="custom-class" />);
    
    const outerContainer = screen.getByRole('radiogroup').closest('.custom-class');
    expect(outerContainer).toBeInTheDocument();
  });

  it('should set aria attributes correctly', () => {
    render(
      <FormRadioGroup 
        {...defaultProps} 
        error="Error message"
        touched={true}
      />
    );
    
    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toHaveAttribute('aria-invalid', 'true');
    expect(radioGroup).toHaveAttribute('aria-describedby', 'testRadio-error');
  });

  it('should set aria-describedby for help text when no error', () => {
    render(
      <FormRadioGroup 
        {...defaultProps} 
        helpText="Help text"
      />
    );
    
    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toHaveAttribute('aria-describedby', 'testRadio-help');
  });

  it('should handle empty options array', () => {
    render(<FormRadioGroup {...defaultProps} options={[]} />);
    
    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toBeInTheDocument();
    
    const radios = screen.queryAllByRole('radio');
    expect(radios).toHaveLength(0);
  });

  it('should use fieldset and legend for accessibility', () => {
    render(<FormRadioGroup {...defaultProps} />);
    
    expect(screen.getByRole('group')).toBeInTheDocument(); // fieldset creates a group role
    expect(screen.getByText('Test Radio Group').tagName).toBe('LEGEND');
  });
});