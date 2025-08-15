import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { redisClient } from '@/config/redis';
// import { env } from '@/config/env';
import { logger } from '@/config/logger';

// Rate limit configuration
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  handler?: (req: Request, res: Response) => void;
}

// Default rate limit configurations
export const rateLimitConfigs = {
  // Global rate limit (all requests)
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
    message: 'Too many requests from this IP, please try again later.',
  },

  // Auth endpoints (more restrictive)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many authentication attempts, please try again later.',
  },

  // API endpoints (standard)
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many API requests, please try again later.',
  },

  // File upload endpoints (more restrictive)
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: 'Too many file uploads, please try again later.',
  },

  // Search endpoints (moderate)
  search: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // 50 searches per 5 minutes
    message: 'Too many search requests, please try again later.',
  },

  // Admin endpoints (less restrictive for superadmins)
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    message: 'Too many admin requests, please try again later.',
  },
};

// Custom key generator for user-based rate limiting
const userKeyGenerator = (req: Request): string => {
  const user = req.user;
  if (user?.id) {
    return `user:${user.id}`;
  }
  return `ip:${req.ip}`;
};

// Custom key generator for tenant-based rate limiting
const tenantKeyGenerator = (req: Request): string => {
  const user = req.user;
  if (user?.tenantId) {
    return `tenant:${user.tenantId}`;
  }
  return `ip:${req.ip}`;
};

// Skip rate limiting for superadmins
const skipSuperadmin = (req: Request): boolean => {
  return req.user?.isSuperadmin === true;
};

// Custom rate limit handler
const customRateLimitHandler = (req: Request, res: Response): void => {
  logger.warn(`Rate limit exceeded for ${req.ip} - ${req.method} ${req.path}`);

  res.status(429).json({
    success: false,
    message: 'Rate limit exceeded',
    errors: ['Too many requests, please try again later.'],
    retryAfter: Math.ceil(rateLimitConfigs.global.windowMs / 1000),
  });
};

// Create rate limit middleware with Redis store
export const createRateLimit = (config: RateLimitConfig) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: config.message,
    keyGenerator:
      config.keyGenerator || ((req: Request) => req.ip || 'unknown'),
    skip: config.skip,
    handler: config.handler || customRateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    // Redis store for distributed rate limiting
    store: {
      incr: async (key: string) => {
        try {
          const current = await redisClient.incr(key);
          if (current === 1) {
            await redisClient.expire(key, Math.ceil(config.windowMs / 1000));
          }
          return {
            totalHits: current,
            resetTime: new Date(Date.now() + config.windowMs),
          };
        } catch (error) {
          logger.error('Redis rate limit error:', error);
          return {
            totalHits: 1,
            resetTime: new Date(Date.now() + config.windowMs),
          };
        }
      },
      decrement: async (key: string) => {
        try {
          await redisClient.decr(key);
        } catch (error) {
          logger.error('Redis rate limit decrement error:', error);
        }
      },
      resetKey: async (key: string) => {
        try {
          await redisClient.del(key);
        } catch (error) {
          logger.error('Redis rate limit reset error:', error);
        }
      },
    },
  });
};

// Pre-configured rate limit middlewares
export const globalRateLimit = createRateLimit(rateLimitConfigs.global);

export const authRateLimit = createRateLimit({
  ...rateLimitConfigs.auth,
  keyGenerator: userKeyGenerator,
  skip: skipSuperadmin,
});

export const apiRateLimit = createRateLimit({
  ...rateLimitConfigs.api,
  keyGenerator: userKeyGenerator,
  skip: skipSuperadmin,
});

export const uploadRateLimit = createRateLimit({
  ...rateLimitConfigs.upload,
  keyGenerator: userKeyGenerator,
  skip: skipSuperadmin,
});

export const searchRateLimit = createRateLimit({
  ...rateLimitConfigs.search,
  keyGenerator: userKeyGenerator,
  skip: skipSuperadmin,
});

export const adminRateLimit = createRateLimit({
  ...rateLimitConfigs.admin,
  keyGenerator: userKeyGenerator,
  skip: skipSuperadmin,
});

// Tenant-based rate limiting
export const tenantRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per tenant per window
  message: 'Too many requests from this tenant, please try again later.',
  keyGenerator: tenantKeyGenerator,
  skip: skipSuperadmin,
});

// Dynamic rate limiting based on user role
export const dynamicRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = req.user;

  if (!user) {
    // Apply global rate limit for unauthenticated users
    globalRateLimit(req, res, next);
    return;
  }

  if (user.isSuperadmin) {
    // No rate limiting for superadmins
    next();
    return;
  }

  // Apply user-based rate limiting
  apiRateLimit(req, res, next);
};

// Rate limit for specific endpoints
export const endpointRateLimit = (
  endpoint: string,
  maxRequests: number,
  windowMs: number = 15 * 60 * 1000
) => {
  return createRateLimit({
    windowMs,
    max: maxRequests,
    message: `Too many requests to ${endpoint}, please try again later.`,
    keyGenerator: userKeyGenerator,
    skip: skipSuperadmin,
  });
};

// Rate limit for bulk operations
export const bulkOperationRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 bulk operations per hour
  message: 'Too many bulk operations, please try again later.',
  keyGenerator: userKeyGenerator,
  skip: skipSuperadmin,
});

// Rate limit for export operations
export const exportRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 exports per hour
  message: 'Too many export requests, please try again later.',
  keyGenerator: userKeyGenerator,
  skip: skipSuperadmin,
});

// Rate limit for login attempts
export const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
  keyGenerator: (req: Request) => `login:${req.ip}`,
});

// Rate limit for password reset
export const passwordResetRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: 'Too many password reset requests, please try again later.',
  keyGenerator: (req: Request) => `password-reset:${req.ip}`,
});

// Utility function to get rate limit info for a user
export const getRateLimitInfo = async (
  userId: string
): Promise<{
  remaining: number;
  resetTime: Date;
  limit: number;
}> => {
  try {
    const key = `user:${userId}`;
    const hits = await redisClient.get(key);
    const ttl = await redisClient.ttl(key);

    const currentHits = hits ? parseInt(hits) : 0;
    const limit = rateLimitConfigs.api.max;
    const remaining = Math.max(0, limit - currentHits);
    const resetTime = new Date(
      Date.now() + (ttl > 0 ? ttl * 1000 : rateLimitConfigs.api.windowMs)
    );

    return {
      remaining,
      resetTime,
      limit,
    };
  } catch (error) {
    logger.error('Failed to get rate limit info:', error);
    return {
      remaining: rateLimitConfigs.api.max,
      resetTime: new Date(),
      limit: rateLimitConfigs.api.max,
    };
  }
};

// Utility function to reset rate limit for a user
export const resetUserRateLimit = async (userId: string): Promise<void> => {
  try {
    const key = `user:${userId}`;
    await redisClient.del(key);
    logger.info(`Rate limit reset for user ${userId}`);
  } catch (error) {
    logger.error('Failed to reset rate limit:', error);
  }
};

// Export default rate limit configurations
export default {
  global: globalRateLimit,
  auth: authRateLimit,
  api: apiRateLimit,
  upload: uploadRateLimit,
  search: searchRateLimit,
  admin: adminRateLimit,
  tenant: tenantRateLimit,
  login: loginRateLimit,
  passwordReset: passwordResetRateLimit,
  bulk: bulkOperationRateLimit,
  export: exportRateLimit,
};
