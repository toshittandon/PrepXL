import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressBar from '../../../components/common/ProgressBar';

describe('ProgressBar', () => {
  it('should render progress bar with default props', () => {
    render(<ProgressBar value={50} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('should display correct progress percentage', () => {
    render(<ProgressBar value={75} showPercentage />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should render with custom max value', () => {
    render(<ProgressBar value={25} max={50} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuemax', '50');
    
    const progressFill = progressBar.querySelector('[data-testid="progress-fill"]');
    expect(progressFill).toHaveStyle('width: 50%'); // 25/50 = 50%
  });

  it('should render different sizes correctly', () => {
    const sizes = ['small', 'medium', 'large'];
    
    sizes.forEach(size => {
      const { unmount } = render(<ProgressBar value={50} size={size} />);
      const progressBar = screen.getByRole('progressbar');
      
      if (size === 'small') {
        expect(progressBar).toHaveClass('h-2');
      } else if (size === 'medium') {
        expect(progressBar).toHaveClass('h-4');
      } else if (size === 'large') {
        expect(progressBar).toHaveClass('h-6');
      }
      
      unmount();
    });
  });

  it('should render different variants correctly', () => {
    const variants = ['primary', 'success', 'warning', 'danger'];
    
    variants.forEach(variant => {
      const { unmount } = render(<ProgressBar value={50} variant={variant} />);
      const progressFill = screen.getByTestId('progress-fill');
      
      if (variant === 'primary') {
        expect(progressFill).toHaveClass('bg-blue-600');
      } else if (variant === 'success') {
        expect(progressFill).toHaveClass('bg-green-600');
      } else if (variant === 'warning') {
        expect(progressFill).toHaveClass('bg-yellow-600');
      } else if (variant === 'danger') {
        expect(progressFill).toHaveClass('bg-red-600');
      }
      
      unmount();
    });
  });

  it('should render with custom label', () => {
    render(<ProgressBar value={60} label="Upload Progress" />);
    
    expect(screen.getByText('Upload Progress')).toBeInTheDocument();
  });

  it('should handle striped variant', () => {
    render(<ProgressBar value={40} striped />);
    
    const progressFill = screen.getByTestId('progress-fill');
    expect(progressFill).toHaveClass('bg-gradient-to-r');
  });

  it('should handle animated variant', () => {
    render(<ProgressBar value={30} animated />);
    
    const progressFill = screen.getByTestId('progress-fill');
    expect(progressFill).toHaveClass('animate-pulse');
  });

  it('should clamp value between min and max', () => {
    const { rerender } = render(<ProgressBar value={150} />);
    
    let progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    
    rerender(<ProgressBar value={-10} />);
    
    progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('should apply custom className', () => {
    render(<ProgressBar value={50} className="custom-progress" />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('custom-progress');
  });

  it('should render indeterminate progress', () => {
    render(<ProgressBar indeterminate />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).not.toHaveAttribute('aria-valuenow');
    
    const progressFill = screen.getByTestId('progress-fill');
    expect(progressFill).toHaveClass('animate-pulse');
  });

  it('should show both label and percentage', () => {
    render(<ProgressBar value={80} label="Processing" showPercentage />);
    
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('should handle zero value', () => {
    render(<ProgressBar value={0} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    
    const progressFill = screen.getByTestId('progress-fill');
    expect(progressFill).toHaveStyle('width: 0%');
  });

  it('should handle complete progress', () => {
    render(<ProgressBar value={100} showPercentage />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('100%')).toBeInTheDocument();
    
    const progressFill = screen.getByTestId('progress-fill');
    expect(progressFill).toHaveStyle('width: 100%');
  });

  it('should have proper accessibility attributes', () => {
    render(<ProgressBar value={65} label="File Upload" />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', 'File Upload');
    expect(progressBar).toHaveAttribute('aria-valuenow', '65');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });
});