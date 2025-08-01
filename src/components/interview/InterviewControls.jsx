import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  ArrowRightIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

const InterviewControls = ({
  onNext,
  onPause,
  onEnd,
  isAnswering = false,
  hasAnswer = false,
  savingInteraction = false,
  questionLoading = false,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Interview Controls
      </h3>

      <div className="space-y-4">
        {/* Next Question Button */}
        <button
          onClick={onNext}
          disabled={disabled || !hasAnswer || savingInteraction || questionLoading}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            hasAnswer && !savingInteraction && !questionLoading
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {savingInteraction ? (
            <>
              <LoadingSpinner size="sm" inline />
              <span>Saving Answer...</span>
            </>
          ) : questionLoading ? (
            <>
              <LoadingSpinner size="sm" inline />
              <span>Loading Next Question...</span>
            </>
          ) : (
            <>
              <ArrowRightIcon className="w-5 h-5" />
              <span>Next Question</span>
            </>
          )}
        </button>

        {/* Pause Button */}
        <button
          onClick={onPause}
          disabled={disabled || savingInteraction}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PauseIcon className="w-5 h-5" />
          <span>Pause Recording</span>
        </button>

        {/* End Interview Button */}
        <button
          onClick={onEnd}
          disabled={disabled || savingInteraction}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <StopIcon className="w-5 h-5" />
          <span>End Interview</span>
        </button>
      </div>

      {/* Status Indicators */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Recording Status</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isAnswering ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
              }`} />
              <span className={`font-medium ${
                isAnswering ? 'text-red-600' : 'text-gray-500'
              }`}>
                {isAnswering ? 'Recording' : 'Stopped'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Answer Status</span>
            <div className="flex items-center space-x-2">
              {hasAnswer ? (
                <>
                  <CheckIcon className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 font-medium">Ready</span>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                  <span className="text-gray-500 font-medium">Pending</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          How to use:
        </h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Click the microphone to start recording your answer</li>
          <li>• Speak clearly and take your time</li>
          <li>• Click "Next Question" when you're done</li>
          <li>• Use "Pause" to stop recording temporarily</li>
          <li>• Click "End Interview" when you want to finish</li>
        </ul>
      </div>
    </div>
  );
};

export default InterviewControls;