describe('Resume Analysis Flow', () => {
  beforeEach(() => {
    cy.cleanupTestData()
    cy.seedTestData()
    
    // Mock authentication
    cy.intercept('GET', '/api/auth/user', { fixture: 'auth/user-profile.json' }).as('getUser')
    
    // Mock file upload and analysis
    cy.intercept('POST', '/api/storage/files', { fixture: 'storage/upload-success.json' }).as('uploadFile')
    cy.intercept('POST', '/api/database/documents', { fixture: 'database/create-resume.json' }).as('createDocument')
    cy.intercept('POST', '/api/ai/analyze-resume', { fixture: 'ai/resume-analysis.json' }).as('analyzeResume')
    cy.intercept('PATCH', '/api/database/documents/*', { fixture: 'database/update-resume.json' }).as('updateDocument')
    
    // Login before each test
    cy.login()
  })

  afterEach(() => {
    cy.cleanupTestData()
  })

  describe('Resume Upload Process', () => {
    it('should complete full resume upload and analysis workflow', () => {
      cy.visit('/resume/upload')
      
      // Verify page loaded correctly
      cy.get('[data-testid="upload-title"]').should('contain', 'Upload Resume')
      cy.get('[data-testid="file-input"]').should('be.visible')
      cy.get('[data-testid="job-description-input"]').should('be.visible')
      
      // Fill job description
      const jobDescription = 'Software Engineer position requiring React, Node.js, and TypeScript experience. Must have 3+ years of experience building scalable web applications.'
      cy.get('[data-testid="job-description-input"]').type(jobDescription)
      
      // Upload resume file
      cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/files/sample-resume.pdf', { force: true })
      
      // Verify file is selected
      cy.get('[data-testid="selected-file"]').should('contain', 'sample-resume.pdf')
      
      // Submit upload
      cy.get('[data-testid="upload-button"]').click()
      
      // Should show uploading state
      cy.get('[data-testid="upload-progress"]').should('be.visible')
      cy.get('[data-testid="upload-status"]').should('contain', 'Uploading')
      
      // Wait for upload to complete
      cy.wait('@uploadFile')
      cy.wait('@createDocument')
      
      // Should show analyzing state
      cy.get('[data-testid="analysis-progress"]').should('be.visible')
      cy.get('[data-testid="analysis-status"]').should('contain', 'Analyzing')
      
      // Wait for analysis to complete
      cy.wait('@analyzeResume')
      cy.wait('@updateDocument')
      
      // Should redirect to analysis results
      cy.url().should('include', '/resume/analysis')
      
      // Verify analysis results are displayed
      cy.get('[data-testid="analysis-results"]').should('be.visible')
      cy.get('[data-testid="match-score"]').should('contain', '85%')
      cy.get('[data-testid="missing-keywords"]').should('be.visible')
      cy.get('[data-testid="action-verbs"]').should('be.visible')
      cy.get('[data-testid="format-suggestions"]').should('be.visible')
    })

    it('should handle file validation errors', () => {
      cy.visit('/resume/upload')
      
      // Try to upload invalid file type
      cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/files/invalid-file.txt', { force: true })
      
      // Should show validation error
      cy.get('[data-testid="file-error"]').should('contain', 'Please upload a PDF, DOC, or DOCX file')
      
      // Upload button should be disabled
      cy.get('[data-testid="upload-button"]').should('be.disabled')
    })

    it('should handle large file size errors', () => {
      cy.visit('/resume/upload')
      
      // Mock large file upload error
      cy.intercept('POST', '/api/storage/files', { 
        statusCode: 413,
        body: { error: 'File too large' }
      }).as('uploadError')
      
      cy.get('[data-testid="job-description-input"]').type('Job description')
      cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/files/large-resume.pdf', { force: true })
      cy.get('[data-testid="upload-button"]').click()
      
      // Should show error message
      cy.wait('@uploadError')
      cy.get('[data-testid="error-message"]').should('contain', 'File too large')
    })

    it('should require job description', () => {
      cy.visit('/resume/upload')
      
      // Upload file without job description
      cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/files/sample-resume.pdf', { force: true })
      cy.get('[data-testid="upload-button"]').click()
      
      // Should show validation error
      cy.get('[data-testid="job-description-error"]').should('contain', 'Job description is required')
    })
  })

  describe('Analysis Results Display', () => {
    beforeEach(() => {
      // Navigate to analysis results page with mock data
      cy.intercept('GET', '/api/database/documents/*', { fixture: 'database/resume-with-analysis.json' }).as('getResume')
      cy.visit('/resume/analysis/resume-123')
      cy.wait('@getResume')
    })

    it('should display comprehensive analysis results', () => {
      // Verify match score display
      cy.get('[data-testid="match-score-gauge"]').should('be.visible')
      cy.get('[data-testid="match-score-value"]').should('contain', '85%')
      cy.get('[data-testid="match-score-label"]').should('contain', 'Match Score')
      
      // Verify missing keywords section
      cy.get('[data-testid="missing-keywords-section"]').should('be.visible')
      cy.get('[data-testid="missing-keywords-list"]').should('contain', 'React')
      cy.get('[data-testid="missing-keywords-list"]').should('contain', 'TypeScript')
      
      // Verify action verbs analysis
      cy.get('[data-testid="action-verbs-section"]').should('be.visible')
      cy.get('[data-testid="action-verbs-score"]').should('contain', 'Good')
      
      // Verify format suggestions
      cy.get('[data-testid="format-suggestions-section"]').should('be.visible')
      cy.get('[data-testid="format-suggestions-list"]').should('contain', 'Use bullet points')
      cy.get('[data-testid="format-suggestions-list"]').should('contain', 'Add metrics')
    })

    it('should allow navigation back to upload', () => {
      cy.get('[data-testid="upload-another-button"]').click()
      cy.url().should('include', '/resume/upload')
    })

    it('should allow navigation to dashboard', () => {
      cy.get('[data-testid="back-to-dashboard-button"]').click()
      cy.url().should('include', '/dashboard')
    })

    it('should display job description used for analysis', () => {
      cy.get('[data-testid="job-description-display"]').should('be.visible')
      cy.get('[data-testid="job-description-text"]').should('contain', 'Software Engineer position')
    })
  })

  describe('Resume History Management', () => {
    beforeEach(() => {
      // Mock resume history
      cy.intercept('GET', '/api/database/documents', { fixture: 'database/resume-history.json' }).as('getResumeHistory')
      cy.visit('/dashboard')
      cy.wait('@getResumeHistory')
    })

    it('should display resume history on dashboard', () => {
      cy.get('[data-testid="resume-history-section"]').should('be.visible')
      cy.get('[data-testid="resume-history-title"]').should('contain', 'Recent Analyses')
      
      // Should show resume entries
      cy.get('[data-testid="resume-entry"]').should('have.length.at.least', 1)
      cy.get('[data-testid="resume-entry"]').first().within(() => {
        cy.get('[data-testid="resume-filename"]').should('be.visible')
        cy.get('[data-testid="resume-score"]').should('be.visible')
        cy.get('[data-testid="resume-date"]').should('be.visible')
      })
    })

    it('should allow viewing previous analysis results', () => {
      cy.get('[data-testid="resume-entry"]').first().click()
      
      // Should navigate to analysis results
      cy.url().should('include', '/resume/analysis/')
      cy.get('[data-testid="analysis-results"]').should('be.visible')
    })

    it('should allow deleting resume analyses', () => {
      cy.intercept('DELETE', '/api/database/documents/*', { statusCode: 200 }).as('deleteResume')
      
      cy.get('[data-testid="resume-entry"]').first().within(() => {
        cy.get('[data-testid="delete-resume-button"]').click()
      })
      
      // Should show confirmation dialog
      cy.get('[data-testid="delete-confirmation"]').should('be.visible')
      cy.get('[data-testid="confirm-delete-button"]').click()
      
      // Should delete resume
      cy.wait('@deleteResume')
      cy.get('[data-testid="success-message"]').should('contain', 'Resume deleted')
    })
  })

  describe('Export and Sharing', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/database/documents/*', { fixture: 'database/resume-with-analysis.json' }).as('getResume')
      cy.visit('/resume/analysis/resume-123')
      cy.wait('@getResume')
    })

    it('should allow exporting analysis results', () => {
      cy.get('[data-testid="export-dropdown"]').click()
      
      // Should show export options
      cy.get('[data-testid="export-pdf"]').should('be.visible')
      cy.get('[data-testid="export-json"]').should('be.visible')
      cy.get('[data-testid="export-csv"]').should('be.visible')
    })

    it('should export as PDF', () => {
      cy.get('[data-testid="export-dropdown"]').click()
      cy.get('[data-testid="export-pdf"]').click()
      
      // Should trigger download (mocked)
      cy.get('[data-testid="download-status"]').should('contain', 'Generating PDF')
    })

    it('should export as JSON', () => {
      cy.get('[data-testid="export-dropdown"]').click()
      cy.get('[data-testid="export-json"]').click()
      
      // Should trigger download
      cy.readFile('cypress/downloads/resume-analysis.json').should('exist')
    })
  })

  describe('Error Handling', () => {
    it('should handle upload failures gracefully', () => {
      cy.intercept('POST', '/api/storage/files', { 
        statusCode: 500,
        body: { error: 'Upload failed' }
      }).as('uploadError')
      
      cy.visit('/resume/upload')
      cy.get('[data-testid="job-description-input"]').type('Job description')
      cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/files/sample-resume.pdf', { force: true })
      cy.get('[data-testid="upload-button"]').click()
      
      // Should show error message
      cy.wait('@uploadError')
      cy.get('[data-testid="error-message"]').should('contain', 'Upload failed')
      
      // Should allow retry
      cy.get('[data-testid="retry-button"]').should('be.visible')
    })

    it('should handle analysis failures gracefully', () => {
      cy.intercept('POST', '/api/storage/files', { fixture: 'storage/upload-success.json' }).as('uploadFile')
      cy.intercept('POST', '/api/ai/analyze-resume', { 
        statusCode: 500,
        body: { error: 'Analysis failed' }
      }).as('analysisError')
      
      cy.visit('/resume/upload')
      cy.get('[data-testid="job-description-input"]').type('Job description')
      cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/files/sample-resume.pdf', { force: true })
      cy.get('[data-testid="upload-button"]').click()
      
      // Wait for upload to succeed and analysis to fail
      cy.wait('@uploadFile')
      cy.wait('@analysisError')
      
      // Should show analysis error
      cy.get('[data-testid="error-message"]').should('contain', 'Analysis failed')
      
      // Should allow retry analysis
      cy.get('[data-testid="retry-analysis-button"]').should('be.visible')
    })

    it('should handle network errors', () => {
      cy.intercept('POST', '/api/storage/files', { forceNetworkError: true }).as('networkError')
      
      cy.visit('/resume/upload')
      cy.get('[data-testid="job-description-input"]').type('Job description')
      cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/files/sample-resume.pdf', { force: true })
      cy.get('[data-testid="upload-button"]').click()
      
      // Should show network error
      cy.get('[data-testid="error-message"]').should('contain', 'Network error')
    })
  })

  describe('Accessibility', () => {
    it('should be accessible on upload page', () => {
      cy.visit('/resume/upload')
      cy.checkAccessibility()
      
      // Check file input accessibility
      cy.get('[data-testid="file-input"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="job-description-input"]').should('have.attr', 'aria-label')
    })

    it('should be accessible on analysis results page', () => {
      cy.intercept('GET', '/api/database/documents/*', { fixture: 'database/resume-with-analysis.json' }).as('getResume')
      cy.visit('/resume/analysis/resume-123')
      cy.wait('@getResume')
      
      cy.checkAccessibility()
      
      // Check results accessibility
      cy.get('[data-testid="match-score-gauge"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="analysis-results"]').should('have.attr', 'role', 'main')
    })
  })

  describe('Performance', () => {
    it('should load upload page quickly', () => {
      cy.visit('/resume/upload')
      cy.measurePageLoad()
    })

    it('should handle large file uploads efficiently', () => {
      cy.visit('/resume/upload')
      
      // Mock large file upload with progress
      cy.intercept('POST', '/api/storage/files', (req) => {
        // Simulate upload progress
        req.reply((res) => {
          res.setDelay(2000) // 2 second delay
          res.send({ fixture: 'storage/upload-success.json' })
        })
      }).as('slowUpload')
      
      cy.get('[data-testid="job-description-input"]').type('Job description')
      cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/files/large-resume.pdf', { force: true })
      cy.get('[data-testid="upload-button"]').click()
      
      // Should show progress indicator
      cy.get('[data-testid="upload-progress"]').should('be.visible')
      cy.get('[data-testid="progress-bar"]').should('be.visible')
      
      cy.wait('@slowUpload')
      cy.get('[data-testid="upload-progress"]').should('not.exist')
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x')
      cy.visit('/resume/upload')
      
      // Should be responsive
      cy.get('[data-testid="upload-container"]').should('be.visible')
      cy.get('[data-testid="file-input"]').should('be.visible')
      cy.get('[data-testid="job-description-input"]').should('be.visible')
      
      // Should handle touch interactions
      cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/files/sample-resume.pdf', { force: true })
      cy.get('[data-testid="job-description-input"]').type('Mobile job description')
      cy.get('[data-testid="upload-button"]').should('be.visible').and('not.be.disabled')
    })
  })
})