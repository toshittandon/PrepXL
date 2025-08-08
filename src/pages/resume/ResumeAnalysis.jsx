import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Download,
  RefreshCw,
  Eye
} from 'lucide-react'

import Button from '../../components/common/Button.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import Card from '../../components/common/Card.jsx'

import MatchScoreDisplay from '../../components/resume/MatchScoreDisplay.jsx'
import AnalysisCard from '../../components/resume/AnalysisCard.jsx'
import KeywordAnalysis from '../../components/resume/KeywordAnalysis.jsx'

import { fetchResumeAnalysis } from '../../store/slices/resumeSlice.js'
import { useGetResumeByIdQuery } from '../../store/api/appwriteApi.js'

const ResumeAnalysis = () => {
  const { resumeId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  const { currentAnalysis, analyzing, error } = useSelector(state => state.resume)
  
  const [showFullJobDescription, setShowFullJobDescription] = useState(false)
  
  // Check if this is a mock resume ID
  const isMockResume = resumeId && resumeId.startsWith('mock-resume-')
  
  // Fetch resume data using RTK Query (skip for mock resumes)
  const {
    data: resumeData,
    isLoading: isLoadingResume,
    error: resumeError,
    refetch: refetchResume
  } = useGetResumeByIdQuery(resumeId, {
    skip: !resumeId || isMockResume
  })

  // Fetch analysis if not already loaded (now handles both real and mock resumes)
  useEffect(() => {
    if (resumeId && !currentAnalysis && !analyzing) {
      dispatch(fetchResumeAnalysis(resumeId))
    }
  }, [resumeId, currentAnalysis, analyzing, dispatch])

  // Handle navigation
  const handleBack = () => {
    navigate('/dashboard')
  }

  const handleAnalyzeAnother = () => {
    navigate('/resume-upload')
  }

  const handleRefresh = () => {
    if (resumeId) {
      dispatch(fetchResumeAnalysis(resumeId))
      if (!isMockResume) {
        refetchResume()
      }
    }
  }

  // Loading state
  if (isLoadingResume || analyzing) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Loading Analysis Results
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Please wait while we retrieve your resume analysis...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || resumeError) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <ErrorMessage 
            message={error || resumeError?.error || 'Failed to load resume analysis'} 
            className="mb-6"
          />
          
          <div className="space-x-4">
            <Button onClick={handleRefresh} variant="primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={handleAnalyzeAnother} variant="secondary">
              Analyze Another Resume
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // No data state
  if (!resumeData && !currentAnalysis) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Analysis Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            We couldn't find the analysis results for this resume.
          </p>
          
          <Button onClick={handleAnalyzeAnother} variant="primary">
            Analyze a Resume
          </Button>
        </div>
      </div>
    )
  }

  const analysis = currentAnalysis || resumeData
  const analysisResults = analysis?.analysisResults
  
  // Debug log for development
  if (process.env.NODE_ENV === 'development') {
    console.log('ResumeAnalysis Debug:', {
      resumeId,
      isMockResume,
      hasCurrentAnalysis: !!currentAnalysis,
      hasResumeData: !!resumeData,
      hasAnalysisResults: !!analysisResults,
      analysis
    })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Analysis Debug Info (Development Only)
          </h4>
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <div>Resume ID: {resumeId}</div>
            <div>Is Mock Resume: {isMockResume ? 'Yes' : 'No'}</div>
            <div>Current Analysis: {currentAnalysis ? 'Available' : 'Not available'}</div>
            <div>Resume Data: {resumeData ? 'Available' : 'Not available'}</div>
            <div>Analysis Results: {analysisResults ? 'Available' : 'Not available'}</div>
            <div>Error: {error || resumeError?.error || 'None'}</div>
          </div>
        </div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Resume Analysis Results
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive ATS analysis for {analysis?.fileName || 'your resume'}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAnalyzeAnother}
              >
                Analyze Another
              </Button>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {analysisResults ? (
          <div className="space-y-8">
            {/* Match Score Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <MatchScoreDisplay 
                score={analysisResults.matchScore}
                fileName={analysis.fileName}
                analysisDate={analysis.uploadedAt}
              />
            </motion.div>

            {/* Analysis Cards Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Missing Keywords */}
              <AnalysisCard
                title="Missing Keywords"
                icon={AlertCircle}
                variant="warning"
                data={analysisResults.missingKeywords}
                type="keywords"
              />

              {/* Action Verbs Analysis */}
              <AnalysisCard
                title="Action Verbs Analysis"
                icon={TrendingUp}
                variant="info"
                data={analysisResults.actionVerbAnalysis}
                type="text"
              />

              {/* Format Suggestions */}
              <AnalysisCard
                title="Format Suggestions"
                icon={CheckCircle}
                variant="success"
                data={analysisResults.formatSuggestions}
                type="suggestions"
              />

              {/* Keyword Analysis Detail */}
              <KeywordAnalysis
                missingKeywords={analysisResults.missingKeywords}
                matchScore={analysisResults.matchScore}
              />
            </motion.div>

            {/* Job Description Section */}
            {analysis.jobDescription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Job Description Used for Analysis
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullJobDescription(!showFullJobDescription)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showFullJobDescription ? 'Hide' : 'Show'} Full Description
                    </Button>
                  </div>
                  
                  <AnimatePresence>
                    {showFullJobDescription ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="prose dark:prose-invert max-w-none"
                      >
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 whitespace-pre-wrap text-sm">
                          {analysis.jobDescription}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-gray-600 dark:text-gray-400 text-sm"
                      >
                        {analysis.jobDescription.substring(0, 200)}
                        {analysis.jobDescription.length > 200 && '...'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={handleAnalyzeAnother}
                className="px-8"
              >
                <FileText className="w-5 h-5 mr-2" />
                Analyze Another Resume
              </Button>
              
              <Button
                variant="secondary"
                size="lg"
                onClick={handleBack}
                className="px-8"
              >
                Back to Dashboard
              </Button>
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Analysis Not Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              The analysis results are not available for this resume. This might be because the analysis is still processing or failed.
            </p>
            <div className="space-x-4">
              <Button onClick={handleRefresh} variant="primary">
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Again
              </Button>
              <Button onClick={handleAnalyzeAnother} variant="secondary">
                Analyze Another Resume
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default ResumeAnalysis