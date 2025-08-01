import { forwardRef } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

/**
 * Reusable form field component with validation states and accessibility
 */
const FormField = forwardRef(({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  touched,
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  labelClassName = '',
  errorClassName = '',
  helpText,
  showValidIcon = false,
  children,
  ...props
}, ref) => {
  const hasError = error && touched;
  const isValid = touched && !error && showValidIcon;
  
  const baseInputClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm 
    focus:outline-none focus:ring-2 focus:border-transparent
    transition-colors duration-200
    ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
  `;
  
  const getInputClasses = () => {
    if (hasError) {
      return `${baseInputClasses} border-red-500 focus:ring-red-500 ${inputClassName}`;
    }
    if (isValid) {
      return `${baseInputClasses} border-green-500 focus:ring-green-500 ${inputClassName}`;
    }
    return `${baseInputClasses} border-gray-300 focus:ring-blue-500 ${inputClassName}`;
  };

  const labelClasses = `
    block text-sm font-medium text-gray-700 mb-1
    ${labelClassName}
  `;

  const errorClasses = `
    mt-1 text-sm text-red-600 flex items-center space-x-1
    ${errorClassName}
  `;

  const helpTextClasses = `
    mt-1 text-sm text-gray-500
  `;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label 
          htmlFor={name} 
          className={labelClasses}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {children || (
          <input
            ref={ref}
            id={name}
            name={name}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            className={getInputClasses()}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${name}-error` : 
              helpText ? `${name}-help` : undefined
            }
            {...props}
          />
        )}
        
        {/* Validation icons */}
        {(hasError || isValid) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {hasError && (
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            )}
            {isValid && (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            )}
          </div>
        )}
      </div>
      
      {/* Error message */}
      {hasError && (
        <div id={`${name}-error`} className={errorClasses}>
          <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Help text */}
      {helpText && !hasError && (
        <div id={`${name}-help`} className={helpTextClasses}>
          {helpText}
        </div>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;