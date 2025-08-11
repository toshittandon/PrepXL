describe('App Branding', () => {
  beforeEach(() => {
    cy.seedTestData();
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  describe('Header Branding', () => {
    it('should display PrepXL branding in header', () => {
      cy.visit('/');
      
      // Check that header contains PrepXL branding
      cy.get('[data-testid="app-logo"]').should('contain', 'PrepXL');
      
      // Check page title
      cy.title().should('contain', 'PrepXL');
    });

    it('should display PrepXL branding when logged in', () => {
      cy.login();
      cy.visit('/dashboard');
      
      // Check that header contains PrepXL branding
      cy.get('[data-testid="app-logo"]').should('contain', 'PrepXL');
      
      // Check page title
      cy.title().should('contain', 'PrepXL');
    });
  });

  describe('Authentication Pages Branding', () => {
    it('should display PrepXL branding on login page', () => {
      cy.visit('/login');
      
      // Check page title
      cy.title().should('contain', 'PrepXL');
      
      // Check for branding in page content (if present)
      cy.get('body').should('contain', 'PrepXL');
    });

    it('should display PrepXL branding on signup page', () => {
      cy.visit('/signup');
      
      // Check page title
      cy.title().should('contain', 'PrepXL');
      
      // Check for branding in page content (if present)
      cy.get('body').should('contain', 'PrepXL');
    });
  });

  describe('Footer Branding', () => {
    it('should display PrepXL branding in footer', () => {
      cy.visit('/');
      
      // Check that footer contains PrepXL branding
      cy.get('[data-testid="footer"]').should('contain', 'PrepXL');
    });
  });

  describe('Meta Tags', () => {
    it('should have correct meta description with PrepXL', () => {
      cy.visit('/');
      
      // Check meta description
      cy.get('meta[name="description"]').should('have.attr', 'content').and('include', 'PrepXL');
    });
  });
});