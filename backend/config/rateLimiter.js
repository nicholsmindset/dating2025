const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const RedisStore = require('rate-limit-redis');
const config = require('./env');

const redisClient = new Redis(config.REDIS_URL, {
  enableReadyCheck: true,
});

redisClient.on('error', (error) => {
  console.error('Redis connection error for rate limiting:', error);
});

(async () => {
  try {
    await redisClient.ping();
    console.log('Connected to Redis for rate limiting');
  } catch (error) {
    console.error('Unable to connect to Redis for rate limiting:', error);
    process.exit(1);
  }
})();

const store = new RedisStore({
  sendCommand: (...args) => redisClient.call(...args),
});

const createRateLimiter = (options = {}) =>
  rateLimit({
    store,
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });

module.exports = {
  createRateLimiter,
  redisClient,
};
