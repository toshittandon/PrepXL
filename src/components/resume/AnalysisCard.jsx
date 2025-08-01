import { useState, memo } from 'react';

const AnalysisCard = memo(({ 
  title, 
  items = [], 
  type = 'list', 
  score = null, 
  icon = null,
  description = null,
  variant = 'default'
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderContent = () => {
    if (type === 'score' && score !== null) {
      return (
        <div className="text-center py-4">
          <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
            {score}%
          </div>
          {description && (
            <p className="text-sm text-gray-600 mt-2">{description}</p>
          )}
        </div>
      );
    }

    if (type === 'text' && description) {
      return (
        <div className="py-2">
          <p className="text-gray-700">{description}</p>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="py-4 text-center text-gray-500">
          No items to display
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start space-x-2">
            <div className="flex-shrink-0 mt-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">{item}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`rounded-lg border ${getVariantStyles()} transition-all duration-200`}>
      {/* Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className={`flex-shrink-0 ${getIconColor()}`}>
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              {type === 'list' && items.length > 0 && (
                <p className="text-sm text-gray-500">{items.length} items</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {score !== null && type !== 'score' && (
              <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                {score}%
              </span>
            )}
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isExpanded ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {renderContent()}
        </div>
      )}
    </div>
  );
});

AnalysisCard.displayName = 'AnalysisCard';

export default AnalysisCard;