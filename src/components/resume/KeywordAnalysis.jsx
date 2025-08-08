import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Search, TrendingUp, AlertTriangle } from 'lucide-react'
import Card from '../common/Card.jsx'

const KeywordAnalysis = ({ 
  missingKeywords = [], 
  matchScore = 0 
}) => {
  // Create data for keyword frequency analysis
  const createKeywordData = (keywords) => {
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return []
    }

    // Group keywords by frequency (simulated for demo)
    const keywordFrequency = keywords.slice(0, 8).map((keyword, index) => ({
      keyword: keyword.length > 12 ? keyword.substring(0, 12) + '...' : keyword,
      fullKeyword: keyword,
      frequency: Math.max(1, 10 - index), // Simulated frequency
      importance: index < 3 ? 'High' : index < 6 ? 'Medium' : 'Low'
    }))

    return keywordFrequency.sort((a, b) => b.frequency - a.frequency)
  }

  const keywordData = createKeywordData(missingKeywords)

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">
            {data.fullKeyword}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Frequency: {data.frequency}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Importance: {data.importance}
          </p>
        </div>
      )
    }
    return null
  }

  // Get recommendations based on missing keywords
  const getRecommendations = () => {
    const keywordCount = missingKeywords.length
    
    if (keywordCount === 0) {
      return {
        title: "Excellent Keyword Coverage!",
        message: "Your resume contains all the important keywords from the job description.",
        type: "success"
      }
    } else if (keywordCount <= 5) {
      return {
        title: "Good Keyword Coverage",
        message: "Your resume covers most keywords. Consider adding the missing ones to improve your match score.",
        type: "warning"
      }
    } else {
      return {
        title: "Keyword Optimization Needed",
        message: "Your resume is missing several important keywords. Focus on incorporating these terms naturally into your experience and skills sections.",
        type: "error"
      }
    }
  }

  const recommendation = getRecommendations()

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 border-2 border-purple-200 dark:border-purple-800">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
          <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Keyword Analysis
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Detailed breakdown of missing keywords
          </p>
        </div>
      </div>

      {/* Recommendation Alert */}
      <div className={`
        p-4 rounded-lg mb-6 border
        ${recommendation.type === 'success' 
          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
          : recommendation.type === 'warning'
          ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
          : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
        }
      `}>
        <div className="flex items-start space-x-3">
          {recommendation.type === 'success' ? (
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          )}
          <div>
            <h4 className={`
              text-sm font-medium mb-1
              ${recommendation.type === 'success' 
                ? 'text-green-900 dark:text-green-100' 
                : recommendation.type === 'warning'
                ? 'text-yellow-900 dark:text-yellow-100'
                : 'text-red-900 dark:text-red-100'
              }
            `}>
              {recommendation.title}
            </h4>
            <p className={`
              text-sm
              ${recommendation.type === 'success' 
                ? 'text-green-700 dark:text-green-300' 
                : recommendation.type === 'warning'
                ? 'text-yellow-700 dark:text-yellow-300'
                : 'text-red-700 dark:text-red-300'
              }
            `}>
              {recommendation.message}
            </p>
          </div>
        </div>
      </div>

      {/* Keyword Frequency Chart */}
      {keywordData.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Missing Keywords by Importance
          </h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={keywordData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis 
                  dataKey="keyword" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-gray-600 dark:text-gray-400"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="frequency" 
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Keyword Priority List */}
      {missingKeywords.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Priority Keywords to Add
          </h4>
          <div className="space-y-2">
            {missingKeywords.slice(0, 5).map((keyword, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                    ${index < 2 
                      ? 'bg-red-500' 
                      : index < 4 
                      ? 'bg-yellow-500' 
                      : 'bg-blue-500'
                    }
                  `}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {keyword}
                  </span>
                </div>
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${index < 2 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                    : index < 4 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  }
                `}>
                  {index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low'} Priority
                </span>
              </motion.div>
            ))}
          </div>
          
          {missingKeywords.length > 5 && (
            <div className="mt-3 text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                +{missingKeywords.length - 5} more keywords to consider
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          💡 Optimization Tips
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Incorporate keywords naturally into your experience descriptions</li>
          <li>• Add relevant skills to your skills section</li>
          <li>• Use both full terms and abbreviations (e.g., "JavaScript" and "JS")</li>
          <li>• Match the exact phrasing used in the job description when possible</li>
        </ul>
      </div>
    </Card>
  )
}

export default KeywordAnalysis