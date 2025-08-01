import { ClockIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

const QuestionDisplay = ({ 
  question, 
  questionNumber = 1, 
  loading = false, 
  sessionType = 'Behavioral',
  className = '' 
}) => {
  // Get session type icon and color
  const getSessionTypeStyle = (type) => {
    switch (type) {
      case 'Technical':
        return {
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          icon: '💻'
        };
      case 'Case Study':
        return {
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-200',
          icon: '📊'
        };
      default: // Behavioral
        return {
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          icon: '🗣️'
        };
    }
  };

  const style = getSessionTypeStyle(sessionType);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <LoadingSpinner size="medium" inline />
            <p className="mt-4 text-gray-600">Loading next question...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <QuestionMarkCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No question available</p>
            <p className="text-sm text-gray-500 mt-2">
              Please wait while we prepare your interview questions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${style.borderColor} ${style.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{style.icon}</span>
            <div>
              <h2 className={`text-lg font-semibold ${style.textColor}`}>
                Question {questionNumber}
              </h2>
              <p className={`text-sm ${style.textColor} opacity-75`}>
                {sessionType} Interview
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <ClockIcon className="w-4 h-4" />
            <span>Take your time</span>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="p-6">
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-900 text-lg leading-relaxed mb-0">
            {question}
          </p>
        </div>

        {/* Question Tips */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            💡 Tips for answering:
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {sessionType === 'Behavioral' && (
              <>
                <li>• Use the STAR method (Situation, Task, Action, Result)</li>
                <li>• Provide specific examples from your experience</li>
                <li>• Focus on your role and contributions</li>
              </>
            )}
            {sessionType === 'Technical' && (
              <>
                <li>• Explain your thought process clearly</li>
                <li>• Consider edge cases and trade-offs</li>
                <li>• Use concrete examples when possible</li>
              </>
            )}
            {sessionType === 'Case Study' && (
              <>
                <li>• Break down the problem systematically</li>
                <li>• Ask clarifying questions if needed</li>
                <li>• Explain your reasoning and assumptions</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuestionDisplay;