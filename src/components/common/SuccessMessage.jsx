const SuccessMessage = ({ 
  message, 
  title = 'Success',
  dismissible = false,
  onDismiss,
  variant = 'default',
  className = ''
}) => {
  if (!message) return null;

  const variants = {
    default: 'bg-green-50 border-green-200 text-green-800',
    inline: 'bg-green-100 border-green-300 text-green-700',
    banner: 'bg-green-600 border-green-600 text-white'
  };

  const iconVariants = {
    default: 'text-green-400',
    inline: 'text-green-500',
    banner: 'text-white'
  };

  return (
    <div className={`
      border rounded-lg p-4 flex items-start space-x-3
      ${variants[variant]}
      ${className}
    `}>
      {/* Success Icon */}
      <div className="flex-shrink-0">
        <svg 
          className={`w-5 h-5 ${iconVariants[variant]}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
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
                ? 'text-white hover:bg-green-700 focus:ring-white' 
                : 'text-green-400 hover:bg-green-100 focus:ring-green-500'
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

export default SuccessMessage;