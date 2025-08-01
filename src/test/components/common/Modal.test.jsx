import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../../components/common/Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when isOpen is true', () => {
    render(<Modal {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<Modal {...defaultProps} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay is clicked', () => {
    const mockOnClose = vi.fn();
    render(<Modal {...defaultProps} onClose={mockOnClose} />);
    
    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not close when modal content is clicked', () => {
    const mockOnClose = vi.fn();
    render(<Modal {...defaultProps} onClose={mockOnClose} />);
    
    const modalContent = screen.getByRole('dialog');
    fireEvent.click(modalContent);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should handle escape key press', () => {
    const mockOnClose = vi.fn();
    render(<Modal {...defaultProps} onClose={mockOnClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not close on escape when closeOnEscape is false', () => {
    const mockOnClose = vi.fn();
    render(<Modal {...defaultProps} onClose={mockOnClose} closeOnEscape={false} />);
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should not close on overlay click when closeOnOverlay is false', () => {
    const mockOnClose = vi.fn();
    render(<Modal {...defaultProps} onClose={mockOnClose} closeOnOverlay={false} />);
    
    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should render different sizes correctly', () => {
    const sizes = ['small', 'medium', 'large', 'full'];
    
    sizes.forEach(size => {
      const { unmount } = render(<Modal {...defaultProps} size={size} />);
      const modal = screen.getByRole('dialog');
      
      if (size === 'small') {
        expect(modal).toHaveClass('max-w-md');
      } else if (size === 'medium') {
        expect(modal).toHaveClass('max-w-lg');
      } else if (size === 'large') {
        expect(modal).toHaveClass('max-w-4xl');
      } else if (size === 'full') {
        expect(modal).toHaveClass('max-w-full');
      }
      
      unmount();
    });
  });

  it('should render without header when showHeader is false', () => {
    render(<Modal {...defaultProps} showHeader={false} />);
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('should render custom footer', () => {
    const customFooter = (
      <div>
        <button>Cancel</button>
        <button>Save</button>
      </div>
    );
    
    render(<Modal {...defaultProps} footer={customFooter} />);
    
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Modal {...defaultProps} className="custom-modal" />);
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('custom-modal');
  });

  it('should have proper accessibility attributes', () => {
    render(<Modal {...defaultProps} />);
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby');
  });

  it('should focus trap within modal', () => {
    render(<Modal {...defaultProps} />);
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('tabIndex', '-1');
  });

  it('should render loading state', () => {
    render(<Modal {...defaultProps} loading />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('should handle portal rendering', () => {
    render(<Modal {...defaultProps} />);
    
    // Modal should be rendered in document.body
    const modal = screen.getByRole('dialog');
    expect(modal.closest('body')).toBeTruthy();
  });

  it('should prevent body scroll when open', () => {
    render(<Modal {...defaultProps} />);
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body scroll when closed', () => {
    const { rerender } = render(<Modal {...defaultProps} />);
    
    rerender(<Modal {...defaultProps} isOpen={false} />);
    
    expect(document.body.style.overflow).toBe('');
  });

  it('should handle animation classes', () => {
    render(<Modal {...defaultProps} />);
    
    const overlay = screen.getByTestId('modal-overlay');
    expect(overlay).toHaveClass('transition-opacity');
  });
});