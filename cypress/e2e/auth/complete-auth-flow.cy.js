describe('Complete Authentication Flow', () => {
  beforeEach(() => {
    cy.cleanupTestData()
    cy.seedTestData()
    
    // Mock API responses
    cy.intercept('POST', '/api/auth/login', { fixture: 'auth/login-success.json' }).as('login')
    cy.intercept('POST', '/api/auth/signup', { fixture: 'auth/signup-success.json' }).as('signup')
    cy.intercept('POST', '/api/auth/logout', { statusCode: 200 }).as('logout')
    cy.intercept('GET', '/api/auth/user', { fixture: 'auth/user-profile.json' }).as('getUser')
  })

  afterEach(() => {
    cy.cleanupTestData()
  })

  describe('User Registration Flow', () => {
    it('should complete full signup process', () => {
      cy.visit('/')
      
      // Navigate to signup
      cy.get('[data-testid="signup-link"]').click()
      cy.url().should('include', '/signup')
      
      // Fill signup form
      cy.get('[data-testid="name-input"]').type('Test User')
      cy.get('[data-testid="email-input"]').type('test@example.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="confirm-password-input"]').type('password123')
      
      // Submit form
      cy.get('[data-testid="signup-button"]').click()
      
      // Should redirect to profile setup
      cy.wait('@signup')
      cy.url().should('include', '/profile/setup')
      
      // Complete profile setup
      cy.get('[data-testid="experience-level-select"]').select('Mid')
      cy.get('[data-testid="target-role-input"]').type('Software Engineer')
      cy.get('[data-testid="target-industry-input"]').type('Technology')
      cy.get('[data-testid="complete-setup-button"]').click()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome, Test User!')
      
      // Verify user menu shows correct info
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="user-name"]').should('contain', 'Test User')
      cy.get('[data-testid="user-email"]').should('contain', 'test@example.com')
    })

    it('should handle signup validation errors', () => {
      cy.visit('/signup')
      
      // Try to submit empty form
      cy.get('[data-testid="signup-button"]').click()
      
      // Should show validation errors
      cy.get('[data-testid="name-error"]').should('contain', 'Name is required')
      cy.get('[data-testid="email-error"]').should('contain', 'Email is required')
      cy.get('[data-testid="password-error"]').should('contain', 'Password is required')
      
      // Fill form with invalid data
      cy.get('[data-testid="name-input"]').type('T') // Too short
      cy.get('[data-testid="email-input"]').type('invalid-email')
      cy.get('[data-testid="password-input"]').type('123') // Too short
      cy.get('[data-testid="confirm-password-input"]').type('456') // Doesn't match
      
      cy.get('[data-testid="signup-button"]').click()
      
      // Should show specific validation errors
      cy.get('[data-testid="email-error"]').should('contain', 'Invalid email')
      cy.get('[data-testid="password-error"]').should('contain', 'at least 8 characters')
      cy.get('[data-testid="confirm-password-error"]').should('contain', 'Passwords must match')
    })
  })

  describe('User Login Flow', () => {
    it('should complete full login process', () => {
      cy.visit('/')
      
      // Navigate to login
      cy.get('[data-testid="login-link"]').click()
      cy.url().should('include', '/login')
      
      // Fill login form
      cy.get('[data-testid="email-input"]').type('test@example.com')
      cy.get('[data-testid="password-input"]').type('password123')
      
      // Submit form
      cy.get('[data-testid="login-button"]').click()
      
      // Should redirect to dashboard
      cy.wait('@login')
      cy.url().should('include', '/dashboard')
      
      // Verify dashboard content
      cy.get('[data-testid="dashboard-title"]').should('contain', 'Dashboard')
      cy.get('[data-testid="quick-actions"]').should('be.visible')
      cy.get('[data-testid="session-history"]').should('be.visible')
      
      // Verify navigation is available
      cy.get('[data-testid="nav-resume"]').should('be.visible')
      cy.get('[data-testid="nav-interview"]').should('be.visible')
      cy.get('[data-testid="nav-library"]').should('be.visible')
    })

    it('should handle login errors', () => {
      cy.intercept('POST', '/api/auth/login', { 
        statusCode: 401, 
        body: { error: 'Invalid credentials' } 
      }).as('loginError')
      
      cy.visit('/login')
      
      // Fill form with invalid credentials
      cy.get('[data-testid="email-input"]').type('wrong@example.com')
      cy.get('[data-testid="password-input"]').type('wrongpassword')
      cy.get('[data-testid="login-button"]').click()
      
      // Should show error message
      cy.wait('@loginError')
      cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials')
      
      // Should remain on login page
      cy.url().should('include', '/login')
    })

    it('should remember user session across page refreshes', () => {
      cy.login()
      
      // Refresh page
      cy.reload()
      
      // Should still be logged in
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="user-menu"]').should('be.visible')
    })
  })

  describe('OAuth Authentication', () => {
    it('should handle Google OAuth login', () => {
      cy.intercept('GET', '/api/auth/oauth/google', { 
        statusCode: 302,
        headers: { location: '/dashboard' }
      }).as('googleOAuth')
      
      cy.visit('/login')
      
      // Click Google login button
      cy.get('[data-testid="google-login-button"]').click()
      
      // Should redirect to dashboard (mocked)
      cy.wait('@googleOAuth')
      cy.url().should('include', '/dashboard')
    })

    it('should handle LinkedIn OAuth login', () => {
      cy.intercept('GET', '/api/auth/oauth/linkedin', { 
        statusCode: 302,
        headers: { location: '/dashboard' }
      }).as('linkedinOAuth')
      
      cy.visit('/login')
      
      // Click LinkedIn login button
      cy.get('[data-testid="linkedin-login-button"]').click()
      
      // Should redirect to dashboard (mocked)
      cy.wait('@linkedinOAuth')
      cy.url().should('include', '/dashboard')
    })
  })

  describe('Logout Flow', () => {
    it('should complete logout process', () => {
      cy.login()
      
      // Logout
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-button"]').click()
      
      // Should redirect to login
      cy.wait('@logout')
      cy.url().should('include', '/login')
      
      // Should not have access to protected routes
      cy.visit('/dashboard')
      cy.url().should('include', '/login')
    })
  })

  describe('Route Protection', () => {
    it('should protect authenticated routes', () => {
      const protectedRoutes = [
        '/dashboard',
        '/resume/upload',
        '/interview/setup',
        '/library'
      ]
      
      protectedRoutes.forEach(route => {
        cy.visit(route)
        cy.url().should('include', '/login')
      })
    })

    it('should protect admin routes', () => {
      // Login as regular user
      cy.intercept('GET', '/api/auth/user', { 
        fixture: 'auth/regular-user.json' 
      }).as('getRegularUser')
      
      cy.login()
      cy.wait('@getRegularUser')
      
      // Try to access admin route
      cy.visit('/admin')
      cy.url().should('include', '/dashboard') // Should redirect to dashboard
    })

    it('should allow admin access for admin users', () => {
      // Login as admin user
      cy.intercept('GET', '/api/auth/user', { 
        fixture: 'auth/admin-user.json' 
      }).as('getAdminUser')
      
      cy.login()
      cy.wait('@getAdminUser')
      
      // Should have access to admin route
      cy.visit('/admin')
      cy.url().should('include', '/admin')
      cy.get('[data-testid="admin-dashboard"]').should('be.visible')
    })
  })

  describe('Password Reset Flow', () => {
    it('should handle password reset request', () => {
      cy.intercept('POST', '/api/auth/reset-password', { 
        statusCode: 200,
        body: { message: 'Reset email sent' }
      }).as('resetPassword')
      
      cy.visit('/login')
      
      // Click forgot password link
      cy.get('[data-testid="forgot-password-link"]').click()
      cy.url().should('include', '/reset-password')
      
      // Enter email
      cy.get('[data-testid="email-input"]').type('test@example.com')
      cy.get('[data-testid="reset-button"]').click()
      
      // Should show success message
      cy.wait('@resetPassword')
      cy.get('[data-testid="success-message"]').should('contain', 'Reset email sent')
    })
  })

  describe('Accessibility', () => {
    it('should be accessible on login page', () => {
      cy.visit('/login')
      cy.checkAccessibility()
      
      // Check specific accessibility features
      cy.get('[data-testid="email-input"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="password-input"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="login-button"]').should('have.attr', 'type', 'submit')
    })

    it('should be accessible on signup page', () => {
      cy.visit('/signup')
      cy.checkAccessibility()
      
      // Check form accessibility
      cy.get('form').should('have.attr', 'novalidate')
      cy.get('input[required]').each($input => {
        cy.wrap($input).should('have.attr', 'aria-required', 'true')
      })
    })
  })

  describe('Performance', () => {
    it('should load login page quickly', () => {
      cy.visit('/login')
      cy.measurePageLoad()
    })

    it('should load dashboard quickly after login', () => {
      cy.login()
      cy.measurePageLoad()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.intercept('POST', '/api/auth/login', { forceNetworkError: true }).as('networkError')
      
      cy.visit('/login')
      cy.get('[data-testid="email-input"]').type('test@example.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      // Should show network error message
      cy.get('[data-testid="error-message"]').should('contain', 'Network error')
    })

    it('should not have console errors', () => {
      cy.visit('/login')
      cy.expectNoConsoleErrors()
    })
  })
})