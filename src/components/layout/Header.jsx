import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { 
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { logoutUser, selectUser } from '../../store/slices/authSlice';
import { Button } from '../common';

const Header = ({ 
  onMenuClick,
  showMobileMenu = true,
  variant = 'default', // 'default', 'minimal', 'dashboard'
  className = ''
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logoutUser());
    setUserMenuOpen(false);
  };

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/resume')) return 'Resume Analysis';
    if (path.includes('/interview')) return 'Interview Practice';
    if (path.includes('/reports')) return 'Reports';
    if (path.includes('/settings')) return 'Settings';
    return 'InterviewPrep AI';
  };

  const notifications = [
    {
      id: 1,
      title: 'Interview completed',
      message: 'Your technical interview session has been analyzed',
      time: '5 minutes ago',
      unread: true
    },
    {
      id: 2,
      title: 'Resume analysis ready',
      message: 'Your resume analysis results are now available',
      time: '1 hour ago',
      unread: false
    }
  ];

  const userMenuItems = [
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const variants = {
    default: 'bg-white shadow-sm border-b border-gray-200',
    minimal: 'bg-transparent',
    dashboard: 'bg-white shadow-sm border-b border-gray-200'
  };

  return (
    <header className={`
      sticky top-0 z-30 ${variants[variant]} ${className}
    `}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            {showMobileMenu && (
              <button
                type="button"
                className="text-gray-500 hover:text-gray-600 lg:hidden mr-4"
                onClick={onMenuClick}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            )}

            {/* Page title */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
              {variant === 'dashboard' && (
                <p className="text-sm text-gray-500 mt-0.5">
                  Welcome back, {user?.name || 'there'}!
                </p>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 relative"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <BellIcon className="h-6 w-6" />
                {notifications.some(n => n.unread) && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notifications dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                          notification.unread ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name || user?.email || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email}
                    </p>
                  </div>
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </div>
              </button>

              {/* User dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 sm:hidden">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name || user?.email || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email}
                    </p>
                  </div>
                  
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <item.icon className="h-4 w-4 mr-3 text-gray-400" />
                      {item.name}
                    </Link>
                  ))}
                  
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(userMenuOpen || notificationsOpen) && (
        <div 
          className="fixed inset-0 z-20"
          onClick={() => {
            setUserMenuOpen(false);
            setNotificationsOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;