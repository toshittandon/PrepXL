import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SuccessMessage from '../../../components/common/SuccessMessage';

describe('SuccessMessage', () => {
  it('should render success message', () => {
    render(<SuccessMessage message="Operation completed successfully" />);
    
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render with success styling by default', () => {
    render(<SuccessMessage message="Success!" />);
    
    const successElement = screen.getByRole('alert');
    expect(successElement).toHaveClass('text-green-600');
  });

  it('should render with custom title', () => {
    render(<SuccessMessage message="Details here" title="Success!" />);
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Details here')).toBeInTheDocument();
  });

  it('should render without title when not provided', () => {
    render(<SuccessMessage message="Just the message" />);
    
    expect(screen.getByText('Just the message')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should handle dismissible functionality', () => {
    const mockDismiss = vi.fn();
    render(<SuccessMessage message="Dismissible success" onDismiss={mockDismiss} />);
    
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    expect(dismissButton).toBeInTheDocument();
    
    fireEvent.click(dismissButton);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('should not show dismiss button when onDismiss is not provided', () => {
    render(<SuccessMessage message="Success without dismiss" />);
    
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<SuccessMessage message="Custom styled success" className="custom-success" />);
    
    const successElement = screen.getByRole('alert');
    expect(successElement).toHaveClass('custom-success');
  });

  it('should render with success icon', () => {
    render(<SuccessMessage message="Success with icon" showIcon />);
    
    const successElement = screen.getByRole('alert');
    expect(successElement.querySelector('svg')).toBeInTheDocument();
  });

  it('should render without icon when showIcon is false', () => {
    render(<SuccessMessage message="Success without icon" showIcon={false} />);
    
    const successElement = screen.getByRole('alert');
    expect(successElement.querySelector('svg')).not.toBeInTheDocument();
  });

  it('should handle auto-dismiss functionality', () => {
    vi.useFakeTimers();
    const mockDismiss = vi.fn();
    
    render(
      <SuccessMessage 
        message="Auto dismiss success" 
        onDismiss={mockDismiss} 
        autoDismiss={2000}
      />
    );
    
    expect(mockDismiss).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(2000);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    
    vi.useRealTimers();
  });

  it('should not auto-dismiss when autoDismiss is not provided', () => {
    vi.useFakeTimers();
    const mockDismiss = vi.fn();
    
    render(<SuccessMessage message="No auto dismiss" onDismiss={mockDismiss} />);
    
    vi.advanceTimersByTime(5000);
    expect(mockDismiss).not.toHaveBeenCalled();
    
    vi.useRealTimers();
  });

  it('should render different variants correctly', () => {
    const variants = ['success', 'info', 'warning'];
    
    variants.forEach(variant => {
      const { unmount } = render(<SuccessMessage message="Test message" variant={variant} />);
      const messageElement = screen.getByRole('alert');
      
      if (variant === 'success') {
        expect(messageElement).toHaveClass('text-green-600');
      } else if (variant === 'info') {
        expect(messageElement).toHaveClass('text-blue-600');
      } else if (variant === 'warning') {
        expect(messageElement).toHaveClass('text-yellow-600');
      }
      
      unmount();
    });
  });

  it('should handle empty message gracefully', () => {
    render(<SuccessMessage message="" />);
    
    const successElement = screen.getByRole('alert');
    expect(successElement).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<SuccessMessage message="Accessible success message" />);
    
    const successElement = screen.getByRole('alert');
    expect(successElement).toHaveAttribute('aria-live', 'polite');
  });

  it('should render with action button', () => {
    const mockAction = vi.fn();
    render(
      <SuccessMessage 
        message="Success with action" 
        actionText="View Details"
        onAction={mockAction}
      />
    );
    
    const actionButton = screen.getByRole('button', { name: /view details/i });
    expect(actionButton).toBeInTheDocument();
    
    fireEvent.click(actionButton);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should render with both action and dismiss buttons', () => {
    const mockAction = vi.fn();
    const mockDismiss = vi.fn();
    
    render(
      <SuccessMessage 
        message="Success with both actions" 
        actionText="Continue"
        onAction={mockAction}
        onDismiss={mockDismiss}
      />
    );
    
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('should clear auto-dismiss timer on unmount', () => {
    vi.useFakeTimers();
    const mockDismiss = vi.fn();
    
    const { unmount } = render(
      <SuccessMessage 
        message="Auto dismiss success" 
        onDismiss={mockDismiss} 
        autoDismiss={2000}
      />
    );
    
    unmount();
    vi.advanceTimersByTime(2000);
    
    expect(mockDismiss).not.toHaveBeenCalled();
    
    vi.useRealTimers();
  });
});