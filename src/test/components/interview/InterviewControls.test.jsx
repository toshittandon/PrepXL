import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../testUtils';
import InterviewControls from '../../../components/interview/InterviewControls';

describe('InterviewControls', () => {
  const defaultProps = {
    onStart: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onEnd: vi.fn(),
    onNext: vi.fn(),
    isRecording: false,
    isPaused: false,
    isCompleted: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render start button when interview is not started', () => {
    renderWithProviders(<InterviewControls {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /start interview/i })).toBeInTheDocument();
  });

  it('should call onStart when start button is clicked', () => {
    const mockOnStart = vi.fn();
    renderWithProviders(<InterviewControls {...defaultProps} onStart={mockOnStart} />);
    
    const startButton = screen.getByRole('button', { name: /start interview/i });
    fireEvent.click(startButton);
    
    expect(mockOnStart).toHaveBeenCalledTimes(1);
  });

  it('should render pause button when recording', () => {
    renderWithProviders(<InterviewControls {...defaultProps} isRecording />);
    
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });

  it('should call onPause when pause button is clicked', () => {
    const mockOnPause = vi.fn();
    renderWithProviders(
      <InterviewControls {...defaultProps} isRecording onPause={mockOnPause} />
    );
    
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(pauseButton);
    
    expect(mockOnPause).toHaveBeenCalledTimes(1);
  });

  it('should render resume button when paused', () => {
    renderWithProviders(<InterviewControls {...defaultProps} isPaused />);
    
    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
  });

  it('should call onResume when resume button is clicked', () => {
    const mockOnResume = vi.fn();
    renderWithProviders(
      <InterviewControls {...defaultProps} isPaused onResume={mockOnResume} />
    );
    
    const resumeButton = screen.getByRole('button', { name: /resume/i });
    fireEvent.click(resumeButton);
    
    expect(mockOnResume).toHaveBeenCalledTimes(1);
  });

  it('should render end button when interview is active', () => {
    renderWithProviders(<InterviewControls {...defaultProps} isRecording />);
    
    expect(screen.getByRole('button', { name: /end interview/i })).toBeInTheDocument();
  });

  it('should call onEnd when end button is clicked', () => {
    const mockOnEnd = vi.fn();
    renderWithProviders(
      <InterviewControls {...defaultProps} isRecording onEnd={mockOnEnd} />
    );
    
    const endButton = screen.getByRole('button', { name: /end interview/i });
    fireEvent.click(endButton);
    
    expect(mockOnEnd).toHaveBeenCalledTimes(1);
  });

  it('should render next question button when available', () => {
    renderWithProviders(<InterviewControls {...defaultProps} canNext />);
    
    expect(screen.getByRole('button', { name: /next question/i })).toBeInTheDocument();
  });

  it('should call onNext when next button is clicked', () => {
    const mockOnNext = vi.fn();
    renderWithProviders(
      <InterviewControls {...defaultProps} canNext onNext={mockOnNext} />
    );
    
    const nextButton = screen.getByRole('button', { name: /next question/i });
    fireEvent.click(nextButton);
    
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('should disable controls when loading', () => {
    renderWithProviders(<InterviewControls {...defaultProps} loading />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should show loading spinner when loading', () => {
    renderWithProviders(<InterviewControls {...defaultProps} loading />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render completion state when interview is completed', () => {
    renderWithProviders(<InterviewControls {...defaultProps} isCompleted />);
    
    expect(screen.getByText(/interview completed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view report/i })).toBeInTheDocument();
  });

  it('should show recording indicator when recording', () => {
    renderWithProviders(<InterviewControls {...defaultProps} isRecording />);
    
    expect(screen.getByText(/recording/i) || screen.getByTestId('recording-indicator')).toBeInTheDocument();
  });

  it('should show paused indicator when paused', () => {
    renderWithProviders(<InterviewControls {...defaultProps} isPaused />);
    
    expect(screen.getByText(/paused/i) || screen.getByTestId('paused-indicator')).toBeInTheDocument();
  });

  it('should display current question number', () => {
    renderWithProviders(<InterviewControls {...defaultProps} currentQuestion={3} totalQuestions={10} />);
    
    expect(screen.getByText(/3 of 10/i) || screen.getByText(/question 3/i)).toBeInTheDocument();
  });

  it('should handle keyboard shortcuts', () => {
    const mockOnStart = vi.fn();
    const mockOnPause = vi.fn();
    
    renderWithProviders(<InterviewControls {...defaultProps} onStart={mockOnStart} />);
    
    // Test spacebar for start/pause
    fireEvent.keyDown(document, { key: ' ', code: 'Space' });
    expect(mockOnStart).toHaveBeenCalledTimes(1);
  });

  it('should show confirmation dialog for end interview', () => {
    renderWithProviders(<InterviewControls {...defaultProps} isRecording />);
    
    const endButton = screen.getByRole('button', { name: /end interview/i });
    fireEvent.click(endButton);
    
    expect(screen.getByText(/are you sure/i) || screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should be accessible with proper ARIA labels', () => {
    renderWithProviders(<InterviewControls {...defaultProps} isRecording />);
    
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    const endButton = screen.getByRole('button', { name: /end interview/i });
    
    expect(pauseButton).toHaveAttribute('aria-label');
    expect(endButton).toHaveAttribute('aria-label');
  });

  it('should handle error states', () => {
    renderWithProviders(<InterviewControls {...defaultProps} error="Recording failed" />);
    
    expect(screen.getByText(/recording failed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should show time elapsed during interview', () => {
    renderWithProviders(<InterviewControls {...defaultProps} isRecording timeElapsed={125} />);
    
    expect(screen.getByText(/2:05/i) || screen.getByText(/125/i)).toBeInTheDocument();
  });

  it('should render with custom styling', () => {
    renderWithProviders(<InterviewControls {...defaultProps} className="custom-controls" />);
    
    const container = screen.getByRole('button', { name: /start interview/i }).closest('div');
    expect(container).toHaveClass('custom-controls');
  });

  it('should handle different interview states correctly', () => {
    const states = [
      { isRecording: false, isPaused: false, isCompleted: false },
      { isRecording: true, isPaused: false, isCompleted: false },
      { isRecording: false, isPaused: true, isCompleted: false },
      { isRecording: false, isPaused: false, isCompleted: true },
    ];

    states.forEach((state, index) => {
      const { unmount } = renderWithProviders(<InterviewControls {...defaultProps} {...state} />);
      
      if (!state.isRecording && !state.isPaused && !state.isCompleted) {
        expect(screen.getByRole('button', { name: /start interview/i })).toBeInTheDocument();
      } else if (state.isRecording) {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      } else if (state.isPaused) {
        expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
      } else if (state.isCompleted) {
        expect(screen.getByText(/interview completed/i)).toBeInTheDocument();
      }
      
      unmount();
    });
  });
});