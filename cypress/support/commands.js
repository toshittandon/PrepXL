// Custom commands for Interview Prep AI E2E tests

// Authentication commands
Cypress.Commands.add('login', (email = Cypress.env('TEST_USER_EMAIL'), password = Cypress.env('TEST_USER_PASSWORD')) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.wait('@login');
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('signup', (name = Cypress.env('TEST_USER_NAME'), email = Cypress.env('TEST_USER_EMAIL'), password = Cypress.env('TEST_USER_PASSWORD')) => {
  cy.visit('/signup');
  cy.get('[data-testid="name-input"]').type(name);
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="confirm-password-input"]').type(password);
  cy.get('[data-testid="signup-button"]').click();
  cy.wait('@signup');
  cy.wait('@login');
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.wait('@logout');
  cy.url().should('include', '/login');
});

// Resume commands
Cypress.Commands.add('uploadResume', (fileName = 'sample-resume.pdf') => {
  cy.visit('/resume/upload');
  cy.get('[data-testid="file-input"]').selectFile(`cypress/fixtures/files/${fileName}`, { force: true });
  cy.get('[data-testid="upload-button"]').click();
  cy.wait('@uploadFile');
  cy.wait('@createDocument');
  cy.wait('@analyzeResume');
});

Cypress.Commands.add('waitForResumeAnalysis', () => {
  cy.get('[data-testid="analysis-loading"]', { timeout: 15000 }).should('not.exist');
  cy.get('[data-testid="analysis-results"]').should('be.visible');
});

// Interview commands
Cypress.Commands.add('startInterview', (role = 'Software Engineer', sessionType = 'Technical') => {
  cy.visit('/interview/setup');
  cy.get('[data-testid="role-input"]').type(role);
  cy.get('[data-testid="session-type-select"]').select(sessionType);
  cy.get('[data-testid="start-interview-button"]').click();
  cy.wait('@createDocument');
  cy.wait('@getInterviewQuestion');
  cy.url().should('include', '/interview/live');
});

Cypress.Commands.add('answerQuestion', (answer) => {
  cy.get('[data-testid="start-recording-button"]').click();
  cy.get('[data-testid="answer-input"]').type(answer);
  cy.get('[data-testid="stop-recording-button"]').click();
  cy.get('[data-testid="next-question-button"]').click();
  cy.wait('@createDocument'); // Save interaction
});

Cypress.Commands.add('endInterview', () => {
  cy.get('[data-testid="end-interview-button"]').click();
  cy.get('[data-testid="confirm-end-button"]').click();
  cy.wait('@updateDocument'); // Update session status
  cy.url().should('include', '/interview/report');
});

// Navigation commands
Cypress.Commands.add('navigateToPage', (page) => {
  const routes = {
    dashboard: '/dashboard',
    'resume-upload': '/resume/upload',
    'interview-setup': '/interview/setup',
    'interview-reports': '/interview/reports',
  };
  
  cy.visit(routes[page] || page);
});

// Utility commands
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist');
});

Cypress.Commands.add('checkAccessibility', () => {
  // Basic accessibility checks
  cy.get('h1, h2, h3, h4, h5, h6').should('exist');
  cy.get('[role="main"]').should('exist');
  cy.get('input').each(($input) => {
    cy.wrap($input).should('have.attr', 'aria-label').or('have.attr', 'aria-labelledby');
  });
});

Cypress.Commands.add('mockSpeechRecognition', () => {
  cy.window().then((win) => {
    win.SpeechRecognition = class MockSpeechRecognition {
      constructor() {
        this.continuous = false;
        this.interimResults = false;
        this.lang = 'en-US';
        this.onstart = null;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
      }
      
      start() {
        setTimeout(() => {
          if (this.onstart) this.onstart();
        }, 100);
      }
      
      stop() {
        setTimeout(() => {
          if (this.onend) this.onend();
        }, 100);
      }
      
      simulateResult(transcript) {
        if (this.onresult) {
          this.onresult({
            results: [{
              0: { transcript },
              isFinal: true
            }],
            resultIndex: 0
          });
        }
      }
    };
    
    win.webkitSpeechRecognition = win.SpeechRecognition;
  });
});

// Data setup commands
Cypress.Commands.add('seedTestData', () => {
  // Set up test data in localStorage/sessionStorage if needed
  cy.window().then((win) => {
    win.localStorage.setItem('test-mode', 'true');
  });
});

Cypress.Commands.add('cleanupTestData', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
});

// Visual testing commands
Cypress.Commands.add('matchImageSnapshot', (name) => {
  // This would integrate with a visual testing tool like Percy or Applitools
  cy.screenshot(name);
});

// Performance testing commands
Cypress.Commands.add('measurePageLoad', () => {
  cy.window().then((win) => {
    const loadTime = win.performance.timing.loadEventEnd - win.performance.timing.navigationStart;
    expect(loadTime).to.be.lessThan(3000); // Page should load in under 3 seconds
  });
});

// Error handling commands
Cypress.Commands.add('expectNoConsoleErrors', () => {
  cy.window().then((win) => {
    const errors = [];
    const originalError = win.console.error;
    win.console.error = (...args) => {
      errors.push(args.join(' '));
      originalError.apply(win.console, args);
    };
    
    cy.wrap(errors).should('have.length', 0);
  });
});