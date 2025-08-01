import { memo, useMemo } from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  PlayCircleIcon,
  ChartBarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const SessionHistory = memo(({ sessions = [], loading = false, onViewReport }) => {
  // Memoize utility functions to prevent recreation on every render
  const getStatusIcon = useMemo(() => (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'active':
        return <PlayCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  }, []);

  const getStatusText = useMemo(() => (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'active':
        return 'In Progress';
      default:
        return 'Pending';
    }
  }, []);

  const getStatusBadgeColor = useMemo(() => (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const formatDate = useMemo(() => (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const formatScore = useMemo(() => (score) => {
    if (score === null || score === undefined) return 'N/A';
    return `${Math.round(score)}%`;
  }, []);

  // Memoize processed sessions data
  const processedSessions = useMemo(() => {
    return sessions.map(session => ({
      ...session,
      statusIcon: getStatusIcon(session.status),
      statusText: getStatusText(session.status),
      statusBadgeColor: getStatusBadgeColor(session.status),
      formattedDate: session.status === 'completed' 
        ? formatDate(session.completedAt)
        : formatDate(session.startedAt),
      formattedScore: formatScore(session.finalScore)
    }));
  }, [sessions, getStatusIcon, getStatusText, getStatusBadgeColor, formatDate, formatScore]);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Interview Sessions</h3>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Interview Sessions</h3>
          <div className="text-center py-8">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No interview sessions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first interview session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Interview Sessions</h3>
        <div className="space-y-4">
          {processedSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {session.statusIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session.sessionType} Interview
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${session.statusBadgeColor}`}>
                      {session.statusText}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    Role: {session.role}
                  </p>
                  <p className="text-xs text-gray-400">
                    {session.status === 'completed' 
                      ? `Completed: ${session.formattedDate}`
                      : `Started: ${session.formattedDate}`
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {session.status === 'completed' && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      Score: {session.formattedScore}
                    </p>
                  </div>
                )}
                
                {session.status === 'completed' && onViewReport && (
                  <button
                    onClick={() => onViewReport(session.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View Report
                  </button>
                )}
                
                {session.status === 'active' && (
                  <button
                    onClick={() => window.location.href = `/interview/live/${session.id}`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlayCircleIcon className="h-4 w-4 mr-1" />
                    Continue
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {sessions.length >= 5 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => window.location.href = '/interview/reports'}
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              View all sessions →
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

SessionHistory.displayName = 'SessionHistory';

export default SessionHistory;