const express = require('express');
const Chat = require('../models/Chat');
const User = require('../models/User');
const { auth, premiumAuth } = require('../middleware/auth');
const { pusherService } = require('../services/pusherService');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const router = express.Router();

// Rate limiting for chat operations
const chatRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many chat requests, please try again later'
});

// Send typing indicator
router.post('/:chatId/typing', auth, async (req, res) => {
  try {
    const { isTyping } = req.body;
    
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.userId,
      isActive: true
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Send typing indicator via Pusher
    await pusherService.sendTypingIndicator(chat._id, req.user.userId, isTyping);

    res.json({ success: true });
  } catch (error) {
    console.error('Typing indicator error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const messageRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 messages per minute
  message: 'Too many messages sent, please slow down'
});

// Get all chats for current user
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.userId,
      isActive: true
    })
      .populate('participants', 'firstName lastName profilePhoto isOnline lastSeen')
      .populate('lastMessage.sender', 'firstName lastName')
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific chat
router.get('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.userId
    })
      .populate('participants', 'firstName lastName profilePhoto gender wali')
      .populate('messages.sender', 'firstName lastName profilePhoto gender')
      .populate('waliSupervision.waliUser', 'firstName lastName email');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user can view messages based on wali supervision
    const canViewMessages = chat.canUserViewMessages(req.user.userId);
    if (!canViewMessages) {
      return res.status(403).json({ 
        message: 'Wali approval required to view messages',
        requiresWaliApproval: true
      });
    }

    // Mark messages as read
    await chat.markAsRead(req.user.userId);

    res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start new chat
router.post('/start', auth, chatRateLimit, async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    if (recipientId === String(req.user.userId)) {
      return res.status(400).json({ message: 'Cannot start chat with yourself' });
    }

    // Validate recipient ID
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: 'Invalid recipient ID' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient || recipient.accountStatus !== 'active') {
      return res.status(404).json({ message: 'User not found or inactive' });
    }

    const currentUser = await User.findById(req.user.userId);

    if (!currentUser) {
      return res.status(401).json({ message: 'Current user not found' });
    }

    // Check if users have blocked each other
    if (currentUser.blockedUsers.some(id => id.equals(recipient._id)) ||
        recipient.blockedUsers.some(id => id.equals(currentUser._id))) {
      return res.status(403).json({ message: 'Cannot start chat with this user' });
    }

    // Check for existing chat
    let chat = await Chat.findOne({
      participants: { $all: [req.user.userId, recipient._id] },
      isActive: true
    });

    if (chat) {
      return res.json({ chatId: chat._id, existing: true });
    }

    // Create new chat
    chat = await Chat.createNewChat(req.user.userId, recipient._id);

    await chat.populate('participants', 'firstName lastName profilePhoto gender wali');

    res.status(201).json({ chatId: chat._id, existing: false, chat });
  } catch (error) {
    console.error('Start chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/:chatId/messages', auth, messageRateLimit, async (req, res) => {
  try {
    const { content, type = 'text' } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: 'Message too long (max 1000 characters)' });
    }

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.userId,
      isActive: true
    })
      .populate('participants', 'firstName lastName profilePhoto gender wali')
      .populate('waliSupervision.waliUser', 'firstName lastName email');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or inactive' });
    }

    // Check if user can send messages
    const canSend = chat.canUserSendMessage(req.user.userId);
    if (!canSend) {
      return res.status(403).json({
        message: 'Cannot send messages in this chat',
        requiresWaliApproval: chat.waliSupervision.isRequired && !chat.waliSupervision.isApproved
      });
    }

    // Add message to chat
    const message = await chat.addMessage(req.user.userId, content, type);

    // Ensure sender info is populated for response
    await chat.populate({
      path: 'messages.sender',
      select: 'firstName lastName profilePhoto gender'
    });

    const populatedMessage = chat.messages.id(message._id);

    // Send real-time message via Pusher
    const recipientId = chat.participants.find(p => !p.equals(req.user.userId));
    if (recipientId) {
      const messageData = {
        ...populatedMessage.toObject(),
        senderName: `${req.user.firstName} ${req.user.lastName}`
      };

      await pusherService.sendNewMessage(chat._id, messageData, recipientId);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request wali supervision
router.post('/:chatId/request-wali-supervision', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    await chat.requestWaliApproval(req.user.userId);
    
    res.json({ message: 'Wali supervision requested successfully' });
  } catch (error) {
    console.error('Request wali supervision error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Approve wali supervision (for wali users)
router.post('/:chatId/approve-wali-supervision', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('participants', 'wali');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a wali for any participant
    const isWali = chat.participants.some(participant => 
      participant.wali && participant.wali.toString() === String(req.user.userId)
    );

    if (!isWali) {
      return res.status(403).json({ message: 'Not authorized to approve this chat' });
    }

    await chat.approveByWali(req.user.userId);
    
    res.json({ message: 'Chat approved successfully' });
  } catch (error) {
    console.error('Approve wali supervision error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Block chat
router.post('/:chatId/block', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    await chat.blockChat(req.user.userId);
    
    res.json({ message: 'Chat blocked successfully' });
  } catch (error) {
    console.error('Block chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report chat
router.post('/:chatId/report', auth, async (req, res) => {
  try {
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Report reason is required' });
    }

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Add report
    chat.reports.push({
      reportedBy: req.user.userId,
      reason,
      description: description || '',
      reportedAt: new Date()
    });

    await chat.save();
    
    res.json({ message: 'Chat reported successfully' });
  } catch (error) {
    console.error('Report chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete chat (soft delete)
router.delete('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Add user to deletedFor array
    const alreadyDeletedForUser = chat.deletedFor.some(id => id.equals(req.user.userId));

    if (!alreadyDeletedForUser) {
      chat.deletedFor.push(req.user.userId);
    }

    // If both participants have deleted, mark as deleted
    if (chat.deletedFor.length === chat.participants.length) {
      chat.status = 'deleted';
    }

    await chat.save();
    
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get wali supervised chats (for wali users)
router.get('/wali/supervised', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      'waliSupervision.waliUser': req.user.userId,
      isActive: true
    })
      .populate('participants', 'firstName lastName profilePhoto')
      .populate('lastMessage.sender', 'firstName lastName')
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Get supervised chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;