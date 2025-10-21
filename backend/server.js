const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import logger
const { logger, requestLogger, errorLogger } = require('./services/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Stripe webhook endpoint needs raw body
app.use('/api/subscription/webhook', express.raw({type: 'application/json'}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// MongoDB connection
// NOTE: useNewUrlParser and useUnifiedTopology are deprecated and no longer needed in Mongoose 6+
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/islamic-dating')
.then(() => logger.info('MongoDB connected successfully'))
.catch(err => logger.error('MongoDB connection error', err));

// API V1 Routes (New Enhanced Features)
app.use('/api/v1/subscription-plans', require('./routes/v1/subscriptionPlans'));
app.use('/api/v1/purchases', require('./routes/v1/purchases'));
app.use('/api/v1/virtual-gifts', require('./routes/v1/virtualGifts'));
app.use('/api/v1/matching', require('./routes/v1/matching'));
app.use('/api/v1/compatibility', require('./routes/v1/compatibility'));
app.use('/api/v1/profile', require('./routes/v1/profile'));
app.use('/api/v1/icebreakers', require('./routes/v1/icebreakers'));

// Legacy Routes (Backward Compatibility)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/pusher', require('./routes/pusher'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'disconnected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    }
  };

  // Check database connection
  try {
    if (mongoose.connection.readyState === 1) {
      healthCheck.services.database = 'connected';
    } else {
      healthCheck.status = 'DEGRADED';
      healthCheck.services.database = 'disconnected';
    }
  } catch (error) {
    healthCheck.status = 'ERROR';
    healthCheck.services.database = 'error';
  }

  const statusCode = healthCheck.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// Error logging middleware
app.use(errorLogger);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err, {
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Socket.io setup for real-time chat
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info('Socket.io connection established', { socketId: socket.id });

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    logger.info('User joined chat room', { socketId: socket.id, roomId });
  });

  socket.on('send_message', (data) => {
    socket.to(data.roomId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    logger.info('Socket.io connection closed', { socketId: socket.id });
  });
});

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`💚 Health check: http://localhost:${PORT}/api/health`);
});