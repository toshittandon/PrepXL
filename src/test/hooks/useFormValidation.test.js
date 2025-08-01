import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import * as yup from 'yup';
import { useFormValidation, useFileUpload, useMultiStepForm } from '../../hooks/useFormValidation.js';

describe('useFormValidation', () => {
  const testSchema = yup.object({
    email: yup.string().required('Email is required').email('Invalid email'),
    password: yup.string().required('Password is required').min(8, 'Too short')
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        defaultValues: { email: '', password: '' }
      })
    );

    expect(result.current.getValues()).toEqual({ email: '', password: '' });
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBe(null);
    expect(result.current.submitSuccess).toBe(false);
  });

  it('should handle successful form submission', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue();
    
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        defaultValues: { email: '', password: '' },
        onSubmit: mockOnSubmit
      })
    );

    // Set valid form data
    act(() => {
      result.current.setValue('email', 'test@example.com');
      result.current.setValue('password', 'password123');
    });

    // Submit form
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(result.current.submitSuccess).toBe(true);
    expect(result.current.submitError).toBe(null);
  });

  it('should handle form submission error', async () => {
    const mockError = new Error('Submission failed');
    const mockOnSubmit = vi.fn().mockRejectedValue(mockError);
    
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        defaultValues: { email: '', password: '' },
        onSubmit: mockOnSubmit
      })
    );

    // Set valid form data
    act(() => {
      result.current.setValue('email', 'test@example.com');
      result.current.setValue('password', 'password123');
    });

    // Submit form
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.submitError).toBe('Submission failed');
    expect(result.current.submitSuccess).toBe(false);
  });

  it('should handle field-specific errors', async () => {
    const mockError = {
      message: 'Validation failed',
      fieldErrors: {
        email: 'Email already exists'
      }
    };
    const mockOnSubmit = vi.fn().mockRejectedValue(mockError);
    
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        defaultValues: { email: '', password: '' },
        onSubmit: mockOnSubmit
      })
    );

    // Set valid form data
    act(() => {
      result.current.setValue('email', 'test@example.com');
      result.current.setValue('password', 'password123');
    });

    // Submit form
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.getFieldError('email')).toBe('Email already exists');
  });

  it('should provide field validation utilities', async () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        defaultValues: { email: '', password: '' }
      })
    );

    // Initially no errors or touched fields
    expect(result.current.hasFieldError('email')).toBe(false);
    expect(result.current.isFieldTouched('email')).toBe(false);

    // Simulate field interaction
    await act(async () => {
      result.current.setValue('email', 'invalid-email');
      await result.current.trigger('email');
    });

    // Wait for validation to complete
    await waitFor(() => {
      const fieldState = result.current.getFieldState('email');
      expect(fieldState.hasError).toBe(true);
      expect(fieldState.className).toContain('border-red-500');
    });
  });

  it('should reset form state', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        defaultValues: { email: '', password: '' }
      })
    );

    // Set some state
    act(() => {
      result.current.setValue('email', 'test@example.com');
    });

    // Reset form
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.getValues()).toEqual({ email: '', password: '' });
    expect(result.current.submitError).toBe(null);
    expect(result.current.submitSuccess).toBe(false);
  });

  it('should clear submit states', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        defaultValues: { email: '', password: '' }
      })
    );

    // Manually set submit states
    act(() => {
      result.current.clearSubmitStates();
    });

    expect(result.current.submitError).toBe(null);
    expect(result.current.submitSuccess).toBe(false);
  });
});

describe('useFileUpload', () => {
  const mockOnUpload = vi.fn();

  beforeEach(() => {
    mockOnUpload.mockClear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useFileUpload({ onUpload: mockOnUpload })
    );

    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.uploadError).toBe(null);
    expect(result.current.uploadedFile).toBe(null);
  });

  it('should validate file size', () => {
    const { result } = renderHook(() =>
      useFileUpload({
        onUpload: mockOnUpload,
        validation: { maxSize: 1024 * 1024 } // 1MB
      })
    );

    const validFile = { size: 500 * 1024, type: 'application/pdf' };
    const invalidFile = { size: 2 * 1024 * 1024, type: 'application/pdf' };

    expect(result.current.validateFile(validFile)).toEqual([]);
    expect(result.current.validateFile(invalidFile)).toContain('File size must be less than 1MB');
  });

  it('should validate file type', () => {
    const { result } = renderHook(() =>
      useFileUpload({
        onUpload: mockOnUpload,
        validation: { allowedTypes: ['application/pdf'] }
      })
    );

    const validFile = { size: 1024, type: 'application/pdf' };
    const invalidFile = { size: 1024, type: 'image/jpeg' };

    expect(result.current.validateFile(validFile)).toEqual([]);
    expect(result.current.validateFile(invalidFile)).toContain('Invalid file type');
  });

  it('should handle successful file upload', async () => {
    const mockResult = { id: '123', url: 'https://example.com/file.pdf' };
    mockOnUpload.mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useFileUpload({ onUpload: mockOnUpload })
    );

    const file = { size: 1024, type: 'application/pdf' };

    await act(async () => {
      await result.current.handleFileUpload([file]);
    });

    expect(mockOnUpload).toHaveBeenCalledWith(file, expect.any(Object));
    expect(result.current.uploadedFile).toEqual(mockResult);
    expect(result.current.uploadProgress).toBe(100);
    expect(result.current.isUploading).toBe(false);
  });

  it('should handle file upload error', async () => {
    const mockError = new Error('Upload failed');
    mockOnUpload.mockRejectedValue(mockError);

    const { result } = renderHook(() =>
      useFileUpload({ onUpload: mockOnUpload })
    );

    const file = { size: 1024, type: 'application/pdf' };

    await act(async () => {
      await result.current.handleFileUpload([file]);
    });

    expect(result.current.uploadError).toBe('Upload failed');
    expect(result.current.isUploading).toBe(false);
  });

  it('should reset upload state', () => {
    const { result } = renderHook(() =>
      useFileUpload({ onUpload: mockOnUpload })
    );

    act(() => {
      result.current.resetUpload();
    });

    expect(result.current.uploadedFile).toBe(null);
    expect(result.current.uploadError).toBe(null);
    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.isUploading).toBe(false);
  });
});

describe('useMultiStepForm', () => {
  const steps = [
    { id: 'step1', title: 'Step 1' },
    { id: 'step2', title: 'Step 2' },
    { id: 'step3', title: 'Step 3' }
  ];

  it('should initialize with first step', () => {
    const { result } = renderHook(() =>
      useMultiStepForm(steps)
    );

    expect(result.current.currentStep).toBe(0);
    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.isLastStep).toBe(false);
    expect(result.current.totalSteps).toBe(3);
    expect(result.current.progress).toBeCloseTo(33.33, 2);
  });

  it('should navigate between steps', () => {
    const { result } = renderHook(() =>
      useMultiStepForm(steps)
    );

    // Go to next step
    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.isFirstStep).toBe(false);
    expect(result.current.isLastStep).toBe(false);

    // Go to previous step
    act(() => {
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(0);
    expect(result.current.isFirstStep).toBe(true);
  });

  it('should go to specific step', () => {
    const { result } = renderHook(() =>
      useMultiStepForm(steps)
    );

    act(() => {
      result.current.goToStep(2);
    });

    expect(result.current.currentStep).toBe(2);
    expect(result.current.isLastStep).toBe(true);
  });

  it('should manage step data', () => {
    const { result } = renderHook(() =>
      useMultiStepForm(steps)
    );

    const stepData = { name: 'John', email: 'john@example.com' };

    act(() => {
      result.current.updateStepData(0, stepData);
    });

    expect(result.current.getStepData(0)).toEqual(stepData);
    expect(result.current.getAllData()).toEqual({ 0: stepData });
  });

  it('should track completed steps', () => {
    const { result } = renderHook(() =>
      useMultiStepForm(steps)
    );

    // Complete first step by going to next
    act(() => {
      result.current.nextStep();
    });

    expect(result.current.isStepCompleted(0)).toBe(true);
    expect(result.current.isStepCompleted(1)).toBe(false);
  });

  it('should reset form state', () => {
    const { result } = renderHook(() =>
      useMultiStepForm(steps)
    );

    // Navigate and add data
    act(() => {
      result.current.nextStep();
      result.current.updateStepData(0, { test: 'data' });
    });

    // Reset
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.currentStep).toBe(0);
    expect(result.current.getAllData()).toEqual({});
    expect(result.current.isStepCompleted(0)).toBe(false);
  });

  it('should not navigate beyond boundaries', () => {
    const { result } = renderHook(() =>
      useMultiStepForm(steps)
    );

    // Try to go before first step
    act(() => {
      result.current.prevStep();
    });
    expect(result.current.currentStep).toBe(0);

    // Go to last step
    act(() => {
      result.current.goToStep(2);
    });

    // Try to go beyond last step
    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(2);
  });
});