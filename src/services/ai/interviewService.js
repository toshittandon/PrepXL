/**
 * Interview AI Service
 * Handles AI-powered interview question generation and session management
 */

const AI_API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL || 'https://api.example.com';

/**
 * Interview Service
 */
export class InterviewService {
  constructor() {
    this.baseUrl = AI_API_BASE_URL;
  }

  /**
   * Get interview question based on role, session type, and conversation history
   */
  async getInterviewQuestion(params) {
    try {
      const { role, sessionType, experienceLevel, industry, history = [] } = params;

      // For development, return mock questions
      if (import.meta.env.DEV || !this.baseUrl || this.baseUrl.includes('example.com')) {
        return this.getMockQuestion(params);
      }

      const response = await fetch(`${this.baseUrl}/api/get-interview-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          sessionType,
          experienceLevel,
          industry,
          history: history.map(item => ({
            q: item.questionText,
            a: item.userAnswerText
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          questionText: data.questionText || 'Could you tell me about yourself?'
        },
        error: null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Interview question generation failed:', error);
      
      // Fallback to mock question on error
      return this.getMockQuestion(params);
    }
  }

  /**
   * Get mock interview question for development/testing
   */
  getMockQuestion(params) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const question = this.generateMockQuestion(params);
        resolve({
          success: true,
          data: {
            questionText: question
          },
          error: null,
          timestamp: new Date().toISOString()
        });
      }, 1000); // 1 second delay to simulate API call
    });
  }

  /**
   * Generate realistic mock questions based on parameters
   */
  generateMockQuestion(params) {
    const { role, sessionType, experienceLevel, history = [] } = params;
    const questionNumber = history.length + 1;

    // Question pools by session type
    const questionPools = {
      'Behavioral': {
        opening: [
          'Tell me about yourself and your background.',
          'What interests you about this role?',
          'Walk me through your career journey so far.'
        ],
        experience: [
          'Describe a challenging project you worked on. How did you handle it?',
          'Tell me about a time when you had to work with a difficult team member.',
          'Give me an example of when you had to learn something new quickly.',
          'Describe a situation where you had to meet a tight deadline.',
          'Tell me about a time when you made a mistake. How did you handle it?',
          'Describe a time when you had to persuade someone to see your point of view.',
          'Tell me about a time when you went above and beyond your job requirements.'
        ],
        leadership: [
          'Describe your leadership style.',
          'Tell me about a time when you had to lead a team through a difficult situation.',
          'How do you handle conflict within your team?',
          'Describe a time when you had to give constructive feedback to a colleague.'
        ],
        closing: [
          'What are your career goals for the next 5 years?',
          'Why are you looking to leave your current position?',
          'What questions do you have for me about the role or company?'
        ]
      },
      'Technical': {
        opening: [
          `What programming languages and technologies are you most comfortable with for ${role} work?`,
          `How do you stay updated with the latest trends in ${role.toLowerCase()} development?`,
          'Describe your development workflow and tools you prefer to use.'
        ],
        technical: [
          'Explain the difference between synchronous and asynchronous programming.',
          'How would you optimize a slow-performing application?',
          'Describe your approach to debugging complex issues.',
          'What are the key principles of good software design?',
          'How do you ensure code quality in your projects?',
          'Explain your experience with version control and collaboration.',
          'Describe how you would approach system architecture for a new project.',
          'What testing strategies do you implement in your development process?'
        ],
        problem_solving: [
          'Walk me through how you would design a simple chat application.',
          'How would you handle a situation where your application needs to scale to handle 10x more users?',
          'Describe your approach to implementing a new feature in an existing codebase.',
          'How would you troubleshoot a production issue that users are reporting?'
        ],
        closing: [
          'What type of technical challenges are you most excited to work on?',
          'How do you balance technical debt with new feature development?',
          'What questions do you have about our technical stack or development process?'
        ]
      },
      'Case Study': {
        opening: [
          'I\'m going to present you with a business scenario. Take your time to think through it.',
          'Let\'s work through a case study together. Feel free to ask clarifying questions.',
          'I have a business problem I\'d like you to analyze. Walk me through your thinking process.'
        ],
        analysis: [
          'A company is seeing a 20% decline in user engagement. How would you investigate and address this?',
          'You need to launch a new product in a competitive market. What\'s your go-to-market strategy?',
          'A client wants to reduce operational costs by 30%. How would you approach this challenge?',
          'How would you prioritize features for a product with limited development resources?',
          'A startup is struggling with customer acquisition. What strategies would you recommend?',
          'How would you measure the success of a new marketing campaign?'
        ],
        problem_solving: [
          'If you had to choose between improving existing features or building new ones, how would you decide?',
          'How would you handle a situation where stakeholders have conflicting priorities?',
          'Describe how you would conduct market research for a new product idea.',
          'What metrics would you track to measure business performance?'
        ],
        closing: [
          'How do you typically validate your assumptions in business scenarios?',
          'What frameworks or methodologies do you use for problem-solving?',
          'Any questions about how we approach similar challenges here?'
        ]
      }
    };

    // Select appropriate question based on progress and type
    const pool = questionPools[sessionType];
    if (!pool) {
      return 'Tell me about yourself and your experience.';
    }

    // Question selection logic based on interview progress
    if (questionNumber === 1) {
      return this.getRandomQuestion(pool.opening || pool.technical || pool.analysis);
    } else if (questionNumber <= 3) {
      return this.getRandomQuestion(pool.experience || pool.technical || pool.analysis);
    } else if (questionNumber <= 6) {
      return this.getRandomQuestion(pool.leadership || pool.problem_solving || pool.problem_solving);
    } else {
      return this.getRandomQuestion(pool.closing);
    }
  }

  /**
   * Get random question from array
   */
  getRandomQuestion(questions) {
    if (!questions || questions.length === 0) {
      return 'Tell me about yourself and your experience.';
    }
    return questions[Math.floor(Math.random() * questions.length)];
  }

  /**
   * Calculate interview score based on interactions
   */
  async calculateInterviewScore(interactions) {
    try {
      // For development, return mock score
      if (import.meta.env.DEV || !this.baseUrl || this.baseUrl.includes('example.com')) {
        return this.getMockScore(interactions);
      }

      const response = await fetch(`${this.baseUrl}/api/calculate-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interactions: interactions.map(item => ({
            question: item.questionText,
            answer: item.userAnswerText
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Score calculation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          score: data.score || 75,
          feedback: data.feedback || 'Good overall performance'
        },
        error: null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Score calculation failed:', error);
      return this.getMockScore(interactions);
    }
  }

  /**
   * Generate mock score based on interactions
   */
  getMockScore(interactions) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simple scoring based on answer length and number of interactions
        const avgAnswerLength = interactions.reduce((sum, item) => 
          sum + (item.userAnswerText?.length || 0), 0) / interactions.length;
        
        let baseScore = 70;
        
        // Bonus for longer, more detailed answers
        if (avgAnswerLength > 100) baseScore += 10;
        if (avgAnswerLength > 200) baseScore += 5;
        
        // Bonus for completing more questions
        if (interactions.length >= 5) baseScore += 10;
        if (interactions.length >= 8) baseScore += 5;
        
        // Add some randomness
        const finalScore = Math.min(100, baseScore + Math.floor(Math.random() * 10));
        
        resolve({
          success: true,
          data: {
            score: finalScore,
            feedback: this.generateScoreFeedback(finalScore, interactions.length)
          },
          error: null,
          timestamp: new Date().toISOString()
        });
      }, 1500);
    });
  }

  /**
   * Generate feedback based on score
   */
  generateScoreFeedback(score, questionCount) {
    if (score >= 90) {
      return 'Excellent performance! You demonstrated strong communication skills and provided detailed, relevant answers.';
    } else if (score >= 80) {
      return 'Good performance overall. Your answers showed good understanding and experience.';
    } else if (score >= 70) {
      return 'Solid performance with room for improvement. Consider providing more specific examples and details.';
    } else {
      return 'There\'s room for improvement. Focus on providing more detailed answers with specific examples.';
    }
  }

  /**
   * Validate interview parameters
   */
  validateInterviewParams(params) {
    const { role, sessionType } = params;
    
    if (!role || typeof role !== 'string') {
      throw new Error('Role is required and must be a string');
    }
    
    if (!sessionType || typeof sessionType !== 'string') {
      throw new Error('Session type is required and must be a string');
    }
    
    const validSessionTypes = ['Behavioral', 'Technical', 'Case Study'];
    if (!validSessionTypes.includes(sessionType)) {
      throw new Error(`Invalid session type. Must be one of: ${validSessionTypes.join(', ')}`);
    }
    
    return true;
  }

  /**
   * Health check for interview AI service
   */
  async healthCheck() {
    try {
      if (import.meta.env.DEV || !this.baseUrl || this.baseUrl.includes('example.com')) {
        return {
          success: true,
          data: { status: 'healthy', mode: 'mock' },
          error: null,
          timestamp: new Date().toISOString()
        };
      }

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: { status: 'healthy', ...data },
        error: null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: { message: error.message },
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export const interviewService = new InterviewService();