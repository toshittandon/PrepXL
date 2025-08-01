import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  HomeIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ 
  isOpen, 
  onClose, 
  className = '',
  variant = 'default' // 'default', 'compact', 'floating'
}) => {
  const location = useLocation();

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: HomeIcon,
      description: 'Overview and quick actions'
    },
    { 
      name: 'Resume Upload', 
      href: '/resume/upload', 
      icon: DocumentTextIcon,
      description: 'Upload and analyze resumes'
    },
    { 
      name: 'Interview Setup', 
      href: '/interview/setup', 
      icon: ChatBubbleLeftRightIcon,
      description: 'Start practice interviews'
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: ChartBarIcon,
      description: 'View interview feedback'
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: Cog6ToothIcon,
      description: 'Account and preferences'
    }
  ];

  const isCurrentPath = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const variants = {
    default: {
      container: 'bg-white border-r border-gray-200',
      width: 'w-64',
      padding: 'p-4'
    },
    compact: {
      container: 'bg-gray-900 text-white',
      width: 'w-16 lg:w-64',
      padding: 'p-2 lg:p-4'
    },
    floating: {
      container: 'bg-white shadow-lg rounded-lg border border-gray-200',
      width: 'w-64',
      padding: 'p-4 m-4'
    }
  };

  const currentVariant = variants[variant];

  const sidebarContent = (
    <div className={`
      flex flex-col h-full ${currentVariant.container} ${currentVariant.padding}
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IP</span>
            </div>
          </div>
          <div className={`ml-3 ${variant === 'compact' ? 'hidden lg:block' : ''}`}>
            <h1 className="text-lg font-semibold text-gray-900">
              InterviewPrep AI
            </h1>
          </div>
        </div>
        
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navigation.map((item) => {
          const isActive = isCurrentPath(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose} // Close sidebar on mobile when navigating
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${isActive
                  ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600'
                  : variant === 'compact' && variant === 'compact'
                    ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
              title={variant === 'compact' ? item.name : undefined}
            >
              <item.icon className={`
                flex-shrink-0 w-5 h-5
                ${isActive 
                  ? 'text-blue-600' 
                  : variant === 'compact' 
                    ? 'text-gray-400 group-hover:text-white' 
                    : 'text-gray-400 group-hover:text-gray-600'
                }
                ${variant === 'compact' ? 'lg:mr-3' : 'mr-3'}
              `} />
              
              <div className={variant === 'compact' ? 'hidden lg:block' : ''}>
                <div className="font-medium">{item.name}</div>
                {variant === 'default' && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.description}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`
        border-t border-gray-200 pt-4 mt-4
        ${variant === 'compact' ? 'hidden lg:block' : ''}
      `}>
        <div className="text-xs text-gray-500 text-center">
          <p>© 2024 InterviewPrep AI</p>
          <p className="mt-1">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 flex flex-col
        ${currentVariant.width}
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
        transition-transform duration-300 ease-in-out
      `}>
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;