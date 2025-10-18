const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'system'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  // For system messages (e.g., "User joined", "Wali approved conversation")
  systemMessageType: {
    type: String,
    enum: ['user_joined', 'wali_approved', 'wali_requested', 'conversation_started'],
    required: function() { return this.messageType === 'system'; }
  }
}, {
  timestamps: true
});

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Chat metadata
  chatType: {
    type: String,
    enum: ['direct', 'wali_supervised'],
    default: 'direct'
  },
  
  // Wali supervision
  waliSupervision: {
    isRequired: {
      type: Boolean,
      default: false
    },
    waliUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    approvedAt: Date,
    requestedAt: Date,
    waliCanView: {
      type: Boolean,
      default: true
    }
  },
  
  // Messages
  messages: [messageSchema],
  
  // Chat status
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  
  // Last activity
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: Date
  },
  
  // Privacy and moderation
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  blockedAt: Date,
  
  // Reporting
  reports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate_content', 'harassment', 'spam', 'fake_profile', 'other']
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending'
    }
  }],
  
  // Islamic guidelines compliance
  guidelines: {
    respectfulCommunication: {
      type: Boolean,
      default: true
    },
    appropriateContent: {
      type: Boolean,
      default: true
    },
    // Track if conversation follows Islamic etiquette
    islamicEtiquette: {
      type: Boolean,
      default: true
    }
  },
  
  // Conversation settings
  settings: {
    allowImages: {
      type: Boolean,
      default: false
    },
    autoDeleteAfterDays: {
      type: Number,
      default: null // null means no auto-delete
    },
    requireWaliApproval: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
chatSchema.index({ participants: 1 });
chatSchema.index({ 'lastMessage.sentAt': -1 });
chatSchema.index({ isActive: 1 });
chatSchema.index({ 'waliSupervision.waliUser': 1 });
chatSchema.index({ createdAt: -1 });

// Virtual for unread message count
chatSchema.virtual('unreadCount').get(function() {
  return this.messages.filter(msg => !msg.isRead).length;
});

// Method to add a message
chatSchema.methods.addMessage = async function(senderId, content, messageType = 'text') {
  const message = {
    sender: senderId,
    content,
    messageType
  };

  this.messages.push(message);

  this.lastMessage = {
    content,
    sender: senderId,
    sentAt: new Date()
  };

  const savedChat = await this.save();
  return savedChat.messages[savedChat.messages.length - 1];
};

// Method to mark messages as read
chatSchema.methods.markAsRead = function(userId) {
  const unreadMessages = this.messages.filter(msg => 
    !msg.isRead && 
    msg.sender.toString() !== userId.toString()
  );
  
  unreadMessages.forEach(msg => {
    msg.isRead = true;
    msg.readAt = new Date();
  });
  
  return this.save();
};

// Method to check if user can send message
chatSchema.methods.canUserSendMessage = function(userId) {
  // Check if chat is active
  if (!this.isActive) return false;
  
  // Check if chat is blocked
  if (this.isBlocked) return false;
  
  // Check if user is participant
  if (!this.participants.some(participant => participant.toString() === userId.toString())) {
    return false;
  }

  // Check wali approval if required
  if (this.waliSupervision?.isRequired && !this.waliSupervision.isApproved) {
    return false;
  }

  return true;
};

chatSchema.methods.canUserViewMessages = function(userId) {
  return this.canUserSendMessage(userId);
};

// Method to request wali approval
chatSchema.methods.requestWaliApproval = function(waliUserId) {
  this.waliSupervision.isRequired = true;
  this.waliSupervision.waliUser = waliUserId;
  this.waliSupervision.requestedAt = new Date();
  this.chatType = 'wali_supervised';
  
  // Add system message
  this.messages.push({
    sender: this.participants[0], // System message from first participant
    content: 'Wali approval has been requested for this conversation.',
    messageType: 'system',
    systemMessageType: 'wali_requested'
  });
  
  return this.save();
};

// Method to approve conversation by wali
chatSchema.methods.approveByWali = function() {
  this.waliSupervision.isApproved = true;
  this.waliSupervision.approvedAt = new Date();
  
  // Add system message
  this.messages.push({
    sender: this.participants[0],
    content: 'This conversation has been approved by the wali.',
    messageType: 'system',
    systemMessageType: 'wali_approved'
  });
  
  return this.save();
};

// Method to block chat
chatSchema.methods.blockChat = function(blockedByUserId) {
  this.isBlocked = true;
  this.blockedBy = blockedByUserId;
  this.blockedAt = new Date();
  this.isActive = false;
  this.status = 'inactive';

  return this.save();
};

// Static method to create new chat
chatSchema.statics.createChat = function(participant1Id, participant2Id, requireWaliApproval = false) {
  const chatData = {
    participants: [participant1Id, participant2Id],
    chatType: requireWaliApproval ? 'wali_supervised' : 'direct'
  };
  
  if (requireWaliApproval) {
    chatData.waliSupervision = {
      isRequired: true,
      isApproved: false
    };
  }
  
  return this.create(chatData);
};

chatSchema.statics.createNewChat = function(participant1Id, participant2Id, requireWaliApproval = false) {
  return this.createChat(participant1Id, participant2Id, requireWaliApproval);
};

// Ensure virtual fields are serialized
chatSchema.set('toJSON', { virtuals: true });
chatSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Chat', chatSchema);