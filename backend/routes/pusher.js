const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { pusher } = require('../services/pusherService');
const { auth } = require('../middleware/auth');
const Chat = require('../models/Chat');
const router = express.Router();

const pusherAuthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

const authenticateChannel = async (req, res) => {
  try {
    const socketId = req.body.socket_id;
    const channel = req.body.channel_name;
    const userId = req.user.userId.toString();

    if (!socketId || !channel) {
      return res.status(400).json({ error: 'Missing socket or channel information' });
    }

    // Validate that user can access this channel
    if (channel.startsWith('private-user-')) {
      const channelUserId = channel.replace('private-user-', '');
      if (channelUserId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    } else if (channel.startsWith('private-chat-')) {
      const chatId = channel.replace('private-chat-', '');

      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ error: 'Invalid chat identifier' });
      }

      const chat = await Chat.findById(chatId);

      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      const isParticipant = chat.participants.some(participant => participant.toString() === userId);

      if (!isParticipant) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    // Generate auth signature
    const authResponse = pusher.authenticate(socketId, channel);
    res.send(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Pusher authentication endpoint for private channels
router.post('/auth', pusherAuthLimiter, auth, authenticateChannel);

// Pusher presence channel authentication
const authenticatePresenceChannel = (req, res) => {
  try {
    const socketId = req.body.socket_id;
    const channel = req.body.channel_name;
    const userId = req.user.userId.toString();

    // User data for presence channel
    const presenceData = {
      user_id: userId,
      user_info: {
        id: userId,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        profilePhoto: req.user.profilePhoto,
        gender: req.user.gender,
        isVerified: req.user.isVerified
      }
    };

    const auth = pusher.authenticate(socketId, channel, presenceData);
    res.send(auth);
  } catch (error) {
    console.error('Pusher presence auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

router.post('/auth/presence', pusherAuthLimiter, auth, authenticatePresenceChannel);

module.exports = router;
module.exports.handlers = {
  authenticateChannel,
  authenticatePresenceChannel
};

