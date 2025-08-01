import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchInterviewQuestion, 
  saveInteraction, 
  updateInterviewSession,
  selectCurrentSession,
  selectCurrentQuestion,
  selectInteractions,
  selectQuestionLoading,
  selectSavingInteraction,
  selectInterviewError
} from '../../store/slices/interviewSlice.js';
import { selectAuth } from '../../store/slices/authSlice.js';
import { databaseService } from '../../services/appwrite/database.js';
import QuestionDisplay from '../../components/interview/QuestionDisplay.jsx';
import InterviewControls from '../../components/interview/InterviewControls.jsx';
import SpeechRecognitionButton from '../../components/interview/SpeechRecognitionButton.jsx';
import SpeechRecognitionIndicator from '../../components/interview/SpeechRecognitionIndicator.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const LiveInterview = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector(selectAuth);
  const currentSession = useSelector(selectCurrentSession);
  const currentQuestion = useSelector(selectCurrentQuestion);
  const interactions = useSelector(selectInteractions);
  const questionLoading = useSelector(selectQuestionLoading);
  const savingInteraction = useSelector(selectSavingInteraction);
  const error = useSelector(selectInterviewError);

  const [sessionData, setSessionData] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [interimAnswer, setInterimAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);
  const [autoProgressEnabled, setAutoProgressEnabled] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [maxQuestions] = useState(10); // Maximum questions per session

  // Load session data on mount
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId || !user) {
        navigate('/dashboard');
        return;
      }

      try {
        setSessionLoading(true);
        const result = await databaseService.getInterviewSession(sessionId);
        
        if (result.success) {
          const session = result.data;
          
          // Parse session content if it's stored as JSON
          let sessionContent;
          try {
            sessionContent = session.content ? JSON.parse(session.content) : {};
          } catch (err) {
            console.warn('Failed to parse session content:', err);
            sessionContent = {};
          }

          // Create a combined session object with parsed content
          const parsedSession = {
            ...session,
            ...sessionContent,
            // Ensure we have the basic fields
            role: sessionContent.role || 'Unknown Role',
            sessionType: sessionContent.sessionType || 'Behavioral',
            experienceLevel: sessionContent.experienceLevel || 'mid',
            industry: sessionContent.industry || '',
            status: sessionContent.status || 'active',
            startedAt: sessionContent.startedAt || session.$createdAt
          };
          
          // Verify session belongs to current user
          if (session.userId !== user.id) {
            setSessionError('Unauthorized access to interview session');
            return;
          }

          // Check if session is still active
          if (parsedSession.status !== 'active') {
            setSessionError('Interview session is no longer active');
            return;
          }

          setSessionData(parsedSession);
          
          // Load existing interactions
          const interactionsResult = await databaseService.getSessionInteractions(sessionId);
          if (interactionsResult.success) {
            // Set interactions in Redux store
            interactionsResult.data.forEach(interaction => {
              dispatch({ type: 'interview/addInteraction', payload: interaction });
            });
          }

          // If no current question, fetch the first one
          if (!currentQuestion) {
            dispatch(fetchInterviewQuestion({
              role: parsedSession.role,
              sessionType: parsedSession.sessionType,
              experienceLevel: parsedSession.experienceLevel,
              industry: parsedSession.industry
            }));
          }
        } else {
          setSessionError(result.error || 'Failed to load interview session');
        }
      } catch (err) {
        setSessionError(err.message || 'An unexpected error occurred');
      } finally {
        setSessionLoading(false);
      }
    };

    loadSession();
  }, [sessionId, user, navigate, dispatch, currentQuestion]);

  // Handle speech recognition transcript
  const handleTranscript = useCallback((text, isInterim) => {
    if (isInterim) {
      setInterimAnswer(text);
    } else {
      setCurrentAnswer(prev => prev + text + ' ');
      setInterimAnswer('');
    }
  }, []);

  // Handle starting to answer
  const handleStartAnswering = useCallback(() => {
    setIsAnswering(true);
    setCurrentAnswer('');
    setInterimAnswer('');
  }, []);

  // Handle ending interview
  const handleEndInterview = useCallback(async () => {
    if (!sessionId) return;

    try {
      // Save current answer if there is one
      if (currentAnswer.trim() && currentQuestion) {
        const finalInteractionData = {
          sessionId: sessionId,
          questionText: currentQuestion,
          userAnswerText: currentAnswer.trim(),
          timestamp: new Date().toISOString(),
          order: interactions.length + 1
        };
        
        await dispatch(saveInteraction(finalInteractionData)).unwrap();
      }

      // Calculate final score based on interactions
      const allInteractions = [...interactions];
      if (currentAnswer.trim() && currentQuestion) {
        allInteractions.push({
          questionText: currentQuestion,
          userAnswerText: currentAnswer.trim()
        });
      }

      // Update session status to completed
      await dispatch(updateInterviewSession({
        sessionId: sessionId,
        updates: {
          status: 'completed',
          completedAt: new Date().toISOString(),
          totalQuestions: allInteractions.length
        }
      })).unwrap();

      // Navigate to feedback report
      navigate(`/interview/report/${sessionId}`);
    } catch (err) {
      console.error('Failed to end interview:', err);
      setSessionError('Failed to end interview. Please try again.');
    }
  }, [sessionId, dispatch, navigate, currentAnswer, currentQuestion, interactions]);

  // Handle stopping answer and saving interaction
  const handleStopAnswering = useCallback(async () => {
    if (!currentQuestion || !currentAnswer.trim()) {
      setIsAnswering(false);
      return;
    }

    const interactionData = {
      sessionId: sessionId,
      questionText: currentQuestion,
      userAnswerText: currentAnswer.trim(),
      timestamp: new Date().toISOString(),
      order: interactions.length + 1
    };

    try {
      // Save interaction to database
      await dispatch(saveInteraction(interactionData)).unwrap();
      
      // Clear current answer
      setCurrentAnswer('');
      setInterimAnswer('');
      setIsAnswering(false);

      // Update question count
      const newQuestionCount = interactions.length + 1;
      setQuestionCount(newQuestionCount);

      // Check if we've reached the maximum number of questions
      if (newQuestionCount >= maxQuestions) {
        // Automatically end the interview
        setTimeout(() => {
          handleEndInterview();
        }, 1000);
        return;
      }

      // Fetch next question
      dispatch(fetchInterviewQuestion({
        role: sessionData.role,
        sessionType: sessionData.sessionType,
        experienceLevel: sessionData.experienceLevel,
        industry: sessionData.industry
      }));
    } catch (err) {
      console.error('Failed to save interaction:', err);
      setSessionError('Failed to save your answer. Please try again.');
    }
  }, [currentQuestion, currentAnswer, sessionId, interactions.length, dispatch, sessionData, maxQuestions, handleEndInterview]);

  // Handle pausing interview
  const handlePauseInterview = useCallback(() => {
    setIsAnswering(false);
    setCurrentAnswer('');
    setInterimAnswer('');
  }, []);

  // Handle interview interruption (browser close, network issues, etc.)
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isAnswering || currentAnswer.trim()) {
        event.preventDefault();
        event.returnValue = 'You have an unsaved answer. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isAnswering) {
        // Pause recording when tab becomes hidden
        handlePauseInterview();
      }
    };

    // Add event listeners for interruption handling
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAnswering, currentAnswer, handlePauseInterview]);

  // Auto-save current answer periodically
  useEffect(() => {
    if (!currentAnswer.trim() || !currentQuestion) return;

    const autoSaveInterval = setInterval(() => {
      // Save draft answer to localStorage as backup
      const draftData = {
        sessionId,
        questionText: currentQuestion,
        userAnswerText: currentAnswer.trim(),
        timestamp: new Date().toISOString(),
        isDraft: true
      };
      
      localStorage.setItem(`interview_draft_${sessionId}`, JSON.stringify(draftData));
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentAnswer, currentQuestion, sessionId]);

  // Restore draft answer on component mount
  useEffect(() => {
    const restoreDraft = () => {
      const draftKey = `interview_draft_${sessionId}`;
      const draftData = localStorage.getItem(draftKey);
      
      if (draftData) {
        try {
          const draft = JSON.parse(draftData);
          if (draft.questionText === currentQuestion && draft.userAnswerText) {
            setCurrentAnswer(draft.userAnswerText);
            // Clear the draft after restoring
            localStorage.removeItem(draftKey);
          }
        } catch (err) {
          console.warn('Failed to restore draft answer:', err);
        }
      }
    };

    if (currentQuestion && !currentAnswer) {
      restoreDraft();
    }
  }, [currentQuestion, sessionId, currentAnswer]);

  // Handle network connectivity issues
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored');
      // Optionally retry failed operations
    };

    const handleOffline = () => {
      console.log('Connection lost');
      setSessionError('Network connection lost. Please check your internet connection.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Loading state
  if (sessionLoading) {
    return <LoadingSpinner message="Loading interview session..." />;
  }

  // Error state
  if (sessionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Session Error
            </h2>
            <p className="text-gray-600 mb-6">{sessionError}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No session data
  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Session Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The interview session could not be found or has expired.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Live Interview
              </h1>
              <p className="text-sm text-gray-600">
                {sessionData.role} • {sessionData.sessionType}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <SpeechRecognitionIndicator />
              <div className="text-sm text-gray-600">
                Question {interactions.length + 1}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question and Answer Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Display */}
            <QuestionDisplay 
              question={currentQuestion}
              questionNumber={interactions.length + 1}
              loading={questionLoading}
              sessionType={sessionData.sessionType}
            />

            {/* Answer Area */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Your Answer</h3>
                {(currentAnswer || interimAnswer) && (
                  <button
                    onClick={() => {
                      setCurrentAnswer('');
                      setInterimAnswer('');
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <div className="min-h-[200px] p-4 border border-gray-200 rounded-lg bg-gray-50">
                {currentAnswer && (
                  <span className="text-gray-900">{currentAnswer}</span>
                )}
                {interimAnswer && (
                  <span className="text-gray-500 italic">{interimAnswer}</span>
                )}
                {!currentAnswer && !interimAnswer && !isAnswering && (
                  <span className="text-gray-400 italic">
                    Start recording to capture your answer...
                  </span>
                )}
                {!currentAnswer && !interimAnswer && isAnswering && (
                  <span className="text-gray-400 italic">
                    Listening for your answer...
                  </span>
                )}
              </div>

              {/* Speech Recognition Button */}
              <div className="mt-6 flex justify-center">
                <SpeechRecognitionButton
                  onTranscript={handleTranscript}
                  onStart={handleStartAnswering}
                  onStop={handleStopAnswering}
                  disabled={questionLoading || !currentQuestion}
                  showTranscript={false}
                  size="large"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Interview Controls */}
            <InterviewControls
              onNext={handleStopAnswering}
              onPause={handlePauseInterview}
              onEnd={handleEndInterview}
              isAnswering={isAnswering}
              hasAnswer={!!currentAnswer.trim()}
              savingInteraction={savingInteraction}
              questionLoading={questionLoading}
            />

            {/* Session Progress */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Session Progress
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Questions Answered</span>
                  <span className="font-medium">{interactions.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Session Type</span>
                  <span className="font-medium">{sessionData.sessionType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Target Role</span>
                  <span className="font-medium">{sessionData.role}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Started</span>
                  <span className="font-medium">
                    {new Date(sessionData.startedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Interactions */}
            {interactions.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Questions
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {interactions.slice(-3).reverse().map((interaction, index) => (
                    <div key={interaction.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Q{interaction.order}: {interaction.questionText}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {interaction.userAnswerText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveInterview;