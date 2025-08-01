import { forwardRef } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

/**
 * Reusable radio group component with validation states
 */
const FormRadioGroup = forwardRef(({
  label,
  name,
  options = [],
  error,
  touched,
  required = false,
  disabled = false,
  className = '',
  labelClassName = '',
  errorClassName = '',
  helpText,
  orientation = 'vertical', // 'vertical' or 'horizontal'
  ...props
}, ref) => {
  const hasError = error && touched;
  
  const labelClasses = `
    block text-sm font-medium text-gray-700 mb-2
    ${labelClassName}
  `;

  const errorClasses = `
    mt-1 text-sm text-red-600 flex items-center space-x-1
    ${errorClassName}
  `;

  const helpTextClasses = `
    mt-1 text-sm text-gray-500
  `;

  const groupClasses = `
    ${orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-3'}
  `;

  const optionClasses = `
    flex items-start space-x-3 cursor-pointer
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  const radioClasses = `
    mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300
    ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
    ${hasError ? 'border-red-500' : ''}
  `;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <fieldset>
          <legend className={labelClasses}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </legend>
          
          <div 
            className={groupClasses}
            role="radiogroup"
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${name}-error` : 
              helpText ? `${name}-help` : undefined
            }
          >
            {options.map((option, index) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              const optionDescription = typeof option === 'object' ? option.description : null;
              const optionDisabled = disabled || (typeof option === 'object' && option.disabled);
              
              return (
                <label key={optionValue} className={optionClasses}>
                  <input
                    ref={index === 0 ? ref : undefined}
                    type="radio"
                    name={name}
                    value={optionValue}
                    disabled={optionDisabled}
                    className={radioClasses}
                    {...props}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {optionLabel}
                    </div>
                    {optionDescription && (
                      <div className="text-sm text-gray-500">
                        {optionDescription}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
      
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

FormRadioGroup.displayName = 'FormRadioGroup';

export default FormRadioGroup;