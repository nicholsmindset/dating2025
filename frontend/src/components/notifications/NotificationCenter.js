import React, { useState } from 'react';
import { usePusher } from '../../contexts/PusherContext';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const { notifications, markNotificationAsRead, clearNotifications, getUnreadCount } = usePusher();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (notification) => {
    markNotificationAsRead(notification.id);
    
    // Handle navigation based on notification type
    switch (notification.type) {
      case 'message':
        window.location.href = `/chat/${notification.data.chatId}`;
        break;
      case 'match':
        window.location.href = `/chat/${notification.data.chatId}`;
        break;
      case 'profile-view':
      case 'like':
        window.location.href = `/profile/${notification.data.viewer?.id || notification.data.liker?.id}`;
        break;
      default:
        break;
    }
    setIsOpen(false);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'match':
        return '💕';
      case 'like':
        return '❤️';
      case 'profile-view':
        return '👁️';
      default:
        return '🔔';
    }
  };

  return (
    <div className="notification-center">
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        🔔
        {getUnreadCount() > 0 && (
          <span className="notification-badge">
            {getUnreadCount() > 99 ? '99+' : getUnreadCount()}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="clear-all-btn"
                onClick={clearNotifications}
              >
                Clear All
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    notification.read ? 'read' : 'unread'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {formatTime(notification.timestamp)}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="unread-indicator"></div>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div className="notification-footer">
              <button className="view-all-btn">
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;