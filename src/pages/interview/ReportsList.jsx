import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks.js';
import { selectUser } from '../../store/slices/authSlice.js';
import { 
  fetchUserReports,
  selectUserReports,
  selectReportLoading,
  selectReportError,
  selectReportPagination,
  clearUserReports
} from '../../store/slices/reportSlice.js';
import { useGetUserReportsQuery } from '../../store/api/reportApi.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  TrophyIcon,
  ChevronRightIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const ReportsList = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  
  // Local state for filters and pagination
  const [filters, setFilters] = useState({
    status: 'completed',
    sessionType: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // Redux state
  const userReports = useAppSelector(selectUserReports);
  const loading = useAppSelector(selectReportLoading);
  const error = useAppSelector(selectReportError);
  const pagination = useAppSelector(selectReportPagination);

  // RTK Query for real-time data
  const { 
    data: reportsData, 
    isLoading: isLoadingReports, 
    error: queryError,
    refetch 
  } = useGetUserReportsQuery({
    userId: user?.id,
    limit,
    offset: (currentPage - 1) * limit,
    status: filters.status
  }, {
    skip: !user?.id
  });

  // Load reports on mount and filter changes
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserReports({
        userId: user.id,
        limit,
        offset: (currentPage - 1) * limit
      }));
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearUserReports());
    };
  }, [user?.id, currentPage, filters, dispatch, limit]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    const duration = Math.round((new Date(endDate) - new Date(startDate)) / 60000);
    return `${duration}m`;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getSessionTypeColor = (sessionType) => {
    switch (sessionType) {
      case 'Technical':
        return 'bg-purple-100 text-purple-800';
      case 'Behavioral':
        return 'bg-blue-100 text-blue-800';
      case 'Case Study':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Use RTK Query data if available, otherwise use Redux state
  const reports = reportsData?.reports || userReports;
  const isLoading = isLoadingReports || loading;
  const currentError = queryError || error;

  if (isLoading && reports.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center justify-center">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-lg text-gray-600">Loading reports...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <div className="text-red-600 text-xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Unable to Load Reports
              </h2>
              <p className="text-gray-600 mb-6">
                {currentError?.message || 'An error occurred while loading your interview reports.'}
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => refetch()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <Link
                  to="/dashboard"
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Interview Reports
            </h1>
            <p className="text-gray-600">
              View and analyze your interview performance history
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="completed">Completed</option>
                <option value="active">Active</option>
                <option value="all">All</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Type
              </label>
              <select
                value={filters.sessionType}
                onChange={(e) => handleFilterChange('sessionType', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="Technical">Technical</option>
                <option value="Behavioral">Behavioral</option>
                <option value="Case Study">Case Study</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date</option>
                <option value="score">Score</option>
                <option value="sessionType">Session Type</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow">
          {reports.length === 0 ? (
            <div className="p-8 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Reports Found
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't completed any interviews yet. Start your first interview to see reports here.
              </p>
              <Link
                to="/interview/setup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Interview
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/interview/report/${report.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {report.sessionType} Interview
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSessionTypeColor(report.sessionType)}`}>
                          {report.sessionType}
                        </span>
                        {report.finalScore !== null && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(report.finalScore)}`}>
                            <TrophyIcon className="h-3 w-3 mr-1" />
                            {Math.round(report.finalScore)}%
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">
                        Role: {report.role}
                      </p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {formatDate(report.completedAt || report.startedAt)}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {formatDuration(report.startedAt, report.completedAt)}
                        </div>
                        {report.interactionCount && (
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            {report.interactionCount} questions
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {reports.length > 0 && pagination && pagination.totalPages > 1 && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, pagination.total)} of {pagination.total} reports
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          page === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsList;