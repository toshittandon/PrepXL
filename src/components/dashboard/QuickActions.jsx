import { memo } from 'react';
import { 
  DocumentArrowUpIcon, 
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const QuickActions = memo(({ onResumeUpload, onStartInterview, onViewReports }) => {
  const actions = [
    {
      title: 'Upload Resume',
      description: 'Upload and analyze your resume with AI-powered feedback',
      icon: DocumentArrowUpIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      href: '/resume/upload',
      onClick: onResumeUpload,
    },
    {
      title: 'Start Interview',
      description: 'Begin a new interview practice session',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-green-500 hover:bg-green-600',
      href: '/interview/setup',
      onClick: onStartInterview,
    },
    {
      title: 'View Reports',
      description: 'Review your past interview performance and feedback',
      icon: ChartBarIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      href: '/reports',
      onClick: onViewReports,
    },
  ];

  const handleActionClick = (action) => {
    if (action.onClick) {
      action.onClick();
    } else {
      window.location.href = action.href;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <button
              key={action.title}
              onClick={() => handleActionClick(action)}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
            >
              <div>
                <span className={`rounded-lg inline-flex p-3 ${action.color} text-white`}>
                  <action.icon className="h-6 w-6" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                  <span className="absolute inset-0" aria-hidden="true" />
                  {action.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {action.description}
                </p>
              </div>
              <span
                className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                aria-hidden="true"
              >
                <PlusIcon className="h-6 w-6" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

QuickActions.displayName = 'QuickActions';

export default QuickActions;