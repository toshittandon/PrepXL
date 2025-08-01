describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.seedTestData();
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  describe('User Registration', () => {
    it('should allow new user to sign up successfully', () => {
      cy.visit('/signup');
      
      // Check page loads correctly
      cy.get('[data-testid="signup-form"]').should('be.visible');
      cy.get('h1').should('contain', 'Create your account');
      
      // Fill out signup form
      cy.get('[data-testid="name-input"]').type('John Doe');
      cy.get('[data-testid="email-input"]').type('john.doe@example.com');
      cy.get('[data-testid="password-input"]').type('SecurePassword123!');
      cy.get('[data-testid="confirm-password-input"]').type('SecurePassword123!');
      
      // Submit form
      cy.get('[data-testid="signup-button"]').click();
      
      // Should show loading state
      cy.get('[data-testid="signup-button"]').should('be.disabled');
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      
      // Wait for signup and auto-login
      cy.wait('@signup');
      cy.wait('@login');
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome, John Doe');
      
      // Should show user profile
      cy.get('[data-testid="user-profile"]').should('be.visible');
      cy.get('[data-testid="user-name"]').should('contain', 'John Doe');
      cy.get('[data-testid="user-email"]').should('contain', 'john.doe@example.com');
    });

    it('should validate form fields and show errors', () => {
      cy.visit('/signup');
      
      // Try to submit empty form
      cy.get('[data-testid="signup-button"]').click();
      
      // Should show validation errors
      cy.get('[data-testid="name-error"]').should('contain', 'Name is required');
      cy.get('[data-testid="email-error"]').should('contain', 'Email is required');
      cy.get('[data-testid="password-error"]').should('contain', 'Password is required');
      
      // Test invalid email
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="email-input"]').blur();
      cy.get('[data-testid="email-error"]').should('contain', 'Please enter a valid email');
      
      // Test weak password
      cy.get('[data-testid="password-input"]').type('weak');
      cy.get('[data-testid="password-input"]').blur();
      cy.get('[data-testid="password-error"]').should('contain', 'Password must be at least 8 characters');
      
      // Test password mismatch
      cy.get('[data-testid="password-input"]').clear().type('StrongPassword123!');
      cy.get('[data-testid="confirm-password-input"]').type('DifferentPassword123!');
      cy.get('[data-testid="confirm-password-input"]').blur();
      cy.get('[data-testid="confirm-password-error"]').should('contain', 'Passwords do not match');
    });

    it('should handle signup errors gracefully', () => {
      // Mock signup failure
      cy.intercept('POST', '**/account', {
        statusCode: 409,
        body: { message: 'A user with the same email already exists' }
      }).as('signupError');
      
      cy.visit('/signup');
      
      // Fill out form with existing email
      cy.get('[data-testid="name-input"]').type('John Doe');
      cy.get('[data-testid="email-input"]').type('existing@example.com');
      cy.get('[data-testid="password-input"]').type('SecurePassword123!');
      cy.get('[data-testid="confirm-password-input"]').type('SecurePassword123!');
      
      cy.get('[data-testid="signup-button"]').click();
      cy.wait('@signupError');
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('contain', 'A user with the same email already exists');
      
      // Form should be re-enabled
      cy.get('[data-testid="signup-button"]').should('not.be.disabled');
    });
  });

  describe('User Login', () => {
    it('should allow existing user to login successfully', () => {
      cy.visit('/login');
      
      // Check page loads correctly
      cy.get('[data-testid="login-form"]').should('be.visible');
      cy.get('h1').should('contain', 'Sign in to your account');
      
      // Fill out login form
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('TestPassword123!');
      
      // Submit form
      cy.get('[data-testid="login-button"]').click();
      
      // Should show loading state
      cy.get('[data-testid="login-button"]').should('be.disabled');
      
      // Wait for login
      cy.wait('@login');
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-profile"]').should('be.visible');
    });

    it('should handle login errors', () => {
      // Mock login failure
      cy.intercept('POST', '**/account/sessions/email', {
        statusCode: 401,
        body: { message: 'Invalid credentials. Please check the email and password.' }
      }).as('loginError');
      
      cy.visit('/login');
      
      // Fill out form with wrong credentials
      cy.get('[data-testid="email-input"]').type('wrong@example.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      
      cy.get('[data-testid="login-button"]').click();
      cy.wait('@loginError');
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials');
      
      // Form should be re-enabled
      cy.get('[data-testid="login-button"]').should('not.be.disabled');
    });

    it('should remember user session across page refreshes', () => {
      cy.login();
      
      // Refresh the page
      cy.reload();
      
      // Should still be logged in
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-profile"]').should('be.visible');
    });
  });

  describe('OAuth Authentication', () => {
    it('should handle Google OAuth login', () => {
      cy.visit('/login');
      
      // Mock OAuth success
      cy.intercept('POST', '**/account/sessions/oauth2/google', {
        fixture: 'auth/login-success.json'
      }).as('googleOAuth');
      
      // Click Google login button
      cy.get('[data-testid="google-oauth-button"]').click();
      
      // Should redirect to dashboard after OAuth
      cy.wait('@googleOAuth');
      cy.url().should('include', '/dashboard');
    });

    it('should handle LinkedIn OAuth login', () => {
      cy.visit('/login');
      
      // Mock OAuth success
      cy.intercept('POST', '**/account/sessions/oauth2/linkedin', {
        fixture: 'auth/login-success.json'
      }).as('linkedinOAuth');
      
      // Click LinkedIn login button
      cy.get('[data-testid="linkedin-oauth-button"]').click();
      
      // Should redirect to dashboard after OAuth
      cy.wait('@linkedinOAuth');
      cy.url().should('include', '/dashboard');
    });
  });

  describe('User Logout', () => {
    it('should allow user to logout successfully', () => {
      cy.login();
      
      // Should be on dashboard
      cy.url().should('include', '/dashboard');
      
      // Click logout
      cy.logout();
      
      // Should redirect to login page
      cy.url().should('include', '/login');
      
      // Should not be able to access protected routes
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users to login', () => {
      const protectedRoutes = ['/dashboard', '/resume/upload', '/interview/setup'];
      
      protectedRoutes.forEach(route => {
        cy.visit(route);
        cy.url().should('include', '/login');
      });
    });

    it('should preserve return URL after login', () => {
      // Try to access protected route
      cy.visit('/interview/setup');
      cy.url().should('include', '/login');
      
      // Login
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('TestPassword123!');
      cy.get('[data-testid="login-button"]').click();
      cy.wait('@login');
      
      // Should redirect to originally requested route
      cy.url().should('include', '/interview/setup');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible on login page', () => {
      cy.visit('/login');
      cy.checkAccessibility();
      
      // Check form labels
      cy.get('[data-testid="email-input"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="password-input"]').should('have.attr', 'aria-label');
      
      // Check button accessibility
      cy.get('[data-testid="login-button"]').should('have.attr', 'type', 'submit');
    });

    it('should be accessible on signup page', () => {
      cy.visit('/signup');
      cy.checkAccessibility();
      
      // Check all form fields have proper labels
      cy.get('input').each(($input) => {
        cy.wrap($input).should('have.attr', 'aria-label');
      });
    });
  });

  describe('Performance', () => {
    it('should load login page quickly', () => {
      cy.visit('/login');
      cy.measurePageLoad();
    });

    it('should load signup page quickly', () => {
      cy.visit('/signup');
      cy.measurePageLoad();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Mock network error
      cy.intercept('POST', '**/account/sessions/email', { forceNetworkError: true }).as('networkError');
      
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('TestPassword123!');
      cy.get('[data-testid="login-button"]').click();
      
      // Should show network error message
      cy.get('[data-testid="error-message"]').should('contain', 'Network error');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should clear errors when user starts typing', () => {
      // Mock login failure first
      cy.intercept('POST', '**/account/sessions/email', {
        statusCode: 401,
        body: { message: 'Invalid credentials' }
      }).as('loginError');
      
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('wrong@example.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-button"]').click();
      cy.wait('@loginError');
      
      // Should show error
      cy.get('[data-testid="error-message"]').should('be.visible');
      
      // Start typing - should clear error
      cy.get('[data-testid="email-input"]').clear().type('correct@example.com');
      cy.get('[data-testid="error-message"]').should('not.exist');
    });
  });
});