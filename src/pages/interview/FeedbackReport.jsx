import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Calendar,
  Clock,
  User,
  Briefcase,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

// Components
import { ScoreDisplay } from '../../components/charts'
import { InteractionItem, ExportOptions } from '../../components/interview'
import { LoadingSpinner, ErrorMessage, Button, Card } from '../../components/common'

// API hooks
import { useGetInterviewSessionsQuery, useGetInteractionsQuery } from '../../store/api/appwriteApi'
import { useSelector } from 'react-redux'

const FeedbackReport = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  
  const [session, setSession] = useState(null)
  const [sessionError, setSessionError] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)

  // Fetch user's sessions to find the specific session
  const { 
    data: sessions = [], 
    isLoading: sessionsLoading, 
    error: sessionsError 
  } = useGetInterviewSessionsQuery(user?.id, { skip: !user?.id })

  // Fetch interactions for the session
  const { 
    data: interactions = [], 
    isLoading: interactionsLoading, 
    error: interactionsError 
  } = useGetInteractionsQuery(sessionId, { skip: !sessionId })

  // Find the specific session
  useEffect(() => {
    if (sessions.length > 0 && sessionId) {
      const foundSession = sessions.find(s => s.$id === sessionId)
      if (foundSession) {
        setSession(foundSession)
        setSessionError(null)
      } else {
        setSessionError('Session not found')
      }
    }
  }, [sessions, sessionId])

  // Calculate performance breakdown based on interactions
  const calculatePerformanceBreakdown = (interactions) => {
    if (!interactions || interactions.length === 0) {
      return {}
    }

    // Simple scoring based on answer quality metrics
    const breakdown = {
      communication: 0,
      completeness: 0,
      relevance: 0,
      confidence: 0
    }

    interactions.forEach(interaction => {
      if (interaction.userAnswerText) {
        const wordCount = interaction.userAnswerText.split(' ').length
        const hasKeywords = interaction.userAnswerText.toLowerCase().includes('experience') || 
                           interaction.userAnswerText.toLowerCase().includes('project') ||
                           interaction.userAnswerText.toLowerCase().includes('team')

        // Communication score based on answer length and structure
        breakdown.communication += wordCount >= 30 ? 25 : wordCount >= 15 ? 15 : 5

        // Completeness score based on answer length
        breakdown.completeness += wordCount >= 50 ? 25 : wordCount >= 25 ? 15 : 5

        // Relevance score based on keywords
        breakdown.relevance += hasKeywords ? 20 : 10

        // Confidence score based on answer presence and length
        breakdown.confidence += wordCount >= 20 ? 20 : wordCount >= 10 ? 15 : 5
      }
    })

    // Normalize scores to percentage
    const maxPossibleScore = interactions.length * 25
    Object.keys(breakdown).forEach(key => {
      breakdown[key] = Math.min(100, Math.round((breakdown[key] / maxPossibleScore) * 100))
    })

    return breakdown
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (startedAt, completedAt) => {
    if (!completedAt) return 'In progress'
    
    const duration = new Date(completedAt) - new Date(startedAt)
    const minutes = Math.round(duration / (1000 * 60))
    
    if (minutes < 60) {
      return `${minutes} minutes`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `${hours}h ${remainingMinutes}m`
    }
  }

  // Loading state
  if (sessionsLoading || interactionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Error state
  if (sessionsError || interactionsError || sessionError) {
    const errorMessage = sessionError || 
                        (sessionsError?.message || sessionsError?.data?.message) ||
                        (interactionsError?.message || interactionsError?.data?.message) ||
                        'There was an error loading the interview report.'
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <Card className="max-w-md mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load Report
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {errorMessage}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="secondary"
              size="sm"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="primary"
              size="sm"
            >
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Session not found
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Session Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The interview session you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/dashboard')} variant="primary">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  const performanceBreakdown = calculatePerformanceBreakdown(interactions)
  const sortedInteractions = [...interactions].sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 print-container">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:max-w-none print:px-0 print:py-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-start"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
              
              <div className="w-full sm:w-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Interview Report
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                  Detailed feedback and performance analysis
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 no-print w-full lg:w-auto">
              <Button 
                variant="secondary" 
                size="sm" 
                className="flex items-center space-x-2 flex-1 sm:flex-none justify-center"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Interview Report',
                      text: `Interview report for ${session.sessionType} interview`,
                      url: window.location.href
                    }).catch(console.error)
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                  }
                }}
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button 
                onClick={() => setShowExportModal(true)}
                variant="secondary" 
                size="sm" 
                className="flex items-center space-x-2 flex-1 sm:flex-none justify-center"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Print-only header */}
        <div className="hidden print:block print-content mb-4">
          <h1 className="text-center text-2xl font-bold mb-2">Interview Performance Report</h1>
          <div className="text-center text-sm mb-4">
            Generated on {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Session Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-4 sm:p-6 print-content page-break-avoid">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 session-overview-print">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Interview Type</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                    {session.sessionType}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {session.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    {formatDate(session.startedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    {formatDuration(session.startedAt, session.completedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex-shrink-0">
                  <User className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Questions</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    {interactions.length} answered
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Score Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <ScoreDisplay
            overallScore={session.finalScore || 0}
            breakdown={performanceBreakdown}
            showBreakdown={true}
          />
        </motion.div>

        {/* Interview Interactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="page-break-before"
        >
          <div className="mb-6 print-content">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Interview Transcript
            </h2>
            <p className="text-gray-600 dark:text-gray-400 no-print">
              Complete record of questions and answers from your interview session
            </p>
            <div className="hidden print:block text-sm mb-4">
              Total Questions: {sortedInteractions.length} | 
              Answered: {sortedInteractions.filter(i => i.userAnswerText).length}
            </div>
          </div>

          {sortedInteractions.length === 0 ? (
            <Card className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Interactions Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This interview session doesn't have any recorded interactions.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {sortedInteractions.map((interaction, index) => (
                <InteractionItem
                  key={interaction.$id || index}
                  interaction={interaction}
                  index={index}
                  showTimestamp={true}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Session Status */}
        {session.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Interview Completed
                  </h3>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Completed on {formatDate(session.completedAt)} at {formatTime(session.completedAt)}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Export Options Modal */}
        <ExportOptions
          session={session}
          interactions={sortedInteractions}
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
      </div>
    </div>
  )
}

export default FeedbackReport