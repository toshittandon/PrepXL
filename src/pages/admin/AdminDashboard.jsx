import { motion } from 'framer-motion'
import { 
  Users, 
  MessageSquare, 
  FileText, 
  BookOpen,
  Activity,
  Shield,
  Settings
} from 'lucide-react'

const AdminDashboard = () => {
  const stats = [
    {
      title: 'Total Users',
      value: '0',
      icon: Users,
      change: '+0%',
      changeType: 'neutral'
    },
    {
      title: 'Interview Sessions',
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
      title: 'Q&A Questions',
      value: '0',
      icon: BookOpen,
      change: '+0%',
      changeType: 'neutral'
    }
  ]

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: Users,
      href: '/admin/users',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Manage Questions',
      description: 'Add, edit, or remove Q&A content',
      icon: BookOpen,
      href: '/admin/questions',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'System Settings',
      description: 'Configure application settings',
      icon: Settings,
      href: '/admin/settings',
      color: 'from-purple-500 to-purple-600'
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
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor application performance and manage system resources.
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
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-red-600 dark:text-red-400" />
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
          Admin Actions
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

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            System Status
          </h2>
          <Activity className="w-5 h-5 text-green-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              Database
            </h3>
            <p className="text-sm text-green-600 dark:text-green-400">
              Operational
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              AI Services
            </h3>
            <p className="text-sm text-green-600 dark:text-green-400">
              Operational
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              Storage
            </h3>
            <p className="text-sm text-green-600 dark:text-green-400">
              Operational
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AdminDashboard