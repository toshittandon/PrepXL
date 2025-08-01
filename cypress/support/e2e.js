// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  const originalFetch = win.fetch;
  win.fetch = function (...args) {
    return originalFetch.apply(this, args);
  };
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions that we expect (like network errors)
  if (err.message.includes('Network Error') || 
      err.message.includes('Failed to fetch') ||
      err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Set up global test data
beforeEach(() => {
  // Clear localStorage and sessionStorage before each test
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Set up viewport
  cy.viewport(1280, 720);
  
  // Mock Appwrite endpoints
  cy.intercept('POST', '**/account/sessions/email', { fixture: 'auth/login-success.json' }).as('login');
  cy.intercept('POST', '**/account', { fixture: 'auth/signup-success.json' }).as('signup');
  cy.intercept('DELETE', '**/account/sessions/current', { fixture: 'auth/logout-success.json' }).as('logout');
  cy.intercept('GET', '**/account', { fixture: 'auth/user.json' }).as('getUser');
  cy.intercept('GET', '**/account/sessions/current', { fixture: 'auth/session.json' }).as('getSession');
  
  // Mock database endpoints
  cy.intercept('POST', '**/databases/*/collections/*/documents', { fixture: 'database/create-document.json' }).as('createDocument');
  cy.intercept('GET', '**/databases/*/collections/*/documents/*', { fixture: 'database/get-document.json' }).as('getDocument');
  cy.intercept('GET', '**/databases/*/collections/*/documents', { fixture: 'database/list-documents.json' }).as('listDocuments');
  cy.intercept('PATCH', '**/databases/*/collections/*/documents/*', { fixture: 'database/update-document.json' }).as('updateDocument');
  cy.intercept('DELETE', '**/databases/*/collections/*/documents/*', { fixture: 'database/delete-document.json' }).as('deleteDocument');
  
  // Mock storage endpoints
  cy.intercept('POST', '**/storage/buckets/*/files', { fixture: 'storage/upload-file.json' }).as('uploadFile');
  cy.intercept('DELETE', '**/storage/buckets/*/files/*', { fixture: 'storage/delete-file.json' }).as('deleteFile');
  
  // Mock AI API endpoints
  cy.intercept('POST', '**/analyze-resume', { fixture: 'ai/resume-analysis.json' }).as('analyzeResume');
  cy.intercept('POST', '**/get-interview-question', { fixture: 'ai/interview-question.json' }).as('getInterviewQuestion');
});

// Add custom assertions
chai.use((chai, utils) => {
  chai.Assertion.addMethod('beVisible', function () {
    const obj = this._obj;
    this.assert(
      obj.should('be.visible'),
      'expected #{this} to be visible',
      'expected #{this} not to be visible'
    );
  });
});