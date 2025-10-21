const mongoose = require('mongoose');

const profileBoostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  boostType: {
    type: String,
    enum: ['standard', 'spotlight', 'prime_time'],
    default: 'standard'
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true // in minutes
  },
  // Analytics
  impressions: {
    type: Number,
    default: 0
  },
  profileViews: {
    type: Number,
    default: 0
  },
  likesReceived: {
    type: Number,
    default: 0
  },
  matchesCreated: {
    type: Number,
    default: 0
  },
  // Purchase reference
  purchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase'
  },
  // Scheduling
  isAutoActivated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

profileBoostSchema.index({ user: 1, status: 1 });
profileBoostSchema.index({ startTime: 1, endTime: 1 });
profileBoostSchema.index({ status: 1, endTime: 1 });

// Check if boost is currently active
profileBoostSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && now >= this.startTime && now <= this.endTime;
};

// Activate boost
profileBoostSchema.methods.activate = function() {
  this.status = 'active';
  if (!this.startTime || this.startTime > new Date()) {
    this.startTime = new Date();
  }
  if (!this.endTime) {
    this.endTime = new Date(this.startTime.getTime() + this.duration * 60000);
  }
  return this.save();
};

// Complete boost
profileBoostSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

module.exports = mongoose.model('ProfileBoost', profileBoostSchema);
