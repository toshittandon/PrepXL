describe('Q&A Library and Admin Flow', () => {
  beforeEach(() => {
    cy.cleanupTestData()
    cy.seedTestData()
    
    // Mock authentication
    cy.intercept('GET', '/api/auth/user', { fixture: 'auth/user-profile.json' }).as('getUser')
    
    // Mock Q&A library API calls
    cy.intercept('GET', '/api/database/documents', { fixture: 'database/questions-library.json' }).as('getQuestions')
    cy.intercept('POST', '/api/database/documents', { fixture: 'database/create-question.json' }).as('createQuestion')
    cy.intercept('PATCH', '/api/database/documents/*', { fixture: 'database/update-question.json' }).as('updateQuestion')
    cy.intercept('DELETE', '/api/database/documents/*', { statusCode: 200 }).as('deleteQuestion')
    
    // Login before each test
    cy.login()
  })

  afterEach(() => {
    cy.cleanupTestData()
  })

  describe('Q&A Library User Experience', () => {
    it('should browse and search question library', () => {
      cy.visit('/library')
      cy.wait('@getQuestions')
      
      // Verify library page loaded
      cy.get('[data-testid="library-title"]').should('contain', 'Question Library')
      cy.get('[data-testid="search-input"]').should('be.visible')
      cy.get('[data-testid="category-filter"]').should('be.visible')
      cy.get('[data-testid="role-filter"]').should('be.visible')
      
      // Verify questions are displayed
      cy.get('[data-testid="question-accordion"]').should('be.visible')
      cy.get('[data-testid="question-item"]').should('have.length.at.least', 1)
      
      // Check first question
      cy.get('[data-testid="question-item"]').first().within(() => {
        cy.get('[data-testid="question-text"]').should('be.visible')
        cy.get('[data-testid="question-category"]').should('be.visible')
        cy.get('[data-testid="question-role"]').should('be.visible')
        cy.get('[data-testid="expand-button"]').should('be.visible')
      })
    })

    it('should expand and collapse question answers', () => {
      cy.visit('/library')
      cy.wait('@getQuestions')
      
      // Expand first question
      cy.get('[data-testid="question-item"]').first().within(() => {
        cy.get('[data-testid="expand-button"]').click()
        
        // Should show answer
        cy.get('[data-testid="question-answer"]').should('be.visible')
        cy.get('[data-testid="suggested-answer"]').should('contain', 'This is a sample answer')
        
        // Collapse question
        cy.get('[data-testid="collapse-button"]').click()
        
        // Should hide answer
        cy.get('[data-testid="question-answer"]').should('not.exist')
      })
    })

    it('should filter questions by search term', () => {
      cy.visit('/library')
      cy.wait('@getQuestions')
      
      // Search for specific term
      cy.get('[data-testid="search-input"]').type('React')
      
      // Should filter questions
      cy.get('[data-testid="question-item"]').should('have.length.at.least', 1)
      cy.get('[data-testid="question-item"]').each($item => {
        cy.wrap($item).should('contain', 'React')
      })
      
      // Clear search
      cy.get('[data-testid="clear-search"]').click()
      cy.get('[data-testid="search-input"]').should('have.value', '')
    })

    it('should filter questions by category', () => {
      cy.visit('/library')
      cy.wait('@getQuestions')
      
      // Filter by Technical category
      cy.get('[data-testid="category-filter"]').select('Technical')
      
      // Should show only technical questions
      cy.get('[data-testid="question-item"]').each($item => {
        cy.wrap($item).find('[data-testid="question-category"]').should('contain', 'Technical')
      })
      
      // Filter by Behavioral category
      cy.get('[data-testid="category-filter"]').select('Behavioral')
      
      // Should show only behavioral questions
      cy.get('[data-testid="question-item"]').each($item => {
        cy.wrap($item).find('[data-testid="question-category"]').should('contain', 'Behavioral')
      })
    })

    it('should filter questions by role', () => {
      cy.visit('/library')
      cy.wait('@getQuestions')
      
      // Filter by Software Engineer role
      cy.get('[data-testid="role-filter"]').select('Software Engineer')
      
      // Should show only software engineer questions
      cy.get('[data-testid="question-item"]').each($item => {
        cy.wrap($item).find('[data-testid="question-role"]').should('contain', 'Software Engineer')
      })
    })

    it('should combine multiple filters', () => {
      cy.visit('/library')
      cy.wait('@getQuestions')
      
      // Apply multiple filters
      cy.get('[data-testid="search-input"]').type('experience')
      cy.get('[data-testid="category-filter"]').select('Behavioral')
      cy.get('[data-testid="role-filter"]').select('Software Engineer')
      
      // Should show filtered results
      cy.get('[data-testid="question-item"]').should('have.length.at.least', 1)
      cy.get('[data-testid="question-item"]').each($item => {
        cy.wrap($item).should('contain', 'experience')
        cy.wrap($item).find('[data-testid="question-category"]').should('contain', 'Behavioral')
        cy.wrap($item).find('[data-testid="question-role"]').should('contain', 'Software Engineer')
      })
    })

    it('should clear all filters', () => {
      cy.visit('/library')
      cy.wait('@getQuestions')
      
      // Apply filters
      cy.get('[data-testid="search-input"]').type('React')
      cy.get('[data-testid="category-filter"]').select('Technical')
      cy.get('[data-testid="role-filter"]').select('Frontend Developer')
      
      // Clear all filters
      cy.get('[data-testid="clear-filters"]').click()
      
      // Should reset all filters
      cy.get('[data-testid="search-input"]').should('have.value', '')
      cy.get('[data-testid="category-filter"]').should('have.value', '')
      cy.get('[data-testid="role-filter"]').should('have.value', '')
      
      // Should show all questions
      cy.get('[data-testid="question-item"]').should('have.length.at.least', 5)
    })

    it('should show empty state when no questions match filters', () => {
      cy.visit('/library')
      cy.wait('@getQuestions')
      
      // Search for non-existent term
      cy.get('[data-testid="search-input"]').type('nonexistentterm123')
      
      // Should show empty state
      cy.get('[data-testid="empty-state"]').should('be.visible')
      cy.get('[data-testid="empty-message"]').should('contain', 'No questions found')
      cy.get('[data-testid="clear-filters-suggestion"]').should('be.visible')
    })
  })

  describe('Admin Question Management', () => {
    beforeEach(() => {
      // Mock admin user
      cy.intercept('GET', '/api/auth/user', { fixture: 'auth/admin-user.json' }).as('getAdminUser')
      cy.login()
      cy.wait('@getAdminUser')
    })

    it('should access admin question management', () => {
      cy.visit('/admin/questions')
      cy.wait('@getQuestions')
      
      // Verify admin interface
      cy.get('[data-testid="admin-title"]').should('contain', 'Question Management')
      cy.get('[data-testid="add-question-button"]').should('be.visible')
      cy.get('[data-testid="bulk-actions"]').should('be.visible')
      cy.get('[data-testid="questions-table"]').should('be.visible')
      
      // Verify table headers
      cy.get('[data-testid="table-header"]').should('contain', 'Question')
      cy.get('[data-testid="table-header"]').should('contain', 'Category')
      cy.get('[data-testid="table-header"]').should('contain', 'Role')
      cy.get('[data-testid="table-header"]').should('contain', 'Actions')
    })

    it('should create new question', () => {
      cy.visit('/admin/questions')
      cy.wait('@getQuestions')
      
      // Click add question button
      cy.get('[data-testid="add-question-button"]').click()
      
      // Should open question form modal
      cy.get('[data-testid="question-form-modal"]').should('be.visible')
      cy.get('[data-testid="modal-title"]').should('contain', 'Add New Question')
      
      // Fill form
      cy.get('[data-testid="question-text-input"]').type('What is your experience with microservices architecture?')
      cy.get('[data-testid="category-select"]').select('Technical')
      cy.get('[data-testid="role-select"]').select('Senior Software Engineer')
      cy.get('[data-testid="suggested-answer-textarea"]').type('I have extensive experience designing and implementing microservices...')
      
      // Submit form
      cy.get('[data-testid="save-question-button"]').click()
      
      // Should create question and close modal
      cy.wait('@createQuestion')
      cy.get('[data-testid="question-form-modal"]').should('not.exist')
      cy.get('[data-testid="success-message"]').should('contain', 'Question created successfully')
      
      // Should appear in table
      cy.get('[data-testid="question-row"]').should('contain', 'microservices architecture')
    })

    it('should edit existing question', () => {
      cy.visit('/admin/questions')
      cy.wait('@getQuestions')
      
      // Click edit button on first question
      cy.get('[data-testid="question-row"]').first().within(() => {
        cy.get('[data-testid="edit-button"]').click()
      })
      
      // Should open edit form
      cy.get('[data-testid="question-form-modal"]').should('be.visible')
      cy.get('[data-testid="modal-title"]').should('contain', 'Edit Question')
      
      // Form should be pre-filled
      cy.get('[data-testid="question-text-input"]').should('not.have.value', '')
      
      // Update question
      cy.get('[data-testid="question-text-input"]').clear().type('Updated: Tell me about your leadership experience')
      cy.get('[data-testid="category-select"]').select('Behavioral')
      
      // Save changes
      cy.get('[data-testid="save-question-button"]').click()
      
      // Should update question
      cy.wait('@updateQuestion')
      cy.get('[data-testid="success-message"]').should('contain', 'Question updated successfully')
      
      // Should reflect changes in table
      cy.get('[data-testid="question-row"]').should('contain', 'Updated: Tell me about your leadership')
    })

    it('should delete question with confirmation', () => {
      cy.visit('/admin/questions')
      cy.wait('@getQuestions')
      
      // Click delete button on first question
      cy.get('[data-testid="question-row"]').first().within(() => {
        cy.get('[data-testid="delete-button"]').click()
      })
      
      // Should show confirmation dialog
      cy.get('[data-testid="delete-confirmation"]').should('be.visible')
      cy.get('[data-testid="confirm-message"]').should('contain', 'Are you sure you want to delete this question?')
      
      // Confirm deletion
      cy.get('[data-testid="confirm-delete-button"]').click()
      
      // Should delete question
      cy.wait('@deleteQuestion')
      cy.get('[data-testid="success-message"]').should('contain', 'Question deleted successfully')
      
      // Should remove from table
      cy.get('[data-testid="question-row"]').should('have.length.lessThan', 5)
    })

    it('should handle bulk operations', () => {
      cy.visit('/admin/questions')
      cy.wait('@getQuestions')
      
      // Select multiple questions
      cy.get('[data-testid="question-checkbox"]').first().check()
      cy.get('[data-testid="question-checkbox"]').eq(1).check()
      
      // Should show bulk actions
      cy.get('[data-testid="bulk-actions"]').should('be.visible')
      cy.get('[data-testid="selected-count"]').should('contain', '2 selected')
      
      // Bulk delete
      cy.get('[data-testid="bulk-delete-button"]').click()
      
      // Should show confirmation
      cy.get('[data-testid="bulk-delete-confirmation"]').should('be.visible')
      cy.get('[data-testid="confirm-bulk-delete"]').click()
      
      // Should delete selected questions
      cy.get('[data-testid="success-message"]').should('contain', '2 questions deleted')
    })

    it('should search and filter in admin interface', () => {
      cy.visit('/admin/questions')
      cy.wait('@getQuestions')
      
      // Search questions
      cy.get('[data-testid="admin-search-input"]').type('React')
      
      // Should filter table
      cy.get('[data-testid="question-row"]').each($row => {
        cy.wrap($row).should('contain', 'React')
      })
      
      // Filter by category
      cy.get('[data-testid="admin-category-filter"]').select('Technical')
      
      // Should combine filters
      cy.get('[data-testid="question-row"]').each($row => {
        cy.wrap($row).should('contain', 'React')
        cy.wrap($row).find('[data-testid="category-cell"]').should('contain', 'Technical')
      })
    })

    it('should validate question form', () => {
      cy.visit('/admin/questions')
      cy.wait('@getQuestions')
      
      // Open add question form
      cy.get('[data-testid="add-question-button"]').click()
      
      // Try to submit empty form
      cy.get('[data-testid="save-question-button"]').click()
      
      // Should show validation errors
      cy.get('[data-testid="question-text-error"]').should('contain', 'Question text is required')
      cy.get('[data-testid="category-error"]').should('contain', 'Category is required')
      cy.get('[data-testid="role-error"]').should('contain', 'Role is required')
      
      // Fill with invalid data
      cy.get('[data-testid="question-text-input"]').type('Short') // Too short
      cy.get('[data-testid="suggested-answer-textarea"]').type('Too short') // Too short
      
      cy.get('[data-testid="save-question-button"]').click()
      
      // Should show specific validation errors
      cy.get('[data-testid="question-text-error"]').should('contain', 'at least 10 characters')
      cy.get('[data-testid="suggested-answer-error"]').should('contain', 'at least 20 characters')
    })
  })

  describe('Admin Dashboard Analytics', () => {
    beforeEach(() => {
      // Mock admin user and analytics data
      cy.intercept('GET', '/api/auth/user', { fixture: 'auth/admin-user.json' }).as('getAdminUser')
      cy.intercept('GET', '/api/admin/analytics', { fixture: 'admin/dashboard-analytics.json' }).as('getAnalytics')
      cy.login()
      cy.wait('@getAdminUser')
    })

    it('should display admin dashboard with analytics', () => {
      cy.visit('/admin')
      cy.wait('@getAnalytics')
      
      // Verify dashboard components
      cy.get('[data-testid="admin-dashboard-title"]').should('contain', 'Admin Dashboard')
      cy.get('[data-testid="analytics-cards"]').should('be.visible')
      cy.get('[data-testid="user-growth-chart"]').should('be.visible')
      cy.get('[data-testid="session-stats-chart"]').should('be.visible')
      
      // Verify summary cards
      cy.get('[data-testid="total-users-card"]').should('contain', 'Total Users')
      cy.get('[data-testid="total-sessions-card"]').should('contain', 'Total Sessions')
      cy.get('[data-testid="total-questions-card"]').should('contain', 'Total Questions')
      cy.get('[data-testid="avg-score-card"]').should('contain', 'Average Score')
    })

    it('should display user management interface', () => {
      cy.intercept('GET', '/api/admin/users', { fixture: 'admin/users-list.json' }).as('getUsers')
      
      cy.visit('/admin/users')
      cy.wait('@getUsers')
      
      // Verify user management interface
      cy.get('[data-testid="users-title"]').should('contain', 'User Management')
      cy.get('[data-testid="users-table"]').should('be.visible')
      cy.get('[data-testid="user-search"]').should('be.visible')
      
      // Verify user table
      cy.get('[data-testid="user-row"]').should('have.length.at.least', 1)
      cy.get('[data-testid="user-row"]').first().within(() => {
        cy.get('[data-testid="user-name"]').should('be.visible')
        cy.get('[data-testid="user-email"]').should('be.visible')
        cy.get('[data-testid="user-role"]').should('be.visible')
        cy.get('[data-testid="user-actions"]').should('be.visible')
      })
    })

    it('should allow promoting users to admin', () => {
      cy.intercept('GET', '/api/admin/users', { fixture: 'admin/users-list.json' }).as('getUsers')
      cy.intercept('PATCH', '/api/admin/users/*', { fixture: 'admin/update-user.json' }).as('updateUser')
      
      cy.visit('/admin/users')
      cy.wait('@getUsers')
      
      // Find regular user and promote to admin
      cy.get('[data-testid="user-row"]').contains('Regular User').within(() => {
        cy.get('[data-testid="promote-admin-button"]').click()
      })
      
      // Should show confirmation
      cy.get('[data-testid="promote-confirmation"]').should('be.visible')
      cy.get('[data-testid="confirm-promote"]').click()
      
      // Should update user role
      cy.wait('@updateUser')
      cy.get('[data-testid="success-message"]').should('contain', 'User promoted to admin')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/database/documents', { 
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('serverError')
      
      cy.visit('/library')
      
      // Should show error message
      cy.wait('@serverError')
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to load questions')
      cy.get('[data-testid="retry-button"]').should('be.visible')
    })

    it('should handle network errors', () => {
      cy.intercept('GET', '/api/database/documents', { forceNetworkError: true }).as('networkError')
      
      cy.visit('/library')
      
      // Should show network error
      cy.get('[data-testid="network-error"]').should('contain', 'Network error')
      cy.get('[data-testid="retry-button"]').should('be.visible')
    })

    it('should handle unauthorized access to admin features', () => {
      // Login as regular user
      cy.intercept('GET', '/api/auth/user', { fixture: 'auth/user-profile.json' }).as('getRegularUser')
      cy.login()
      cy.wait('@getRegularUser')
      
      // Try to access admin page
      cy.visit('/admin')
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="access-denied"]').should('contain', 'Access denied')
    })
  })

  describe('Accessibility', () => {
    it('should be accessible on library page', () => {
      cy.visit('/library')
      cy.wait('@getQuestions')
      cy.checkAccessibility()
      
      // Check specific accessibility features
      cy.get('[data-testid="search-input"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="category-filter"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="question-accordion"]').should('have.attr', 'role', 'region')
    })

    it('should be accessible on admin pages', () => {
      cy.intercept('GET', '/api/auth/user', { fixture: 'auth/admin-user.json' }).as('getAdminUser')
      cy.login()
      cy.wait('@getAdminUser')
      
      cy.visit('/admin/questions')
      cy.wait('@getQuestions')
      cy.checkAccessibility()
      
      // Check table accessibility
      cy.get('[data-testid="questions-table"]').should('have.attr', 'role', 'table')
      cy.get('[data-testid="table-header"]').should('have.attr', 'role', 'columnheader')
    })
  })

  describe('Performance', () => {
    it('should load library page quickly', () => {
      cy.visit('/library')
      cy.measurePageLoad()
    })

    it('should handle large question datasets efficiently', () => {
      // Mock large dataset
      cy.intercept('GET', '/api/database/documents', { fixture: 'database/large-questions-dataset.json' }).as('getLargeDataset')
      
      cy.visit('/library')
      cy.wait('@getLargeDataset')
      
      // Should render efficiently
      cy.get('[data-testid="question-item"]').should('have.length.at.least', 100)
      
      // Search should be fast
      const startTime = Date.now()
      cy.get('[data-testid="search-input"]').type('React')
      cy.get('[data-testid="question-item"]').should('have.length.lessThan', 50)
      
      cy.then(() => {
        const endTime = Date.now()
        expect(endTime - startTime).to.be.lessThan(1000) // Should complete within 1 second
      })
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x')
      cy.visit('/library')
      cy.wait('@getQuestions')
      
      // Should be responsive
      cy.get('[data-testid="mobile-filters-toggle"]').should('be.visible')
      cy.get('[data-testid="question-accordion"]').should('be.visible')
      
      // Should handle mobile interactions
      cy.get('[data-testid="mobile-filters-toggle"]').click()
      cy.get('[data-testid="mobile-filters"]').should('be.visible')
      
      // Should be able to search on mobile
      cy.get('[data-testid="search-input"]').type('React')
      cy.get('[data-testid="question-item"]').should('have.length.at.least', 1)
    })
  })
})