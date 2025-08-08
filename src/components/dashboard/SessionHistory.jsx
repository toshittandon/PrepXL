import { useState, memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  Clock, 
  Award, 
  Calendar,
  Filter,
  ChevronRight,
  MessageSquare,
  CheckCircle,
  XCircle,
  PlayCircle
} from 'lucide-react'
import { useGetInterviewSessionsQuery } from '../../store/api/appwriteApi'
import { selectUser } from '../../store/selectors'

const SessionHistory = memo(() => {
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const [filter, setFilter] = useState('all') // all, completed, active, abandoned
  
  const { data: sessions = [], isLoading, error } = useGetInterviewSessionsQuery(
    user?.id, 
    { skip: !user?.id }
  )

  // Filter sessions based on selected filter
  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true
    return session.status === filter
  })

  // Sort sessions by date (most recent first)
  const sortedSessions = [...filteredSessions].sort((a, b) => 
    new Date(b.startedAt) - new Date(a.startedAt)
  )

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return CheckCircle
      case 'active':
        return PlayCircle
      case 'abandoned':
        return XCircle
      default:
        return MessageSquare
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20'
      case 'active':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20'
      case 'abandoned':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDuration = (startedAt, completedAt) => {
    if (!completedAt) return 'In progress'
    
    const duration = new Date(completedAt) - new Date(startedAt)
    const minutes = Math.round(duration / (1000 * 60))
    
    if (minutes < 60) {
      return `${minutes}m`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `${hours}h ${remainingMinutes}m`
    }
  }

  const handleSessionClick = useCallback((session) => {
    if (session.status === 'completed') {
      navigate(`/interview/report/${session.$id}`)
    } else if (session.status === 'active') {
      navigate(`/interview/live/${session.$id}`)
    }
  }, [navigate])

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Interview History
          </h2>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Sessions</option>
              <option value="completed">Completed</option>
              <option value="active">Active</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400">
              Failed to load interview history
            </p>
          </div>
        )}

        {!error && sortedSessions.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No interviews yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start your first interview session to see your history here.
            </p>
            <button
              onClick={() => navigate('/interview/setup')}
              className="btn-primary"
            >
              Start Interview
            </button>
          </div>
        )}

        {!error && sortedSessions.length > 0 && (
          <div className="space-y-4">
            {sortedSessions.map((session, index) => {
              const StatusIcon = getStatusIcon(session.status)
              
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onClick={() => handleSessionClick(session)}
                  className={`p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 ${
                    session.status === 'completed' || session.status === 'active' 
                      ? 'cursor-pointer hover:border-primary-300 dark:hover:border-primary-600' 
                      : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${getStatusColor(session.status)}`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {session.sessionType} Interview
                          </h3>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            • {session.role}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(session.startedAt)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(session.startedAt, session.completedAt)}</span>
                          </div>
                          
                          {session.status === 'completed' && session.finalScore && (
                            <div className="flex items-center space-x-1">
                              <Award className="w-4 h-4" />
                              <span>{session.finalScore}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {(session.status === 'completed' || session.status === 'active') && (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
})

SessionHistory.displayName = 'SessionHistory'

export default SessionHistory