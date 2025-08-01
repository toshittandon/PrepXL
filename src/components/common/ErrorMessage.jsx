const ErrorMessage = ({ 
  message, 
  title = 'Error',
  dismissible = false,
  onDismiss,
  variant = 'default',
  className = ''
}) => {
  if (!message) return null;

  const variants = {
    default: 'bg-red-50 border-red-200 text-red-800',
    inline: 'bg-red-100 border-red-300 text-red-700',
    banner: 'bg-red-600 border-red-600 text-white'
  };

  const iconVariants = {
    default: 'text-red-400',
    inline: 'text-red-500',
    banner: 'text-white'
  };

  return (
    <div className={`
      border rounded-lg p-4 flex items-start space-x-3
      ${variants[variant]}
      ${className}
    `}>
      {/* Error Icon */}
      <div className="flex-shrink-0">
        <svg 
          className={`w-5 h-5 ${iconVariants[variant]}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && variant !== 'inline' && (
          <h3 className="text-sm font-medium mb-1">{title}</h3>
        )}
        <p className="text-sm">{message}</p>
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <div className="flex-shrink-0">
          <button
            onClick={onDismiss}
            className={`
              rounded-md p-1.5 inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2
              ${variant === 'banner' 
                ? 'text-white hover:bg-red-700 focus:ring-white' 
                : 'text-red-400 hover:bg-red-100 focus:ring-red-500'
              }
            `}
          >
            <span className="sr-only">Dismiss</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;