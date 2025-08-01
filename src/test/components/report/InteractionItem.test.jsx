import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InteractionItem from '../../../components/report/InteractionItem.jsx';

describe('InteractionItem', () => {
  const mockInteraction = {
    id: '1',
    questionText: 'Tell me about yourself.',
    userAnswerText: 'I am a software developer with 5 years of experience.',
    timestamp: '2024-01-01T10:00:00Z',
    order: 1
  };

  it('renders interaction item with basic information', () => {
    render(<InteractionItem interaction={mockInteraction} index={0} />);
    
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    // Check for time format (may vary based on locale)
    expect(screen.getByText(/\d{1,2}:\d{2}:\d{2} [AP]M/)).toBeInTheDocument();
    expect(screen.getByText('Adequate')).toBeInTheDocument(); // 53 chars is adequate, not detailed
    expect(screen.getByText(/\d+ chars/)).toBeInTheDocument();
  });

  it('expands and shows full content when clicked', () => {
    render(<InteractionItem interaction={mockInteraction} index={0} />);
    
    // Initially collapsed
    expect(screen.queryByText('Tell me about yourself.')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(screen.getByText('Question 1'));
    
    // Now expanded
    expect(screen.getByText('Tell me about yourself.')).toBeInTheDocument();
    expect(screen.getByText('I am a software developer with 5 years of experience.')).toBeInTheDocument();
  });

  it('handles empty answer correctly', () => {
    const emptyAnswerInteraction = {
      ...mockInteraction,
      userAnswerText: ''
    };
    
    render(<InteractionItem interaction={emptyAnswerInteraction} index={0} />);
    
    expect(screen.getByText('No Response')).toBeInTheDocument();
    expect(screen.getByText('0 chars')).toBeInTheDocument();
    
    // Expand to see empty answer message
    fireEvent.click(screen.getByText('Question 1'));
    expect(screen.getByText('No response provided')).toBeInTheDocument();
  });

  it('calculates response quality correctly', () => {
    const testCases = [
      { text: '', expectedQuality: 'No Response' },
      { text: 'Short', expectedQuality: 'Brief' },
      { text: 'This is a medium length response that should be adequate.', expectedQuality: 'Adequate' },
      { text: 'This is a very long and detailed response that provides comprehensive information about the topic and demonstrates thorough understanding of the subject matter with specific examples and detailed explanations.', expectedQuality: 'Detailed' }
    ];

    testCases.forEach(({ text, expectedQuality }) => {
      const interaction = { ...mockInteraction, userAnswerText: text };
      const { unmount } = render(<InteractionItem interaction={interaction} index={0} />);
      
      expect(screen.getByText(expectedQuality)).toBeInTheDocument();
      unmount();
    });
  });

  it('displays correct word count', () => {
    render(<InteractionItem interaction={mockInteraction} index={0} />);
    
    // Expand to see metrics
    fireEvent.click(screen.getByText('Question 1'));
    
    // The actual word count is 10, not 11
    expect(screen.getByText('10')).toBeInTheDocument(); // Word count
    expect(screen.getByText('words')).toBeInTheDocument();
  });

  it('formats timestamp correctly', () => {
    const interaction = {
      ...mockInteraction,
      timestamp: '2024-01-01T15:30:45Z'
    };
    
    render(<InteractionItem interaction={interaction} index={0} />);
    
    // Check for time format (may vary based on locale, could be 3:30:45 PM or 04:30:45 PM)
    expect(screen.getByText(/\d{1,2}:\d{2}:\d{2} [AP]M/)).toBeInTheDocument();
  });

  it('shows correct question number', () => {
    render(<InteractionItem interaction={mockInteraction} index={4} />);
    
    expect(screen.getByText('Question 5')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // In the circle
  });

  it('toggles expansion state correctly', () => {
    render(<InteractionItem interaction={mockInteraction} index={0} />);
    
    const questionElement = screen.getByText('Question 1');
    
    // Initially collapsed
    expect(screen.queryByText('Question:')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(questionElement);
    expect(screen.getByText('Question:')).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(questionElement);
    expect(screen.queryByText('Question:')).not.toBeInTheDocument();
  });

  it('handles null or undefined answer text', () => {
    const nullAnswerInteraction = {
      ...mockInteraction,
      userAnswerText: null
    };
    
    render(<InteractionItem interaction={nullAnswerInteraction} index={0} />);
    
    expect(screen.getByText('No Response')).toBeInTheDocument();
    expect(screen.getByText('0 chars')).toBeInTheDocument();
  });

  it('preserves whitespace in answer text', () => {
    const multilineAnswer = 'Line 1\n\nLine 2\n  Indented line';
    const interaction = {
      ...mockInteraction,
      userAnswerText: multilineAnswer
    };
    
    render(<InteractionItem interaction={interaction} index={0} />);
    
    // Expand to see answer
    fireEvent.click(screen.getByText('Question 1'));
    
    // Check that the whitespace-pre-wrap class is applied to the p element specifically
    const answerElements = screen.getAllByText((content, element) => {
      return element?.textContent === multilineAnswer && element?.tagName === 'P';
    });
    expect(answerElements[0]).toHaveClass('whitespace-pre-wrap');
  });
});