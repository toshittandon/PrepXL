import { useSelector, useDispatch } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import { removeNotification } from '../../store/slices/uiSlice'
import ErrorMessage from './ErrorMessage'
import SuccessMessage from './SuccessMessage'
import { CheckCircle, AlertCircle, AlertTriangle, XCircle, Info } from 'lucide-react'

const NotificationSystem = () => {
  const dispatch = useDispatch()
  const notifications = useSelector(state => state.ui.notifications)

  const handleRemoveNotification = (id) => {
    dispatch(removeNotification(id))
  }

  const getNotificationComponent = (notification) => {
    const { type, severity, ...props } = notification

    switch (type) {
      case 'success':
        return (
          <SuccessMessage
            key={notification.id}
            variant="toast"
            onClose={() => handleRemoveNotification(notification.id)}
            autoHide={true}
            autoHideDelay={notification.duration || 5000}
            {...props}
          />
        )
      
      case 'error':
        return (
          <ErrorMessage
            key={notification.id}
            variant="toast"
            severity="error"
            onClose={() => handleRemoveNotification(notification.id)}
            autoHide={!notification.persistent}
            autoHideDelay={notification.duration || 8000}
            persistent={notification.persistent}
            {...props}
          />
        )
      
      case 'warning':
        return (
          <ErrorMessage
            key={notification.id}
            variant="toast"
            severity="warning"
            onClose={() => handleRemoveNotification(notification.id)}
            autoHide={!notification.persistent}
            autoHideDelay={notification.duration || 6000}
            persistent={notification.persistent}
            {...props}
          />
        )
      
      case 'info':
        return (
          <InfoNotification
            key={notification.id}
            onClose={() => handleRemoveNotification(notification.id)}
            autoHide={!notification.persistent}
            autoHideDelay={notification.duration || 5000}
            persistent={notification.persistent}
            {...props}
          />
        )
      
      default:
        return (
          <ErrorMessage
            key={notification.id}
            variant="toast"
            severity="info"
            onClose={() => handleRemoveNotification(notification.id)}
            autoHide={!notification.persistent}
            autoHideDelay={notification.duration || 5000}
            {...props}
          />
        )
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            layout
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {getNotificationComponent(notification)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Custom Info Notification Component
const InfoNotification = ({ 
  message, 
  title,
  onClose, 
  autoHide = true, 
  autoHideDelay = 5000,
  persistent = false,
  actions = null,
  className = ''
}) => {
  return (
    <ErrorMessage
      message={message}
      title={title}
      variant="toast"
      severity="info"
      onClose={onClose}
      autoHide={autoHide}
      autoHideDelay={autoHideDelay}
      persistent={persistent}
      actions={actions}
      className={className}
    />
  )
}

export default NotificationSystem