import { forwardRef } from 'react';
import { ChevronDownIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

/**
 * Reusable select component with validation states
 */
const FormSelect = forwardRef(({
  label,
  name,
  options = [],
  placeholder = 'Select an option...',
  error,
  touched,
  required = false,
  disabled = false,
  className = '',
  selectClassName = '',
  labelClassName = '',
  errorClassName = '',
  helpText,
  showValidIcon = false,
  ...props
}, ref) => {
  const hasError = error && touched;
  const isValid = touched && !error && showValidIcon;
  
  const baseSelectClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm 
    focus:outline-none focus:ring-2 focus:border-transparent
    transition-colors duration-200 appearance-none
    ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white cursor-pointer'}
  `;
  
  const getSelectClasses = () => {
    if (hasError) {
      return `${baseSelectClasses} border-red-500 focus:ring-red-500 ${selectClassName}`;
    }
    if (isValid) {
      return `${baseSelectClasses} border-green-500 focus:ring-green-500 ${selectClassName}`;
    }
    return `${baseSelectClasses} border-gray-300 focus:ring-blue-500 ${selectClassName}`;
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
        <select
          ref={ref}
          id={name}
          name={name}
          disabled={disabled}
          className={getSelectClasses()}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${name}-error` : 
            helpText ? `${name}-help` : undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => {
            if (typeof option === 'string') {
              return (
                <option key={option} value={option}>
                  {option}
                </option>
              );
            }
            return (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            );
          })}
        </select>
        
        {/* Dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        {/* Validation icons */}
        {(hasError || isValid) && (
          <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
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

FormSelect.displayName = 'FormSelect';

export default FormSelect;