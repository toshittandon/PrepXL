describe('Complete Interview Flow', () => {
  beforeEach(() => {
    cy.cleanupTestData()
    cy.seedTestData()
    
    // Mock authentication
    cy.intercept('GET', '/api/auth/user', { fixture: 'auth/user-profile.json' }).as('getUser')
    
    // Mock interview API calls
    cy.intercept('POST', '/api/database/documents', { fixture: 'database/create-session.json' }).as('createSession')
    cy.intercept('POST', '/api/ai/interview-question', { fixture: 'ai/interview-question.json' }).as('getQuestion')
    cy.intercept('PATCH', '/api/database/documents/*', { fixture: 'database/update-session.json' }).as('updateSession')
    cy.intercept('GET', '/api/database/documents/*', { fixture: 'database/interview-session.json' }).as('getSession')
    
    // Mock speech recognition
    cy.mockSpeechRecognition()
    
    // Login before each test
    cy.login()
  })

  afterEach(() => {
    cy.cleanupTestData()
  })

  describe('Interview Setup Process', () => {
    it('should complete interview setup workflow', () => {
      cy.visit('/interview/setup')
      
      // Verify setup page loaded
      cy.get('[data-testid="setup-title"]').should('contain', 'Interview Setup')
      cy.get('[data-testid="role-input"]').should('be.visible')
      cy.get('[data-testid="session-type-select"]').should('be.visible')
      cy.get('[data-testid="experience-level-select"]').should('be.visible')
      
      // Fill setup form
      cy.get('[data-testid="role-input"]').type('Senior Software Engineer')
      cy.get('[data-testid="session-type-select"]').select('Technical')
      cy.get('[data-testid="experience-level-select"]').select('Senior')
      
      // Add optional preferences
      cy.get('[data-testid="focus-areas-input"]').type('React, Node.js, System Design')
      cy.get('[data-testid="duration-select"]').select('45')
      
      // Start interview
      cy.get('[data-testid="start-interview-button"]').click()
      
      // Should create session and redirect
      cy.wait('@createSession')
      cy.wait('@getQuestion')
      cy.url().should('include', '/interview/live')
      
      // Verify interview interface loaded
      cy.get('[data-testid="interview-interface"]').should('be.visible')
      cy.get('[data-testid="current-question"]').should('be.visible')
      cy.get('[data-testid="interview-controls"]').should('be.visible')
    })

    it('should validate required setup fields', () => {
      cy.visit('/interview/setup')
      
      // Try to start without filling required fields
      cy.get('[data-testid="start-interview-button"]').click()
      
      // Should show validation errors
      cy.get('[data-testid="role-error"]').should('contain', 'Role is required')
      cy.get('[data-testid="session-type-error"]').should('contain', 'Session type is required')
      cy.get('[data-testid="experience-level-error"]').should('contain', 'Experience level is required')
    })

    it('should handle different session types', () => {
      const sessionTypes = ['Behavioral', 'Technical', 'Case Study']
      
      sessionTypes.forEach(sessionType => {
        cy.visit('/interview/setup')
        
        cy.get('[data-testid="role-input"]').type('Software Engineer')
        cy.get('[data-testid="session-type-select"]').select(sessionType)
        cy.get('[data-testid="experience-level-select"]').select('Mid')
        
        cy.get('[data-testid="start-interview-button"]').click()
        
        cy.wait('@createSession')
        cy.wait('@getQuestion')
        
        // Should start interview with correct type
        cy.url().should('include', '/interview/live')
        cy.get('[data-testid="session-type-display"]').should('contain', sessionType)
        
        // Go back for next iteration
        cy.go('back')
      })
    })
  })

  describe('Live Interview Experience', () => {
    beforeEach(() => {
      // Start an interview session
      cy.startInterview('Software Engineer', 'Technical')
    })

    it('should display first question and controls', () => {
      // Verify question display
      cy.get('[data-testid="question-counter"]').should('contain', '1 of')
      cy.get('[data-testid="current-question"]').should('contain', 'Tell me about')
      cy.get('[data-testid="question-category"]').should('be.visible')
      
      // Verify controls
      cy.get('[data-testid="start-recording-button"]').should('be.visible')
      cy.get('[data-testid="text-input-toggle"]').should('be.visible')
      cy.get('[data-testid="end-interview-button"]').should('be.visible')
      
      // Verify session info
      cy.get('[data-testid="session-timer"]').should('be.visible')
      cy.get('[data-testid="session-progress"]').should('be.visible')
    })

    it('should handle voice recording workflow', () => {
      // Start recording
      cy.get('[data-testid="start-recording-button"]').click()
      
      // Should show recording state
      cy.get('[data-testid="recording-indicator"]').should('be.visible')
      cy.get('[data-testid="recording-status"]').should('contain', 'Recording')
      cy.get('[data-testid="stop-recording-button"]').should('be.visible')
      
      // Simulate speech recognition result
      cy.window().then((win) => {
        const recognition = new win.SpeechRecognition()
        recognition.simulateResult('I have 5 years of experience in software development')
      })
      
      // Should show transcript
      cy.get('[data-testid="live-transcript"]').should('contain', 'I have 5 years')
      
      // Stop recording
      cy.get('[data-testid="stop-recording-button"]').click()
      
      // Should show final answer
      cy.get('[data-testid="final-answer"]').should('be.visible')
      cy.get('[data-testid="next-question-button"]').should('be.visible')
    })

    it('should handle text input as fallback', () => {
      // Switch to text input mode
      cy.get('[data-testid="text-input-toggle"]').click()
      
      // Should show text input
      cy.get('[data-testid="answer-textarea"]').should('be.visible')
      cy.get('[data-testid="start-recording-button"]').should('not.exist')
      
      // Type answer
      const answer = 'I have extensive experience in React and Node.js development, having worked on multiple large-scale applications.'
      cy.get('[data-testid="answer-textarea"]').type(answer)
      
      // Submit answer
      cy.get('[data-testid="submit-answer-button"]').click()
      
      // Should save answer and show next question button
      cy.get('[data-testid="answer-saved"]').should('be.visible')
      cy.get('[data-testid="next-question-button"]').should('be.visible')
    })

    it('should progress through multiple questions', () => {
      // Answer first question
      cy.answerQuestion('I have 5 years of experience in software development')
      
      // Should load next question
      cy.wait('@getQuestion')
      cy.get('[data-testid="question-counter"]').should('contain', '2 of')
      cy.get('[data-testid="current-question"]').should('be.visible')
      
      // Answer second question
      cy.answerQuestion('My greatest strength is problem-solving and attention to detail')
      
      // Should continue to next question
      cy.wait('@getQuestion')
      cy.get('[data-testid="question-counter"]').should('contain', '3 of')
    })

    it('should handle interview completion', () => {
      // Answer several questions to reach completion
      for (let i = 0; i < 5; i++) {
        cy.answerQuestion(`Answer to question ${i + 1}`)
        if (i < 4) cy.wait('@getQuestion')
      }
      
      // End interview
      cy.get('[data-testid="end-interview-button"]').click()
      cy.get('[data-testid="confirm-end-button"]').click()
      
      // Should complete interview and redirect to report
      cy.wait('@updateSession')
      cy.url().should('include', '/interview/report')
      
      // Verify completion message
      cy.get('[data-testid="completion-message"]').should('contain', 'Interview Completed')
    })

    it('should allow pausing and resuming interview', () => {
      // Pause interview
      cy.get('[data-testid="pause-interview-button"]').click()
      
      // Should show paused state
      cy.get('[data-testid="paused-indicator"]').should('be.visible')
      cy.get('[data-testid="resume-interview-button"]').should('be.visible')
      cy.get('[data-testid="start-recording-button"]').should('be.disabled')
      
      // Resume interview
      cy.get('[data-testid="resume-interview-button"]').click()
      
      // Should return to active state
      cy.get('[data-testid="paused-indicator"]').should('not.exist')
      cy.get('[data-testid="start-recording-button"]').should('not.be.disabled')
    })
  })

  describe('Interview Report and Feedback', () => {
    beforeEach(() => {
      // Mock completed interview session
      cy.intercept('GET', '/api/database/documents/*', { fixture: 'database/completed-session.json' }).as('getCompletedSession')
      cy.intercept('GET', '/api/database/documents', { fixture: 'database/session-interactions.json' }).as('getInteractions')
      
      cy.visit('/interview/report/session-123')
      cy.wait('@getCompletedSession')
      cy.wait('@getInteractions')
    })

    it('should display comprehensive interview report', () => {
      // Verify report header
      cy.get('[data-testid="report-title"]').should('contain', 'Interview Report')
      cy.get('[data-testid="session-info"]').should('be.visible')
      cy.get('[data-testid="completion-date"]').should('be.visible')
      cy.get('[data-testid="session-duration"]').should('be.visible')
      
      // Verify overall score
      cy.get('[data-testid="overall-score"]').should('be.visible')
      cy.get('[data-testid="score-gauge"]').should('be.visible')
      cy.get('[data-testid="score-value"]').should('contain', '85')
      
      // Verify performance breakdown
      cy.get('[data-testid="performance-breakdown"]').should('be.visible')
      cy.get('[data-testid="communication-score"]').should('be.visible')
      cy.get('[data-testid="technical-score"]').should('be.visible')
      cy.get('[data-testid="problem-solving-score"]').should('be.visible')
    })

    it('should display question-by-question breakdown', () => {
      // Verify interactions section
      cy.get('[data-testid="interactions-section"]').should('be.visible')
      cy.get('[data-testid="interaction-item"]').should('have.length.at.least', 1)
      
      // Check first interaction
      cy.get('[data-testid="interaction-item"]').first().within(() => {
        cy.get('[data-testid="question-text"]').should('be.visible')
        cy.get('[data-testid="user-answer"]').should('be.visible')
        cy.get('[data-testid="answer-timestamp"]').should('be.visible')
        cy.get('[data-testid="answer-duration"]').should('be.visible')
      })
    })

    it('should provide actionable feedback', () => {
      // Verify feedback sections
      cy.get('[data-testid="strengths-section"]').should('be.visible')
      cy.get('[data-testid="strengths-list"]').should('contain', 'Clear communication')
      
      cy.get('[data-testid="improvements-section"]').should('be.visible')
      cy.get('[data-testid="improvements-list"]').should('contain', 'Provide more specific examples')
      
      cy.get('[data-testid="recommendations-section"]').should('be.visible')
      cy.get('[data-testid="recommendations-list"]').should('be.visible')
    })

    it('should allow exporting report', () => {
      cy.get('[data-testid="export-report-button"]').click()
      
      // Should show export options
      cy.get('[data-testid="export-options"]').should('be.visible')
      cy.get('[data-testid="export-pdf"]').should('be.visible')
      cy.get('[data-testid="export-json"]').should('be.visible')
      
      // Export as PDF
      cy.get('[data-testid="export-pdf"]').click()
      cy.get('[data-testid="export-status"]').should('contain', 'Generating PDF')
    })

    it('should allow sharing report', () => {
      cy.get('[data-testid="share-report-button"]').click()
      
      // Should show sharing options
      cy.get('[data-testid="share-options"]').should('be.visible')
      cy.get('[data-testid="copy-link-button"]').should('be.visible')
      cy.get('[data-testid="email-report-button"]').should('be.visible')
      
      // Copy link
      cy.get('[data-testid="copy-link-button"]').click()
      cy.get('[data-testid="link-copied"]').should('contain', 'Link copied')
    })

    it('should navigate back to dashboard', () => {
      cy.get('[data-testid="back-to-dashboard"]').click()
      cy.url().should('include', '/dashboard')
    })

    it('should allow starting new interview', () => {
      cy.get('[data-testid="new-interview-button"]').click()
      cy.url().should('include', '/interview/setup')
    })
  })

  describe('Interview History and Management', () => {
    beforeEach(() => {
      // Mock interview history
      cy.intercept('GET', '/api/database/documents', { fixture: 'database/interview-history.json' }).as('getInterviewHistory')
      cy.visit('/dashboard')
      cy.wait('@getInterviewHistory')
    })

    it('should display interview history on dashboard', () => {
      cy.get('[data-testid="interview-history-section"]').should('be.visible')
      cy.get('[data-testid="interview-history-title"]').should('contain', 'Recent Interviews')
      
      // Should show interview entries
      cy.get('[data-testid="interview-entry"]').should('have.length.at.least', 1)
      cy.get('[data-testid="interview-entry"]').first().within(() => {
        cy.get('[data-testid="interview-role"]').should('be.visible')
        cy.get('[data-testid="interview-type"]').should('be.visible')
        cy.get('[data-testid="interview-score"]').should('be.visible')
        cy.get('[data-testid="interview-date"]').should('be.visible')
        cy.get('[data-testid="interview-status"]').should('be.visible')
      })
    })

    it('should allow viewing previous interview reports', () => {
      cy.get('[data-testid="interview-entry"]').first().click()
      
      // Should navigate to report
      cy.url().should('include', '/interview/report/')
      cy.get('[data-testid="report-title"]').should('be.visible')
    })

    it('should allow deleting interview sessions', () => {
      cy.intercept('DELETE', '/api/database/documents/*', { statusCode: 200 }).as('deleteSession')
      
      cy.get('[data-testid="interview-entry"]').first().within(() => {
        cy.get('[data-testid="delete-interview-button"]').click()
      })
      
      // Should show confirmation
      cy.get('[data-testid="delete-confirmation"]').should('be.visible')
      cy.get('[data-testid="confirm-delete-button"]').click()
      
      // Should delete session
      cy.wait('@deleteSession')
      cy.get('[data-testid="success-message"]').should('contain', 'Interview deleted')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle microphone permission denied', () => {
      cy.visit('/interview/setup')
      cy.get('[data-testid="role-input"]').type('Software Engineer')
      cy.get('[data-testid="session-type-select"]').select('Technical')
      cy.get('[data-testid="experience-level-select"]').select('Mid')
      cy.get('[data-testid="start-interview-button"]').click()
      
      cy.wait('@createSession')
      cy.wait('@getQuestion')
      
      // Mock microphone permission denied
      cy.window().then((win) => {
        win.navigator.mediaDevices.getUserMedia = () => 
          Promise.reject(new Error('Permission denied'))
      })
      
      cy.get('[data-testid="start-recording-button"]').click()
      
      // Should show permission error and fallback
      cy.get('[data-testid="microphone-error"]').should('contain', 'Microphone access denied')
      cy.get('[data-testid="text-input-fallback"]').should('be.visible')
    })

    it('should handle network errors during interview', () => {
      cy.startInterview('Software Engineer', 'Technical')
      
      // Mock network error for next question
      cy.intercept('POST', '/api/ai/interview-question', { forceNetworkError: true }).as('networkError')
      
      cy.answerQuestion('My answer to the first question')
      
      // Should show network error
      cy.get('[data-testid="network-error"]').should('contain', 'Network error')
      cy.get('[data-testid="retry-button"]').should('be.visible')
    })

    it('should handle session timeout', () => {
      cy.startInterview('Software Engineer', 'Technical')
      
      // Mock session timeout
      cy.intercept('POST', '/api/database/documents', { 
        statusCode: 401,
        body: { error: 'Session expired' }
      }).as('sessionTimeout')
      
      cy.answerQuestion('My answer')
      
      // Should handle timeout gracefully
      cy.wait('@sessionTimeout')
      cy.get('[data-testid="session-expired"]').should('be.visible')
      cy.get('[data-testid="login-again-button"]').should('be.visible')
    })

    it('should handle browser refresh during interview', () => {
      cy.startInterview('Software Engineer', 'Technical')
      
      // Answer a question
      cy.answerQuestion('My first answer')
      
      // Refresh browser
      cy.reload()
      
      // Should restore interview state
      cy.get('[data-testid="interview-restored"]').should('be.visible')
      cy.get('[data-testid="current-question"]').should('be.visible')
      cy.get('[data-testid="question-counter"]').should('contain', '2 of')
    })
  })

  describe('Accessibility', () => {
    it('should be accessible during interview setup', () => {
      cy.visit('/interview/setup')
      cy.checkAccessibility()
      
      // Check form accessibility
      cy.get('[data-testid="role-input"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="session-type-select"]').should('have.attr', 'aria-label')
    })

    it('should be accessible during live interview', () => {
      cy.startInterview('Software Engineer', 'Technical')
      cy.checkAccessibility()
      
      // Check interview controls accessibility
      cy.get('[data-testid="start-recording-button"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="current-question"]').should('have.attr', 'role', 'main')
    })

    it('should support keyboard navigation', () => {
      cy.visit('/interview/setup')
      
      // Should be able to navigate with keyboard
      cy.get('[data-testid="role-input"]').focus().type('Software Engineer')
      cy.get('[data-testid="session-type-select"]').focus().select('Technical')
      cy.get('[data-testid="experience-level-select"]').focus().select('Mid')
      cy.get('[data-testid="start-interview-button"]').focus().type('{enter}')
      
      // Should start interview
      cy.wait('@createSession')
      cy.url().should('include', '/interview/live')
    })
  })

  describe('Performance', () => {
    it('should load interview setup quickly', () => {
      cy.visit('/interview/setup')
      cy.measurePageLoad()
    })

    it('should handle real-time speech recognition efficiently', () => {
      cy.startInterview('Software Engineer', 'Technical')
      
      // Start recording
      cy.get('[data-testid="start-recording-button"]').click()
      
      // Should show minimal latency
      cy.get('[data-testid="recording-indicator"]').should('be.visible')
      
      // Simulate continuous speech input
      cy.window().then((win) => {
        const recognition = new win.SpeechRecognition()
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            recognition.simulateResult(`Word ${i}`)
          }, i * 100)
        }
      })
      
      // Should handle continuous updates smoothly
      cy.get('[data-testid="live-transcript"]').should('contain', 'Word 9')
    })
  })
})