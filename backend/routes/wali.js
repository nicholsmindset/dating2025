const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Wali = require('../models/Wali');
const User = require('../models/User');
const Chat = require('../models/Chat');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for wali routes
const waliAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later.'
});

// Wali authentication middleware
const waliAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'wali') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const wali = await Wali.findById(decoded.waliId);

    if (!wali || !wali.isActive || !wali.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Wali account not found or inactive'
      });
    }

    req.wali = wali;
    next();
  } catch (error) {
    console.error('Wali auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// @route   POST /api/wali/setup
// @desc    Initial wali setup (called when user registers with wali)
// @access  Public (but requires valid user wali data)
router.post('/setup', [
  body('email').isEmail().normalizeEmail(),
  body('name').trim().isLength({ min: 2 }),
  body('phone').trim().notEmpty(),
  body('relation').isIn(['father', 'brother', 'uncle', 'imam', 'other']),
  body('wardId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, name, phone, relation, wardId } = req.body;

    // Verify ward exists
    const ward = await User.findById(wardId);
    if (!ward) {
      return res.status(404).json({
        success: false,
        message: 'Ward user not found'
      });
    }

    // Check if wali already exists
    let wali = await Wali.findOne({ email });

    if (wali) {
      return res.status(400).json({
        success: false,
        message: 'Wali account already exists with this email'
      });
    }

    // Create wali account
    wali = new Wali({
      email,
      name,
      phone,
      relation,
      ward: wardId,
      isVerified: false // Will be verified via email
    });

    // Generate verification token
    const crypto = require('crypto');
    wali.verificationToken = crypto.randomBytes(32).toString('hex');

    await wali.save();

    // TODO: Send verification email to wali

    res.status(201).json({
      success: true,
      message: 'Wali account created. Verification email sent.',
      waliId: wali._id
    });

  } catch (error) {
    console.error('Wali setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during wali setup'
    });
  }
});

// @route   POST /api/wali/verify-email
// @desc    Verify wali email and set password
// @access  Public
router.post('/verify-email', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    const wali = await Wali.findOne({ verificationToken: token });

    if (!wali) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Set password and verify account
    wali.password = password;
    wali.isVerified = true;
    wali.verificationToken = undefined;
    await wali.save();

    // Generate JWT token
    const authToken = jwt.sign(
      { waliId: wali._id, type: 'wali' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Wali account verified successfully',
      token: authToken,
      wali: {
        id: wali._id,
        name: wali.name,
        email: wali.email,
        ward: wali.ward
      }
    });

  } catch (error) {
    console.error('Wali verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
});

// @route   POST /api/wali/login
// @desc    Wali login
// @access  Public
router.post('/login', [
  waliAuthLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const wali = await Wali.findOne({ email }).select('+password');

    if (!wali) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!wali.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    if (!wali.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    const isPasswordValid = await wali.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Record login
    await wali.recordLogin(req.ip, req.get('user-agent'));

    // Generate token
    const token = jwt.sign(
      { waliId: wali._id, type: 'wali' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      wali: {
        id: wali._id,
        name: wali.name,
        email: wali.email,
        ward: wali.ward,
        permissions: wali.permissions
      }
    });

  } catch (error) {
    console.error('Wali login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/wali/dashboard
// @desc    Get wali dashboard data (ward's activity overview)
// @access  Private (Wali)
router.get('/dashboard', waliAuth, async (req, res) => {
  try {
    const ward = await User.findById(req.wali.ward)
      .select('-password -resetPasswordToken -verificationToken')
      .populate('likedProfiles', 'firstName lastName profilePhoto age maritalStatus')
      .lean();

    if (!ward) {
      return res.status(404).json({
        success: false,
        message: 'Ward not found'
      });
    }

    // Get ward's active chats
    const chats = await Chat.find({
      participants: ward._id,
      isActive: true
    })
    .populate('participants', 'firstName lastName profilePhoto age')
    .select('participants lastMessage createdAt waliSupervision')
    .sort({ 'lastMessage.sentAt': -1 })
    .limit(10)
    .lean();

    // Get chats pending wali approval
    const pendingApproval = await Chat.find({
      'waliSupervision.waliUser': req.wali._id,
      'waliSupervision.isRequired': true,
      'waliSupervision.isApproved': false
    })
    .populate('participants', 'firstName lastName profilePhoto age')
    .lean();

    // Get statistics
    const stats = {
      totalLikes: ward.likedProfiles?.length || 0,
      totalProfileViews: ward.profileViews?.length || 0,
      activeChats: chats.length,
      pendingApproval: pendingApproval.length,
      accountCreated: ward.createdAt,
      lastSeen: ward.lastSeen,
      subscriptionPlan: ward.subscription?.plan || 'free'
    };

    res.json({
      success: true,
      ward: {
        id: ward._id,
        firstName: ward.firstName,
        lastName: ward.lastName,
        age: ward.age,
        profilePhoto: ward.profilePhoto,
        bio: ward.bio,
        location: ward.location,
        maritalStatus: ward.maritalStatus,
        religiousLevel: ward.religiousLevel,
        prayerFrequency: ward.prayerFrequency
      },
      recentChats: chats,
      pendingApproval,
      stats
    });

  } catch (error) {
    console.error('Wali dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/wali/chats/:chatId
// @desc    View specific chat conversation
// @access  Private (Wali)
router.get('/chats/:chatId', waliAuth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('participants', 'firstName lastName profilePhoto age maritalStatus religiousLevel')
      .populate('messages.sender', 'firstName lastName')
      .lean();

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Verify wali has permission to view this chat
    const isWaliChat = chat.waliSupervision?.waliUser?.toString() === req.wali._id.toString();
    const isWardParticipant = chat.participants.some(p => p._id.toString() === req.wali.ward.toString());

    if (!isWaliChat && !isWardParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this chat'
      });
    }

    // Record action
    await req.wali.recordAction('viewed_messages', chat._id);

    res.json({
      success: true,
      chat
    });

  } catch (error) {
    console.error('Wali view chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/wali/chats/:chatId/approve
// @desc    Approve a conversation
// @access  Private (Wali)
router.post('/chats/:chatId/approve', waliAuth, async (req, res) => {
  try {
    if (!req.wali.hasPermission('canApproveConversations')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to approve conversations'
      });
    }

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Verify this wali is assigned to this chat
    if (chat.waliSupervision.waliUser?.toString() !== req.wali._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to supervise this conversation'
      });
    }

    // Approve conversation
    await chat.approveByWali();

    // Record action
    await req.wali.recordAction('approved_conversation', chat._id, req.body.notes || '');

    res.json({
      success: true,
      message: 'Conversation approved successfully',
      chat: {
        id: chat._id,
        isApproved: chat.waliSupervision.isApproved,
        approvedAt: chat.waliSupervision.approvedAt
      }
    });

  } catch (error) {
    console.error('Wali approve chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/wali/chats/:chatId/reject
// @desc    Reject/block a conversation
// @access  Private (Wali)
router.post('/chats/:chatId/reject', waliAuth, async (req, res) => {
  try {
    if (!req.wali.hasPermission('canBlockUsers')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to block conversations'
      });
    }

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Block conversation
    await chat.blockChat(req.wali.ward);

    // Record action
    await req.wali.recordAction('rejected_conversation', chat._id, req.body.reason || '');

    res.json({
      success: true,
      message: 'Conversation blocked successfully'
    });

  } catch (error) {
    console.error('Wali reject chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/wali/activity
// @desc    Get wali's activity history
// @access  Private (Wali)
router.get('/activity', waliAuth, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const wali = await Wali.findById(req.wali._id);

    const activities = wali.actions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(parseInt(skip), parseInt(skip) + parseInt(limit));

    res.json({
      success: true,
      count: activities.length,
      total: wali.actions.length,
      activities
    });

  } catch (error) {
    console.error('Wali activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/wali/settings
// @desc    Update wali notification settings
// @access  Private (Wali)
router.put('/settings', waliAuth, async (req, res) => {
  try {
    const { notifications, permissions } = req.body;

    const wali = await Wali.findById(req.wali._id);

    if (notifications) {
      wali.notifications = { ...wali.notifications, ...notifications };
    }

    // Note: permissions updates should be restricted or require additional verification
    // For now, we'll only allow updating notification preferences

    await wali.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      wali: {
        notifications: wali.notifications,
        permissions: wali.permissions
      }
    });

  } catch (error) {
    console.error('Wali settings update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/wali/ward/matches
// @desc    View ward's match suggestions
// @access  Private (Wali)
router.get('/ward/matches', waliAuth, async (req, res) => {
  try {
    if (!req.wali.hasPermission('canViewMatches')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view matches'
      });
    }

    const { getMatchSuggestions } = require('../services/matchingService');

    const matches = await getMatchSuggestions(req.wali.ward, {
      limit: 20,
      skip: 0,
      minScore: 40
    });

    res.json({
      success: true,
      count: matches.length,
      matches
    });

  } catch (error) {
    console.error('Wali view matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
