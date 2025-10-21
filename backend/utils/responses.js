/**
 * Standard API response helpers for consistency across all routes
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {String} message - Success message (optional)
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
const successResponse = (res, data = null, message = null, statusCode = 200) => {
  const response = {
    success: true
  };

  if (message) response.message = message;
  if (data) response.data = data;

  return res.status(statusCode).json(response);
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 500)
 * @param {Array} errors - Validation errors (optional)
 */
const errorResponse = (res, message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) response.errors = errors;

  return res.status(statusCode).json(response);
};

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @param {Number} total - Total number of items
 * @param {String} message - Success message (optional)
 */
const paginatedResponse = (res, data, page, limit, total, message = null) => {
  const response = {
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };

  if (message) response.message = message;

  return res.status(200).json(response);
};

/**
 * Created response (201)
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {String} message - Success message (optional)
 */
const createdResponse = (res, data, message = 'Resource created successfully') => {
  return successResponse(res, data, message, 201);
};

/**
 * No content response (204)
 * @param {Object} res - Express response object
 */
const noContentResponse = (res) => {
  return res.status(204).send();
};

/**
 * Not found response (404)
 * @param {Object} res - Express response object
 * @param {String} message - Error message (default: 'Resource not found')
 */
const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, 404);
};

/**
 * Unauthorized response (401)
 * @param {Object} res - Express response object
 * @param {String} message - Error message (default: 'Unauthorized access')
 */
const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return errorResponse(res, message, 401);
};

/**
 * Forbidden response (403)
 * @param {Object} res - Express response object
 * @param {String} message - Error message (default: 'Access forbidden')
 */
const forbiddenResponse = (res, message = 'Access forbidden') => {
  return errorResponse(res, message, 403);
};

/**
 * Bad request response (400)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Array} errors - Validation errors (optional)
 */
const badRequestResponse = (res, message, errors = null) => {
  return errorResponse(res, message, 400, errors);
};

/**
 * Conflict response (409)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const conflictResponse = (res, message) => {
  return errorResponse(res, message, 409);
};

/**
 * Too many requests response (429)
 * @param {Object} res - Express response object
 * @param {String} message - Error message (default: 'Too many requests')
 */
const tooManyRequestsResponse = (res, message = 'Too many requests. Please try again later.') => {
  return errorResponse(res, message, 429);
};

/**
 * Server error response (500)
 * @param {Object} res - Express response object
 * @param {String} message - Error message (default: 'Internal server error')
 * @param {Error} error - Error object for logging (optional, not sent to client in production)
 */
const serverErrorResponse = (res, message = 'Internal server error', error = null) => {
  if (error && process.env.NODE_ENV === 'development') {
    console.error('Server Error:', error);
    return errorResponse(res, message, 500, [{ message: error.message, stack: error.stack }]);
  }
  return errorResponse(res, message, 500);
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  conflictResponse,
  tooManyRequestsResponse,
  serverErrorResponse
};
