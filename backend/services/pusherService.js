const Pusher = require('pusher');

// Initialize Pusher with environment variables
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

// Helper functions for different types of real-time events
const pusherService = {
  // Send new message notification
  sendNewMessage: async (chatId, message, recipientId) => {
    try {
      await pusher.trigger(`private-chat-${chatId}`, 'new-message', {
        message,
        timestamp: new Date()
      });
      
      // Also send to user's personal channel for notifications
      await pusher.trigger(`private-user-${recipientId}`, 'new-message-notification', {
        chatId,
        senderId: message.sender,
        senderName: message.senderName,
        preview: message.content.substring(0, 50),
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending new message via Pusher:', error);
    }
  },

  // Send typing indicator
  sendTypingIndicator: async (chatId, userId, isTyping) => {
    try {
      await pusher.trigger(`private-chat-${chatId}`, 'typing', {
        userId,
        isTyping,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending typing indicator via Pusher:', error);
    }
  },

  // Send profile view notification
  sendProfileView: async (viewedUserId, viewerInfo) => {
    try {
      await pusher.trigger(`private-user-${viewedUserId}`, 'profile-viewed', {
        viewer: viewerInfo,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending profile view notification via Pusher:', error);
    }
  },

  // Send like notification
  sendLikeNotification: async (likedUserId, likerInfo) => {
    try {
      await pusher.trigger(`private-user-${likedUserId}`, 'profile-liked', {
        liker: likerInfo,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending like notification via Pusher:', error);
    }
  },

  // Update user online status
  updateOnlineStatus: async (userId, isOnline) => {
    try {
      await pusher.trigger('presence-users', 'user-status-changed', {
        userId,
        isOnline,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error updating online status via Pusher:', error);
    }
  },

  // Send match notification (when two users like each other)
  sendMatchNotification: async (user1Id, user2Id, matchInfo) => {
    try {
      await pusher.trigger(`private-user-${user1Id}`, 'new-match', {
        matchedUser: matchInfo.user2,
        timestamp: new Date()
      });
      
      await pusher.trigger(`private-user-${user2Id}`, 'new-match', {
        matchedUser: matchInfo.user1,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending match notification via Pusher:', error);
    }
  },

  // Send admin notification
  sendAdminNotification: async (adminId, notification) => {
    try {
      await pusher.trigger(`admin-${adminId}`, 'admin-notification', {
        ...notification,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending admin notification via Pusher:', error);
    }
  }
};

module.exports = { pusher, pusherService };