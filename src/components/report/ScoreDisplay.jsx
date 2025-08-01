import { useState, useEffect, memo } from 'react';
import { 
  TrophyIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

const ScoreDisplay = memo(({ score, sessionType, totalQuestions, completedQuestions }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score on mount
  useEffect(() => {
    if (score) {
      const timer = setTimeout(() => {
        setAnimatedScore(score);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [score]);

  const getScoreColor = (scoreValue) => {
    if (scoreValue >= 90) return 'text-green-600';
    if (scoreValue >= 80) return 'text-blue-600';
    if (scoreValue >= 70) return 'text-yellow-600';
    if (scoreValue >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreGrade = (scoreValue) => {
    if (scoreValue >= 90) return 'A';
    if (scoreValue >= 80) return 'B';
    if (scoreValue >= 70) return 'C';
    if (scoreValue >= 60) return 'D';
    return 'F';
  };

  const getScoreDescription = (scoreValue) => {
    if (scoreValue >= 90) return 'Excellent Performance';
    if (scoreValue >= 80) return 'Good Performance';
    if (scoreValue >= 70) return 'Satisfactory Performance';
    if (scoreValue >= 60) return 'Needs Improvement';
    return 'Poor Performance';
  };

  const getProgressBarColor = (scoreValue) => {
    if (scoreValue >= 90) return 'bg-green-500';
    if (scoreValue >= 80) return 'bg-blue-500';
    if (scoreValue >= 70) return 'bg-yellow-500';
    if (scoreValue >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreIcon = (scoreValue) => {
    if (scoreValue >= 90) return <TrophyIcon className="h-8 w-8 text-green-600" />;
    if (scoreValue >= 80) return <CheckCircleIcon className="h-8 w-8 text-blue-600" />;
    if (scoreValue >= 70) return <ChartBarIcon className="h-8 w-8 text-yellow-600" />;
    return <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />;
  };

  const completionRate = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;

  if (!score && score !== 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Score Calculation Pending
          </h3>
          <p className="text-gray-500">
            Your interview score is being calculated and will be available shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Interview Score
            </h3>
            <p className="text-sm text-gray-600">
              {sessionType} Interview Assessment
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getScoreIcon(score)}
          </div>
        </div>
      </div>

      {/* Score Display */}
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="text-6xl font-bold mb-2">
              <span className={`${getScoreColor(score)} transition-all duration-1000 ease-out`}>
                {Math.round(animatedScore)}
              </span>
              <span className="text-2xl text-gray-400 ml-1">/100</span>
            </div>
            <div className={`text-xl font-medium ${getScoreColor(score)} mb-1`}>
              Grade: {getScoreGrade(score)}
            </div>
            <div className="text-sm text-gray-600">
              {getScoreDescription(score)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Performance</span>
            <span>{Math.round(score)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ease-out ${getProgressBarColor(score)}`}
              style={{ width: `${animatedScore}%` }}
            />
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {completedQuestions}
            </div>
            <div className="text-sm text-gray-600">
              Questions Answered
            </div>
            <div className="text-xs text-gray-500 mt-1">
              out of {totalQuestions}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(completionRate)}%
            </div>
            <div className="text-sm text-gray-600">
              Completion Rate
            </div>
            <div className="text-xs text-gray-500 mt-1">
              interview progress
            </div>
          </div>
        </div>

        {/* Score Breakdown (if available) */}
        {typeof score === 'object' && score && score.breakdown && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              Score Breakdown
            </h4>
            <div className="space-y-3">
              {Object.entries(score.breakdown).map(([category, categoryScore]) => {
                // Format category names: camelCase to Title Case
                const formattedCategory = category
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim();
                
                return (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {formattedCategory}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressBarColor(categoryScore)}`}
                          style={{ width: `${categoryScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">
                        {Math.round(categoryScore)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Performance Indicators */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full mb-2 ${score >= 80 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-600">Strong Performance</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full mb-2 ${completionRate >= 90 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-600">High Completion</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full mb-2 ${score >= 70 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-600">Above Average</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ScoreDisplay.displayName = 'ScoreDisplay';

export default ScoreDisplay;