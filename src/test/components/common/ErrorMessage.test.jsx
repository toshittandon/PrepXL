import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from '../../../components/common/ErrorMessage';

describe('ErrorMessage', () => {
  it('should render error message', () => {
    render(<ErrorMessage message="Something went wrong" />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render with error icon by default', () => {
    render(<ErrorMessage message="Error occurred" />);
    
    const errorElement = screen.getByRole('alert');
    expect(errorElement).toHaveClass('text-red-600');
  });

  it('should render with custom title', () => {
    render(<ErrorMessage message="Error details" title="Custom Error" />);
    
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
    expect(screen.getByText('Error details')).toBeInTheDocument();
  });

  it('should render without title when not provided', () => {
    render(<ErrorMessage message="Just the message" />);
    
    expect(screen.getByText('Just the message')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should handle retry functionality', () => {
    const mockRetry = vi.fn();
    render(<ErrorMessage message="Network error" onRetry={mockRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('should not show retry button when onRetry is not provided', () => {
    render(<ErrorMessage message="Error without retry" />);
    
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('should handle dismissible functionality', () => {
    const mockDismiss = vi.fn();
    render(<ErrorMessage message="Dismissible error" onDismiss={mockDismiss} />);
    
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    expect(dismissButton).toBeInTheDocument();
    
    fireEvent.click(dismissButton);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    render(<ErrorMessage message="Custom styled error" className="custom-error" />);
    
    const errorElement = screen.getByRole('alert');
    expect(errorElement).toHaveClass('custom-error');
  });

  it('should render different variants correctly', () => {
    const variants = ['error', 'warning', 'info'];
    
    variants.forEach(variant => {
      const { unmount } = render(<ErrorMessage message="Test message" variant={variant} />);
      const errorElement = screen.getByRole('alert');
      
      if (variant === 'error') {
        expect(errorElement).toHaveClass('text-red-600');
      } else if (variant === 'warning') {
        expect(errorElement).toHaveClass('text-yellow-600');
      } else if (variant === 'info') {
        expect(errorElement).toHaveClass('text-blue-600');
      }
      
      unmount();
    });
  });

  it('should handle empty message gracefully', () => {
    render(<ErrorMessage message="" />);
    
    const errorElement = screen.getByRole('alert');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toBeEmptyDOMElement();
  });

  it('should render with both retry and dismiss buttons', () => {
    const mockRetry = vi.fn();
    const mockDismiss = vi.fn();
    
    render(
      <ErrorMessage 
        message="Error with both actions" 
        onRetry={mockRetry} 
        onDismiss={mockDismiss} 
      />
    );
    
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('should handle complex error objects', () => {
    const errorObject = {
      message: 'Complex error',
      code: 'ERR_001',
      details: 'Additional error details'
    };
    
    render(<ErrorMessage message={errorObject.message} />);
    
    expect(screen.getByText('Complex error')).toBeInTheDocument();
  });
});