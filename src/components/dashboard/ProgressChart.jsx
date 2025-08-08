import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts'
import { TrendingUp, Award, Calendar } from 'lucide-react'
import { useGetInterviewSessionsQuery } from '../../store/api/appwriteApi'
import { selectUser } from '../../store/selectors'

const ProgressChart = memo(() => {
  const user = useSelector(selectUser)
  const { data: sessions = [], isLoading } = useGetInterviewSessionsQuery(
    user?.id, 
    { skip: !user?.id }
  )

  // Process data for charts
  const processProgressData = () => {
    const completedSessions = sessions
      .filter(session => session.status === 'completed' && session.finalScore)
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))

    if (completedSessions.length === 0) {
      return []
    }

    // Group sessions by month for trend analysis
    const monthlyData = {}
    
    completedSessions.forEach(session => {
      const date = new Date(session.completedAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthLabel,
          scores: [],
          count: 0
        }
      }
      
      monthlyData[monthKey].scores.push(session.finalScore)
      monthlyData[monthKey].count++
    })

    // Calculate average scores and format data
    return Object.values(monthlyData).map(data => ({
      month: data.month,
      averageScore: Math.round(data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length),
      sessionCount: data.count,
      maxScore: Math.max(...data.scores),
      minScore: Math.min(...data.scores)
    }))
  }

  const processSessionTypeData = () => {
    const completedSessions = sessions.filter(session => session.status === 'completed')
    const typeData = {}

    completedSessions.forEach(session => {
      const type = session.sessionType || 'Unknown'
      if (!typeData[type]) {
        typeData[type] = {
          type,
          count: 0,
          totalScore: 0,
          sessions: []
        }
      }
      
      typeData[type].count++
      typeData[type].totalScore += session.finalScore || 0
      typeData[type].sessions.push(session)
    })

    return Object.values(typeData).map(data => ({
      type: data.type,
      count: data.count,
      averageScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0
    }))
  }

  const progressData = useMemo(() => processProgressData(), [sessions])
  const sessionTypeData = useMemo(() => processSessionTypeData(), [sessions])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name.includes('Score') && '%'}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (progressData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Progress Overview
          </h2>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="text-center py-12">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No progress data yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Complete some interview sessions to see your progress charts.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Score Progress Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Score Progress
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Your interview performance over time
            </p>
          </div>
          <TrendingUp className="w-5 h-5 text-primary-500" />
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={progressData}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                domain={[0, 100]}
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="averageScore"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#scoreGradient)"
                name="Average Score"
              />
              <Line
                type="monotone"
                dataKey="maxScore"
                stroke="#10b981"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Best Score"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {progressData[progressData.length - 1]?.averageScore || 0}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Latest Average</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.max(...progressData.map(d => d.maxScore))}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Best Score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {progressData.reduce((sum, d) => sum + d.sessionCount, 0)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
          </div>
        </div>
      </div>

      {/* Session Type Performance */}
      {sessionTypeData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Performance by Interview Type
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Compare your performance across different interview types
              </p>
            </div>
            <Award className="w-5 h-5 text-primary-500" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionTypeData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="type" 
                  className="text-xs text-gray-600 dark:text-gray-400"
                />
                <YAxis 
                  domain={[0, 100]}
                  className="text-xs text-gray-600 dark:text-gray-400"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="averageScore" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  name="Average Score"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
})

ProgressChart.displayName = 'ProgressChart'

export default ProgressChart