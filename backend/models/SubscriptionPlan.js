const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['free', 'basic', 'premium', 'vip']
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  price: {
    monthly: {
      amount: { type: Number, required: true },
      currency: { type: String, default: 'SGD' }
    },
    annual: {
      amount: { type: Number },
      currency: { type: String, default: 'SGD' },
      discount: { type: Number, default: 0 } // Percentage discount
    }
  },
  features: {
    profileViewsPerMonth: {
      type: Number,
      default: -1 // -1 means unlimited
    },
    canSeeWhoLikedYou: { type: Boolean, default: false },
    profileBoostPerMonth: { type: Number, default: 0 },
    superLikesPerMonth: { type: Number, default: 0 },
    canSendVirtualGifts: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    verificationBadge: { type: Boolean, default: false },
    advancedFilters: { type: Boolean, default: false },
    readReceipts: { type: Boolean, default: false },
    undoSwipes: { type: Boolean, default: false },
    profileAnalytics: { type: Boolean, default: false },
    adFree: { type: Boolean, default: false },
    videoIntroduction: { type: Boolean, default: false },
    voiceMessages: { type: Boolean, default: false }
  },
  stripePriceIdMonthly: String,
  stripePriceIdAnnual: String,
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

subscriptionPlanSchema.index({ name: 1 });
subscriptionPlanSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
