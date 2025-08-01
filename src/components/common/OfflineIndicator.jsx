import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const OfflineIndicator = () => {
  const { isOnline, quality, effectiveType } = useNetworkStatus();

  if (isOnline && quality !== 'poor') {
    return null;
  }

  const getIndicatorContent = () => {
    if (!isOnline) {
      return {
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0 0L5.636 18.364m12.728-12.728L18.364 18.364M12 12h.01M8 8h.01M16 16h.01" />
          </svg>
        ),
        text: 'Offline',
        bgColor: 'bg-red-600',
        textColor: 'text-white'
      };
    }

    if (quality === 'poor') {
      return {
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        ),
        text: `Slow Connection (${effectiveType})`,
        bgColor: 'bg-yellow-600',
        textColor: 'text-white'
      };
    }
  };

  const content = getIndicatorContent();
  if (!content) return null;

  return (
    <div className={`
      fixed top-0 left-0 right-0 z-50 
      ${content.bgColor} ${content.textColor}
      px-4 py-2 text-sm font-medium text-center
      shadow-lg
    `}>
      <div className="flex items-center justify-center space-x-2">
        {content.icon}
        <span>{content.text}</span>
        {!isOnline && (
          <span className="text-xs opacity-75">
            - Some features may not work
          </span>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;