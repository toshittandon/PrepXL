const LoadingSpinner = ({ 
  size = 'large', 
  message = 'Loading...', 
  inline = false,
  variant = 'spinner',
  color = 'blue'
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    small: 'h-6 w-6',
    medium: 'h-8 w-8',
    lg: 'h-10 w-10',
    large: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    gray: 'border-gray-600',
    green: 'border-green-600',
    red: 'border-red-600',
    white: 'border-white'
  };

  const renderSpinner = () => {
    const baseClasses = `${inline ? '' : 'mx-auto'} ${sizeClasses[size]}`;
    
    switch (variant) {
      case 'dots':
        return (
          <div className={`flex space-x-1 ${baseClasses}`} role="status" aria-label="Loading">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 bg-${color}-600 rounded-full animate-bounce`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <div 
            className={`animate-pulse bg-${color}-600 rounded-full ${baseClasses}`}
            role="status"
            aria-label="Loading"
          />
        );
      
      case 'bars':
        return (
          <div className={`flex space-x-1 ${baseClasses}`} role="status" aria-label="Loading">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-1 bg-${color}-600 animate-pulse`}
                style={{ 
                  height: '100%',
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );
      
      default: // spinner
        return (
          <div 
            className={`animate-spin rounded-full border-b-2 ${colorClasses[color]} ${baseClasses}`}
            role="status"
            aria-label="Loading"
          />
        );
    }
  };

  const spinner = renderSpinner();

  if (inline) {
    return spinner;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {spinner}
        {message && (
          <p className="mt-4 text-gray-600 text-sm">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;