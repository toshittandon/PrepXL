import { describe, it, expect, vi } from 'vitest';
import { 
  navigateToRoute,
  buildRouteWithParams,
  getRouteParams,
  isActiveRoute,
  redirectToLogin,
  redirectToDashboard,
  getReturnUrl,
  setReturnUrl,
} from '../../utils/navigation';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = {
  pathname: '/dashboard',
  search: '?tab=profile',
  hash: '#section1',
};

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  useParams: () => ({ id: '123', type: 'interview' }),
}));

describe('navigation utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  describe('navigateToRoute', () => {
    it('should navigate to simple route', () => {
      navigateToRoute('/dashboard');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate with replace option', () => {
      navigateToRoute('/login', { replace: true });
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should navigate with state', () => {
      const state = { from: '/dashboard' };
      navigateToRoute('/login', { state });
      expect(mockNavigate).toHaveBeenCalledWith('/login', { state });
    });

    it('should handle relative navigation', () => {
      navigateToRoute('../parent');
      expect(mockNavigate).toHaveBeenCalledWith('../parent');
    });

    it('should handle navigation with query params', () => {
      navigateToRoute('/search?q=test&filter=active');
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=test&filter=active');
    });
  });

  describe('buildRouteWithParams', () => {
    it('should build route with single parameter', () => {
      const route = buildRouteWithParams('/user/:id', { id: '123' });
      expect(route).toBe('/user/123');
    });

    it('should build route with multiple parameters', () => {
      const route = buildRouteWithParams('/user/:userId/post/:postId', {
        userId: '123',
        postId: '456',
      });
      expect(route).toBe('/user/123/post/456');
    });

    it('should handle missing parameters', () => {
      const route = buildRouteWithParams('/user/:id', {});
      expect(route).toBe('/user/:id');
    });

    it('should handle extra parameters', () => {
      const route = buildRouteWithParams('/user/:id', {
        id: '123',
        extra: 'ignored',
      });
      expect(route).toBe('/user/123');
    });

    it('should handle special characters in parameters', () => {
      const route = buildRouteWithParams('/search/:query', {
        query: 'hello world',
      });
      expect(route).toBe('/search/hello world');
    });

    it('should handle encoded parameters', () => {
      const route = buildRouteWithParams('/search/:query', {
        query: encodeURIComponent('hello world'),
      });
      expect(route).toBe('/search/hello%20world');
    });
  });

  describe('getRouteParams', () => {
    it('should extract route parameters', () => {
      const params = getRouteParams();
      expect(params).toEqual({ id: '123', type: 'interview' });
    });

    it('should return empty object when no params', () => {
      vi.mocked(require('react-router-dom').useParams).mockReturnValue({});
      const params = getRouteParams();
      expect(params).toEqual({});
    });

    it('should handle undefined params', () => {
      vi.mocked(require('react-router-dom').useParams).mockReturnValue(undefined);
      const params = getRouteParams();
      expect(params).toEqual({});
    });
  });

  describe('isActiveRoute', () => {
    it('should return true for exact match', () => {
      const isActive = isActiveRoute('/dashboard');
      expect(isActive).toBe(true);
    });

    it('should return false for non-matching route', () => {
      const isActive = isActiveRoute('/profile');
      expect(isActive).toBe(false);
    });

    it('should handle partial matching', () => {
      const isActive = isActiveRoute('/dash', { exact: false });
      expect(isActive).toBe(true);
    });

    it('should handle case sensitivity', () => {
      const isActive = isActiveRoute('/DASHBOARD', { caseSensitive: false });
      expect(isActive).toBe(true);
    });

    it('should handle trailing slashes', () => {
      const isActive = isActiveRoute('/dashboard/', { ignoreTrailingSlash: true });
      expect(isActive).toBe(true);
    });

    it('should handle query parameters', () => {
      const isActive = isActiveRoute('/dashboard?tab=profile');
      expect(isActive).toBe(true);
    });
  });

  describe('redirectToLogin', () => {
    it('should redirect to login page', () => {
      redirectToLogin();
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should redirect with return URL', () => {
      redirectToLogin('/dashboard');
      expect(mockNavigate).toHaveBeenCalledWith('/login?returnUrl=%2Fdashboard', { replace: true });
    });

    it('should handle custom login path', () => {
      redirectToLogin('/dashboard', '/auth/login');
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login?returnUrl=%2Fdashboard', { replace: true });
    });

    it('should preserve existing query parameters', () => {
      redirectToLogin('/dashboard?tab=profile');
      expect(mockNavigate).toHaveBeenCalledWith('/login?returnUrl=%2Fdashboard%3Ftab%3Dprofile', { replace: true });
    });
  });

  describe('redirectToDashboard', () => {
    it('should redirect to dashboard', () => {
      redirectToDashboard();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('should redirect to custom dashboard path', () => {
      redirectToDashboard('/home');
      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });

    it('should handle navigation options', () => {
      redirectToDashboard('/dashboard', { replace: false });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: false });
    });
  });

  describe('getReturnUrl', () => {
    it('should get return URL from localStorage', () => {
      localStorage.setItem('returnUrl', '/profile');
      const returnUrl = getReturnUrl();
      expect(returnUrl).toBe('/profile');
    });

    it('should return default URL when no return URL stored', () => {
      const returnUrl = getReturnUrl('/dashboard');
      expect(returnUrl).toBe('/dashboard');
    });

    it('should return null when no return URL and no default', () => {
      const returnUrl = getReturnUrl();
      expect(returnUrl).toBeNull();
    });

    it('should handle invalid return URLs', () => {
      localStorage.setItem('returnUrl', 'javascript:alert("xss")');
      const returnUrl = getReturnUrl('/dashboard');
      expect(returnUrl).toBe('/dashboard');
    });

    it('should handle external URLs', () => {
      localStorage.setItem('returnUrl', 'https://external.com');
      const returnUrl = getReturnUrl('/dashboard');
      expect(returnUrl).toBe('/dashboard');
    });
  });

  describe('setReturnUrl', () => {
    it('should set return URL in localStorage', () => {
      setReturnUrl('/profile');
      expect(localStorage.getItem('returnUrl')).toBe('/profile');
    });

    it('should handle null URL', () => {
      setReturnUrl(null);
      expect(localStorage.getItem('returnUrl')).toBeNull();
    });

    it('should handle undefined URL', () => {
      setReturnUrl(undefined);
      expect(localStorage.getItem('returnUrl')).toBeNull();
    });

    it('should validate URL before setting', () => {
      setReturnUrl('javascript:alert("xss")');
      expect(localStorage.getItem('returnUrl')).toBeNull();
    });

    it('should handle relative URLs', () => {
      setReturnUrl('../parent');
      expect(localStorage.getItem('returnUrl')).toBe('../parent');
    });

    it('should handle query parameters', () => {
      setReturnUrl('/search?q=test');
      expect(localStorage.getItem('returnUrl')).toBe('/search?q=test');
    });

    it('should handle hash fragments', () => {
      setReturnUrl('/page#section');
      expect(localStorage.getItem('returnUrl')).toBe('/page#section');
    });
  });

  describe('edge cases', () => {
    it('should handle empty route patterns', () => {
      const route = buildRouteWithParams('', { id: '123' });
      expect(route).toBe('');
    });

    it('should handle routes with no parameters', () => {
      const route = buildRouteWithParams('/static/route', { id: '123' });
      expect(route).toBe('/static/route');
    });

    it('should handle malformed route patterns', () => {
      const route = buildRouteWithParams('/user/:id/:', { id: '123' });
      expect(route).toBe('/user/123/:');
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => setReturnUrl('/test')).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    it('should handle navigation without navigate function', () => {
      vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(null);
      
      expect(() => navigateToRoute('/test')).not.toThrow();
    });

    it('should handle location without pathname', () => {
      vi.mocked(require('react-router-dom').useLocation).mockReturnValue({});
      
      const isActive = isActiveRoute('/test');
      expect(isActive).toBe(false);
    });
  });

  describe('URL validation', () => {
    it('should validate safe internal URLs', () => {
      const safeUrls = [
        '/dashboard',
        '/user/123',
        '/search?q=test',
        '/page#section',
        '../parent',
        './current',
      ];

      safeUrls.forEach(url => {
        setReturnUrl(url);
        expect(localStorage.getItem('returnUrl')).toBe(url);
        localStorage.clear();
      });
    });

    it('should reject unsafe URLs', () => {
      const unsafeUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'vbscript:msgbox("xss")',
        'https://external.com',
        'http://malicious.com',
        'ftp://file.server.com',
      ];

      unsafeUrls.forEach(url => {
        setReturnUrl(url);
        expect(localStorage.getItem('returnUrl')).toBeNull();
      });
    });
  });
});