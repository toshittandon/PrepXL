import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuestionDisplay from '../../../components/interview/QuestionDisplay';

describe('QuestionDisplay', () => {
  it('should render question text', () => {
    const question = "Tell me about yourself and your experience.";
    render(<QuestionDisplay question={question} />);
    
    expect(screen.getByText(question)).toBeInTheDocument();
  });

  it('should render loading state when question is loading', () => {
    render(<QuestionDisplay loading />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/loading question/i)).toBeInTheDocument();
  });

  it('should render empty state when no question is provided', () => {
    render(<QuestionDisplay />);
    
    expect(screen.getByText(/no question available/i) || screen.getByText(/waiting for question/i)).toBeInTheDocument();
  });

  it('should display question number when provided', () => {
    render(
      <QuestionDisplay 
        question="What are your strengths?" 
        questionNumber={3}
        totalQuestions={10}
      />
    );
    
    expect(screen.getByText(/question 3 of 10/i)).toBeInTheDocument();
  });

  it('should render with proper typography styling', () => {
    const question = "Describe a challenging project you worked on.";
    render(<QuestionDisplay question={question} />);
    
    const questionElement = screen.getByText(question);
    expect(questionElement).toHaveClass('text-lg');
  });

  it('should handle long questions with proper formatting', () => {
    const longQuestion = "This is a very long question that should be properly formatted and displayed in a readable manner without breaking the layout or causing any visual issues.";
    render(<QuestionDisplay question={longQuestion} />);
    
    expect(screen.getByText(longQuestion)).toBeInTheDocument();
  });

  it('should render question type indicator', () => {
    render(
      <QuestionDisplay 
        question="What motivates you?" 
        type="behavioral"
      />
    );
    
    expect(screen.getByText(/behavioral/i)).toBeInTheDocument();
  });

  it('should display time limit when provided', () => {
    render(
      <QuestionDisplay 
        question="Solve this coding problem." 
        timeLimit={300}
      />
    );
    
    expect(screen.getByText(/5:00/i) || screen.getByText(/300/i)).toBeInTheDocument();
  });

  it('should show remaining time countdown', () => {
    render(
      <QuestionDisplay 
        question="Explain your approach." 
        timeLimit={300}
        timeRemaining={180}
      />
    );
    
    expect(screen.getByText(/3:00/i) || screen.getByText(/180/i)).toBeInTheDocument();
  });

  it('should apply warning styling when time is running low', () => {
    render(
      <QuestionDisplay 
        question="Final thoughts?" 
        timeLimit={300}
        timeRemaining={30}
      />
    );
    
    const timeElement = screen.getByText(/0:30/i) || screen.getByText(/30/i);
    expect(timeElement).toHaveClass('text-red-600');
  });

  it('should render with custom className', () => {
    render(<QuestionDisplay question="Test question" className="custom-question" />);
    
    const container = screen.getByText("Test question").closest('div');
    expect(container).toHaveClass('custom-question');
  });

  it('should handle error state', () => {
    render(<QuestionDisplay error="Failed to load question" />);
    
    expect(screen.getByText(/failed to load question/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should be accessible with proper ARIA attributes', () => {
    render(
      <QuestionDisplay 
        question="What is your biggest weakness?" 
        questionNumber={2}
      />
    );
    
    const questionElement = screen.getByRole('heading') || screen.getByText("What is your biggest weakness?");
    expect(questionElement).toHaveAttribute('aria-level', '2');
  });

  it('should render question hints when provided', () => {
    const hints = ["Think about specific examples", "Focus on growth mindset"];
    render(
      <QuestionDisplay 
        question="Describe a failure." 
        hints={hints}
      />
    );
    
    hints.forEach(hint => {
      expect(screen.getByText(hint)).toBeInTheDocument();
    });
  });

  it('should show/hide hints toggle', () => {
    const hints = ["Consider the STAR method"];
    render(
      <QuestionDisplay 
        question="Tell me about a time..." 
        hints={hints}
        showHintsToggle
      />
    );
    
    expect(screen.getByRole('button', { name: /show hints/i })).toBeInTheDocument();
  });

  it('should render question category badge', () => {
    render(
      <QuestionDisplay 
        question="How do you handle stress?" 
        category="Behavioral"
      />
    );
    
    expect(screen.getByText('Behavioral')).toBeInTheDocument();
  });

  it('should handle markdown formatting in questions', () => {
    const markdownQuestion = "What is **your** approach to *problem solving*?";
    render(<QuestionDisplay question={markdownQuestion} />);
    
    expect(screen.getByText(/your/)).toBeInTheDocument();
    expect(screen.getByText(/problem solving/)).toBeInTheDocument();
  });

  it('should render progress indicator', () => {
    render(
      <QuestionDisplay 
        question="Final question" 
        questionNumber={10}
        totalQuestions={10}
        showProgress
      />
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should handle different question difficulties', () => {
    const difficulties = ['easy', 'medium', 'hard'];
    
    difficulties.forEach(difficulty => {
      const { unmount } = render(
        <QuestionDisplay 
          question="Test question" 
          difficulty={difficulty}
        />
      );
      
      expect(screen.getByText(new RegExp(difficulty, 'i'))).toBeInTheDocument();
      
      unmount();
    });
  });

  it('should render with animation when question changes', () => {
    const { rerender } = render(<QuestionDisplay question="First question" />);
    
    rerender(<QuestionDisplay question="Second question" />);
    
    const questionElement = screen.getByText("Second question");
    expect(questionElement).toHaveClass('animate-fade-in');
  });
});