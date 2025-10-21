const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware - checks for validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Common validation rules
 */
const validationRules = {
  // User ID validation
  userId: [
    param('userId').isMongoId().withMessage('Invalid user ID format')
  ],

  // Chat ID validation
  chatId: [
    param('chatId').isMongoId().withMessage('Invalid chat ID format')
  ],

  // Pagination validation
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],

  // Message content validation
  message: [
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters'),
    body('type')
      .optional()
      .isIn(['text', 'image', 'system'])
      .withMessage('Invalid message type')
  ],

  // Profile update validation
  profileUpdate: [
    body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
    body('bio').optional().trim().isLength({ max: 1000 }).withMessage('Bio must not exceed 1000 characters'),
    body('height').optional().isInt({ min: 100, max: 250 }).withMessage('Height must be between 100-250 cm'),
    body('education').optional().isIn(['high_school', 'diploma', 'bachelor', 'master', 'phd', 'other']).withMessage('Invalid education level')
  ],

  // Report validation
  report: [
    body('reason')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Reason must be 3-100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
  ],

  // Registration validation
  registration: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
    body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required')
      .custom((value) => {
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        if (age < 18) throw new Error('Must be at least 18 years old');
        return true;
      }),
    body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female'),
    body('maritalStatus').isIn(['never_married', 'widow', 'divorced', 'separated']).withMessage('Invalid marital status'),
    body('religiousLevel').isIn(['practicing', 'moderate', 'learning']).withMessage('Invalid religious level'),
    body('prayerFrequency').isIn(['5_times_daily', 'regularly', 'sometimes', 'rarely']).withMessage('Invalid prayer frequency')
  ],

  // Age range validation
  ageRange: [
    query('minAge').optional().isInt({ min: 18, max: 100 }).withMessage('Min age must be 18-100'),
    query('maxAge').optional().isInt({ min: 18, max: 100 }).withMessage('Max age must be 18-100')
      .custom((value, { req }) => {
        if (req.query.minAge && parseInt(value) < parseInt(req.query.minAge)) {
          throw new Error('Max age must be greater than min age');
        }
        return true;
      })
  ],

  // Search query validation
  searchQuery: [
    param('query').trim().isLength({ min: 2, max: 100 }).withMessage('Search query must be 2-100 characters')
  ]
};

module.exports = {
  validate,
  validationRules,
  body,
  param,
  query
};
