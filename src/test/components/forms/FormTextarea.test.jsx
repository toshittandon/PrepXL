import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import FormTextarea from '../../../components/forms/FormTextarea';

// Test wrapper component that provides react-hook-form context
const TestWrapper = ({ children, defaultValues = {} }) => {
  const methods = useForm({ defaultValues });
  return (
    <form>
      {children(methods)}
    </form>
  );
};

describe('FormTextarea', () => {
  it('should render textarea with label', () => {
    render(
      <TestWrapper>
        {(methods) => (
          <FormTextarea
            name="description"
            label="Description"
            register={methods.register}
          />
        )}
      </TestWrapper>
    );
    
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render without label when not provided', () => {
    render(
      <TestWrapper>
        {(methods) => (
          <FormTextarea
            name="description"
            register={methods.register}
          />
        )}
      </TestWrapper>
    );
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByText('label')).not.toBeInTheDocument();
  });

  it('should display placeholder text', () => {
    render(
      <TestWrapper>
        {(methods) => (
          <FormTextarea
            name="description"
            placeholder="Enter your description here..."
            register={methods.register}
          />
        )}
      </TestWrapper>
    );
    
    expect(screen.getByPlaceholderText('Enter your description here...')).toBeInTheDocument();
  });

  it('should handle user input', () => {
    render(
      <TestWrapper>
        {(methods) => (
          <FormTextarea
            name="description"
            register={methods.register}
          />
        )}
      </TestWrapper>
    );
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Test description' } });
    
    expect(textarea.value).toBe('Test description');
  });

  it('should display error message when error exists', () => {
    const mockError = { message: 'This field is required' };
    
    render(
      <TestWrapper>
        {(methods) => (
          <FormTextarea
            name="description"
            label="Description"
            register={methods.register}
            error={mockError}
          />
        )}
      </TestWrapper>
    );
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('should apply required styling when required', () => {
    render(
      <TestWrapper>
        {(methods) => (
          <FormTextarea
            name="description"
            label="Description"
            register={methods.register}
            required
          />
        )}
      </TestWrapper>
    );
    
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('required');
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <TestWrapper>
        {(methods) => (
          <FormTextarea
            name="description"
            register={methods.register}
            disabled
          />
        )}
      </TestWrapper>
    );
    
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should apply custom className', () => {
    render(
      <TestWrapper>
        {(methods) => (
          <FormTextarea
            name="description"
            register={methods.register}
            className="custom-textarea"
          />
        )}
      </TestWrapper>
    );
    
    expect(screen.getByRole('textbox')).toHaveClass('custom-textarea');
  });

  it('should handle different sizes', () => {
    const sizes = ['small', 'medium', 'large'];
    
    sizes.forEach(size => {
      const { unmount } = render(
        <TestWrapper>
          {(methods) => (
            <FormTextarea
              name="description"
              register={methods.register}
              size={size}
            />
          )}
        </TestWrapper>
      );
      
      const textarea = screen.getByRole('textbox');
      if (size === 'small') {
        expect(textarea).toHaveClass('text-sm');
      } else if (size === 'large') {
        expect(textarea).toHaveClass('text-lg');
      }
      
      unmount();
    });
  });

  it('should set custom rows and cols', () => {
    render(
      <TestWrapper>
        {(methods) => (
          <FormTextarea
            name="description"
            register={methods.register}
            rows={10}
            cols={50}
          />
        )}
      </TestWrapper>
    );
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '10');
    expect(textarea).toHaveAttribute('cols', '50');
  });

  it('should handle maxLength validation', () => {
    render(
      <TestWrapper>
        {(methods) => (
          <FormTextarea
            name="description"
            register={methods.register}
            maxLength={100}
          />
        )}
      </TestWrapper>
    );
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('maxLength', '100');
  });

  it('should show character count when showCharCount is true', () => {
    render(
      <TestWrapper defaultValues={{ description: 'Test' }}>
        {(methods) => (
          <FormTextarea
            name="description"
            register={methods.register}
            maxLength={100}
            showCharCount
          />
        )}
      </TestWrapper>
    );
    
    expect(screen.getByText('4/100')).toBeInTheDocument();
  });

  it('should handle resize options', () => {
    const resizeOptions = ['none', 'vertical', 'horizontal', 'both'];
    
    resizeOptions.forEach(resize => {
      const { unmount } = render(
        <TestWrapper>
          {(methods) => (
            <FormTextarea
              name="description"
              register={methods.register}
              resize={resize}
            />
          )}
        </TestWrapper>
      );
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass(`resize-${resize}`);
      
      unmount();
    });
  });

  it('should have proper accessibility attributes', () => {
    render(
      <TestWrapper>
        {(methods) => (
          <FormTextarea
            name="description"
            label="Description"
            register={methods.register}
            required
            aria-describedby="description-help"
          />
        )}
      </TestWrapper>
    );
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-required', 'true');
    expect(textarea).toHaveAttribute('aria-describedby', 'description-help');
  });

  it('should handle focus and blur events', () => {
    const mockOnFocus = vi.fn();
    const mockOnBlur = vi.fn();
    
    render(
      <TestWrapper>
        {(methods) => (
          <FormTextarea
            name="description"
            register={methods.register}
            onFocus={mockOnFocus}
            onBlur={mockOnBlur}
          />
        )}
      </TestWrapper>
    );
    
    const textarea = screen.getByRole('textbox');
    
    fireEvent.focus(textarea);
    expect(mockOnFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(textarea);
    expect(mockOnBlur).toHaveBeenCalledTimes(1);
  });

  it('should integrate with react-hook-form validation', () => {
    const TestForm = () => {
      const methods = useForm();
      const { formState: { errors } } = methods;
      
      return (
        <form>
          <FormTextarea
            name="description"
            label="Description"
            register={methods.register}
            rules={{ required: 'Description is required' }}
            error={errors.description}
          />
        </form>
      );
    };
    
    render(<TestForm />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });
});