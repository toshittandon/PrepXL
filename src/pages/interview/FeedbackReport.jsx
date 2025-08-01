import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks.js';
import { 
  fetchInterviewReport, 
  generateDetailedFeedback,
  selectCurrentReport,
  selectFetchingReport,
  selectGeneratingFeedback,
  selectReportError,
  selectFormattedCurrentReport,
  selectSortedInteractions,
  clearCurrentReport
} from '../../store/slices/reportSlice.js';
import { useGetInterviewReportQuery } from '../../store/api/reportApi.js';
import ScoreDisplay from '../../components/report/ScoreDisplay.jsx';
import InteractionItem from '../../components/report/InteractionItem.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { 
  ArrowLeftIcon, 
  DocumentArrowDownIcon, 
  SparklesIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const FeedbackReport = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Redux state
  const currentReport = useAppSelector(selectCurrentReport);
  const fetchingReport = useAppSelector(selectFetchingReport);
  const generatingFeedback = useAppSelector(selectGeneratingFeedback);
  const reportError = useAppSelector(selectReportError);
  const formattedReport = useAppSelector(selectFormattedCurrentReport);
  const sortedInteractions = useAppSelector(selectSortedInteractions);

  // RTK Query for real-time data
  const { 
    data: reportData, 
    isLoading: isLoadingReport, 
    error: queryError,
    refetch 
  } = useGetInterviewReportQuery(sessionId, {
    skip: !sessionId
  });

  const [showAllInteractions, setShowAllInteractions] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  // Load report data on mount
  useEffect(() => {
    if (sessionId && !currentReport) {
      dispatch(fetchInterviewReport(sessionId));
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentReport());
    };
  }, [sessionId, dispatch, currentReport]);

  // Update Redux state when RTK Query data changes
  useEffect(() => {
    if (reportData && !currentReport) {
      dispatch({
        type: 'report/setCurrentReport',
        payload: {
          session: reportData.session,
          interactions: reportData.interactions,
          score: reportData.session.finalScore,
          feedback: reportData.session.feedback
        }
      });
    }
  }, [reportData, currentReport, dispatch]);

  const handleGenerateFeedback = async () => {
    if (currentReport && currentReport.interactions) {
      await dispatch(generateDetailedFeedback({
        sessionId,
        interactions: currentReport.interactions
      }));
    }
  };

  const handleExportReport = async (format = 'json') => {
    if (!currentReport) return;

    try {
      const exportData = {
        reportInfo: {
          sessionId: currentReport.session.id,
          exportedAt: new Date().toISOString(),
          format,
          version: '1.0'
        },
        session: {
          id: currentReport.session.id,
          sessionType: currentReport.session.sessionType,
          role: currentReport.session.role,
          status: currentReport.session.status,
          finalScore: currentReport.session.finalScore,
          startedAt: currentReport.session.startedAt,
          completedAt: currentReport.session.completedAt,
          feedback: currentReport.feedback
        },
        interactions: currentReport.interactions.map(interaction => ({
          order: interaction.order,
          question: interaction.questionText,
          answer: interaction.userAnswerText,
          timestamp: interaction.timestamp,
          responseLength: interaction.userAnswerText?.length || 0
        })),
        summary: {
          totalQuestions: currentReport.interactions.length,
          answeredQuestions: currentReport.interactions.filter(i => i.userAnswerText?.trim()).length,
          sessionDuration: currentReport.session.completedAt && currentReport.session.startedAt
            ? Math.round((new Date(currentReport.session.completedAt) - new Date(currentReport.session.startedAt)) / 60000)
            : null,
          averageResponseLength: currentReport.interactions.length > 0
            ? Math.round(currentReport.interactions.reduce((sum, int) => sum + (int.userAnswerText?.length || 0), 0) / currentReport.interactions.length)
            : 0,
          completionRate: currentReport.interactions.length > 0
            ? Math.round((currentReport.interactions.filter(i => i.userAnswerText?.trim()).length / currentReport.interactions.length) * 100)
            : 0
        }
      };

      let blob, filename;
      const timestamp = new Date().toISOString().split('T')[0];
      const sessionType = currentReport.session.sessionType.toLowerCase().replace(/\s+/g, '-');

      if (format === 'json') {
        blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json'
        });
        filename = `interview-report-${sessionType}-${timestamp}.json`;
      } else if (format === 'csv') {
        // Convert to CSV format
        const csvHeaders = ['Order', 'Question', 'Answer', 'Response Length', 'Timestamp'];
        const csvRows = [
          csvHeaders.join(','),
          ...exportData.interactions.map(int => [
            int.order,
            `"${int.question.replace(/"/g, '""')}"`,
            `"${(int.answer || '').replace(/"/g, '""')}"`,
            int.responseLength,
            int.timestamp
          ].join(','))
        ];
        
        blob = new Blob([csvRows.join('\n')], {
          type: 'text/csv'
        });
        filename = `interview-report-${sessionType}-${timestamp}.csv`;
      } else if (format === 'txt') {
        // Convert to readable text format
        const textContent = [
          `Interview Report - ${currentReport.session.sessionType}`,
          `Role: ${currentReport.session.role}`,
          `Date: ${formatDate(currentReport.session.completedAt || currentReport.session.startedAt)}`,
          `Score: ${currentReport.score ? Math.round(currentReport.score) + '%' : 'N/A'}`,
          `Duration: ${exportData.summary.sessionDuration ? exportData.summary.sessionDuration + ' minutes' : 'N/A'}`,
          '',
          '='.repeat(50),
          '',
          ...exportData.interactions.map((int, index) => [
            `Question ${int.order}: ${int.question}`,
            `Answer: ${int.answer || 'No answer provided'}`,
            ''
          ].join('\n'))
        ].join('\n');
        
        blob = new Blob([textContent], {
          type: 'text/plain'
        });
        filename = `interview-report-${sessionType}-${timestamp}.txt`;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show success message (you could add a toast notification here)
      console.log(`Report exported successfully as ${filename}`);
    } catch (error) {
      console.error('Failed to export report:', error);
      // You could add error handling UI here
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Loading state
  if (fetchingReport || isLoadingReport) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center justify-center">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-lg text-gray-600">Loading interview report...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (reportError || queryError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <div className="text-red-600 text-xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Unable to Load Report
              </h2>
              <p className="text-gray-600 mb-6">
                {reportError || queryError?.message || 'An error occurred while loading the interview report.'}
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => refetch()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <Link
                  to="/dashboard"
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No report data
  if (!currentReport) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Report Not Found
              </h2>
              <p className="text-gray-600 mb-6">
                The interview report for session {sessionId} could not be found.
              </p>
              <Link
                to="/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { session, interactions, score, feedback } = currentReport;
  const displayedInteractions = showAllInteractions ? interactions : interactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGenerateFeedback}
                disabled={generatingFeedback}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                {generatingFeedback ? 'Generating...' : 'Generate AI Feedback'}
              </button>
              <div className="relative export-dropdown">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Export Report
                  <ChevronDownIcon className="h-4 w-4 ml-2" />
                </button>
                
                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleExportReport('json');
                          setShowExportDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export as JSON
                      </button>
                      <button
                        onClick={() => {
                          handleExportReport('csv');
                          setShowExportDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export as CSV
                      </button>
                      <button
                        onClick={() => {
                          handleExportReport('txt');
                          setShowExportDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export as Text
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Interview Feedback Report
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {formatDate(session.completedAt || session.startedAt)}
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                Duration: {formatDuration(formattedReport?.duration)}
              </div>
              <div className="flex items-center">
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                {interactions.length} Questions
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {session.sessionType} Interview
              </div>
              <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                {session.role}
              </div>
            </div>
          </div>
        </div>

        {/* Score Display */}
        <div className="mb-8">
          <ScoreDisplay 
            score={score}
            sessionType={session.sessionType}
            totalQuestions={interactions.length}
            completedQuestions={interactions.filter(i => i.userAnswerText?.trim()).length}
          />
        </div>

        {/* AI Feedback Section */}
        {feedback && (
          <div className="mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <SparklesIcon className="h-6 w-6 text-purple-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  AI-Generated Feedback
                </h2>
              </div>
              <div className="prose max-w-none">
                {typeof feedback === 'string' ? (
                  <p className="text-gray-700 leading-relaxed">{feedback}</p>
                ) : (
                  <div className="space-y-4">
                    {feedback.overall && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Overall Assessment</h3>
                        <p className="text-gray-700">{feedback.overall}</p>
                      </div>
                    )}
                    {feedback.strengths && feedback.strengths.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Strengths</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {feedback.strengths.map((strength, index) => (
                            <li key={index} className="text-gray-700">{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.improvements && feedback.improvements.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Areas for Improvement</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {feedback.improvements.map((improvement, index) => (
                            <li key={index} className="text-gray-700">{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Question & Answer Review */}
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Question & Answer Review
              </h2>
              {interactions.length > 5 && (
                <button
                  onClick={() => setShowAllInteractions(!showAllInteractions)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {showAllInteractions ? 'Show Less' : `Show All ${interactions.length} Questions`}
                </button>
              )}
            </div>
            
            {displayedInteractions.length > 0 ? (
              <div className="space-y-4">
                {displayedInteractions.map((interaction, index) => (
                  <InteractionItem 
                    key={interaction.id} 
                    interaction={interaction} 
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No interactions found for this interview session.</p>
              </div>
            )}
          </div>
        </div>

        {/* Session Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Session Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {interactions.length}
              </div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {interactions.filter(i => i.userAnswerText?.trim()).length}
              </div>
              <div className="text-sm text-gray-600">Questions Answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {interactions.length > 0 
                  ? Math.round(interactions.reduce((sum, i) => sum + (i.userAnswerText?.length || 0), 0) / interactions.length)
                  : 0
                }
              </div>
              <div className="text-sm text-gray-600">Avg. Response Length</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackReport;