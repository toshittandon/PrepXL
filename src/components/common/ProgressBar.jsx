const ProgressBar = ({
  progress = 0,
  size = 'medium',
  variant = 'default',
  showPercentage = true,
  label,
  className = '',
  animated = true
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  const sizes = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4'
  };

  const variants = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  };

  const backgroundVariants = {
    default: 'bg-blue-100',
    success: 'bg-green-100',
    warning: 'bg-yellow-100',
    danger: 'bg-red-100'
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Label and Percentage */}
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-500">{Math.round(normalizedProgress)}%</span>
          )}
        </div>
      )}

      {/* Progress Bar Container */}
      <div className={`
        w-full ${sizes[size]} ${backgroundVariants[variant]} rounded-full overflow-hidden
      `}>
        {/* Progress Bar Fill */}
        <div
          className={`
            ${sizes[size]} ${variants[variant]} rounded-full transition-all duration-300 ease-out
            ${animated ? 'animate-pulse' : ''}
          `}
          style={{ width: `${normalizedProgress}%` }}
          role="progressbar"
          aria-valuenow={normalizedProgress}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label={label || `Progress: ${Math.round(normalizedProgress)}%`}
        />
      </div>
    </div>
  );
};

// Indeterminate Progress Bar variant
export const IndeterminateProgressBar = ({
  size = 'medium',
  variant = 'default',
  label,
  className = ''
}) => {
  const sizes = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4'
  };

  const variants = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  };

  const backgroundVariants = {
    default: 'bg-blue-100',
    success: 'bg-green-100',
    warning: 'bg-yellow-100',
    danger: 'bg-red-100'
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
      )}

      <div className={`
        w-full ${sizes[size]} ${backgroundVariants[variant]} rounded-full overflow-hidden
      `}>
        <div
          className={`
            ${sizes[size]} ${variants[variant]} rounded-full animate-pulse
          `}
          style={{
            width: '30%',
            animation: 'indeterminate 2s infinite linear'
          }}
          role="progressbar"
          aria-label={label || 'Loading...'}
        />
      </div>

      <style jsx>{`
        @keyframes indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
};

export default ProgressBar;