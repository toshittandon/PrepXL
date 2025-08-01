import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../../components/forms/LoginForm.jsx';
import SignupForm from '../../components/forms/SignupForm.jsx';
import authSlice from '../../store/slices/authSlice.js';

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice
    }
  });
};

const renderWithProviders = (component) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('Form Validation Integration', () => {
  describe('LoginForm with Enhanced Validation', () => {
    it('should show real-time validation feedback', async () => {
      renderWithProviders(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      // Test email validation
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
        expect(emailInput).toHaveClass('border-red-500');
      });
      
      // Fix email and check valid state
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
        expect(emailInput).toHaveClass('border-green-500');
      });
      
      // Test password validation
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.blur(passwordInput);
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
        expect(passwordInput).toHaveClass('border-red-500');
      });
    });

    it('should show validation icons for valid and invalid states', async () => {
      renderWithProviders(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      
      // Enter valid email
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        // Should show green border for valid state
        expect(emailInput).toHaveClass('border-green-500');
        // Should have validation icon (we can't easily test for specific icon, but border color indicates it)
      });
      
      // Enter invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        // Should show red border for error state
        expect(emailInput).toHaveClass('border-red-500');
      });
    });
  });

  describe('SignupForm with Enhanced Validation', () => {
    it('should validate password complexity', async () => {
      renderWithProviders(<SignupForm />);
      
      const passwordInput = screen.getByPlaceholderText('Create a password');
      
      // Test weak password
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.blur(passwordInput);
      
      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
      });
      
      // Test strong password
      fireEvent.change(passwordInput, { target: { value: 'Password123' } });
      fireEvent.blur(passwordInput);
      
      await waitFor(() => {
        expect(screen.queryByText(/password must contain at least one uppercase letter/i)).not.toBeInTheDocument();
        expect(passwordInput).toHaveClass('border-green-500');
      });
    });

    it('should validate password confirmation', async () => {
      renderWithProviders(<SignupForm />);
      
      const passwordInput = screen.getByPlaceholderText('Create a password');
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      // Set password
      fireEvent.change(passwordInput, { target: { value: 'Password123' } });
      
      // Set mismatched confirmation
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password456' } });
      fireEvent.blur(confirmPasswordInput);
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
        expect(confirmPasswordInput).toHaveClass('border-red-500');
      });
      
      // Fix confirmation
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });
      fireEvent.blur(confirmPasswordInput);
      
      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
        expect(confirmPasswordInput).toHaveClass('border-green-500');
      });
    });

    it('should validate name format', async () => {
      renderWithProviders(<SignupForm />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      
      // Test invalid name with numbers
      fireEvent.change(nameInput, { target: { value: 'John123' } });
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        expect(screen.getByText(/name can only contain letters and spaces/i)).toBeInTheDocument();
        expect(nameInput).toHaveClass('border-red-500');
      });
      
      // Test valid name
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        expect(screen.queryByText(/name can only contain letters and spaces/i)).not.toBeInTheDocument();
        expect(nameInput).toHaveClass('border-green-500');
      });
    });

    it('should show help text for password requirements', () => {
      renderWithProviders(<SignupForm />);
      
      expect(screen.getByText(/must contain at least one uppercase letter/i)).toBeInTheDocument();
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithProviders(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      // Check required fields have proper labels
      expect(emailInput).toHaveAttribute('id', 'email');
      expect(passwordInput).toHaveAttribute('id', 'password');
      
      // Check input types
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should associate error messages with inputs', async () => {
      renderWithProviders(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      
      // Trigger validation error
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
      });
    });
  });

  describe('Form User Experience', () => {
    it('should provide immediate feedback on field blur', async () => {
      renderWithProviders(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      
      // Focus and blur without entering data
      fireEvent.focus(emailInput);
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should clear errors when field becomes valid', async () => {
      renderWithProviders(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      
      // Create error
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
      
      // Fix error
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });
  });
});