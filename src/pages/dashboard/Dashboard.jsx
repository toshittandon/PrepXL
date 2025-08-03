
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { 
  FileText, 
  MessageSquare, 
  BookOpen, 
  TrendingUp,
  Clock,
  Award,
  Target
} from 'lucide-react'

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth)

  const quickActions = [
    {
      title: 'Upload Resume',
      description: 'Analyze your resume against job descriptions',
      icon: FileText,
      href: '/resume-upload',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Practice Interview',
      description: 'Start an AI-powered interview session',
      icon: MessageSquare,
      href: '/interview/setup',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Browse Q&A Library',
      description: 'Study common interview questions',
      icon: BookOpen,
      href: '/library',
      color: 'from-purple-500 to-purple-600'
    }
  ]

  const stats = [
    {
      title: 'Interviews Completed',
      value: '0',
      icon: MessageSquare,
      change: '+0%',
      changeType: 'neutral'
    },
    {
      title: 'Resume Analyses',
      value: '0',
      icon: FileText,
      change: '+0%',
      changeType: 'neutral'
    },
    {
      title: 'Average Score',
      value: 'N/A',
      icon: Award,
      change: '+0%',
      changeType: 'neutral'
    },
    {
      title: 'Study Time',
      value: '0h',
      icon: Clock,
      change: '+0%',
      changeType: 'neutral'
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.name || 'User'}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Ready to ace your next interview? Let's get started with your preparation.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' :
                  stat.changeType === 'negative' ? 'text-red-600 dark:text-red-400' :
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  from last month
                </span>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <motion.a
                key={action.title}
                href={action.href}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 group"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {action.description}
                </p>
              </motion.a>
            )
          })}
        </div>
      </motion.div>

      {/* Recent Activity Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No activity yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start your interview preparation journey by uploading a resume or practicing an interview.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/resume-upload"
              className="btn-primary"
            >
              Upload Resume
            </a>
            <a
              href="/interview/setup"
              className="btn-secondary"
            >
              Start Interview
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard