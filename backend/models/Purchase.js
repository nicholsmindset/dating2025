const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemType: {
    type: String,
    required: true,
    enum: [
      'profile_boost',
      'super_likes_pack',
      'read_receipts',
      'virtual_gift',
      'rewind_pack',
      'verification_badge',
      'background_check'
    ]
  },
  itemDetails: {
    name: String,
    quantity: { type: Number, default: 1 },
    description: String
  },
  price: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'SGD'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  stripePaymentIntentId: String,
  stripeChargeId: String,
  // For virtual gifts
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  giftMessage: String,
  // For boosts
  boostStartTime: Date,
  boostEndTime: Date,
  boostDuration: Number, // in minutes
  // Usage tracking
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: Date,
  expiresAt: Date
}, {
  timestamps: true
});

purchaseSchema.index({ user: 1, createdAt: -1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ itemType: 1, user: 1 });
purchaseSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
