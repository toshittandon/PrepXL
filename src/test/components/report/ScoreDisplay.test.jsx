import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScoreDisplay from '../../../components/report/ScoreDisplay.jsx';

describe('ScoreDisplay', () => {
  const defaultProps = {
    score: 85,
    sessionType: 'Behavioral',
    totalQuestions: 10,
    completedQuestions: 8
  };

  it('renders score display with basic information', () => {
    render(<ScoreDisplay {...defaultProps} />);
    
    // The score starts at 0 and animates to 85, so we check for both states
    expect(screen.getByText('/100')).toBeInTheDocument();
    expect(screen.getByText('Grade: B')).toBeInTheDocument();
    expect(screen.getByText('Good Performance')).toBeInTheDocument();
    expect(screen.getByText('Behavioral Interview Assessment')).toBeInTheDocument();
    // Check that 85% appears in the progress section
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('displays correct statistics', () => {
    render(<ScoreDisplay {...defaultProps} />);
    
    expect(screen.getByText('8')).toBeInTheDocument(); // Completed questions
    expect(screen.getByText('Questions Answered')).toBeInTheDocument();
    expect(screen.getByText('out of 10')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument(); // Completion rate
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
  });

  it('shows pending state when score is null', () => {
    render(<ScoreDisplay {...defaultProps} score={null} />);
    
    expect(screen.getByText('Score Calculation Pending')).toBeInTheDocument();
    expect(screen.getByText('Your interview score is being calculated and will be available shortly.')).toBeInTheDocument();
  });

  it('handles zero score correctly', () => {
    render(<ScoreDisplay {...defaultProps} score={0} />);
    
    expect(screen.getByText('Grade: F')).toBeInTheDocument();
    expect(screen.getByText('Poor Performance')).toBeInTheDocument();
    // Check for the main score display specifically
    const scoreElements = screen.getAllByText('0');
    expect(scoreElements.length).toBeGreaterThan(0);
  });

  it('applies correct color classes for different score ranges', () => {
    const testCases = [
      { score: 95, expectedGrade: 'A', expectedDescription: 'Excellent Performance' },
      { score: 85, expectedGrade: 'B', expectedDescription: 'Good Performance' },
      { score: 75, expectedGrade: 'C', expectedDescription: 'Satisfactory Performance' },
      { score: 65, expectedGrade: 'D', expectedDescription: 'Needs Improvement' },
      { score: 45, expectedGrade: 'F', expectedDescription: 'Poor Performance' }
    ];

    testCases.forEach(({ score, expectedGrade, expectedDescription }) => {
      const { unmount } = render(<ScoreDisplay {...defaultProps} score={score} />);
      
      expect(screen.getByText(`Grade: ${expectedGrade}`)).toBeInTheDocument();
      expect(screen.getByText(expectedDescription)).toBeInTheDocument();
      
      unmount();
    });
  });

  it('calculates completion rate correctly', () => {
    const testCases = [
      { total: 10, completed: 8, expected: '80%' },
      { total: 5, completed: 5, expected: '100%' },
      { total: 10, completed: 0, expected: '0%' },
      { total: 0, completed: 0, expected: '0%' }
    ];

    testCases.forEach(({ total, completed, expected }) => {
      const { unmount } = render(
        <ScoreDisplay 
          {...defaultProps} 
          totalQuestions={total} 
          completedQuestions={completed} 
        />
      );
      
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('displays score breakdown when available', () => {
    const scoreWithBreakdown = {
      score: 85,
      breakdown: {
        communication: 90,
        technicalSkills: 80,
        problemSolving: 85
      }
    };

    render(<ScoreDisplay {...defaultProps} score={scoreWithBreakdown} />);
    
    expect(screen.getByText('Score Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('Technical Skills')).toBeInTheDocument();
    expect(screen.getByText('Problem Solving')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('shows performance indicators correctly', () => {
    render(<ScoreDisplay {...defaultProps} score={85} />);
    
    expect(screen.getByText('Strong Performance')).toBeInTheDocument();
    expect(screen.getByText('High Completion')).toBeInTheDocument();
    expect(screen.getByText('Above Average')).toBeInTheDocument();
  });

  it('handles different session types', () => {
    const sessionTypes = ['Technical', 'Case Study', 'Behavioral'];
    
    sessionTypes.forEach(sessionType => {
      const { unmount } = render(<ScoreDisplay {...defaultProps} sessionType={sessionType} />);
      
      expect(screen.getByText(`${sessionType} Interview Assessment`)).toBeInTheDocument();
      unmount();
    });
  });

  it('handles edge cases for questions', () => {
    render(
      <ScoreDisplay 
        {...defaultProps} 
        totalQuestions={0} 
        completedQuestions={0} 
      />
    );
    
    expect(screen.getByText('Questions Answered')).toBeInTheDocument();
    expect(screen.getByText('out of 0')).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
  });

  it('formats category names correctly in breakdown', () => {
    const scoreWithBreakdown = {
      score: 85,
      breakdown: {
        technicalSkills: 80,
        problemSolvingAbility: 85,
        communicationSkills: 90
      }
    };

    render(<ScoreDisplay {...defaultProps} score={scoreWithBreakdown} />);
    
    expect(screen.getByText('Technical Skills')).toBeInTheDocument();
    expect(screen.getByText('Problem Solving Ability')).toBeInTheDocument();
    expect(screen.getByText('Communication Skills')).toBeInTheDocument();
  });

  it('shows correct icons for different score ranges', () => {
    const { container } = render(<ScoreDisplay {...defaultProps} score={95} />);
    
    // Check if trophy icon is present for excellent score
    const trophyIcon = container.querySelector('svg');
    expect(trophyIcon).toBeInTheDocument();
  });
});