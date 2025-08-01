import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../../components/common/Button';

describe('Button', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toBeDisabled();
  });

  it('should render different variants correctly', () => {
    const variants = ['primary', 'secondary', 'outline', 'danger', 'success', 'ghost'];
    
    variants.forEach(variant => {
      const { unmount } = render(<Button variant={variant}>Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(variant === 'primary' ? 'bg-blue-600' : 
                                 variant === 'secondary' ? 'bg-gray-200' :
                                 variant === 'outline' ? 'border' :
                                 variant === 'danger' ? 'bg-red-600' :
                                 variant === 'success' ? 'bg-green-600' :
                                 'hover:bg-gray-100');
      unmount();
    });
  });

  it('should render different sizes correctly', () => {
    const sizes = ['small', 'medium', 'large'];
    
    sizes.forEach(size => {
      const { unmount } = render(<Button size={size}>Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(size === 'small' ? 'px-3' : 
                                 size === 'medium' ? 'px-4' : 
                                 'px-6');
      unmount();
    });
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should show loading state', () => {
    render(<Button loading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Loading');
  });

  it('should render full width when fullWidth prop is true', () => {
    render(<Button fullWidth>Full Width</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should render different button types', () => {
    render(<Button type="submit">Submit</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should forward ref correctly', () => {
    const ref = { current: null };
    render(<Button ref={ref}>Ref Test</Button>);
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('should pass through additional props', () => {
    render(<Button data-testid="custom-button" aria-label="Custom label">Test</Button>);
    
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('aria-label', 'Custom label');
  });
});