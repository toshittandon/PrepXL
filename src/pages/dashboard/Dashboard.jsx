import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { DashboardLayout } from '../../components/layout';
import { SessionHistory, QuickActions, UserProfile } from '../../components/dashboard';

const Dashboard = () => {
  const user = useSelector(selectUser);

  console.log('Dashboard component rendered, user:', user);

  const handleResumeUpload = () => {
    window.location.href = '/resume/upload';
  };

  const handleStartInterview = () => {
    window.location.href = '/interview/setup';
  };

  const handleViewReports = () => {
    window.location.href = '/interview/reports';
  };

  const handleViewReport = (sessionId) => {
    window.location.href = `/interview/report/${sessionId}`;
  };

  const handleEditProfile = () => {
    // TODO: Implement profile editing modal or page
    console.log('Edit profile clicked');
  };

  // Mock data for now since API might not be working yet
  const mockSessions = [
    {
      id: '1',
      sessionType: 'Technical',
      role: 'Frontend Developer',
      status: 'completed',
      finalScore: 85,
      completedAt: new Date().toISOString(),
      startedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: '2',
      sessionType: 'Behavioral',
      role: 'Product Manager',
      status: 'active',
      startedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    }
  ];

  const mockStatistics = {
    totalSessions: 5,
    completedSessions: 4,
    activeSessions: 1,
    averageScore: 82,
    totalResumes: 2,
    recentSessionsCount: 2,
    scoreImprovement: 5
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name || user?.email || 'User'}!
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Here's an overview of your interview preparation progress.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions
          onResumeUpload={handleResumeUpload}
          onStartInterview={handleStartInterview}
          onViewReports={handleViewReports}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session History - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2">
            <SessionHistory
              sessions={mockSessions}
              loading={false}
              onViewReport={handleViewReport}
            />
          </div>

          {/* User Profile - Takes up 1 column on large screens */}
          <div className="lg:col-span-1">
            <UserProfile
              user={user}
              statistics={mockStatistics}
              onEditProfile={handleEditProfile}
            />
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {mockStatistics.totalSessions}
                </div>
                <div className="text-sm text-gray-600">Total Sessions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {mockStatistics.completedSessions}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {mockStatistics.averageScore}%
                </div>
                <div className="text-sm text-gray-600">Avg Score</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {mockStatistics.totalResumes}
                </div>
                <div className="text-sm text-gray-600">Resumes</div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </DashboardLayout>
  );
};

export default Dashboard;