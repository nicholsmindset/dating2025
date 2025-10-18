const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female']
  },
  
  // Islamic Specific Fields
  maritalStatus: {
    type: String,
    required: true,
    enum: ['never_married', 'widow', 'divorced', 'separated']
  },
  religiousLevel: {
    type: String,
    required: true,
    enum: ['practicing', 'moderate', 'learning']
  },
  prayerFrequency: {
    type: String,
    required: true,
    enum: ['5_times_daily', 'regularly', 'sometimes', 'rarely']
  },
  hijabWearing: {
    type: String,
    enum: ['always', 'sometimes', 'no', 'not_applicable'],
    required: function() { return this.gender === 'female'; }
  },
  
  // Wali Information (Guardian for Islamic marriage)
  wali: {
    hasWali: {
      type: Boolean,
      required: true
    },
    waliName: {
      type: String,
      required: function() { return this.wali.hasWali; }
    },
    waliRelation: {
      type: String,
      enum: ['father', 'brother', 'uncle', 'imam', 'other'],
      required: function() { return this.wali.hasWali; }
    },
    waliContact: {
      type: String,
      required: function() { return this.wali.hasWali; }
    },
    waliEmail: {
      type: String,
      required: function() { return this.wali.hasWali; }
    }
  },
  
  // Location
  location: {
    country: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: String
  },
  
  // Profile Information
  bio: {
    type: String,
    maxlength: 1000
  },
  occupation: String,
  education: {
    type: String,
    enum: ['high_school', 'diploma', 'bachelor', 'master', 'phd', 'other']
  },
  height: Number, // in cm
  ethnicity: String,
  languages: [String],
  
  // Preferences for partner
  partnerPreferences: {
    ageRange: {
      min: { type: Number, min: 18, max: 80 },
      max: { type: Number, min: 18, max: 80 }
    },
    maritalStatus: [{
      type: String,
      enum: ['widow', 'divorced', 'separated']
    }],
    religiousLevel: [{
      type: String,
      enum: ['practicing', 'moderate', 'learning']
    }],
    location: {
      countries: [String],
      maxDistance: Number // in km
    },
    education: [{
      type: String,
      enum: ['high_school', 'diploma', 'bachelor', 'master', 'phd', 'other']
    }]
  },
  
  // Profile Images
  profileImages: [{
    url: String,
    cloudinaryId: String,
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Primary profile photo URL
  profilePhoto: String,
  
  // Subscription Information
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    profileViewsThisMonth: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  
  // Account Status
  accountStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Privacy Settings
  privacy: {
    showAge: { type: Boolean, default: true },
    showLocation: { type: Boolean, default: true },
    showLastSeen: { type: Boolean, default: true },
    allowMessages: {
      type: String,
      enum: ['everyone', 'premium_only', 'matches_only'],
      default: 'everyone'
    }
  },
  
  // Activity Tracking
  lastSeen: {
    type: Date,
    default: Date.now
  },
  profileViews: [{
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Liked Profiles
  likedProfiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Blocked Users
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Reported Users
  reportedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Reports against this user
  reports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending'
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ gender: 1, maritalStatus: 1 });
userSchema.index({ 'location.country': 1, 'location.city': 1 });
userSchema.index({ isActive: 1, isVerified: 1 });
userSchema.index({ 'subscription.plan': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Reset monthly profile views
userSchema.methods.resetMonthlyViews = function() {
  const now = new Date();
  const lastReset = this.subscription?.lastResetDate ? new Date(this.subscription.lastResetDate) : null;
  const needsReset = !lastReset ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear();

  if (needsReset) {
    this.subscription.profileViewsThisMonth = 0;
    this.subscription.lastResetDate = now;

    if (Array.isArray(this.profileViews) && this.profileViews.length > 0) {
      this.profileViews = this.profileViews.filter(view => {
        const viewDate = new Date(view.viewedAt);
        return viewDate.getMonth() === now.getMonth() && viewDate.getFullYear() === now.getFullYear();
      });
    }
  }

  return needsReset;
};

userSchema.methods.recordProfileView = function(targetUserId) {
  this.resetMonthlyViews();

  const now = new Date();
  const targetIdString = targetUserId.toString();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const alreadyViewedThisMonth = this.profileViews.some(view => {
    if (!view.profileId) return false;
    const viewDate = new Date(view.viewedAt);
    return view.profileId.toString() === targetIdString &&
      viewDate.getMonth() === currentMonth &&
      viewDate.getFullYear() === currentYear;
  });

  if (alreadyViewedThisMonth) {
    return { isNewView: false };
  }

  this.profileViews.push({
    profileId: targetUserId,
    viewedAt: now
  });

  this.subscription.profileViewsThisMonth = (this.subscription.profileViewsThisMonth || 0) + 1;

  return { isNewView: true };
};

// Check if user can view more profiles
userSchema.methods.canViewProfile = function(targetUserId) {
  this.resetMonthlyViews();

  // Check if trying to view own profile
  if (this._id.toString() === targetUserId) {
    return {
      allowed: false,
      reason: 'Cannot view your own profile',
      requiresPremium: false
    };
  }
  
  // Premium users can view unlimited profiles
  if (this.subscription.plan === 'premium') {
    return {
      allowed: true,
      reason: null,
      requiresPremium: false
    };
  }
  
  // Check monthly view limit for free users
  if (this.subscription.profileViewsThisMonth >= 10) {
    return {
      allowed: false,
      reason: 'Monthly profile view limit reached. Upgrade to premium for unlimited access.',
      requiresPremium: true
    };
  }
  
  return {
    allowed: true,
    reason: null,
    requiresPremium: false
  };
};

// Get age from date of birth
userSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);