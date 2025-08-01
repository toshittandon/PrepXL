import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../testUtils';
import QuickActions from '../../../components/dashboard/QuickActions';

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('QuickActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render quick action buttons', () => {
    renderWithProviders(<QuickActions />);
    
    expect(screen.getByRole('button', { name: /upload resume/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start interview/i })).toBeInTheDocument();
  });

  it('should navigate to resume upload when upload button is clicked', () => {
    renderWithProviders(<QuickActions />);
    
    const uploadButton = screen.getByRole('button', { name: /upload resume/i });
    fireEvent.click(uploadButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/resume/upload');
  });

  it('should navigate to interview setup when interview button is clicked', () => {
    renderWithProviders(<QuickActions />);
    
    const interviewButton = screen.getByRole('button', { name: /start interview/i });
    fireEvent.click(interviewButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/interview/setup');
  });

  it('should render with proper styling and icons', () => {
    renderWithProviders(<QuickActions />);
    
    const uploadButton = screen.getByRole('button', { name: /upload resume/i });
    const interviewButton = screen.getByRole('button', { name: /start interview/i });
    
    expect(uploadButton).toHaveClass('bg-blue-600');
    expect(interviewButton).toHaveClass('bg-green-600');
  });

  it('should display descriptive text for each action', () => {
    renderWithProviders(<QuickActions />);
    
    expect(screen.getByText(/analyze your resume/i)).toBeInTheDocument();
    expect(screen.getByText(/practice interview/i)).toBeInTheDocument();
  });

  it('should be accessible with proper ARIA labels', () => {
    renderWithProviders(<QuickActions />);
    
    const uploadButton = screen.getByRole('button', { name: /upload resume/i });
    const interviewButton = screen.getByRole('button', { name: /start interview/i });
    
    expect(uploadButton).toHaveAttribute('aria-label');
    expect(interviewButton).toHaveAttribute('aria-label');
  });

  it('should handle keyboard navigation', () => {
    renderWithProviders(<QuickActions />);
    
    const uploadButton = screen.getByRole('button', { name: /upload resume/i });
    const interviewButton = screen.getByRole('button', { name: /start interview/i });
    
    uploadButton.focus();
    expect(document.activeElement).toBe(uploadButton);
    
    fireEvent.keyDown(uploadButton, { key: 'Tab' });
    expect(document.activeElement).toBe(interviewButton);
  });

  it('should render in responsive grid layout', () => {
    renderWithProviders(<QuickActions />);
    
    const container = screen.getByRole('button', { name: /upload resume/i }).closest('div').parentElement;
    expect(container).toHaveClass('grid');
  });

  it('should show loading state when actions are disabled', () => {
    renderWithProviders(<QuickActions disabled />);
    
    const uploadButton = screen.getByRole('button', { name: /upload resume/i });
    const interviewButton = screen.getByRole('button', { name: /start interview/i });
    
    expect(uploadButton).toBeDisabled();
    expect(interviewButton).toBeDisabled();
  });

  it('should display recent activity indicators', () => {
    const preloadedState = {
      resume: {
        resumes: [{ $id: 'resume1', fileName: 'test.pdf' }],
        currentAnalysis: null,
        uploading: false,
        analyzing: false,
        error: null,
      },
      interview: {
        sessions: [{ $id: 'session1', status: 'completed' }],
        currentSession: null,
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<QuickActions />, { preloadedState });
    
    // Should show indicators for recent activity
    expect(screen.getByText(/recent resume/i) || screen.getByText(/1 resume/i)).toBeInTheDocument();
  });

  it('should handle error states gracefully', () => {
    const preloadedState = {
      resume: {
        resumes: [],
        currentAnalysis: null,
        uploading: false,
        analyzing: false,
        error: 'Upload failed',
      },
    };

    renderWithProviders(<QuickActions />, { preloadedState });
    
    // Should still render buttons even with errors
    expect(screen.getByRole('button', { name: /upload resume/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start interview/i })).toBeInTheDocument();
  });

  it('should show progress indicators when operations are in progress', () => {
    const preloadedState = {
      resume: {
        resumes: [],
        currentAnalysis: null,
        uploading: true,
        analyzing: false,
        error: null,
      },
      interview: {
        sessions: [],
        currentSession: null,
        loading: true,
        error: null,
      },
    };

    renderWithProviders(<QuickActions />, { preloadedState });
    
    // Should show loading states
    expect(screen.getByText(/uploading/i) || screen.getByRole('status')).toBeInTheDocument();
  });
});