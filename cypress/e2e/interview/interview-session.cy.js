describe('Interview Session Workflow', () => {
  beforeEach(() => {
    cy.seedTestData();
    cy.login();
    cy.mockSpeechRecognition();
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  describe('Interview Setup', () => {
    it('should complete interview setup and start session', () => {
      cy.visit('/interview/setup');
      
      // Check page loads correctly
      cy.get('[data-testid="setup-page"]').should('be.visible');
      cy.get('h1').should('contain', 'Interview Setup');
      
      // Fill out setup form
      cy.get('[data-testid="role-input"]').type('Senior Software Engineer');
      cy.get('[data-testid="session-type-select"]').select('Technical');
      cy.get('[data-testid="experience-level-select"]').select('Senior');
      cy.get('[data-testid="industry-select"]').select('Technology');
      
      // Add optional preferences
      cy.get('[data-testid="duration-select"]').select('30');
      cy.get('[data-testid="difficulty-select"]').select('Medium');
      
      // Start interview
      cy.get('[data-testid="start-interview-button"]').should('not.be.disabled');
      cy.get('[data-testid="start-interview-button"]').click();
      
      // Should create session
      cy.wait('@createDocument');
      cy.wait('@getInterviewQuestion');
      
      // Should redirect to live interview
      cy.url().should('include', '/interview/live');
      
      // Should show interview interface
      cy.get('[data-testid="interview-interface"]').should('be.visible');
      cy.get('[data-testid="question-display"]').should('be.visible');
      cy.get('[data-testid="interview-controls"]').should('be.visible');
    });

    it('should validate setup form fields', () => {
      cy.visit('/interview/setup');
      
      // Try to start without filling required fields
      cy.get('[data-testid="start-interview-button"]').click();
      
      // Should show validation errors
      cy.get('[data-testid="role-error"]').should('contain', 'Role is required');
      cy.get('[data-testid="session-type-error"]').should('contain', 'Session type is required');
      
      // Fill role but leave session type empty
      cy.get('[data-testid="role-input"]').type('Software Engineer');
      cy.get('[data-testid="start-interview-button"]').click();
      
      // Should still show session type error
      cy.get('[data-testid="session-type-error"]').should('be.visible');
      cy.get('[data-testid="role-error"]').should('not.exist');
    });

    it('should show different question types based on session type', () => {
      cy.visit('/interview/setup');
      
      // Test Technical session
      cy.get('[data-testid="role-input"]').type('Software Engineer');
      cy.get('[data-testid="session-type-select"]').select('Technical');
      
      // Should show technical-specific options
      cy.get('[data-testid="programming-language-select"]').should('be.visible');
      cy.get('[data-testid="technical-focus-select"]').should('be.visible');
      
      // Test Behavioral session
      cy.get('[data-testid="session-type-select"]').select('Behavioral');
      
      // Should hide technical options and show behavioral options
      cy.get('[data-testid="programming-language-select"]').should('not.exist');
      cy.get('[data-testid="behavioral-focus-select"]').should('be.visible');
    });
  });

  describe('Live Interview Session', () => {
    beforeEach(() => {
      // Mock existing interview session
      cy.intercept('GET', '**/databases/*/collections/*/documents/*', {
        body: {
          $id: 'session123',
          userId: 'user123',
          role: 'Software Engineer',
          sessionType: 'Technical',
          status: 'active',
          $createdAt: new Date().toISOString()
        }
      }).as('getSession');
      
      cy.intercept('GET', '**/databases/*/collections/*/documents', {
        body: { documents: [] }
      }).as('getInteractions');
    });

    it('should display question and handle speech recognition', () => {
      cy.visit('/interview/live/session123');
      cy.wait('@getSession');
      cy.wait('@getInteractions');
      cy.wait('@getInterviewQuestion');
      
      // Should show question
      cy.get('[data-testid="current-question"]').should('be.visible');
      cy.get('[data-testid="question-text"]').should('contain', 'Tell me about a challenging technical problem');
      
      // Should show interview controls
      cy.get('[data-testid="start-recording-button"]').should('be.visible');
      cy.get('[data-testid="end-interview-button"]').should('be.visible');
      
      // Start recording
      cy.get('[data-testid="start-recording-button"]').click();
      
      // Should show recording state
      cy.get('[data-testid="recording-indicator"]').should('be.visible');
      cy.get('[data-testid="stop-recording-button"]').should('be.visible');
      
      // Simulate speech recognition result
      cy.window().then((win) => {
        const recognition = new win.SpeechRecognition();
        recognition.simulateResult('I recently worked on a complex microservices architecture problem where we needed to handle high traffic loads.');
      });
      
      // Should show transcribed answer
      cy.get('[data-testid="current-answer"]').should('contain', 'I recently worked on a complex microservices');
      
      // Stop recording
      cy.get('[data-testid="stop-recording-button"]').click();
      
      // Should show next question button
      cy.get('[data-testid="next-question-button"]').should('be.visible');
    });

    it('should handle question progression', () => {
      cy.visit('/interview/live/session123');
      cy.wait('@getSession');
      cy.wait('@getInteractions');
      cy.wait('@getInterviewQuestion');
      
      // Answer first question
      cy.get('[data-testid="start-recording-button"]').click();
      cy.window().then((win) => {
        const recognition = new win.SpeechRecognition();
        recognition.simulateResult('This is my answer to the first question.');
      });
      cy.get('[data-testid="stop-recording-button"]').click();
      
      // Go to next question
      cy.get('[data-testid="next-question-button"]').click();
      cy.wait('@createDocument'); // Save interaction
      cy.wait('@getInterviewQuestion'); // Get next question
      
      // Should show question counter
      cy.get('[data-testid="question-counter"]').should('contain', 'Question 2');
      
      // Should show new question
      cy.get('[data-testid="question-text"]').should('be.visible');
      
      // Should reset answer area
      cy.get('[data-testid="current-answer"]').should('be.empty');
    });

    it('should handle interview pause and resume', () => {
      cy.visit('/interview/live/session123');
      cy.wait('@getSession');
      cy.wait('@getInteractions');
      cy.wait('@getInterviewQuestion');
      
      // Start recording
      cy.get('[data-testid="start-recording-button"]').click();
      
      // Pause interview
      cy.get('[data-testid="pause-interview-button"]').click();
      
      // Should show paused state
      cy.get('[data-testid="paused-indicator"]').should('be.visible');
      cy.get('[data-testid="resume-interview-button"]').should('be.visible');
      
      // Recording should be stopped
      cy.get('[data-testid="recording-indicator"]').should('not.exist');
      
      // Resume interview
      cy.get('[data-testid="resume-interview-button"]').click();
      
      // Should return to active state
      cy.get('[data-testid="paused-indicator"]').should('not.exist');
      cy.get('[data-testid="start-recording-button"]').should('be.visible');
    });

    it('should handle speech recognition errors', () => {
      cy.visit('/interview/live/session123');
      cy.wait('@getSession');
      cy.wait('@getInteractions');
      cy.wait('@getInterviewQuestion');
      
      // Start recording
      cy.get('[data-testid="start-recording-button"]').click();
      
      // Simulate speech recognition error
      cy.window().then((win) => {
        const recognition = new win.SpeechRecognition();
        if (recognition.onerror) {
          recognition.onerror({ error: 'no-speech' });
        }
      });
      
      // Should show error message
      cy.get('[data-testid="speech-error"]').should('contain', 'No speech detected');
      cy.get('[data-testid="try-again-button"]').should('be.visible');
      
      // Should allow manual text input as fallback
      cy.get('[data-testid="manual-input-button"]').click();
      cy.get('[data-testid="answer-textarea"]').should('be.visible');
      
      // Type manual answer
      cy.get('[data-testid="answer-textarea"]').type('This is my manual answer since speech recognition failed.');
      cy.get('[data-testid="save-answer-button"]').click();
      
      // Should show the answer
      cy.get('[data-testid="current-answer"]').should('contain', 'This is my manual answer');
    });

    it('should show interview progress and time tracking', () => {
      cy.visit('/interview/live/session123');
      cy.wait('@getSession');
      cy.wait('@getInteractions');
      cy.wait('@getInterviewQuestion');
      
      // Should show progress indicators
      cy.get('[data-testid="progress-bar"]').should('be.visible');
      cy.get('[data-testid="question-counter"]').should('contain', 'Question 1');
      cy.get('[data-testid="time-elapsed"]').should('be.visible');
      
      // Should show estimated time remaining
      cy.get('[data-testid="time-remaining"]').should('be.visible');
      
      // Progress should update after answering questions
      cy.get('[data-testid="start-recording-button"]').click();
      cy.window().then((win) => {
        const recognition = new win.SpeechRecognition();
        recognition.simulateResult('Answer to first question.');
      });
      cy.get('[data-testid="stop-recording-button"]').click();
      cy.get('[data-testid="next-question-button"]').click();
      
      cy.wait('@createDocument');
      cy.wait('@getInterviewQuestion');
      
      // Progress should increase
      cy.get('[data-testid="question-counter"]').should('contain', 'Question 2');
      cy.get('[data-testid="progress-bar"]').should('have.attr', 'aria-valuenow', '20'); // 2/10 questions
    });
  });

  describe('Interview Completion', () => {
    beforeEach(() => {
      // Mock session with some interactions
      cy.intercept('GET', '**/databases/*/collections/*/documents/*', {
        body: {
          $id: 'session123',
          userId: 'user123',
          role: 'Software Engineer',
          sessionType: 'Technical',
          status: 'active',
          $createdAt: new Date().toISOString()
        }
      }).as('getSession');
      
      cy.intercept('GET', '**/databases/*/collections/*/documents', {
        body: {
          documents: [
            {
              $id: 'interaction1',
              sessionId: 'session123',
              questionText: 'First question',
              userAnswerText: 'First answer',
              order: 1
            }
          ]
        }
      }).as('getInteractions');
    });

    it('should end interview and navigate to report', () => {
      cy.visit('/interview/live/session123');
      cy.wait('@getSession');
      cy.wait('@getInteractions');
      cy.wait('@getInterviewQuestion');
      
      // End interview
      cy.get('[data-testid="end-interview-button"]').click();
      
      // Should show confirmation dialog
      cy.get('[data-testid="end-confirmation"]').should('be.visible');
      cy.get('[data-testid="end-confirmation-message"]').should('contain', 'Are you sure you want to end the interview?');
      
      // Confirm ending
      cy.get('[data-testid="confirm-end-button"]').click();
      
      // Should update session status
      cy.wait('@updateDocument');
      
      // Should redirect to report
      cy.url().should('include', '/interview/report/session123');
      
      // Should show completion message
      cy.get('[data-testid="completion-message"]').should('be.visible');
    });

    it('should auto-complete after maximum questions', () => {
      // Mock session with 9 interactions (close to max of 10)
      const interactions = Array.from({ length: 9 }, (_, i) => ({
        $id: `interaction${i + 1}`,
        sessionId: 'session123',
        questionText: `Question ${i + 1}`,
        userAnswerText: `Answer ${i + 1}`,
        order: i + 1
      }));
      
      cy.intercept('GET', '**/databases/*/collections/*/documents', {
        body: { documents: interactions }
      }).as('getInteractions');
      
      cy.visit('/interview/live/session123');
      cy.wait('@getSession');
      cy.wait('@getInteractions');
      cy.wait('@getInterviewQuestion');
      
      // Should show this is the final question
      cy.get('[data-testid="final-question-indicator"]').should('be.visible');
      cy.get('[data-testid="question-counter"]').should('contain', 'Question 10 of 10');
      
      // Answer the final question
      cy.get('[data-testid="start-recording-button"]').click();
      cy.window().then((win) => {
        const recognition = new win.SpeechRecognition();
        recognition.simulateResult('This is my final answer.');
      });
      cy.get('[data-testid="stop-recording-button"]').click();
      
      // Next question button should say "Complete Interview"
      cy.get('[data-testid="complete-interview-button"]').should('be.visible');
      cy.get('[data-testid="complete-interview-button"]').click();
      
      // Should save final interaction and complete session
      cy.wait('@createDocument');
      cy.wait('@updateDocument');
      
      // Should redirect to report
      cy.url().should('include', '/interview/report/session123');
    });

    it('should handle interview abandonment', () => {
      cy.visit('/interview/live/session123');
      cy.wait('@getSession');
      cy.wait('@getInteractions');
      cy.wait('@getInterviewQuestion');
      
      // Try to navigate away
      cy.visit('/dashboard');
      
      // Should show warning dialog
      cy.get('[data-testid="abandon-warning"]').should('be.visible');
      cy.get('[data-testid="abandon-message"]').should('contain', 'You have an active interview session');
      
      // Options to continue or abandon
      cy.get('[data-testid="continue-interview-button"]').should('be.visible');
      cy.get('[data-testid="abandon-interview-button"]').should('be.visible');
      
      // Choose to abandon
      cy.get('[data-testid="abandon-interview-button"]').click();
      
      // Should update session status to abandoned
      cy.wait('@updateDocument');
      
      // Should allow navigation to dashboard
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Interview Reports', () => {
    beforeEach(() => {
      // Mock completed session with interactions
      cy.intercept('GET', '**/databases/*/collections/*/documents/*', {
        body: {
          $id: 'session123',
          userId: 'user123',
          role: 'Software Engineer',
          sessionType: 'Technical',
          status: 'completed',
          finalScore: 85,
          $createdAt: '2024-01-15T10:00:00.000Z',
          $updatedAt: '2024-01-15T10:30:00.000Z'
        }
      }).as('getCompletedSession');
      
      cy.intercept('GET', '**/databases/*/collections/*/documents', {
        body: {
          documents: [
            {
              $id: 'interaction1',
              sessionId: 'session123',
              questionText: 'Tell me about yourself',
              userAnswerText: 'I am a software engineer with 5 years of experience...',
              order: 1,
              timestamp: '2024-01-15T10:05:00.000Z'
            },
            {
              $id: 'interaction2',
              sessionId: 'session123',
              questionText: 'What is your biggest strength?',
              userAnswerText: 'My biggest strength is problem-solving...',
              order: 2,
              timestamp: '2024-01-15T10:10:00.000Z'
            }
          ]
        }
      }).as('getSessionInteractions');
    });

    it('should display comprehensive interview report', () => {
      cy.visit('/interview/report/session123');
      cy.wait('@getCompletedSession');
      cy.wait('@getSessionInteractions');
      
      // Should show report header
      cy.get('[data-testid="report-header"]').should('be.visible');
      cy.get('[data-testid="session-title"]').should('contain', 'Software Engineer • Technical');
      cy.get('[data-testid="session-date"]').should('contain', 'January 15, 2024');
      
      // Should show overall score
      cy.get('[data-testid="overall-score"]').should('be.visible');
      cy.get('[data-testid="score-value"]').should('contain', '85');
      cy.get('[data-testid="score-label"]').should('contain', 'Overall Score');
      
      // Should show all interactions
      cy.get('[data-testid="interaction-list"]').should('be.visible');
      cy.get('[data-testid="interaction-item"]').should('have.length', 2);
      
      // Check first interaction
      cy.get('[data-testid="interaction-item"]').first().within(() => {
        cy.get('[data-testid="question-text"]').should('contain', 'Tell me about yourself');
        cy.get('[data-testid="answer-text"]').should('contain', 'I am a software engineer with 5 years');
        cy.get('[data-testid="interaction-timestamp"]').should('be.visible');
      });
      
      // Should show session statistics
      cy.get('[data-testid="session-stats"]').should('be.visible');
      cy.get('[data-testid="total-questions"]').should('contain', '2');
      cy.get('[data-testid="session-duration"]').should('contain', '30 minutes');
    });

    it('should allow exporting report', () => {
      cy.visit('/interview/report/session123');
      cy.wait('@getCompletedSession');
      cy.wait('@getSessionInteractions');
      
      // Should show export options
      cy.get('[data-testid="export-button"]').should('be.visible');
      cy.get('[data-testid="export-button"]').click();
      
      // Should show export menu
      cy.get('[data-testid="export-menu"]').should('be.visible');
      cy.get('[data-testid="export-pdf"]').should('be.visible');
      cy.get('[data-testid="export-json"]').should('be.visible');
      cy.get('[data-testid="export-csv"]').should('be.visible');
      
      // Test PDF export
      cy.get('[data-testid="export-pdf"]').click();
      
      // Should trigger download (we can't test actual file download in Cypress easily)
      // But we can verify the export function was called
      cy.get('[data-testid="export-success"]').should('contain', 'Report exported successfully');
    });

    it('should navigate back to dashboard', () => {
      cy.visit('/interview/report/session123');
      cy.wait('@getCompletedSession');
      cy.wait('@getSessionInteractions');
      
      // Should show back button
      cy.get('[data-testid="back-to-dashboard"]').should('be.visible');
      cy.get('[data-testid="back-to-dashboard"]').click();
      
      // Should navigate to dashboard
      cy.url().should('include', '/dashboard');
    });

    it('should handle missing or invalid session', () => {
      // Mock session not found
      cy.intercept('GET', '**/databases/*/collections/*/documents/*', {
        statusCode: 404,
        body: { message: 'Session not found' }
      }).as('getSessionNotFound');
      
      cy.visit('/interview/report/nonexistent');
      cy.wait('@getSessionNotFound');
      
      // Should show error message
      cy.get('[data-testid="session-error"]').should('be.visible');
      cy.get('[data-testid="error-message"]').should('contain', 'Session not found');
      cy.get('[data-testid="back-to-dashboard"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible during interview setup', () => {
      cy.visit('/interview/setup');
      cy.checkAccessibility();
      
      // Check form accessibility
      cy.get('[data-testid="role-input"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="session-type-select"]').should('have.attr', 'aria-label');
    });

    it('should be accessible during live interview', () => {
      cy.intercept('GET', '**/databases/*/collections/*/documents/*', {
        body: {
          $id: 'session123',
          userId: 'user123',
          role: 'Software Engineer',
          sessionType: 'Technical',
          status: 'active'
        }
      }).as('getSession');
      
      cy.visit('/interview/live/session123');
      cy.wait('@getSession');
      cy.wait('@getInterviewQuestion');
      
      cy.checkAccessibility();
      
      // Check interview controls accessibility
      cy.get('[data-testid="start-recording-button"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="question-text"]').should('have.attr', 'role', 'main');
    });

    it('should be accessible on report page', () => {
      cy.intercept('GET', '**/databases/*/collections/*/documents/*', {
        body: {
          $id: 'session123',
          status: 'completed',
          finalScore: 85
        }
      }).as('getCompletedSession');
      
      cy.visit('/interview/report/session123');
      cy.wait('@getCompletedSession');
      
      cy.checkAccessibility();
      
      // Check report accessibility
      cy.get('[data-testid="overall-score"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="interaction-list"]').should('have.attr', 'role', 'list');
    });
  });

  describe('Performance', () => {
    it('should load interview pages quickly', () => {
      cy.visit('/interview/setup');
      cy.measurePageLoad();
    });

    it('should handle real-time updates efficiently', () => {
      cy.intercept('GET', '**/databases/*/collections/*/documents/*', {
        body: {
          $id: 'session123',
          userId: 'user123',
          status: 'active'
        }
      }).as('getSession');
      
      cy.visit('/interview/live/session123');
      cy.wait('@getSession');
      cy.wait('@getInterviewQuestion');
      
      // Simulate rapid speech recognition updates
      cy.get('[data-testid="start-recording-button"]').click();
      
      // Multiple rapid updates should not cause performance issues
      for (let i = 0; i < 10; i++) {
        cy.window().then((win) => {
          const recognition = new win.SpeechRecognition();
          recognition.simulateResult(`Word ${i}`);
        });
      }
      
      // Should handle updates smoothly
      cy.get('[data-testid="current-answer"]').should('contain', 'Word 9');
    });
  });

  describe('Error Handling', () => {
    it('should handle session creation errors', () => {
      // Mock session creation failure
      cy.intercept('POST', '**/databases/*/collections/*/documents', {
        statusCode: 500,
        body: { message: 'Failed to create interview session' }
      }).as('createSessionError');
      
      cy.visit('/interview/setup');
      
      cy.get('[data-testid="role-input"]').type('Software Engineer');
      cy.get('[data-testid="session-type-select"]').select('Technical');
      cy.get('[data-testid="start-interview-button"]').click();
      
      cy.wait('@createSessionError');
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to create interview session');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should handle question loading errors', () => {
      cy.intercept('GET', '**/databases/*/collections/*/documents/*', {
        body: {
          $id: 'session123',
          userId: 'user123',
          status: 'active'
        }
      }).as('getSession');
      
      // Mock question loading failure
      cy.intercept('POST', '**/get-interview-question', {
        statusCode: 503,
        body: { message: 'AI service temporarily unavailable' }
      }).as('questionError');
      
      cy.visit('/interview/live/session123');
      cy.wait('@getSession');
      cy.wait('@questionError');
      
      // Should show error message
      cy.get('[data-testid="question-error"]').should('contain', 'AI service temporarily unavailable');
      cy.get('[data-testid="retry-question-button"]').should('be.visible');
      
      // Should allow retry
      cy.intercept('POST', '**/get-interview-question', { fixture: 'ai/interview-question.json' }).as('questionSuccess');
      cy.get('[data-testid="retry-question-button"]').click();
      cy.wait('@questionSuccess');
      
      // Should show question
      cy.get('[data-testid="question-text"]').should('be.visible');
    });

    it('should handle browser compatibility issues', () => {
      cy.visit('/interview/setup');
      
      // Mock unsupported browser (no speech recognition)
      cy.window().then((win) => {
        delete win.SpeechRecognition;
        delete win.webkitSpeechRecognition;
      });
      
      cy.get('[data-testid="role-input"]').type('Software Engineer');
      cy.get('[data-testid="session-type-select"]').select('Technical');
      cy.get('[data-testid="start-interview-button"]').click();
      
      cy.wait('@createDocument');
      
      // Should show compatibility warning
      cy.get('[data-testid="compatibility-warning"]').should('be.visible');
      cy.get('[data-testid="manual-input-option"]').should('be.visible');
      
      // Should still allow manual text input
      cy.get('[data-testid="use-manual-input"]').click();
      cy.url().should('include', '/interview/live');
      cy.get('[data-testid="answer-textarea"]').should('be.visible');
    });
  });
});