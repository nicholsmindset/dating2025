import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Alert
} from '@mui/material';
import {
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  Report as ReportIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePusher } from '../../contexts/PusherContext';
import { formatDistanceToNow } from 'date-fns';
import { WithOnlineStatus } from '../../components/OnlineStatus';

const Chat = () => {
  const { user } = useAuth();
  const { subscribeToChatChannel, unsubscribeFromChatChannel, typingUsers } = usePusher();
  const {
    chats,
    activeChat,
    loading,
    error,
    loadChats,
    loadChat,
    sendMessage,
    requestWaliSupervision,
    approveWaliSupervision,
    blockChat,
    reportChat,
    deleteChat,
    setActiveChat,
    clearError
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [reportDialog, setReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat?.messages]);

  // Subscribe to Pusher chat channel for real-time messages
  useEffect(() => {
    if (activeChat?._id) {
      const handleNewMessage = (data) => {
        // Reload the chat to get the new message
        loadChat(activeChat._id);
      };

      const handleTyping = (data) => {
        // Typing indicator is handled by the PusherContext
        console.log('User typing:', data);
      };

      subscribeToChatChannel(activeChat._id, handleNewMessage, handleTyping);

      return () => {
        unsubscribeFromChatChannel(activeChat._id);
      };
    }
  }, [activeChat?._id, subscribeToChatChannel, unsubscribeFromChatChannel, loadChat]);

  const handleChatSelect = (chat) => {
    setActiveChat(chat);
    loadChat(chat._id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat) return;

    try {
      await sendMessage(activeChat._id, messageText.trim());
      setMessageText('');
    } catch (error) {
      // Error handled in context
    }
  };

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleReportSubmit = async () => {
    if (!reportReason.trim()) return;
    
    try {
      await reportChat(activeChat._id, reportReason, reportDescription);
      setReportDialog(false);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      // Error handled in context
    }
  };

  const getOtherParticipant = (chat) => {
    return chat.participants.find(p => p._id !== user.id);
  };

  // Send typing indicator
  const sendTypingIndicator = async (isTyping) => {
    if (!activeChat?._id) return;
    
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/chat/${activeChat._id}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isTyping })
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  };

  // Handle typing indicator
  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 2000);
  };

  const handleMessageChange = (e) => {
    setMessageText(e.target.value);
    handleTypingStart();
  };

  const formatMessageTime = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const canSendMessages = (chat) => {
    if (!chat) return false;
    if (chat.status !== 'active') return false;
    if (chat.waliSupervision.required && !chat.waliSupervision.approved) return false;
    return true;
  };

  const isWaliUser = (chat) => {
    if (!chat || !user) return false;
    return chat.participants.some(p => p.wali && p.wali.toString() === user.id);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', p: 2 }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Chat List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
                Messages
              </Typography>
            </Box>
            
            <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
              {chats.map((chat) => {
                const otherUser = getOtherParticipant(chat);
                return (
                  <motion.div
                    key={chat._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ListItem
                      button
                      selected={activeChat?._id === chat._id}
                      onClick={() => handleChatSelect(chat)}
                      sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '&.Mui-selected': {
                          backgroundColor: '#E8F5E8'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          color="error"
                          badgeContent={chat.unreadCount || 0}
                          invisible={!chat.unreadCount}
                        >
                          <WithOnlineStatus userId={otherUser?._id}>
                            <Avatar
                              src={otherUser?.profilePhoto}
                              sx={{ bgcolor: '#2E7D32' }}
                            >
                              {otherUser?.firstName?.[0]}
                            </Avatar>
                          </WithOnlineStatus>
                        </Badge>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">
                              {otherUser?.firstName} {otherUser?.lastName}
                            </Typography>
                            {chat.waliSupervision.required && (
                              <SecurityIcon 
                                sx={{ 
                                  fontSize: 16, 
                                  color: chat.waliSupervision.approved ? '#2E7D32' : '#FF9800' 
                                }} 
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {chat.lastMessage?.content || 'No messages yet'}
                            </Typography>
                            {chat.lastMessage && (
                              <Typography variant="caption" color="text.secondary">
                                {formatMessageTime(chat.lastMessage.sentAt)}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </motion.div>
                );
              })}
            </List>
          </Paper>
        </Grid>

        {/* Chat Messages */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {activeChat ? (
              <>
                {/* Chat Header */}
                <Box sx={{ 
                  p: 2, 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <WithOnlineStatus userId={getOtherParticipant(activeChat)?._id}>
                      <Avatar
                        src={getOtherParticipant(activeChat)?.profilePhoto}
                        sx={{ bgcolor: '#2E7D32' }}
                      >
                        {getOtherParticipant(activeChat)?.firstName?.[0]}
                      </Avatar>
                    </WithOnlineStatus>
                    
                    <Box>
                      <Typography variant="h6">
                        {getOtherParticipant(activeChat)?.firstName} {getOtherParticipant(activeChat)?.lastName}
                      </Typography>
                      
                      {activeChat.waliSupervision.required && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <SecurityIcon sx={{ fontSize: 16, color: '#FF9800' }} />
                          <Typography variant="caption" color="text.secondary">
                            {activeChat.waliSupervision.approved 
                              ? 'Wali Approved' 
                              : 'Awaiting Wali Approval'
                            }
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  
                  <IconButton onClick={handleMenuOpen}>
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                {/* Wali Supervision Alert */}
                {activeChat.waliSupervision.required && !activeChat.waliSupervision.approved && (
                  <Alert 
                    severity="warning" 
                    sx={{ m: 2, mb: 0 }}
                    action={
                      !isWaliUser(activeChat) && (
                        <Button 
                          size="small" 
                          onClick={() => requestWaliSupervision(activeChat._id)}
                        >
                          Request Approval
                        </Button>
                      )
                    }
                  >
                    {isWaliUser(activeChat) 
                      ? 'You can approve this conversation as a wali'
                      : 'This conversation requires wali approval before messaging'
                    }
                  </Alert>
                )}

                {/* Messages */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  <AnimatePresence>
                    {activeChat.messages?.map((message, index) => {
                      const isOwn = message.sender._id === user.id;
                      return (
                        <motion.div
                          key={message._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: isOwn ? 'flex-end' : 'flex-start',
                              mb: 2
                            }}
                          >
                            <Paper
                              sx={{
                                p: 2,
                                maxWidth: '70%',
                                bgcolor: isOwn ? '#2E7D32' : '#f5f5f5',
                                color: isOwn ? 'white' : 'text.primary'
                              }}
                            >
                              <Typography variant="body1">
                                {message.content}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  opacity: 0.7,
                                  display: 'block',
                                  mt: 0.5
                                }}
                              >
                                {formatMessageTime(message.sentAt)}
                              </Typography>
                            </Paper>
                          </Box>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </Box>

                {/* Typing Indicator */}
                {activeChat && typingUsers.has(getOtherParticipant(activeChat)?._id) && (
                  <Box sx={{ px: 2, py: 1, borderTop: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {getOtherParticipant(activeChat)?.firstName} is typing...
                    </Typography>
                  </Box>
                )}

                {/* Message Input */}
                {canSendMessages(activeChat) ? (
                  <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <form onSubmit={handleSendMessage}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          placeholder="Type your message..."
                          value={messageText}
                          onChange={handleMessageChange}
                          variant="outlined"
                          size="small"
                          multiline
                          maxRows={3}
                        />
                        <IconButton 
                          type="submit" 
                          disabled={!messageText.trim()}
                          sx={{ color: '#2E7D32' }}
                        >
                          <SendIcon />
                        </IconButton>
                      </Box>
                    </form>
                  </Box>
                ) : (
                  <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {activeChat.waliSupervision.required && !activeChat.waliSupervision.approved
                        ? 'Wali approval required to send messages'
                        : 'Cannot send messages in this chat'
                      }
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                flexDirection: 'column',
                gap: 2
              }}>
                <Typography variant="h6" color="text.secondary">
                  Select a conversation to start messaging
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose from your existing conversations or start a new one
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Chat Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {isWaliUser(activeChat) && activeChat?.waliSupervision.required && !activeChat?.waliSupervision.approved && (
          <MenuItem onClick={() => {
            approveWaliSupervision(activeChat._id);
            handleMenuClose();
          }}>
            <CheckCircleIcon sx={{ mr: 1 }} />
            Approve Chat
          </MenuItem>
        )}
        
        <MenuItem onClick={() => {
          setReportDialog(true);
          handleMenuClose();
        }}>
          <ReportIcon sx={{ mr: 1 }} />
          Report
        </MenuItem>
        
        <MenuItem onClick={() => {
          blockChat(activeChat._id);
          handleMenuClose();
        }}>
          <BlockIcon sx={{ mr: 1 }} />
          Block
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={() => {
            deleteChat(activeChat._id);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Chat
        </MenuItem>
      </Menu>

      {/* Report Dialog */}
      <Dialog open={reportDialog} onClose={() => setReportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Report Conversation</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reason"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description (optional)"
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleReportSubmit} 
            variant="contained" 
            color="error"
            disabled={!reportReason.trim()}
          >
            Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          onClose={clearError}
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default Chat;