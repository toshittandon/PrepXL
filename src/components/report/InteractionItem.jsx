import { useState, memo } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const InteractionItem = memo(({ interaction, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getResponseLength = (text) => {
    return text ? text.trim().length : 0;
  };

  const getResponseQuality = (length) => {
    if (length === 0) return { label: 'No Response', color: 'text-red-600 bg-red-50' };
    if (length < 50) return { label: 'Brief', color: 'text-yellow-600 bg-yellow-50' };
    if (length < 200) return { label: 'Adequate', color: 'text-blue-600 bg-blue-50' };
    return { label: 'Detailed', color: 'text-green-600 bg-green-50' };
  };

  const responseLength = getResponseLength(interaction.userAnswerText);
  const responseQuality = getResponseQuality(responseLength);

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {index + 1}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                Question {index + 1}
              </h3>
              <p className="text-xs text-gray-500">
                {formatTimestamp(interaction.timestamp)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${responseQuality.color}`}>
              {responseQuality.label}
            </span>
            <span className="text-xs text-gray-400">
              {responseLength} chars
            </span>
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="space-y-4 pt-4">
            {/* Question */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Question:
              </h4>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-gray-800 leading-relaxed">
                  {interaction.questionText}
                </p>
              </div>
            </div>

            {/* Answer */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Your Answer:
              </h4>
              <div className="bg-gray-50 rounded-lg p-3">
                {interaction.userAnswerText ? (
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {interaction.userAnswerText}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No response provided
                  </p>
                )}
              </div>
            </div>

            {/* Response Metrics */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Response Length
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {responseLength}
                </div>
                <div className="text-xs text-gray-500">
                  characters
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Word Count
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {interaction.userAnswerText ? interaction.userAnswerText.trim().split(/\s+/).length : 0}
                </div>
                <div className="text-xs text-gray-500">
                  words
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

InteractionItem.displayName = 'InteractionItem';

export default InteractionItem;