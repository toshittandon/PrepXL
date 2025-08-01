describe('Resume Upload and Analysis Workflow', () => {
  beforeEach(() => {
    cy.seedTestData();
    cy.login();
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  describe('Resume Upload', () => {
    it('should complete full resume upload and analysis workflow', () => {
      cy.visit('/resume/upload');
      
      // Check page loads correctly
      cy.get('[data-testid="upload-page"]').should('be.visible');
      cy.get('h1').should('contain', 'Upload Your Resume');
      
      // Should show upload area
      cy.get('[data-testid="drop-zone"]').should('be.visible');
      cy.get('[data-testid="file-input"]').should('exist');
      
      // Upload a resume file
      cy.fixture('files/sample-resume.pdf', 'base64').then(fileContent => {
        cy.get('[data-testid="file-input"]').selectFile({
          contents: Cypress.Buffer.from(fileContent, 'base64'),
          fileName: 'sample-resume.pdf',
          mimeType: 'application/pdf'
        }, { force: true });
      });
      
      // Should show file preview
      cy.get('[data-testid="file-preview"]').should('be.visible');
      cy.get('[data-testid="file-name"]').should('contain', 'sample-resume.pdf');
      cy.get('[data-testid="file-size"]').should('be.visible');
      
      // Click upload button
      cy.get('[data-testid="upload-button"]').should('not.be.disabled');
      cy.get('[data-testid="upload-button"]').click();
      
      // Should show upload progress
      cy.get('[data-testid="upload-progress"]').should('be.visible');
      cy.get('[data-testid="progress-bar"]').should('be.visible');
      
      // Wait for upload to complete
      cy.wait('@uploadFile');
      cy.wait('@createDocument');
      
      // Should show analysis progress
      cy.get('[data-testid="analysis-progress"]').should('be.visible');
      cy.get('[data-testid="analysis-message"]').should('contain', 'Analyzing your resume');
      
      // Wait for analysis to complete
      cy.wait('@analyzeResume');
      cy.wait('@updateDocument');
      
      // Should redirect to analysis page
      cy.url().should('include', '/resume/analysis');
      
      // Should show analysis results
      cy.get('[data-testid="analysis-results"]').should('be.visible');
      cy.get('[data-testid="overall-score"]').should('be.visible');
      cy.get('[data-testid="ats-keywords"]').should('be.visible');
      cy.get('[data-testid="action-verbs"]').should('be.visible');
      cy.get('[data-testid="suggestions"]').should('be.visible');
    });

    it('should handle drag and drop upload', () => {
      cy.visit('/resume/upload');
      
      // Create a mock file
      cy.fixture('files/sample-resume.pdf', 'base64').then(fileContent => {
        const file = new File([Cypress.Buffer.from(fileContent, 'base64')], 'resume.pdf', {
          type: 'application/pdf'
        });
        
        // Simulate drag and drop
        cy.get('[data-testid="drop-zone"]').trigger('dragenter', {
          dataTransfer: { files: [file] }
        });
        
        // Should show drag over state
        cy.get('[data-testid="drop-zone"]').should('have.class', 'border-blue-500');
        
        // Drop the file
        cy.get('[data-testid="drop-zone"]').trigger('drop', {
          dataTransfer: { files: [file] }
        });
        
        // Should show file preview
        cy.get('[data-testid="file-preview"]').should('be.visible');
        cy.get('[data-testid="file-name"]').should('contain', 'resume.pdf');
      });
    });

    it('should validate file type and size', () => {
      cy.visit('/resume/upload');
      
      // Test invalid file type
      cy.fixture('files/invalid-file.txt').then(fileContent => {
        cy.get('[data-testid="file-input"]').selectFile({
          contents: fileContent,
          fileName: 'invalid-file.txt',
          mimeType: 'text/plain'
        }, { force: true });
      });
      
      // Should show error message
      cy.get('[data-testid="file-error"]').should('contain', 'Invalid file type');
      cy.get('[data-testid="upload-button"]').should('be.disabled');
      
      // Test file too large (mock a large file)
      cy.get('[data-testid="file-input"]').selectFile({
        contents: 'x'.repeat(10 * 1024 * 1024), // 10MB
        fileName: 'large-resume.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      
      // Should show size error
      cy.get('[data-testid="file-error"]').should('contain', 'File too large');
      cy.get('[data-testid="upload-button"]').should('be.disabled');
    });

    it('should handle upload errors gracefully', () => {
      // Mock upload failure
      cy.intercept('POST', '**/storage/buckets/*/files', {
        statusCode: 500,
        body: { message: 'Storage service unavailable' }
      }).as('uploadError');
      
      cy.visit('/resume/upload');
      
      // Upload a file
      cy.fixture('files/sample-resume.pdf', 'base64').then(fileContent => {
        cy.get('[data-testid="file-input"]').selectFile({
          contents: Cypress.Buffer.from(fileContent, 'base64'),
          fileName: 'sample-resume.pdf',
          mimeType: 'application/pdf'
        }, { force: true });
      });
      
      cy.get('[data-testid="upload-button"]').click();
      cy.wait('@uploadError');
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('contain', 'Storage service unavailable');
      cy.get('[data-testid="retry-button"]').should('be.visible');
      
      // Should reset upload state
      cy.get('[data-testid="upload-progress"]').should('not.exist');
      cy.get('[data-testid="upload-button"]').should('not.be.disabled');
    });

    it('should handle analysis errors and allow retry', () => {
      // Mock successful upload but failed analysis
      cy.intercept('POST', '**/analyze-resume', {
        statusCode: 503,
        body: { message: 'Analysis service temporarily unavailable' }
      }).as('analysisError');
      
      cy.visit('/resume/upload');
      
      // Upload file
      cy.fixture('files/sample-resume.pdf', 'base64').then(fileContent => {
        cy.get('[data-testid="file-input"]').selectFile({
          contents: Cypress.Buffer.from(fileContent, 'base64'),
          fileName: 'sample-resume.pdf',
          mimeType: 'application/pdf'
        }, { force: true });
      });
      
      cy.get('[data-testid="upload-button"]').click();
      
      // Wait for upload to succeed
      cy.wait('@uploadFile');
      cy.wait('@createDocument');
      
      // Wait for analysis to fail
      cy.wait('@analysisError');
      
      // Should show analysis error
      cy.get('[data-testid="analysis-error"]').should('contain', 'Analysis service temporarily unavailable');
      cy.get('[data-testid="retry-analysis-button"]').should('be.visible');
      
      // Should still navigate to analysis page
      cy.url().should('include', '/resume/analysis');
    });
  });

  describe('Resume Analysis Display', () => {
    beforeEach(() => {
      // Mock existing resume with analysis
      cy.intercept('GET', '**/databases/*/collections/*/documents/*', {
        fixture: 'database/resume-with-analysis.json'
      }).as('getResumeWithAnalysis');
    });

    it('should display comprehensive analysis results', () => {
      cy.visit('/resume/analysis/resume123');
      cy.wait('@getResumeWithAnalysis');
      
      // Should show overall score prominently
      cy.get('[data-testid="overall-score"]').should('be.visible');
      cy.get('[data-testid="score-value"]').should('contain', '82');
      cy.get('[data-testid="score-label"]').should('contain', 'Overall Score');
      
      // Should display ATS keywords section
      cy.get('[data-testid="ats-keywords"]').should('be.visible');
      cy.get('[data-testid="ats-keywords-title"]').should('contain', 'ATS Keywords');
      cy.get('[data-testid="keyword-tag"]').should('have.length.greaterThan', 0);
      
      // Should display action verbs section
      cy.get('[data-testid="action-verbs"]').should('be.visible');
      cy.get('[data-testid="action-verbs-title"]').should('contain', 'Action Verbs');
      cy.get('[data-testid="verb-tag"]').should('have.length.greaterThan', 0);
      
      // Should display suggestions section
      cy.get('[data-testid="suggestions"]').should('be.visible');
      cy.get('[data-testid="suggestions-title"]').should('contain', 'Suggestions');
      cy.get('[data-testid="suggestion-item"]').should('have.length.greaterThan', 0);
      
      // Should display recommendations section
      cy.get('[data-testid="recommendations"]').should('be.visible');
      cy.get('[data-testid="recommendations-title"]').should('contain', 'Recommendations');
      cy.get('[data-testid="recommendation-item"]').should('have.length.greaterThan', 0);
    });

    it('should allow re-analysis of existing resume', () => {
      cy.visit('/resume/analysis/resume123');
      cy.wait('@getResumeWithAnalysis');
      
      // Should show re-analyze button
      cy.get('[data-testid="reanalyze-button"]').should('be.visible');
      cy.get('[data-testid="reanalyze-button"]').click();
      
      // Should show confirmation dialog
      cy.get('[data-testid="reanalyze-dialog"]').should('be.visible');
      cy.get('[data-testid="confirm-reanalyze"]').click();
      
      // Should start re-analysis
      cy.get('[data-testid="analysis-progress"]').should('be.visible');
      cy.wait('@analyzeResume');
      cy.wait('@updateDocument');
      
      // Should update results
      cy.get('[data-testid="analysis-results"]').should('be.visible');
    });

    it('should handle missing analysis results', () => {
      // Mock resume without analysis
      cy.intercept('GET', '**/databases/*/collections/*/documents/*', {
        body: {
          $id: 'resume123',
          fileName: 'resume.pdf',
          analysisResults: null
        }
      }).as('getResumeWithoutAnalysis');
      
      cy.visit('/resume/analysis/resume123');
      cy.wait('@getResumeWithoutAnalysis');
      
      // Should show analysis pending state
      cy.get('[data-testid="analysis-pending"]').should('be.visible');
      cy.get('[data-testid="start-analysis-button"]').should('be.visible');
      
      // Click to start analysis
      cy.get('[data-testid="start-analysis-button"]').click();
      cy.wait('@analyzeResume');
      
      // Should show analysis results
      cy.get('[data-testid="analysis-results"]').should('be.visible');
    });

    it('should be responsive on different screen sizes', () => {
      cy.visit('/resume/analysis/resume123');
      cy.wait('@getResumeWithAnalysis');
      
      // Test mobile view
      cy.viewport(375, 667);
      cy.get('[data-testid="analysis-results"]').should('be.visible');
      cy.get('[data-testid="overall-score"]').should('be.visible');
      
      // Test tablet view
      cy.viewport(768, 1024);
      cy.get('[data-testid="analysis-results"]').should('be.visible');
      
      // Test desktop view
      cy.viewport(1280, 720);
      cy.get('[data-testid="analysis-results"]').should('be.visible');
    });
  });

  describe('Resume Management', () => {
    it('should display list of user resumes', () => {
      // Mock multiple resumes
      cy.intercept('GET', '**/databases/*/collections/*/documents', {
        body: {
          documents: [
            {
              $id: 'resume1',
              fileName: 'software-engineer-resume.pdf',
              analysisResults: { overallScore: 85 },
              $createdAt: '2024-01-15T10:00:00.000Z'
            },
            {
              $id: 'resume2',
              fileName: 'product-manager-resume.pdf',
              analysisResults: { overallScore: 78 },
              $createdAt: '2024-01-10T10:00:00.000Z'
            }
          ]
        }
      }).as('getResumes');
      
      cy.visit('/resume/upload');
      cy.wait('@getResumes');
      
      // Should show existing resumes
      cy.get('[data-testid="resume-list"]').should('be.visible');
      cy.get('[data-testid="resume-item"]').should('have.length', 2);
      
      // Should display resume details
      cy.get('[data-testid="resume-name"]').first().should('contain', 'software-engineer-resume.pdf');
      cy.get('[data-testid="resume-score"]').first().should('contain', '85');
      cy.get('[data-testid="resume-date"]').first().should('be.visible');
    });

    it('should allow deleting resumes', () => {
      // Mock single resume
      cy.intercept('GET', '**/databases/*/collections/*/documents', {
        body: {
          documents: [{
            $id: 'resume123',
            fileId: 'file123',
            fileName: 'old-resume.pdf',
            analysisResults: { overallScore: 70 }
          }]
        }
      }).as('getResumes');
      
      cy.visit('/resume/upload');
      cy.wait('@getResumes');
      
      // Click delete button
      cy.get('[data-testid="delete-resume-button"]').click();
      
      // Should show confirmation dialog
      cy.get('[data-testid="delete-confirmation"]').should('be.visible');
      cy.get('[data-testid="confirm-delete"]').click();
      
      // Should delete resume
      cy.wait('@deleteDocument');
      cy.wait('@deleteFile');
      
      // Should remove from list
      cy.get('[data-testid="resume-item"]').should('not.exist');
      cy.get('[data-testid="empty-state"]').should('be.visible');
    });

    it('should navigate to analysis when resume is clicked', () => {
      // Mock resume list
      cy.intercept('GET', '**/databases/*/collections/*/documents', {
        body: {
          documents: [{
            $id: 'resume123',
            fileName: 'resume.pdf',
            analysisResults: { overallScore: 82 }
          }]
        }
      }).as('getResumes');
      
      cy.visit('/resume/upload');
      cy.wait('@getResumes');
      
      // Click on resume
      cy.get('[data-testid="resume-item"]').click();
      
      // Should navigate to analysis page
      cy.url().should('include', '/resume/analysis/resume123');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible on upload page', () => {
      cy.visit('/resume/upload');
      cy.checkAccessibility();
      
      // Check file input accessibility
      cy.get('[data-testid="file-input"]').should('have.attr', 'aria-label');
      
      // Check drop zone accessibility
      cy.get('[data-testid="drop-zone"]').should('have.attr', 'role', 'button');
      cy.get('[data-testid="drop-zone"]').should('have.attr', 'tabindex', '0');
    });

    it('should be accessible on analysis page', () => {
      cy.intercept('GET', '**/databases/*/collections/*/documents/*', {
        fixture: 'database/resume-with-analysis.json'
      }).as('getResumeWithAnalysis');
      
      cy.visit('/resume/analysis/resume123');
      cy.wait('@getResumeWithAnalysis');
      
      cy.checkAccessibility();
      
      // Check score accessibility
      cy.get('[data-testid="overall-score"]').should('have.attr', 'aria-label');
      
      // Check section headings
      cy.get('[data-testid="ats-keywords-title"]').should('have.attr', 'role', 'heading');
    });
  });

  describe('Performance', () => {
    it('should load upload page quickly', () => {
      cy.visit('/resume/upload');
      cy.measurePageLoad();
    });

    it('should handle large file uploads efficiently', () => {
      cy.visit('/resume/upload');
      
      // Mock large file upload with progress
      let uploadProgress = 0;
      cy.intercept('POST', '**/storage/buckets/*/files', (req) => {
        // Simulate upload progress
        const interval = setInterval(() => {
          uploadProgress += 10;
          if (uploadProgress >= 100) {
            clearInterval(interval);
            req.reply({ fixture: 'storage/upload-file.json' });
          }
        }, 100);
      }).as('uploadLargeFile');
      
      // Upload large file
      cy.get('[data-testid="file-input"]').selectFile({
        contents: 'x'.repeat(4 * 1024 * 1024), // 4MB
        fileName: 'large-resume.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      
      cy.get('[data-testid="upload-button"]').click();
      
      // Should show progress updates
      cy.get('[data-testid="progress-bar"]').should('be.visible');
      cy.wait('@uploadLargeFile');
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after network errors', () => {
      // Mock network error first, then success
      cy.intercept('POST', '**/storage/buckets/*/files', { forceNetworkError: true }).as('networkError');
      
      cy.visit('/resume/upload');
      
      // Upload file
      cy.fixture('files/sample-resume.pdf', 'base64').then(fileContent => {
        cy.get('[data-testid="file-input"]').selectFile({
          contents: Cypress.Buffer.from(fileContent, 'base64'),
          fileName: 'sample-resume.pdf',
          mimeType: 'application/pdf'
        }, { force: true });
      });
      
      cy.get('[data-testid="upload-button"]').click();
      
      // Should show network error
      cy.get('[data-testid="error-message"]').should('contain', 'Network error');
      cy.get('[data-testid="retry-button"]').should('be.visible');
      
      // Mock success for retry
      cy.intercept('POST', '**/storage/buckets/*/files', { fixture: 'storage/upload-file.json' }).as('uploadSuccess');
      
      // Retry upload
      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@uploadSuccess');
      
      // Should proceed with analysis
      cy.get('[data-testid="analysis-progress"]').should('be.visible');
    });

    it('should handle browser interruption gracefully', () => {
      cy.visit('/resume/upload');
      
      // Start upload
      cy.fixture('files/sample-resume.pdf', 'base64').then(fileContent => {
        cy.get('[data-testid="file-input"]').selectFile({
          contents: Cypress.Buffer.from(fileContent, 'base64'),
          fileName: 'sample-resume.pdf',
          mimeType: 'application/pdf'
        }, { force: true });
      });
      
      cy.get('[data-testid="upload-button"]').click();
      
      // Simulate page refresh during upload
      cy.reload();
      
      // Should show recovery options
      cy.get('[data-testid="recovery-message"]').should('be.visible');
      cy.get('[data-testid="resume-upload-button"]').should('be.visible');
    });
  });
});