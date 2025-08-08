import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, 
  MessageSquare, 
  BookOpen, 
  Upload,
  Play,
  Search
} from 'lucide-react'

const QuickActions = () => {
  const navigate = useNavigate()

  const actions = [
    {
      title: 'Upload Resume',
      description: 'Analyze your resume against job descriptions with AI-powered insights',
      icon: FileText,
      secondaryIcon: Upload,
      href: '/resume-upload',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700'
    },
    {
      title: 'Practice Interview',
      description: 'Start an AI-powered interview session with speech recognition',
      icon: MessageSquare,
      secondaryIcon: Play,
      href: '/interview/setup',
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700'
    },
    {
      title: 'Browse Q&A Library',
      description: 'Study common interview questions and suggested answers',
      icon: BookOpen,
      secondaryIcon: Search,
      href: '/library',
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700'
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

  const handleActionClick = (href) => {
    navigate(href)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Quick Actions
      </h2>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {actions.map((action) => {
          const Icon = action.icon
          const SecondaryIcon = action.secondaryIcon
          
          return (
            <motion.div
              key={action.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleActionClick(action.href)}
              className={`relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer group ${action.hoverColor}`}
            >
              {/* Background gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              
              {/* Main icon */}
              <div className={`relative w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              {/* Secondary icon (floating) */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <SecondaryIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
              
              {/* Content */}
              <div className="relative">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors duration-300">
                  {action.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                  {action.description}
                </p>
              </div>
              
              {/* Hover effect border */}
              <div className={`absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-gradient-to-r group-hover:${action.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

export default QuickActions