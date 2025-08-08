
import {
  DashboardLayout,
  AnalyticsCards,
  SessionHistory,
  QuickActions,
  UserProfile,
  ProgressChart
} from '../../components/dashboard'

const Dashboard = () => {
  return (
    <DashboardLayout>
      {/* Analytics Cards */}
      <AnalyticsCards />

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Session History and Progress */}
        <div className="lg:col-span-2 space-y-8">
          <SessionHistory />
          <ProgressChart />
        </div>

        {/* Right Column - User Profile */}
        <div className="lg:col-span-1">
          <UserProfile />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard