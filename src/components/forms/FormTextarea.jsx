import { forwardRef } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

/**
 * Reusable textarea component with validation states and character count
 */
const FormTextarea = forwardRef(({
  label,
  name,
  placeholder,
  error,
  touched,
  required = false,
  disabled = false,
  rows = 4,
  maxLength,
  showCharCount = false,
  className = '',
  textareaClassName = '',
  labelClassName = '',
  errorClassName = '',
  helpText,
  showValidIcon = false,
  value = '',
  ...props
}, ref) => {
  const hasError = error && touched;
  const isValid = touched && !error && showValidIcon;
  const charCount = value?.length || 0;
  const isNearLimit = maxLength && charCount > maxLength * 0.8;
  const isOverLimit = maxLength && charCount > maxLength;
  
  const baseTextareaClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm 
    focus:outline-none focus:ring-2 focus:border-transparent
    transition-colors duration-200 resize-vertical
    ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
  `;
  
  const getTextareaClasses = () => {
    if (hasError || isOverLimit) {
      return `${baseTextareaClasses} border-red-500 focus:ring-red-500 ${textareaClassName}`;
    }
    if (isValid) {
      return `${baseTextareaClasses} border-green-500 focus:ring-green-500 ${textareaClassName}`;
    }
    return `${baseTextareaClasses} border-gray-300 focus:ring-blue-500 ${textareaClassName}`;
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

  const charCountClasses = `
    text-xs text-right mt-1
    ${isOverLimit ? 'text-red-600' : 
      isNearLimit ? 'text-yellow-600' : 'text-gray-500'}
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
        <textarea
          ref={ref}
          id={name}
          name={name}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          className={getTextareaClasses()}
          aria-invalid={hasError || isOverLimit}
          aria-describedby={
            hasError ? `${name}-error` : 
            helpText ? `${name}-help` : undefined
          }
          {...props}
        />
        
        {/* Validation icons */}
        {(hasError || isValid) && (
          <div className="absolute top-2 right-2 pointer-events-none">
            {hasError && (
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            )}
            {isValid && (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            )}
          </div>
        )}
      </div>
      
      {/* Character count */}
      {(showCharCount || maxLength) && (
        <div className={charCountClasses}>
          {charCount}{maxLength && `/${maxLength}`}
        </div>
      )}
      
      {/* Error message */}
      {(hasError || isOverLimit) && (
        <div id={`${name}-error`} className={errorClasses}>
          <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
          <span>
            {isOverLimit ? `Character limit exceeded (${charCount}/${maxLength})` : error}
          </span>
        </div>
      )}
      
      {/* Help text */}
      {helpText && !hasError && !isOverLimit && (
        <div id={`${name}-help`} className={helpTextClasses}>
          {helpText}
        </div>
      )}
    </div>
  );
});

FormTextarea.displayName = 'FormTextarea';

export default FormTextarea;