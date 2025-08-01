import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Container from './Container';

const AppLayout = ({ 
  variant = 'dashboard', // 'dashboard', 'auth', 'landing', 'minimal'
  showSidebar = true,
  showHeader = true,
  showFooter = true,
  sidebarVariant = 'default',
  headerVariant = 'default',
  footerVariant = 'default',
  className = ''
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  // Layout variants
  const layouts = {
    dashboard: {
      container: 'min-h-screen bg-gray-50 flex flex-col',
      main: 'flex-1 flex',
      content: 'flex-1 flex flex-col'
    },
    auth: {
      container: 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col',
      main: 'flex-1 flex items-center justify-center',
      content: 'w-full max-w-md'
    },
    landing: {
      container: 'min-h-screen bg-white flex flex-col',
      main: 'flex-1',
      content: 'w-full'
    },
    minimal: {
      container: 'min-h-screen bg-white flex flex-col',
      main: 'flex-1 flex',
      content: 'flex-1 p-4'
    }
  };

  const currentLayout = layouts[variant];

  if (variant === 'auth') {
    return (
      <div className={`${currentLayout.container} ${className}`}>
        {showHeader && (
          <Header 
            variant={headerVariant}
            showMobileMenu={false}
          />
        )}
        <main className={currentLayout.main}>
          <div className={currentLayout.content}>
            <Outlet />
          </div>
        </main>
        {showFooter && (
          <Footer variant="minimal" />
        )}
      </div>
    );
  }

  if (variant === 'landing') {
    return (
      <div className={`${currentLayout.container} ${className}`}>
        {showHeader && (
          <Header 
            variant={headerVariant}
            showMobileMenu={false}
          />
        )}
        <main className={currentLayout.main}>
          <div className={currentLayout.content}>
            <Outlet />
          </div>
        </main>
        {showFooter && (
          <Footer variant={footerVariant} />
        )}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`${currentLayout.container} ${className}`}>
        {showHeader && (
          <Header 
            variant={headerVariant}
            showMobileMenu={false}
          />
        )}
        <main className={currentLayout.main}>
          <div className={currentLayout.content}>
            <Outlet />
          </div>
        </main>
        {showFooter && (
          <Footer variant="minimal" />
        )}
      </div>
    );
  }

  // Dashboard layout (default)
  return (
    <div className={`${currentLayout.container} ${className}`}>
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          variant={sidebarVariant}
        />
      )}

      {/* Main content area */}
      <div className={`
        ${currentLayout.main}
        ${showSidebar ? 'lg:ml-64' : ''}
      `}>
        <div className={currentLayout.content}>
          {/* Header */}
          {showHeader && (
            <Header
              variant={headerVariant}
              onMenuClick={handleSidebarToggle}
              showMobileMenu={showSidebar}
            />
          )}

          {/* Page content */}
          <main className="flex-1">
            <Container size="default" padding="default">
              <div className="py-6">
                <Outlet />
              </div>
            </Container>
          </main>

          {/* Footer */}
          {showFooter && (
            <Footer variant={footerVariant} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;