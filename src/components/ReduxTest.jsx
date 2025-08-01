import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  selectSidebarOpen, 
  toggleSidebar, 
  addNotification,
  selectNotifications 
} from '../store/slices/uiSlice';

function ReduxTest() {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const notifications = useAppSelector(selectNotifications);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleAddNotification = () => {
    dispatch(addNotification({
      type: 'success',
      message: 'Redux store is working correctly!',
      duration: 3000,
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Redux Store Test</h2>
      
      <div className="space-y-4">
        <div>
          <p className="mb-2">Sidebar State: <span className="font-semibold">{sidebarOpen ? 'Open' : 'Closed'}</span></p>
          <button
            onClick={handleToggleSidebar}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
          >
            Toggle Sidebar
          </button>
        </div>

        <div>
          <p className="mb-2">Notifications Count: <span className="font-semibold">{notifications.length}</span></p>
          <button
            onClick={handleAddNotification}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
          >
            Add Notification
          </button>
        </div>

        {notifications.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Recent Notifications:</h3>
            <div className="space-y-2">
              {notifications.slice(-3).map((notification) => (
                <div key={notification.id} className="bg-gray-100 p-2 rounded text-sm">
                  <span className="font-medium">{notification.type}:</span> {notification.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReduxTest;