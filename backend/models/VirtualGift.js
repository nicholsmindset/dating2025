const mongoose = require('mongoose');

const virtualGiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['flowers', 'chocolates', 'islamic', 'jewelry', 'special'],
    default: 'islamic'
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
  icon: {
    type: String,
    required: true // URL to icon image or emoji
  },
  animation: String, // URL to animation file
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  // Track popularity
  purchaseCount: {
    type: Number,
    default: 0
  },
  // Special occasion gifts
  isLimitedEdition: {
    type: Boolean,
    default: false
  },
  availableFrom: Date,
  availableUntil: Date
}, {
  timestamps: true
});

virtualGiftSchema.index({ category: 1, isActive: 1 });
virtualGiftSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('VirtualGift', virtualGiftSchema);
