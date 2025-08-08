import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle,
  Clock,
  MessageSquare
} from 'lucide-react'

import Button from '../../components/common/Button.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import QuestionDisplay from '../../components/interview/QuestionDisplay.jsx'
import InterviewControls from '../../components/interview/InterviewControls.jsx'
import AnswerCapture from '../../components/interview/AnswerCapture.jsx'

import { 
  useGetInterviewSessionsQuery,
  useUpdateInterviewSessionMutation,
  useCreateInteractionMutation
} from '../../store/api/appwriteApi.js'
import { useGetInterviewQuestionMutation } from '../../store/api/aiApi.js'

import {
  setCurrentSession,
  setCurrentQuestion,
  addInteraction,
  startInterview,
  pauseInterview,
  resumeInterview,
  completeInterview,
  setError,
  clearError,
  setUseVoiceInput,
  setAutoAdvanceQuestions
} from '../../store/slices/interviewSlice.js'

const LiveInterview = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  const { user } = useSelector((state) => state.auth)
  const {
    currentSession,
    currentQuestion,
    interactions,
    interviewStarted,
    interviewPaused,
    interviewCompleted,
    useVoiceInput,
    autoAdvanceQuestions,
    error
  } = useSelector((state) => state.interview)

  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [questionStartTime, setQuestionStartTime] = useState(null)
  const [totalQuestions] = useState(10) // Default number of questions
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false)

  // API hooks
  const { data: sessions, isLoading: loadingSessions } = useGetInterviewSessionsQuery(user?.$id)
  const [updateSession] = useUpdateInterviewSessionMutation()
  const [createInteraction] = useCreateInteractionMutation()
  const [getInterviewQuestion] = useGetInterviewQuestionMutation()

  // Load session data on mount
  useEffect(() => {
    if (sessions && sessionId) {
      const session = sessions.find(s => s.$id === sessionId)
      if (session) {
        dispatch(setCurrentSession(session))
        
        // If session is already completed, redirect to report
        if (session.status === 'completed') {
          navigate(`/interview/report/${sessionId}`)
          return
        }
      } else {
        dispatch(setError('Interview session not found'))
      }
    }
  }, [sessions, sessionId, dispatch, navigate])

  // Load first question when interview starts
  useEffect(() => {
    if (interviewStarted && !currentQuestion && currentSession) {
      loadNextQuestion()
    }
  }, [interviewStarted, currentQuestion, currentSession])

  const loadNextQuestion = async () => {
    if (!currentSession) return

    try {
      setIsLoadingQuestion(true)
      dispatch(clearError())

      // Prepare conversation history for context
      const history = interactions.map(interaction => ({
        q: interaction.questionText,
        a: interaction.userAnswerText
      }))

      const questionData = await getInterviewQuestion({
        role: currentSession.role,
        sessionType: currentSession.sessionType,
        experienceLevel: currentSession.experienceLevel,
        targetIndustry: currentSession.targetIndustry,
        history
      }).unwrap()

      dispatch(setCurrentQuestion(questionData.questionText))
      setQuestionStartTime(Date.now())

    } catch (error) {
      console.error('Failed to load question:', error)
      dispatch(setError('Failed to load next question. Please try again.'))
    } finally {
      setIsLoadingQuestion(false)
    }
  }

  const handleStartInterview = () => {
    dispatch(startInterview())
    setSessionStartTime(Date.now())
  }

  const handlePauseInterview = async () => {
    dispatch(pauseInterview())
    
    // Update session status in database
    try {
      await updateSession({
        sessionId: currentSession.$id,
        status: 'paused',
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to update session status:', error)
    }
  }

  const handleResumeInterview = async () => {
    dispatch(resumeInterview())
    
    // Update session status in database
    try {
      await updateSession({
        sessionId: currentSession.$id,
        status: 'active',
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to update session status:', error)
    }
  }

  const handleEndInterview = async () => {
    try {
      // Calculate final score (simple scoring based on questions answered)
      const finalScore = Math.round((interactions.length / totalQuestions) * 100)
      
      // Update session as completed
      await updateSession({
        sessionId: currentSession.$id,
        status: 'completed',
        finalScore,
        completedAt: new Date().toISOString()
      })

      dispatch(completeInterview())
      
      // Navigate to feedback report
      navigate(`/interview/report/${sessionId}`)
      
    } catch (error) {
      console.error('Failed to end interview:', error)
      dispatch(setError('Failed to end interview. Please try again.'))
    }
  }

  const handleSkipQuestion = () => {
    if (currentQuestion) {
      // Save empty interaction for skipped question
      const interaction = {
        sessionId: currentSession.$id,
        questionText: currentQuestion,
        userAnswerText: '[Question Skipped]',
        timestamp: new Date().toISOString(),
        order: interactions.length + 1
      }

      handleAnswerSubmit({
        text: '[Question Skipped]',
        timeSpent: questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : 0,
        inputMethod: 'skip',
        timestamp: new Date().toISOString()
      })
    }
  }

  const handleAnswerSubmit = async (answerData) => {
    if (!currentQuestion || !currentSession) return

    try {
      // Create interaction record
      const interactionData = {
        sessionId: currentSession.$id,
        questionText: currentQuestion,
        userAnswerText: answerData.text,
        timestamp: answerData.timestamp,
        order: interactions.length + 1
      }

      const savedInteraction = await createInteraction(interactionData).unwrap()
      dispatch(addInteraction(savedInteraction))

      // Check if we should load next question
      if (interactions.length + 1 < totalQuestions) {
        if (autoAdvanceQuestions || answerData.inputMethod === 'skip') {
          await loadNextQuestion()
        }
      } else {
        // Interview is complete
        await handleEndInterview()
      }

    } catch (error) {
      console.error('Failed to save answer:', error)
      dispatch(setError('Failed to save your answer. Please try again.'))
    }
  }

  const handleAnswerSave = async (answerData) => {
    // Save draft - could be implemented for auto-save functionality
    console.log('Saving draft:', answerData)
  }

  const handleSettingsChange = (settings) => {
    dispatch(setUseVoiceInput(settings.useVoiceInput))
    dispatch(setAutoAdvanceQuestions(settings.autoAdvanceQuestions))
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  if (loadingSessions) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!currentSession) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Session Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The interview session you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={handleBackToDashboard} variant="primary">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleBackToDashboard}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentSession.sessionType} Interview
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {currentSession.role} • {currentSession.experienceLevel} Level
              </p>
            </div>
          </div>

          {/* Session Info */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <MessageSquare className="w-4 h-4" />
              <span>{interactions.length} of {totalQuestions} questions</span>
            </div>
            {sessionStartTime && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{Math.floor((Date.now() - sessionStartTime) / 60000)} min</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <ErrorMessage 
            message={error} 
            onClose={() => dispatch(clearError())} 
          />
        )}

        {/* Interview Controls */}
        <InterviewControls
          isStarted={interviewStarted}
          isPaused={interviewPaused}
          isCompleted={interviewCompleted}
          canStart={!interviewStarted && !interviewCompleted}
          canPause={interviewStarted && !interviewPaused}
          canEnd={interviewStarted}
          canSkip={interviewStarted && currentQuestion && !interviewCompleted}
          onStart={handleStartInterview}
          onPause={handlePauseInterview}
          onResume={handleResumeInterview}
          onEnd={handleEndInterview}
          onSkip={handleSkipQuestion}
          onSettingsChange={handleSettingsChange}
          settings={{ useVoiceInput, autoAdvanceQuestions }}
          loading={isLoadingQuestion}
        />

        {/* Main Interview Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question Display */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {isLoadingQuestion ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8"
                >
                  <div className="text-center">
                    <LoadingSpinner size="lg" className="mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Loading your next question...
                    </p>
                  </div>
                </motion.div>
              ) : currentQuestion ? (
                <QuestionDisplay
                  key={currentQuestion}
                  question={currentQuestion}
                  questionNumber={interactions.length + 1}
                  totalQuestions={totalQuestions}
                  category={currentSession.sessionType}
                  difficulty="medium"
                />
              ) : !interviewStarted ? (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Ready to Start Your Interview?
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Click "Start Interview" when you're ready to begin. You'll have {totalQuestions} questions 
                      tailored to your {currentSession.role} role and {currentSession.experienceLevel} experience level.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        💡 <strong>Tip:</strong> Make sure your microphone is working if you plan to use voice input, 
                        and find a quiet space for the best experience.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : interviewCompleted ? (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8"
                >
                  <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Interview Complete!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Congratulations! You've completed your {currentSession.sessionType.toLowerCase()} interview. 
                      Your responses have been saved and analyzed.
                    </p>
                    <Button
                      onClick={() => navigate(`/interview/report/${sessionId}`)}
                      variant="primary"
                      size="lg"
                    >
                      View Feedback Report
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Answer Capture */}
          <div className="space-y-6">
            <AnswerCapture
              onAnswerSubmit={handleAnswerSubmit}
              onAnswerSave={handleAnswerSave}
              disabled={!interviewStarted || interviewPaused || interviewCompleted || !currentQuestion}
              placeholder={
                !interviewStarted 
                  ? "Start the interview to begin answering questions..."
                  : interviewPaused
                  ? "Interview is paused. Resume to continue..."
                  : interviewCompleted
                  ? "Interview completed. View your feedback report."
                  : "Type your answer here or use voice input..."
              }
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default LiveInterview