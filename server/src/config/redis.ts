import { createClient } from 'redis';
import { env } from './env';
import { logger } from './logger';

// Create Redis client
export const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis connection failed after 10 retries');
        return new Error('Redis connection failed');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

// Handle Redis events
redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

redisClient.on('ready', () => {
  logger.info('Redis Client Ready');
});

redisClient.on('end', () => {
  logger.info('Redis Client Disconnected');
});

// Connect to Redis
export const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Disconnect from Redis
export const disconnectRedis = async () => {
  try {
    await redisClient.disconnect();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Failed to disconnect from Redis:', error);
  }
};

// Cache utility functions
export const cacheGet = async (key: string): Promise<string | null> => {
  try {
    return await redisClient.get(key);
  } catch (error) {
    logger.error('Redis GET error:', error);
    return null;
  }
};

export const cacheSet = async (
  key: string,
  value: string,
  ttl?: number
): Promise<void> => {
  try {
    if (ttl) {
      await redisClient.setEx(key, ttl, value);
    } else {
      await redisClient.set(key, value);
    }
  } catch (error) {
    logger.error('Redis SET error:', error);
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Redis DEL error:', error);
  }
};

export const cacheExists = async (key: string): Promise<boolean> => {
  try {
    const result = await redisClient.exists(key);
    return result === 1;
  } catch (error) {
    logger.error('Redis EXISTS error:', error);
    return false;
  }
};

// Session management functions
export const setSession = async (
  sessionId: string,
  data: any,
  ttl: number = 3600
): Promise<void> => {
  try {
    await redisClient.setEx(
      `session:${sessionId}`,
      ttl,
      JSON.stringify(data)
    );
  } catch (error) {
    logger.error('Redis session SET error:', error);
  }
};

export const getSession = async (sessionId: string): Promise<any | null> => {
  try {
    const data = await redisClient.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Redis session GET error:', error);
    return null;
  }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    await redisClient.del(`session:${sessionId}`);
  } catch (error) {
    logger.error('Redis session DEL error:', error);
  }
};

// Rate limiting functions
export const incrementRateLimit = async (
  key: string,
  windowMs: number
): Promise<number> => {
  try {
    const multi = redisClient.multi();
    multi.incr(key);
    multi.expire(key, Math.ceil(windowMs / 1000));
    const results = await multi.exec();
    return (results?.[0] as unknown as number) || 0;
  } catch (error) {
    logger.error('Redis rate limit error:', error);
    return 0;
  }
};

export default redisClient;
