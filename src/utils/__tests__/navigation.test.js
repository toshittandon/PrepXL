import { navigationHelpers, ROUTES } from '../navigation';

describe('Navigation Utilities', () => {
  describe('ROUTES constants', () => {
    test('should have all required route constants', () => {
      expect(ROUTES.AUTH.LOGIN).toBe('/auth/login');
      expect(ROUTES.AUTH.SIGNUP).toBe('/auth/signup');
      expect(ROUTES.DASHBOARD).toBe('/dashboard');
      expect(ROUTES.RESUME.UPLOAD).toBe('/resume/upload');
      expect(ROUTES.INTERVIEW.SETUP).toBe('/interview/setup');
    });

    test('should generate dynamic routes correctly', () => {
      expect(ROUTES.RESUME.ANALYSIS('123')).toBe('/resume/analysis/123');
      expect(ROUTES.INTERVIEW.LIVE('456')).toBe('/interview/live/456');
      expect(ROUTES.INTERVIEW.REPORT('789')).toBe('/interview/report/789');
    });
  });

  describe('navigationHelpers', () => {
    test('isCurrentRoute should match exact routes', () => {
      expect(navigationHelpers.isCurrentRoute('/dashboard', '/dashboard')).toBe(true);
      expect(navigationHelpers.isCurrentRoute('/dashboard', '/auth/login')).toBe(false);
    });

    test('isInSection should match route sections', () => {
      expect(navigationHelpers.isInSection('/resume/upload', '/resume')).toBe(true);
      expect(navigationHelpers.isInSection('/interview/setup', '/interview')).toBe(true);
      expect(navigationHelpers.isInSection('/dashboard', '/resume')).toBe(false);
    });

    test('isProtectedRoute should identify protected routes correctly', () => {
      expect(navigationHelpers.isProtectedRoute('/dashboard')).toBe(true);
      expect(navigationHelpers.isProtectedRoute('/resume/upload')).toBe(true);
      expect(navigationHelpers.isProtectedRoute('/auth/login')).toBe(false);
      expect(navigationHelpers.isProtectedRoute('/auth/signup')).toBe(false);
    });

    test('getAuthenticatedRedirect should return correct paths', () => {
      expect(navigationHelpers.getAuthenticatedRedirect()).toBe('/dashboard');
      expect(navigationHelpers.getAuthenticatedRedirect('/resume/upload')).toBe('/resume/upload');
      expect(navigationHelpers.getAuthenticatedRedirect('/auth/login')).toBe('/dashboard');
    });

    test('getUnauthenticatedRedirect should return login path', () => {
      expect(navigationHelpers.getUnauthenticatedRedirect()).toBe('/auth/login');
    });

    test('getBreadcrumbs should generate correct breadcrumbs', () => {
      const dashboardBreadcrumbs = navigationHelpers.getBreadcrumbs('/dashboard');
      expect(dashboardBreadcrumbs).toHaveLength(1);
      expect(dashboardBreadcrumbs[0].label).toBe('Dashboard');

      const resumeUploadBreadcrumbs = navigationHelpers.getBreadcrumbs('/resume/upload');
      expect(resumeUploadBreadcrumbs).toHaveLength(3);
      expect(resumeUploadBreadcrumbs[1].label).toBe('Resume');
      expect(resumeUploadBreadcrumbs[2].label).toBe('Upload');

      const interviewSetupBreadcrumbs = navigationHelpers.getBreadcrumbs('/interview/setup');
      expect(interviewSetupBreadcrumbs).toHaveLength(3);
      expect(interviewSetupBreadcrumbs[1].label).toBe('Interview');
      expect(interviewSetupBreadcrumbs[2].label).toBe('Setup');
    });
  });
});