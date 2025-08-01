import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../testUtils';
import OAuthButtons from '../../../components/forms/OAuthButtons';

// Mock the auth service
vi.mock('../../../services/appwrite/auth.js', () => ({
  authService: {
    loginWithOAuth: vi.fn(),
  },
}));

import { authService } from '../../../services/appwrite/auth.js';

describe('OAuthButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render OAuth provider buttons', () => {
    renderWithProviders(<OAuthButtons />);
    
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with linkedin/i })).toBeInTheDocument();
  });

  it('should handle Google OAuth login', async () => {
    authService.loginWithOAuth.mockResolvedValue({ success: true });
    
    renderWithProviders(<OAuthButtons />);
    
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleButton);
    
    expect(authService.loginWithOAuth).toHaveBeenCalledWith('google');
  });

  it('should handle LinkedIn OAuth login', async () => {
    authService.loginWithOAuth.mockResolvedValue({ success: true });
    
    renderWithProviders(<OAuthButtons />);
    
    const linkedinButton = screen.getByRole('button', { name: /continue with linkedin/i });
    fireEvent.click(linkedinButton);
    
    expect(authService.loginWithOAuth).toHaveBeenCalledWith('linkedin');
  });

  it('should show loading state during OAuth process', async () => {
    authService.loginWithOAuth.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderWithProviders(<OAuthButtons />);
    
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleButton);
    
    expect(googleButton).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should handle OAuth errors', async () => {
    const errorMessage = 'OAuth authentication failed';
    authService.loginWithOAuth.mockResolvedValue({ success: false, error: errorMessage });
    
    const { store } = renderWithProviders(<OAuthButtons />);
    
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleButton);
    
    // Wait for error to be processed
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Should dispatch error to store
    expect(store.getState().ui.notifications).toHaveLength(1);
    expect(store.getState().ui.notifications[0].type).toBe('error');
  });

  it('should render with custom styling', () => {
    renderWithProviders(<OAuthButtons className="custom-oauth" />);
    
    const container = screen.getByRole('button', { name: /continue with google/i }).closest('div');
    expect(container).toHaveClass('custom-oauth');
  });

  it('should be disabled when disabled prop is true', () => {
    renderWithProviders(<OAuthButtons disabled />);
    
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    const linkedinButton = screen.getByRole('button', { name: /continue with linkedin/i });
    
    expect(googleButton).toBeDisabled();
    expect(linkedinButton).toBeDisabled();
  });

  it('should render only specified providers', () => {
    renderWithProviders(<OAuthButtons providers={['google']} />);
    
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue with linkedin/i })).not.toBeInTheDocument();
  });

  it('should render with custom button text', () => {
    renderWithProviders(<OAuthButtons buttonText="Sign in with" />);
    
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with linkedin/i })).toBeInTheDocument();
  });

  it('should handle successful OAuth redirect', async () => {
    const mockUser = { $id: 'user123', name: 'Test User' };
    const mockSession = { $id: 'session123' };
    
    authService.loginWithOAuth.mockResolvedValue({ 
      success: true, 
      data: { user: mockUser, session: mockSession } 
    });
    
    const { store } = renderWithProviders(<OAuthButtons />);
    
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleButton);
    
    // Wait for OAuth to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Should update auth state
    expect(store.getState().auth.loading).toBe(true);
  });

  it('should render provider icons', () => {
    renderWithProviders(<OAuthButtons />);
    
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    const linkedinButton = screen.getByRole('button', { name: /continue with linkedin/i });
    
    expect(googleButton.querySelector('svg') || googleButton.querySelector('img')).toBeInTheDocument();
    expect(linkedinButton.querySelector('svg') || linkedinButton.querySelector('img')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    renderWithProviders(<OAuthButtons />);
    
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    const linkedinButton = screen.getByRole('button', { name: /continue with linkedin/i });
    
    expect(googleButton).toHaveAttribute('type', 'button');
    expect(linkedinButton).toHaveAttribute('type', 'button');
  });

  it('should handle keyboard navigation', () => {
    renderWithProviders(<OAuthButtons />);
    
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    const linkedinButton = screen.getByRole('button', { name: /continue with linkedin/i });
    
    googleButton.focus();
    expect(document.activeElement).toBe(googleButton);
    
    fireEvent.keyDown(googleButton, { key: 'Tab' });
    expect(document.activeElement).toBe(linkedinButton);
  });

  it('should render in vertical layout by default', () => {
    renderWithProviders(<OAuthButtons />);
    
    const container = screen.getByRole('button', { name: /continue with google/i }).closest('div');
    expect(container).toHaveClass('flex-col');
  });

  it('should render in horizontal layout when specified', () => {
    renderWithProviders(<OAuthButtons layout="horizontal" />);
    
    const container = screen.getByRole('button', { name: /continue with google/i }).closest('div');
    expect(container).toHaveClass('flex-row');
  });

  it('should handle network errors gracefully', async () => {
    authService.loginWithOAuth.mockRejectedValue(new Error('Network error'));
    
    const { store } = renderWithProviders(<OAuthButtons />);
    
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleButton);
    
    // Wait for error to be processed
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Should show error notification
    expect(store.getState().ui.notifications).toHaveLength(1);
    expect(store.getState().ui.notifications[0].type).toBe('error');
  });
});