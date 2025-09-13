const express = require('express');
const { pusher } = require('../services/pusherService');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Pusher authentication endpoint for private channels
router.post('/auth', auth, (req, res) => {
  try {
    const socketId = req.body.socket_id;
    const channel = req.body.channel_name;
    const userId = req.user.id;

    // Validate that user can access this channel
    if (channel.startsWith('private-user-')) {
      const channelUserId = channel.replace('private-user-', '');
      if (channelUserId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    } else if (channel.startsWith('private-chat-')) {
      // For chat channels, we would need to verify the user is part of the chat
      // This is a simplified version - in production, check chat membership
      const chatId = channel.replace('private-chat-', '');
      // TODO: Add proper chat membership validation
    }

    // Generate auth signature
    const auth = pusher.authenticate(socketId, channel);
    res.send(auth);
  } catch (error) {
    console.error('Pusher auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Pusher presence channel authentication
router.post('/auth/presence', auth, (req, res) => {
  try {
    const socketId = req.body.socket_id;
    const channel = req.body.channel_name;
    const userId = req.user.id;
    const user = req.user;

    // User data for presence channel
    const presenceData = {
      user_id: userId,
      user_info: {
        id: userId,
        name: `${user.firstName} ${user.lastName}`,
        avatar: user.profilePicture
      }
    };

    const auth = pusher.authenticate(socketId, channel, presenceData);
    res.send(auth);
  } catch (error) {
    console.error('Pusher presence auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;