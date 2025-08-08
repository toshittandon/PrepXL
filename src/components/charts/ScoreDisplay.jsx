import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Award, TrendingUp, Target } from 'lucide-react'

const ScoreDisplay = ({ 
  overallScore = 0, 
  breakdown = {}, 
  className = '',
  showBreakdown = true 
}) => {
  // Prepare data for pie chart
  const pieData = [
    { name: 'Score', value: overallScore, color: '#3b82f6' },
    { name: 'Remaining', value: 100 - overallScore, color: '#e5e7eb' }
  ]

  // Prepare breakdown data for bar chart
  const breakdownData = Object.entries(breakdown).map(([category, score]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    score: score || 0
  }))

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBackground = (score) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20'
    return 'bg-red-100 dark:bg-red-900/20'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <Award className="w-6 h-6 mr-2 text-primary-600" />
          Interview Score
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBackground(overallScore)} ${getScoreColor(overallScore)}`}>
          {getScoreLabel(overallScore)}
        </div>
      </div>

      {/* Main Score Display */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Score Text Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(overallScore)} score-number`}>
                {Math.round(overallScore)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                out of 100
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print-only score display */}
      <div className="hidden print:block print-score-text">
        Overall Interview Score: {Math.round(overallScore)}/100 ({getScoreLabel(overallScore)})
      </div>

      {/* Score Breakdown */}
      {showBreakdown && breakdownData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center text-lg font-medium text-gray-900 dark:text-white">
            <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
            Performance Breakdown
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdownData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12 }}
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  className="text-gray-600 dark:text-gray-400"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    border: '1px solid var(--tooltip-border)',
                    borderRadius: '8px',
                    color: 'var(--tooltip-text)'
                  }}
                  formatter={(value) => [`${value}%`, 'Score']}
                />
                <Bar 
                  dataKey="score" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Print-only breakdown display */}
          <div className="hidden print:block">
            {breakdownData.map((item) => (
              <div key={item.category} className="print-breakdown-text">
                {item.category}: {item.score}%
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Insights */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-start">
          <Target className="w-5 h-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Performance Insights
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {overallScore >= 80 && (
                <p>Excellent performance! You demonstrated strong interview skills across all areas.</p>
              )}
              {overallScore >= 60 && overallScore < 80 && (
                <p>Good performance with room for improvement. Focus on areas with lower scores.</p>
              )}
              {overallScore >= 40 && overallScore < 60 && (
                <p>Fair performance. Consider practicing more to improve your interview confidence.</p>
              )}
              {overallScore < 40 && (
                <p>Keep practicing! Focus on preparing better answers and improving your communication skills.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ScoreDisplay