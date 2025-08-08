import { motion } from 'framer-motion'
import { TrendingUp, Calendar, FileText } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import Card from '../common/Card.jsx'

const MatchScoreDisplay = ({ 
  score = 0, 
  fileName = 'Resume', 
  analysisDate = null 
}) => {
  // Determine score color and status
  const getScoreColor = (score) => {
    if (score >= 80) return { color: '#10b981', status: 'Excellent' }
    if (score >= 60) return { color: '#f59e0b', status: 'Good' }
    if (score >= 40) return { color: '#ef4444', status: 'Needs Improvement' }
    return { color: '#6b7280', status: 'Poor' }
  }

  const { color, status } = getScoreColor(score)

  // Data for the pie chart
  const data = [
    { name: 'Match', value: score, color },
    { name: 'Gap', value: 100 - score, color: '#e5e7eb' }
  ]

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown'
    }
  }

  return (
    <Card className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        {/* Score Visualization */}
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Score Text Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                className="text-center"
              >
                <div className="text-4xl font-bold" style={{ color }}>
                  {score}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Match Score
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className={`
              mt-4 px-4 py-2 rounded-full text-sm font-medium
              ${score >= 80 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : score >= 60
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                : score >= 40
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }
            `}
          >
            {status}
          </motion.div>
        </div>

        {/* Score Details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ATS Match Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your resume has been analyzed against the job description using advanced ATS algorithms. 
              Here's how well your resume matches the requirements.
            </p>
          </div>

          {/* File Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Resume File
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                  {fileName}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Analyzed On
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(analysisDate)}
                </div>
              </div>
            </div>
          </div>

          {/* Score Interpretation */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  What does this score mean?
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {score >= 80 && "Excellent! Your resume is well-optimized for this position. Most ATS systems will rank it highly."}
                  {score >= 60 && score < 80 && "Good match! Your resume covers most requirements, but there's room for improvement to increase your chances."}
                  {score >= 40 && score < 60 && "Your resume needs improvement. Consider adding more relevant keywords and skills from the job description."}
                  {score < 40 && "Your resume may not pass initial ATS screening. Significant optimization is needed to match the job requirements."}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">ATS Compatibility</span>
              <span className="font-medium text-gray-900 dark:text-white">{score}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ delay: 0.3, duration: 1 }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default MatchScoreDisplay