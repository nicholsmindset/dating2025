const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const waliSchema = new mongoose.Schema({
  // Wali Personal Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  relation: {
    type: String,
    required: true,
    enum: ['father', 'brother', 'uncle', 'imam', 'other']
  },

  // Authentication
  password: {
    type: String,
    select: false
  },
  accessToken: {
    type: String,
    select: false
  },
  tokenExpiry: {
    type: Date
  },

  // Ward (the user they're guardian for)
  ward: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Access Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,

  // Access Permissions
  permissions: {
    canViewProfile: {
      type: Boolean,
      default: true
    },
    canViewMatches: {
      type: Boolean,
      default: true
    },
    canViewMessages: {
      type: Boolean,
      default: true
    },
    canApproveConversations: {
      type: Boolean,
      default: true
    },
    canBlockUsers: {
      type: Boolean,
      default: true
    },
    requireApprovalForNewChats: {
      type: Boolean,
      default: false // If true, ward can't start chats without approval
    }
  },

  // Activity Tracking
  lastLogin: Date,
  loginHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],

  // Notification Preferences
  notifications: {
    emailOnNewMatch: {
      type: Boolean,
      default: true
    },
    emailOnNewMessage: {
      type: Boolean,
      default: false // Too many notifications
    },
    emailOnNewConversation: {
      type: Boolean,
      default: true
    },
    emailOnProfileUpdate: {
      type: Boolean,
      default: true
    },
    weeklyDigest: {
      type: Boolean,
      default: true
    }
  },

  // Actions History
  actions: [{
    actionType: {
      type: String,
      enum: ['approved_conversation', 'rejected_conversation', 'blocked_user', 'viewed_profile', 'viewed_messages']
    },
    targetId: mongoose.Schema.Types.ObjectId, // ID of chat or user
    notes: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
waliSchema.index({ email: 1 });
waliSchema.index({ ward: 1 });
waliSchema.index({ isActive: 1, isVerified: 1 });

// Hash password before saving
waliSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
waliSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate access token method
waliSchema.methods.generateAccessToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.accessToken = token;
  this.tokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  return token;
};

// Verify access token
waliSchema.methods.verifyAccessToken = function(token) {
  if (!this.accessToken || !this.tokenExpiry) return false;
  if (this.accessToken !== token) return false;
  if (new Date() > this.tokenExpiry) return false;
  return true;
};

// Record action
waliSchema.methods.recordAction = function(actionType, targetId, notes = '') {
  this.actions.push({
    actionType,
    targetId,
    notes,
    timestamp: new Date()
  });

  // Keep only last 100 actions
  if (this.actions.length > 100) {
    this.actions = this.actions.slice(-100);
  }

  return this.save();
};

// Check permission
waliSchema.methods.hasPermission = function(permissionName) {
  if (!this.isActive || !this.isVerified) return false;
  return this.permissions[permissionName] === true;
};

// Record login
waliSchema.methods.recordLogin = function(ipAddress, userAgent) {
  this.lastLogin = new Date();
  this.loginHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent
  });

  // Keep only last 50 login records
  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(-50);
  }

  return this.save();
};

// Ensure virtual fields are serialized
waliSchema.set('toJSON', { virtuals: true });
waliSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Wali', waliSchema);
