const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format (for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logs directory path
const logsDir = path.join(__dirname, '../logs');

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'islamic-dating-api' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write security-related logs
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ]
});

// If not in production, also log to console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Create specialized logging functions
class Logger {
  /**
   * Log general information
   */
  info(message, meta = {}) {
    logger.info(message, meta);
  }

  /**
   * Log errors
   */
  error(message, error = null, meta = {}) {
    if (error instanceof Error) {
      logger.error(message, {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        ...meta
      });
    } else {
      logger.error(message, meta);
    }
  }

  /**
   * Log warnings
   */
  warn(message, meta = {}) {
    logger.warn(message, meta);
  }

  /**
   * Log debug information
   */
  debug(message, meta = {}) {
    logger.debug(message, meta);
  }

  /**
   * Log security events
   */
  security(event, meta = {}) {
    logger.warn(`[SECURITY] ${event}`, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log authentication events
   */
  auth(event, userId = null, meta = {}) {
    logger.info(`[AUTH] ${event}`, {
      userId,
      ...meta,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log API requests
   */
  request(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user?.userId || 'anonymous',
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`
    };

    if (res.statusCode >= 400) {
      logger.warn('[API REQUEST]', meta);
    } else {
      logger.info('[API REQUEST]', meta);
    }
  }

  /**
   * Log database operations
   */
  database(operation, collection, meta = {}) {
    logger.debug(`[DB] ${operation} on ${collection}`, meta);
  }

  /**
   * Log payment transactions
   */
  payment(event, amount, userId, meta = {}) {
    logger.info(`[PAYMENT] ${event}`, {
      amount,
      userId,
      ...meta,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log user actions
   */
  userAction(action, userId, meta = {}) {
    logger.info(`[USER ACTION] ${action}`, {
      userId,
      ...meta,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log suspicious activity
   */
  suspicious(activity, meta = {}) {
    logger.warn(`[SUSPICIOUS] ${activity}`, {
      ...meta,
      timestamp: new Date().toISOString(),
      severity: 'high'
    });
  }
}

// Create logger instance
const loggerInstance = new Logger();

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    loggerInstance.request(req, res, responseTime);
  });

  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  loggerInstance.error('Express error', err, {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userId: req.user?.userId || 'anonymous'
  });

  next(err);
};

module.exports = {
  logger: loggerInstance,
  requestLogger,
  errorLogger
};
