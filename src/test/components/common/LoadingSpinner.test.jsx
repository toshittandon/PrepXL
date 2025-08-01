import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render loading spinner with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('should render with custom message', () => {
    render(<LoadingSpinner message="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render different sizes correctly', () => {
    const sizes = ['small', 'medium', 'large'];
    
    sizes.forEach(size => {
      const { unmount } = render(<LoadingSpinner size={size} />);
      const spinner = screen.getByRole('status');
      
      if (size === 'small') {
        expect(spinner.querySelector('svg')).toHaveClass('w-4', 'h-4');
      } else if (size === 'medium') {
        expect(spinner.querySelector('svg')).toHaveClass('w-8', 'h-8');
      } else if (size === 'large') {
        expect(spinner.querySelector('svg')).toHaveClass('w-12', 'h-12');
      }
      
      unmount();
    });
  });

  it('should render different variants correctly', () => {
    const variants = ['primary', 'secondary', 'white'];
    
    variants.forEach(variant => {
      const { unmount } = render(<LoadingSpinner variant={variant} />);
      const spinner = screen.getByRole('status');
      const svg = spinner.querySelector('svg');
      
      if (variant === 'primary') {
        expect(svg).toHaveClass('text-blue-600');
      } else if (variant === 'secondary') {
        expect(svg).toHaveClass('text-gray-600');
      } else if (variant === 'white') {
        expect(svg).toHaveClass('text-white');
      }
      
      unmount();
    });
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-spinner" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-spinner');
  });

  it('should render as overlay when overlay prop is true', () => {
    render(<LoadingSpinner overlay />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50');
  });

  it('should render inline when inline prop is true', () => {
    render(<LoadingSpinner inline />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('inline-flex');
  });

  it('should render centered by default', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('flex', 'justify-center', 'items-center');
  });

  it('should have proper accessibility attributes', () => {
    render(<LoadingSpinner message="Loading content" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
  });

  it('should render without message when not provided', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  it('should handle fullscreen variant', () => {
    render(<LoadingSpinner fullscreen />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('min-h-screen');
  });

  it('should render with custom aria-label', () => {
    render(<LoadingSpinner ariaLabel="Processing request" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Processing request');
  });

  it('should combine multiple props correctly', () => {
    render(
      <LoadingSpinner 
        size="large" 
        variant="primary" 
        message="Loading..." 
        className="custom-class"
        inline
      />
    );
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('inline-flex', 'custom-class');
    expect(spinner.querySelector('svg')).toHaveClass('w-12', 'h-12', 'text-blue-600');
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});