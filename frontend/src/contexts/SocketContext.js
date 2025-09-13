import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize socket connection when user is authenticated
      const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        },
        transports: ['websocket', 'polling']
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
      });

      // Online users tracking
      newSocket.on('users_online', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('user_connected', (userId) => {
        setOnlineUsers(prev => [...prev.filter(id => id !== userId), userId]);
      });

      newSocket.on('user_disconnected', (userId) => {
        setOnlineUsers(prev => prev.filter(id => id !== userId));
      });

      setSocket(newSocket);

      // Cleanup on unmount or user change
      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
      };
    } else {
      // Disconnect socket when user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
      }
    }
  }, [user]);

  // Socket event helpers
  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  // Chat-specific helpers
  const joinChatRoom = (chatId) => {
    emit('join_chat', { chatId });
  };

  const leaveChatRoom = (chatId) => {
    emit('leave_chat', { chatId });
  };

  const sendMessage = (chatId, message) => {
    emit('send_message', { chatId, message });
  };

  const markMessageAsRead = (chatId, messageId) => {
    emit('mark_read', { chatId, messageId });
  };

  // Typing indicators
  const startTyping = (chatId) => {
    emit('typing_start', { chatId });
  };

  const stopTyping = (chatId) => {
    emit('typing_stop', { chatId });
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    emit,
    on,
    off,
    // Chat helpers
    joinChatRoom,
    leaveChatRoom,
    sendMessage,
    markMessageAsRead,
    startTyping,
    stopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;