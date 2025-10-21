const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { auth, adminAuth } = require('../middleware/auth');
const PhotoVerification = require('../models/PhotoVerification');
const User = require('../models/User');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   POST /api/photo-verification/submit
// @desc    Submit photo for verification
// @access  Private
router.post('/submit', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo file provided'
      });
    }

    // Check if user already has a pending verification
    const existingPending = await PhotoVerification.findOne({
      user: req.user.userId,
      status: 'pending'
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending photo verification request'
      });
    }

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'photo_verifications',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const uploadResult = await uploadPromise;

    // Create verification request
    const verification = new PhotoVerification({
      user: req.user.userId,
      photoUrl: uploadResult.secure_url,
      cloudinaryId: uploadResult.public_id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      checks: {
        faceDetected: true, // TODO: Implement actual face detection
        multipleFaces: false,
        appropriateContent: true,
        imageQuality: 'good'
      }
    });

    await verification.save();

    res.status(201).json({
      success: true,
      message: 'Photo verification submitted successfully. Our team will review it shortly.',
      verification: {
        id: verification._id,
        status: verification.status,
        submittedAt: verification.submittedAt
      }
    });

  } catch (error) {
    console.error('Photo verification submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit photo for verification'
    });
  }
});

// @route   GET /api/photo-verification/status
// @desc    Get user's verification status
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const verification = await PhotoVerification.getLatestForUser(req.user.userId);

    res.json({
      success: true,
      verification: verification ? {
        id: verification._id,
        status: verification.status,
        photoUrl: verification.photoUrl,
        submittedAt: verification.submittedAt,
        reviewedAt: verification.reviewedAt,
        rejectionReason: verification.rejectionReason
      } : null
    });

  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification status'
    });
  }
});

// @route   GET /api/photo-verification/admin/pending
// @desc    Get all pending photo verifications (Admin)
// @access  Private (Admin)
router.get('/admin/pending', adminAuth, async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const verifications = await PhotoVerification.find({ status: 'pending' })
      .populate('user', 'firstName lastName email profilePhoto age gender')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totalPending = await PhotoVerification.getPendingCount();

    res.json({
      success: true,
      count: verifications.length,
      total: totalPending,
      verifications
    });

  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending verifications'
    });
  }
});

// @route   POST /api/photo-verification/admin/approve/:verificationId
// @desc    Approve photo verification (Admin)
// @access  Private (Admin)
router.post('/admin/approve/:verificationId', adminAuth, async (req, res) => {
  try {
    const verification = await PhotoVerification.findById(req.params.verificationId);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found'
      });
    }

    if (verification.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Verification has already been reviewed'
      });
    }

    // Approve verification
    verification.status = 'approved';
    verification.reviewedBy = req.user.userId;
    verification.reviewedAt = new Date();
    verification.adminNotes = req.body.notes || '';
    await verification.save();

    // Update user's verification status
    await User.findByIdAndUpdate(verification.user, {
      isPhotoVerified: true,
      verificationBadge: 'verified'
    });

    res.json({
      success: true,
      message: 'Photo verification approved',
      verification
    });

  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve verification'
    });
  }
});

// @route   POST /api/photo-verification/admin/reject/:verificationId
// @desc    Reject photo verification (Admin)
// @access  Private (Admin)
router.post('/admin/reject/:verificationId', adminAuth, async (req, res) => {
  try {
    const { reason, notes } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const verification = await PhotoVerification.findById(req.params.verificationId);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found'
      });
    }

    if (verification.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Verification has already been reviewed'
      });
    }

    // Reject verification
    verification.status = 'rejected';
    verification.reviewedBy = req.user.userId;
    verification.reviewedAt = new Date();
    verification.rejectionReason = reason;
    verification.adminNotes = notes || '';
    await verification.save();

    res.json({
      success: true,
      message: 'Photo verification rejected',
      verification
    });

  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject verification'
    });
  }
});

// @route   GET /api/photo-verification/admin/stats
// @desc    Get verification statistics (Admin)
// @access  Private (Admin)
router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    const stats = await PhotoVerification.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsObj = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    stats.forEach(stat => {
      statsObj[stat._id] = stat.count;
      statsObj.total += stat.count;
    });

    res.json({
      success: true,
      stats: statsObj
    });

  } catch (error) {
    console.error('Get verification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification statistics'
    });
  }
});

module.exports = router;
