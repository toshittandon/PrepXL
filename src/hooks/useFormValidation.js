import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState, useCallback } from 'react';

/**
 * Enhanced form hook with validation, loading states, and error handling
 * @param {Object} options - Configuration options
 * @param {Object} options.schema - Yup validation schema
 * @param {Object} options.defaultValues - Default form values
 * @param {string} options.mode - Validation mode ('onBlur', 'onChange', 'onSubmit')
 * @param {Function} options.onSubmit - Submit handler function
 * @param {Function} options.onError - Error handler function
 * @returns {Object} Form utilities and state
 */
export const useFormValidation = ({
  schema,
  defaultValues = {},
  mode = 'onBlur',
  onSubmit,
  onError
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm({
    resolver: schema ? yupResolver(schema) : undefined,
    defaultValues,
    mode
  });

  const {
    handleSubmit,
    formState: { errors, isValid, isDirty, touchedFields },
    reset,
    clearErrors,
    setError,
    watch,
    setValue,
    getValues
  } = form;

  // Enhanced submit handler with loading states and error handling
  const handleFormSubmit = useCallback(
    async (data) => {
      if (!onSubmit) return;

      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      try {
        await onSubmit(data);
        setSubmitSuccess(true);
      } catch (error) {
        const errorMessage = error?.message || 'An unexpected error occurred';
        setSubmitError(errorMessage);
        
        if (onError) {
          onError(error);
        }

        // Set field-specific errors if provided
        if (error?.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([field, message]) => {
            setError(field, { type: 'server', message });
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, onError, setError]
  );

  // Reset form and clear all states
  const resetForm = useCallback(() => {
    reset();
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(false);
  }, [reset]);

  // Clear submit states
  const clearSubmitStates = useCallback(() => {
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  // Get field error message
  const getFieldError = useCallback((fieldName) => {
    return errors[fieldName]?.message;
  }, [errors]);

  // Check if field has error
  const hasFieldError = useCallback((fieldName) => {
    return !!errors[fieldName];
  }, [errors]);

  // Check if field is touched
  const isFieldTouched = useCallback((fieldName) => {
    return !!touchedFields[fieldName];
  }, [touchedFields]);

  // Get field validation state
  const getFieldState = useCallback((fieldName) => {
    const hasError = hasFieldError(fieldName);
    const isTouched = isFieldTouched(fieldName);
    
    return {
      hasError,
      isTouched,
      isValid: isTouched && !hasError,
      className: hasError ? 'border-red-500 focus:ring-red-500' : 
                 (isTouched ? 'border-green-500 focus:ring-green-500' : 'border-gray-300 focus:ring-blue-500')
    };
  }, [hasFieldError, isFieldTouched]);

  return {
    // Form methods
    ...form,
    handleSubmit: handleSubmit(handleFormSubmit),
    resetForm,
    clearSubmitStates,
    
    // State
    isSubmitting,
    submitError,
    submitSuccess,
    isFormValid: isValid,
    isFormDirty: isDirty,
    
    // Field utilities
    getFieldError,
    hasFieldError,
    isFieldTouched,
    getFieldState,
    
    // Form state helpers
    hasErrors: Object.keys(errors).length > 0,
    errorCount: Object.keys(errors).length,
    touchedCount: Object.keys(touchedFields).length
  };
};

/**
 * Hook for handling file uploads with validation
 * @param {Object} options - Configuration options
 * @param {Function} options.onUpload - Upload handler function
 * @param {Object} options.validation - File validation options
 * @returns {Object} File upload utilities
 */
export const useFileUpload = ({
  onUpload,
  validation = {}
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    maxFiles = 1
  } = validation;

  const validateFile = useCallback((file) => {
    const errors = [];

    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type');
    }

    return errors;
  }, [maxSize, allowedTypes]);

  const handleFileUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // Handle single file for now
    const validationErrors = validateFile(file);

    if (validationErrors.length > 0) {
      setUploadError(validationErrors[0]);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const result = await onUpload(file, {
        onProgress: (progress) => setUploadProgress(progress)
      });
      
      setUploadedFile(result);
      setUploadProgress(100);
    } catch (error) {
      setUploadError(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, validateFile]);

  const resetUpload = useCallback(() => {
    setUploadedFile(null);
    setUploadError(null);
    setUploadProgress(0);
    setIsUploading(false);
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadError,
    uploadedFile,
    handleFileUpload,
    resetUpload,
    validateFile
  };
};

/**
 * Hook for managing multi-step forms
 * @param {Array} steps - Array of step configurations
 * @param {Object} options - Configuration options
 * @returns {Object} Multi-step form utilities
 */
export const useMultiStepForm = (steps = [], options = {}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [stepData, setStepData] = useState({});

  const {
    validateOnNext = true,
    allowSkip = false
  } = options;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length]);

  const nextStep = useCallback(() => {
    if (!isLastStep) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep, currentStep]);

  const prevStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  }, [isFirstStep]);

  const updateStepData = useCallback((step, data) => {
    setStepData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data }
    }));
  }, []);

  const getStepData = useCallback((step) => {
    return stepData[step] || {};
  }, [stepData]);

  const getAllData = useCallback(() => {
    return stepData;
  }, [stepData]);

  const resetForm = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setStepData({});
  }, []);

  const isStepCompleted = useCallback((stepIndex) => {
    return completedSteps.has(stepIndex);
  }, [completedSteps]);

  return {
    currentStep,
    isFirstStep,
    isLastStep,
    totalSteps,
    progress,
    goToStep,
    nextStep,
    prevStep,
    updateStepData,
    getStepData,
    getAllData,
    resetForm,
    isStepCompleted,
    currentStepConfig: steps[currentStep]
  };
};