import { 
  UserCircleIcon,
  PencilIcon,
  CalendarIcon,
  BriefcaseIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const UserProfile = ({ user, statistics, onEditProfile }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const stats = [
    {
      name: 'Total Sessions',
      value: statistics?.totalSessions || 0,
      icon: CalendarIcon,
    },
    {
      name: 'Completed',
      value: statistics?.completedSessions || 0,
      icon: BriefcaseIcon,
    },
    {
      name: 'Average Score',
      value: statistics?.averageScore ? `${statistics.averageScore}%` : 'N/A',
      icon: BuildingOfficeIcon,
    },
  ];

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Profile</h3>
          {onEditProfile && (
            <button
              onClick={onEditProfile}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-shrink-0">
            {user?.avatar ? (
              <img
                className="h-16 w-16 rounded-full"
                src={user.avatar}
                alt={user.name || user.email}
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-xl font-medium text-white">
                  {getInitials(user?.name, user?.email)}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-medium text-gray-900 truncate">
              {user?.name || 'User'}
            </h4>
            <p className="text-sm text-gray-500 truncate">
              {user?.email}
            </p>
            {user?.createdAt && (
              <p className="text-xs text-gray-400">
                Member since {formatDate(user.createdAt)}
              </p>
            )}
          </div>
        </div>

        {/* User Details */}
        <div className="space-y-3 mb-6">
          {user?.experienceLevel && (
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-24">Experience:</span>
              <span className="text-gray-900">{user.experienceLevel}</span>
            </div>
          )}
          {user?.targetRole && (
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-24">Target Role:</span>
              <span className="text-gray-900">{user.targetRole}</span>
            </div>
          )}
          {user?.targetIndustry && (
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-24">Industry:</span>
              <span className="text-gray-900">{user.targetIndustry}</span>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="border-t border-gray-200 pt-4">
          <h5 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h5>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="flex justify-center mb-1">
                  <stat.icon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500">
                  {stat.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Indicator */}
        {statistics?.recentSessionsCount > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  You've completed {statistics.recentSessionsCount} session{statistics.recentSessionsCount !== 1 ? 's' : ''} in the last 30 days.
                  {statistics.scoreImprovement > 0 && (
                    <span className="font-medium"> Your average score improved by {statistics.scoreImprovement}%!</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;