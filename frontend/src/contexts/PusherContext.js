import React, { createContext, useContext, useEffect, useState } from 'react';
import pusherService from '../services/pusherService';
import { useAuth } from './AuthContext';

const PusherContext = createContext();

export const usePusher = () => {
  const context = useContext(PusherContext);
  if (!context) {
    throw new Error('usePusher must be used within a PusherProvider');
  }
  return context;
};

export const PusherProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize Pusher connection
      pusherService.init(user.id);
      setIsConnected(true);

      // Subscribe to user's personal channel
      const userChannel = pusherService.subscribeToUserChannel(user.id);

      // Listen for new message notifications
      userChannel.bind('new-message-notification', (data) => {
        setNotifications(prev => [{
          id: Date.now(),
          type: 'message',
          title: 'New Message',
          message: `${data.senderName}: ${data.preview}`,
          data: data,
          timestamp: new Date(),
          read: false
        }, ...prev]);

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification('New Message', {
            body: `${data.senderName}: ${data.preview}`,
            icon: '/favicon.ico'
          });
        }
      });

      // Listen for profile view notifications
      userChannel.bind('profile-viewed', (data) => {
        setNotifications(prev => [{
          id: Date.now(),
          type: 'profile-view',
          title: 'Profile Viewed',
          message: `${data.viewer.firstName} ${data.viewer.lastName} viewed your profile`,
          data: data,
          timestamp: new Date(),
          read: false
        }, ...prev]);
      });

      // Listen for like notifications
      userChannel.bind('profile-liked', (data) => {
        setNotifications(prev => [{
          id: Date.now(),
          type: 'like',
          title: 'Profile Liked',
          message: `${data.liker.firstName} ${data.liker.lastName} liked your profile`,
          data: data,
          timestamp: new Date(),
          read: false
        }, ...prev]);
      });

      // Listen for match notifications
      userChannel.bind('new-match', (data) => {
        setNotifications(prev => [{
          id: Date.now(),
          type: 'match',
          title: 'New Match! 🎉',
          message: `You and ${data.matchedUser.firstName} ${data.matchedUser.lastName} liked each other!`,
          data: data,
          timestamp: new Date(),
          read: false
        }, ...prev]);

        // Show browser notification for matches
        if (Notification.permission === 'granted') {
          new Notification('New Match! 🎉', {
            body: `You and ${data.matchedUser.firstName} ${data.matchedUser.lastName} liked each other!`,
            icon: '/favicon.ico'
          });
        }
      });

      // Subscribe to presence channel for online status
      const presenceChannel = pusherService.subscribeToPresenceChannel();
      
      // Handle initial member list
      presenceChannel.bind('pusher:subscription_succeeded', (members) => {
        const memberIds = new Set();
        members.each(member => {
          memberIds.add(member.id);
        });
        setOnlineUsers(memberIds);
      });
      
      // Handle new members joining
      presenceChannel.bind('pusher:member_added', (member) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.add(member.id);
          return newSet;
        });
      });
      
      // Handle members leaving
      presenceChannel.bind('pusher:member_removed', (member) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(member.id);
          return newSet;
        });
      });

      // Request notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    return () => {
      if (isAuthenticated) {
        pusherService.disconnect();
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, user]);

  // Subscribe to chat channel
  const subscribeToChatChannel = (chatId, onNewMessage, onTyping) => {
    const chatChannel = pusherService.subscribeToChatChannel(chatId);
    
    if (onNewMessage) {
      chatChannel.bind('new-message', onNewMessage);
    }
    
    if (onTyping) {
      chatChannel.bind('typing', (data) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (data.isTyping) {
            newMap.set(data.userId, true);
          } else {
            newMap.delete(data.userId);
          }
          return newMap;
        });
        onTyping(data);
      });
    }
    
    return chatChannel;
  };

  // Unsubscribe from chat channel
  const unsubscribeFromChatChannel = (chatId) => {
    pusherService.unsubscribeFromChannel(`chat-${chatId}`);
  };

  // Mark notification as read
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Get unread notification count
  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.read).length;
  };

  const value = {
    notifications,
    onlineUsers,
    typingUsers,
    isConnected,
    subscribeToChatChannel,
    unsubscribeFromChatChannel,
    markNotificationAsRead,
    clearNotifications,
    getUnreadCount
  };

  return (
    <PusherContext.Provider value={value}>
      {children}
    </PusherContext.Provider>
  );
};