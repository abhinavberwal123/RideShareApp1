import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useFirestoreOperations, useCollection } from '../hooks/useFirestore';
import { useAuth } from '../hooks/useAuth';
import '../styles/NotificationBell.css';

// Helper function to format time
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';

  const now = new Date();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;

  // For older notifications, show the actual date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
  });
};

const NotificationBell = ({ 
  maxNotifications = 5,
  onNotificationClick,
  showAllLink = true,
  allNotificationsPath = '/notifications'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const { user } = useAuth();
  const { updateDocument, updateDocuments } = useFirestoreOperations();

  // Get notifications from Firestore
  const { documents: notifications, loading } = useCollection(
    'notifications',
    user?.uid ? [
      { field: 'userId', operator: '==', value: user.uid }
    ] : null,
    {
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: maxNotifications
    }
  );

  // Calculate unread count
  useEffect(() => {
    if (notifications) {
      const unread = notifications.filter(notification => !notification.read).length;
      setUnreadCount(unread);
      setHasNewNotifications(unread > 0);
    }
  }, [notifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);

    // If opening the dropdown and there are unread notifications, mark them as seen
    if (!isOpen && hasNewNotifications) {
      setHasNewNotifications(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notification) => {
    if (!notification.read && user?.uid) {
      try {
        await updateDocument('notifications', notification.id, {
          read: true,
          updatedAt: new Date()
        });

        // If this is the last unread notification, update the hasNewNotifications state
        if (unreadCount === 1) {
          setHasNewNotifications(false);
        }

        // Handle notification click if provided
        if (onNotificationClick) {
          onNotificationClick(notification);
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    } else if (onNotificationClick) {
      // If already read, just handle the click
      onNotificationClick(notification);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (notifications && notifications.length > 0 && user?.uid) {
      try {
        // Get IDs of unread notifications
        const unreadIds = notifications
          .filter(notification => !notification.read)
          .map(notification => notification.id);

        if (unreadIds.length === 0) return;

        // Update all unread notifications
        await updateDocuments('notifications', unreadIds, {
          read: true,
          updatedAt: new Date()
        });

        setHasNewNotifications(false);
        setUnreadCount(0);
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    }
  };

  // Navigate to all notifications page
  const viewAllNotifications = () => {
    // Close the dropdown
    setIsOpen(false);

    // Navigate to all notifications page
    // In a real implementation, you would use a router like react-router-dom
    window.location.href = allNotificationsPath;
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <div 
        className={`notification-icon ${hasNewNotifications ? 'has-new' : ''}`}
        onClick={toggleDropdown}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      <div className={`notification-dropdown ${isOpen ? 'open' : ''}`}>
        <div className="notification-header">
          <h3>Notifications</h3>
          {unreadCount > 0 && (
            <button className="mark-all-read" onClick={markAllAsRead}>
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="notification-empty">Loading notifications...</div>
        ) : notifications && notifications.length > 0 ? (
          <>
            <ul className="notification-list">
              {notifications.map(notification => (
                <li 
                  key={notification.id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification)}
                >
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{formatTimeAgo(notification.createdAt)}</div>
                </li>
              ))}
            </ul>

            {showAllLink && (
              <div className="notification-footer">
                <button className="view-all" onClick={viewAllNotifications}>
                  View all notifications
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="notification-empty">No notifications</div>
        )}
      </div>
    </div>
  );
};

NotificationBell.propTypes = {
  maxNotifications: PropTypes.number,
  onNotificationClick: PropTypes.func,
  showAllLink: PropTypes.bool,
  allNotificationsPath: PropTypes.string
};

export default NotificationBell;
