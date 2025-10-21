const mongoose = require('mongoose');

const photoVerificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Photo details
  photoUrl: {
    type: String,
    required: true
  },
  cloudinaryId: {
    type: String,
    required: true
  },

  // Verification status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  // Admin review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  rejectionReason: String,
  adminNotes: String,

  // Automated checks (can be enhanced with AI/ML)
  checks: {
    faceDetected: {
      type: Boolean,
      default: null
    },
    multipleF aces: {
      type: Boolean,
      default: null
    },
    appropriateContent: {
      type: Boolean,
      default: null
    },
    imageQuality: {
      type: String,
      enum: ['good', 'poor', 'unacceptable', null],
      default: null
    }
  },

  // Submission metadata
  submittedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Indexes
photoVerificationSchema.index({ user: 1, status: 1 });
photoVerificationSchema.index({ status: 1, createdAt: -1 });
photoVerificationSchema.index({ reviewedBy: 1 });

// Static method to get pending count
photoVerificationSchema.statics.getPendingCount = async function() {
  return await this.countDocuments({ status: 'pending' });
};

// Static method to get user's latest verification
photoVerificationSchema.statics.getLatestForUser = async function(userId) {
  return await this.findOne({ user: userId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('PhotoVerification', photoVerificationSchema);
