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
      enum: ['free', 'basic', 'premium', 'vip'],
      default: 'free'
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual'],
      default: 'monthly'
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
    },
    // Usage tracking for premium features
    superLikesRemaining: {
      type: Number,
      default: 0
    },
    boostsRemaining: {
      type: Number,
      default: 0
    },
    lastMonthlyReset: Date
  },

  // Profile Verification
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationMethod: {
      type: String,
      enum: ['photo', 'id', 'phone', 'email', 'manual'],
      default: null
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationBadgeActive: {
      type: Boolean,
      default: false
    }
  },

  // Profile Completion
  profileCompletion: {
    percentage: {
      type: Number,
      default: 0
    },
    missingFields: [String],
    lastCalculated: Date
  },

  // Compatibility Quiz
  hasCompletedQuiz: {
    type: Boolean,
    default: false
  },

  // Today's Top Picks tracking
  topPicks: {
    lastGenerated: Date,
    generatedFor: Date, // The date these picks are for
    picks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },

  // Who Liked Me (premium feature)
  likedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    },
    isSeen: {
      type: Boolean,
      default: false
    }
  }],
  
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
  const lastReset = new Date(this.subscription.lastResetDate);
  
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.subscription.profileViewsThisMonth = 0;
    this.subscription.lastResetDate = now;
  }
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

// Calculate profile completion percentage
userSchema.methods.calculateProfileCompletion = function() {
  const requiredFields = [
    'firstName',
    'lastName',
    'email',
    'dateOfBirth',
    'gender',
    'maritalStatus',
    'religiousLevel',
    'prayerFrequency',
    'location.country',
    'location.city'
  ];

  const optionalFields = [
    'bio',
    'occupation',
    'education',
    'height',
    'ethnicity',
    'languages',
    'profilePhoto',
    'wali.hasWali'
  ];

  const bonusFields = [
    'partnerPreferences.ageRange.min',
    'partnerPreferences.ageRange.max',
    'partnerPreferences.religiousLevel',
    'hasCompletedQuiz'
  ];

  let score = 0;
  let totalPossible = 100;
  const missing = [];

  // Required fields: 40 points
  const requiredWeight = 40 / requiredFields.length;
  requiredFields.forEach((field) => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], this);
    if (value) {
      score += requiredWeight;
    } else {
      missing.push(field);
    }
  });

  // Optional fields: 40 points
  const optionalWeight = 40 / optionalFields.length;
  optionalFields.forEach((field) => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], this);
    if (value) {
      score += optionalWeight;
    } else {
      missing.push(field);
    }
  });

  // Bonus fields: 20 points
  const bonusWeight = 20 / bonusFields.length;
  bonusFields.forEach((field) => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], this);
    if (value) {
      score += bonusWeight;
    } else {
      missing.push(field);
    }
  });

  // Photos: +5 points per photo (up to 3)
  if (this.profileImages && this.profileImages.length > 0) {
    score += Math.min(this.profileImages.length * 5, 15);
  }

  this.profileCompletion = {
    percentage: Math.round(Math.min(score, 100)),
    missingFields: missing,
    lastCalculated: new Date()
  };

  return this.profileCompletion.percentage;
};

// Check if user has active premium subscription
userSchema.methods.isPremium = function() {
  return ['basic', 'premium', 'vip'].includes(this.subscription.plan) &&
         (!this.subscription.endDate || new Date() < new Date(this.subscription.endDate));
};

// Get subscription tier
userSchema.methods.getSubscriptionTier = function() {
  if (this.isPremium()) {
    return this.subscription.plan;
  }
  return 'free';
};

// Reset monthly limits (super likes, boosts, etc.)
userSchema.methods.resetMonthlyLimits = async function() {
  const SubscriptionPlan = mongoose.model('SubscriptionPlan');
  const plan = await SubscriptionPlan.findOne({ name: this.subscription.plan });

  if (plan) {
    this.subscription.superLikesRemaining = plan.features.superLikesPerMonth || 0;
    this.subscription.boostsRemaining = plan.features.profileBoostPerMonth || 0;
    this.subscription.profileViewsThisMonth = 0;
    this.subscription.lastMonthlyReset = new Date();
    await this.save();
  }
};

// Check if user can use feature
userSchema.methods.canUseFeature = async function(featureName) {
  const SubscriptionPlan = mongoose.model('SubscriptionPlan');
  const plan = await SubscriptionPlan.findOne({ name: this.subscription.plan });

  if (!plan) {
    return false;
  }

  // Map feature names to plan features
  const featureMap = {
    'see_who_liked_you': 'canSeeWhoLikedYou',
    'read_receipts': 'readReceipts',
    'undo_swipes': 'undoSwipes',
    'advanced_filters': 'advancedFilters',
    'video_introduction': 'videoIntroduction',
    'voice_messages': 'voiceMessages',
    'profile_analytics': 'profileAnalytics',
    'send_gifts': 'canSendVirtualGifts',
    'verification_badge': 'verificationBadge'
  };

  const planFeature = featureMap[featureName];
  return planFeature ? plan.features[planFeature] : false;
};

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);