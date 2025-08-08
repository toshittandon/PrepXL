import { memo } from 'react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { 
  MessageSquare, 
  FileText, 
  Award, 
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { useGetInterviewSessionsQuery, useGetResumesQuery } from '../../store/api/appwriteApi'
import { selectUser } from '../../store/selectors'

const AnalyticsCards = memo(() => {
  const user = useSelector(selectUser)
  
  // Fetch user data
  const { data: sessions = [], isLoading: sessionsLoading } = useGetInterviewSessionsQuery(
    user?.id, 
    { skip: !user?.id }
  )
  const { data: resumes = [], isLoading: resumesLoading } = useGetResumesQuery(
    user?.id, 
    { skip: !user?.id }
  )

  // Calculate analytics
  const completedSessions = sessions.filter(session => session.status === 'completed')
  const averageScore = completedSessions.length > 0 
    ? Math.round(completedSessions.reduce((sum, session) => sum + (session.finalScore || 0), 0) / completedSessions.length)
    : 0

  // Calculate study time (mock calculation based on sessions)
  const studyTime = completedSessions.reduce((total, session) => {
    if (session.completedAt && session.startedAt) {
      const duration = new Date(session.completedAt) - new Date(session.startedAt)
      return total + Math.round(duration / (1000 * 60)) // Convert to minutes
    }
    return total
  }, 0)

  const stats = [
    {
      title: 'Interviews Completed',
      value: completedSessions.length.toString(),
      icon: MessageSquare,
      change: '+12%',
      changeType: 'positive',
      loading: sessionsLoading
    },
    {
      title: 'Resume Analyses',
      value: resumes.length.toString(),
      icon: FileText,
      change: '+8%',
      changeType: 'positive',
      loading: resumesLoading
    },
    {
      title: 'Average Score',
      value: averageScore > 0 ? `${averageScore}%` : 'N/A',
      icon: Award,
      change: averageScore > 75 ? '+5%' : averageScore > 50 ? '0%' : '-3%',
      changeType: averageScore > 75 ? 'positive' : averageScore > 50 ? 'neutral' : 'negative',
      loading: sessionsLoading
    },
    {
      title: 'Study Time',
      value: studyTime > 60 ? `${Math.round(studyTime / 60)}h ${studyTime % 60}m` : `${studyTime}m`,
      icon: Clock,
      change: '+15%',
      changeType: 'positive',
      loading: sessionsLoading
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  const getTrendIcon = (changeType) => {
    switch (changeType) {
      case 'positive':
        return TrendingUp
      case 'negative':
        return TrendingDown
      default:
        return Minus
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {stats.map((stat) => {
        const Icon = stat.icon
        const TrendIcon = getTrendIcon(stat.changeType)
        
        return (
          <motion.div
            key={stat.title}
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                {stat.loading ? (
                  <div className="mt-1 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            
            {!stat.loading && (
              <div className="mt-4 flex items-center">
                <div className={`flex items-center text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' :
                  stat.changeType === 'negative' ? 'text-red-600 dark:text-red-400' :
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  <TrendIcon className="w-4 h-4 mr-1" />
                  {stat.change}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  from last month
                </span>
              </div>
            )}
          </motion.div>
        )
      })}
    </motion.div>
  )
})

AnalyticsCards.displayName = 'AnalyticsCards'

export default AnalyticsCards