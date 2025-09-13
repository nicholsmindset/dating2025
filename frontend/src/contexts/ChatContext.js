import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

// Chat reducer
const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    case 'SET_CHATS':
      return {
        ...state,
        chats: action.payload,
        loading: false
      };
    
    case 'SET_ACTIVE_CHAT':
      return {
        ...state,
        activeChat: action.payload,
        loading: false
      };
    
    case 'ADD_CHAT':
      return {
        ...state,
        chats: [action.payload, ...state.chats]
      };
    
    case 'UPDATE_CHAT':
      return {
        ...state,
        chats: state.chats.map(chat => 
          chat._id === action.payload._id ? action.payload : chat
        ),
        activeChat: state.activeChat?._id === action.payload._id ? action.payload : state.activeChat
      };
    
    case 'ADD_MESSAGE':
      const { chatId, message } = action.payload;
      return {
        ...state,
        chats: state.chats.map(chat => {
          if (chat._id === chatId) {
            return {
              ...chat,
              messages: [...(chat.messages || []), message],
              lastMessage: {
                content: message.content,
                sender: message.sender,
                sentAt: message.sentAt
              },
              updatedAt: new Date().toISOString()
            };
          }
          return chat;
        }),
        activeChat: state.activeChat?._id === chatId ? {
          ...state.activeChat,
          messages: [...(state.activeChat.messages || []), message]
        } : state.activeChat
      };
    
    case 'MARK_MESSAGES_READ':
      return {
        ...state,
        chats: state.chats.map(chat => {
          if (chat._id === action.payload.chatId) {
            return {
              ...chat,
              unreadCount: 0,
              messages: chat.messages?.map(msg => ({
                ...msg,
                readBy: msg.readBy?.includes(action.payload.userId) 
                  ? msg.readBy 
                  : [...(msg.readBy || []), action.payload.userId]
              }))
            };
          }
          return chat;
        })
      };
    
    case 'SET_SOCKET':
      return {
        ...state,
        socket: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

const initialState = {
  chats: [],
  activeChat: null,
  socket: null,
  loading: false,
  error: null
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, token } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (user && token) {
      const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token
        }
      });

      socket.on('connect', () => {
        console.log('Connected to chat server');
        dispatch({ type: 'SET_SOCKET', payload: socket });
      });

      socket.on('newMessage', (data) => {
        dispatch({ type: 'ADD_MESSAGE', payload: data });
        
        // Show notification if not in active chat
        if (state.activeChat?._id !== data.chatId) {
          toast.info(`New message from ${data.message.sender.firstName}`);
        }
      });

      socket.on('chatUpdated', (data) => {
        dispatch({ type: 'UPDATE_CHAT', payload: data.chat });
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
      });

      return () => {
        socket.disconnect();
        dispatch({ type: 'SET_SOCKET', payload: null });
      };
    }
  }, [user, token]);

  // Load user chats
  const loadChats = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.get('/api/chat', {
        headers: { Authorization: `Bearer ${token}` }
      });
      dispatch({ type: 'SET_CHATS', payload: response.data });
    } catch (error) {
      console.error('Load chats error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to load chats' });
    }
  };

  // Load specific chat
  const loadChat = async (chatId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.get(`/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      dispatch({ type: 'SET_ACTIVE_CHAT', payload: response.data });
      
      // Mark messages as read
      if (response.data.messages?.length > 0) {
        dispatch({ 
          type: 'MARK_MESSAGES_READ', 
          payload: { chatId, userId: user.id } 
        });
      }
    } catch (error) {
      console.error('Load chat error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to load chat' });
    }
  };

  // Start new chat
  const startChat = async (recipientId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.post('/api/chat/start', 
        { recipientId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.existing) {
        // Load existing chat
        await loadChat(response.data.chatId);
      } else {
        // Add new chat to list
        dispatch({ type: 'ADD_CHAT', payload: response.data.chat });
        dispatch({ type: 'SET_ACTIVE_CHAT', payload: response.data.chat });
      }
      
      return response.data.chatId;
    } catch (error) {
      console.error('Start chat error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to start chat' });
      throw error;
    }
  };

  // Send message
  const sendMessage = async (chatId, content, type = 'text') => {
    try {
      const response = await axios.post(`/api/chat/${chatId}/messages`,
        { content, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Message will be added via socket event
      return response.data;
    } catch (error) {
      console.error('Send message error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send message';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Request wali supervision
  const requestWaliSupervision = async (chatId) => {
    try {
      await axios.post(`/api/chat/${chatId}/request-wali-supervision`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Wali supervision requested successfully');
      await loadChat(chatId); // Reload chat to get updated status
    } catch (error) {
      console.error('Request wali supervision error:', error);
      toast.error(error.response?.data?.message || 'Failed to request wali supervision');
    }
  };

  // Approve wali supervision
  const approveWaliSupervision = async (chatId) => {
    try {
      await axios.post(`/api/chat/${chatId}/approve-wali-supervision`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Chat approved successfully');
      await loadChat(chatId); // Reload chat to get updated status
    } catch (error) {
      console.error('Approve wali supervision error:', error);
      toast.error(error.response?.data?.message || 'Failed to approve chat');
    }
  };

  // Block chat
  const blockChat = async (chatId) => {
    try {
      await axios.post(`/api/chat/${chatId}/block`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Chat blocked successfully');
      await loadChats(); // Reload chats list
    } catch (error) {
      console.error('Block chat error:', error);
      toast.error(error.response?.data?.message || 'Failed to block chat');
    }
  };

  // Report chat
  const reportChat = async (chatId, reason, description) => {
    try {
      await axios.post(`/api/chat/${chatId}/report`, 
        { reason, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Chat reported successfully');
    } catch (error) {
      console.error('Report chat error:', error);
      toast.error(error.response?.data?.message || 'Failed to report chat');
    }
  };

  // Delete chat
  const deleteChat = async (chatId) => {
    try {
      await axios.delete(`/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Chat deleted successfully');
      await loadChats(); // Reload chats list
      
      // Clear active chat if it was deleted
      if (state.activeChat?._id === chatId) {
        dispatch({ type: 'SET_ACTIVE_CHAT', payload: null });
      }
    } catch (error) {
      console.error('Delete chat error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete chat');
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Set active chat
  const setActiveChat = (chat) => {
    dispatch({ type: 'SET_ACTIVE_CHAT', payload: chat });
  };

  const value = {
    ...state,
    loadChats,
    loadChat,
    startChat,
    sendMessage,
    requestWaliSupervision,
    approveWaliSupervision,
    blockChat,
    reportChat,
    deleteChat,
    setActiveChat,
    clearError
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;