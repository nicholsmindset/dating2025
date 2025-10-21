/**
 * Redis Caching Service
 * Improves performance by caching frequently accessed data
 */

// Note: Redis is optional. If not configured, falls back to in-memory cache
let redis;
let inMemoryCache = new Map();

try {
  // Try to use Redis if available
  const Redis = require('ioredis');
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
      if (times > 3) {
        console.log('Redis connection failed, falling back to in-memory cache');
        return null; // Stop retrying
      }
      return Math.min(times * 100, 3000);
    }
  });

  redis.on('error', (err) => {
    console.log('Redis error:', err.message);
    redis = null; // Fall back to in-memory
  });

  redis.on('connect', () => {
    console.log('Redis connected successfully');
  });

} catch (error) {
  console.log('Redis not available, using in-memory cache');
  redis = null;
}

/**
 * Cache keys configuration
 */
const CACHE_KEYS = {
  USER_PROFILE: (userId) => `user:profile:${userId}`,
  USER_MATCHES: (userId) => `user:matches:${userId}`,
  MATCH_SUGGESTIONS: (userId) => `match:suggestions:${userId}`,
  SEARCH_RESULTS: (filters) => `search:${JSON.stringify(filters)}`,
  POPULAR_PROFILES: 'profiles:popular',
  PLATFORM_STATS: 'stats:platform',
  SUBSCRIPTION_STATUS: (userId) => `subscription:${userId}`,
  CHAT_MESSAGES: (chatId) => `chat:messages:${chatId}`,
  ONLINE_USERS: 'users:online',
  TRENDING_SEARCHES: 'searches:trending'
};

/**
 * Cache TTL (Time To Live) in seconds
 */
const CACHE_TTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 1800,       // 30 minutes
  VERY_LONG: 3600,  // 1 hour
  DAY: 86400        // 24 hours
};

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached value or null
 */
const get = async (key) => {
  try {
    if (redis) {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } else {
      // In-memory fallback
      const cached = inMemoryCache.get(key);
      if (cached && cached.expiry > Date.now()) {
        return cached.value;
      } else {
        inMemoryCache.delete(key);
        return null;
      }
    }
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
const set = async (key, value, ttl = CACHE_TTL.MEDIUM) => {
  try {
    if (redis) {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } else {
      // In-memory fallback
      inMemoryCache.set(key, {
        value,
        expiry: Date.now() + (ttl * 1000)
      });
      return true;
    }
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
const del = async (key) => {
  try {
    if (redis) {
      await redis.del(key);
    } else {
      inMemoryCache.delete(key);
    }
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

/**
 * Delete all keys matching pattern
 * @param {string} pattern - Key pattern (e.g., "user:*")
 * @returns {Promise<number>} Number of keys deleted
 */
const delPattern = async (pattern) => {
  try {
    if (redis) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return keys.length;
    } else {
      // In-memory: delete keys matching pattern
      let deleted = 0;
      for (const key of inMemoryCache.keys()) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        if (regex.test(key)) {
          inMemoryCache.delete(key);
          deleted++;
        }
      }
      return deleted;
    }
  } catch (error) {
    console.error('Cache pattern delete error:', error);
    return 0;
  }
};

/**
 * Clear all cache
 * @returns {Promise<boolean>} Success status
 */
const clear = async () => {
  try {
    if (redis) {
      await redis.flushdb();
    } else {
      inMemoryCache.clear();
    }
    return true;
  } catch (error) {
    console.error('Cache clear error:', error);
    return false;
  }
};

/**
 * Get or set cached value (cache-aside pattern)
 * @param {string} key - Cache key
 * @param {Function} fetchFunction - Function to fetch data if not cached
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<any>} Cached or fresh value
 */
const getOrSet = async (key, fetchFunction, ttl = CACHE_TTL.MEDIUM) => {
  try {
    // Try to get from cache
    const cached = await get(key);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, fetch fresh data
    const fresh = await fetchFunction();

    // Store in cache
    if (fresh !== null && fresh !== undefined) {
      await set(key, fresh, ttl);
    }

    return fresh;
  } catch (error) {
    console.error('Cache getOrSet error:', error);
    // On error, try to fetch fresh data
    return await fetchFunction();
  }
};

/**
 * Increment counter in cache
 * @param {string} key - Cache key
 * @param {number} increment - Amount to increment
 * @returns {Promise<number>} New value
 */
const incr = async (key, increment = 1) => {
  try {
    if (redis) {
      return await redis.incrby(key, increment);
    } else {
      const current = inMemoryCache.get(key)?.value || 0;
      const newValue = current + increment;
      inMemoryCache.set(key, {
        value: newValue,
        expiry: Date.now() + (CACHE_TTL.DAY * 1000)
      });
      return newValue;
    }
  } catch (error) {
    console.error('Cache increment error:', error);
    return 0;
  }
};

/**
 * Set expiry on existing key
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
const expire = async (key, ttl) => {
  try {
    if (redis) {
      await redis.expire(key, ttl);
      return true;
    } else {
      const cached = inMemoryCache.get(key);
      if (cached) {
        cached.expiry = Date.now() + (ttl * 1000);
        inMemoryCache.set(key, cached);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('Cache expire error:', error);
    return false;
  }
};

/**
 * Add value to set
 * @param {string} key - Set key
 * @param {string} member - Member to add
 * @returns {Promise<boolean>} Success status
 */
const sadd = async (key, member) => {
  try {
    if (redis) {
      await redis.sadd(key, member);
      return true;
    } else {
      const set = inMemoryCache.get(key)?.value || new Set();
      set.add(member);
      inMemoryCache.set(key, {
        value: set,
        expiry: Date.now() + (CACHE_TTL.DAY * 1000)
      });
      return true;
    }
  } catch (error) {
    console.error('Cache sadd error:', error);
    return false;
  }
};

/**
 * Get all members of set
 * @param {string} key - Set key
 * @returns {Promise<Array>} Set members
 */
const smembers = async (key) => {
  try {
    if (redis) {
      return await redis.smembers(key);
    } else {
      const cached = inMemoryCache.get(key);
      return cached ? Array.from(cached.value) : [];
    }
  } catch (error) {
    console.error('Cache smembers error:', error);
    return [];
  }
};

/**
 * Remove member from set
 * @param {string} key - Set key
 * @param {string} member - Member to remove
 * @returns {Promise<boolean>} Success status
 */
const srem = async (key, member) => {
  try {
    if (redis) {
      await redis.srem(key, member);
      return true;
    } else {
      const cached = inMemoryCache.get(key);
      if (cached) {
        cached.value.delete(member);
        inMemoryCache.set(key, cached);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('Cache srem error:', error);
    return false;
  }
};

/**
 * Invalidate cache for user-related data
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of keys invalidated
 */
const invalidateUserCache = async (userId) => {
  const patterns = [
    `user:*:${userId}`,
    `match:*:${userId}`,
    `subscription:${userId}`
  ];

  let total = 0;
  for (const pattern of patterns) {
    total += await delPattern(pattern);
  }

  return total;
};

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache stats
 */
const getStats = async () => {
  try {
    if (redis) {
      const info = await redis.info('stats');
      const memory = await redis.info('memory');
      return {
        type: 'redis',
        connected: true,
        info,
        memory
      };
    } else {
      return {
        type: 'in-memory',
        size: inMemoryCache.size,
        keys: Array.from(inMemoryCache.keys())
      };
    }
  } catch (error) {
    return {
      type: redis ? 'redis' : 'in-memory',
      error: error.message
    };
  }
};

// Clean up expired entries from in-memory cache periodically
if (!redis) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of inMemoryCache.entries()) {
      if (value.expiry < now) {
        inMemoryCache.delete(key);
      }
    }
  }, 60000); // Every minute
}

module.exports = {
  CACHE_KEYS,
  CACHE_TTL,
  get,
  set,
  del,
  delPattern,
  clear,
  getOrSet,
  incr,
  expire,
  sadd,
  smembers,
  srem,
  invalidateUserCache,
  getStats
};
