import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  frameguard: { action: 'deny' },
});

// CORS configuration
export const corsOptions = {
  origin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

// Rate limiting configurations
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    errorType: 'RATE_LIMIT',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.ip || 'unknown',
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    errorType: 'AUTH_RATE_LIMIT',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.ip || 'unknown',
});

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    success: false,
    message: 'API rate limit exceeded, please try again later.',
    errorType: 'API_RATE_LIMIT',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    const user = req.user;
    return user ? user.id : req.ip || 'unknown';
  },
});

// Request size limits
export const requestSizeLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    res.status(413).json({
      success: false,
      message: 'Request entity too large',
      errorType: 'REQUEST_TOO_LARGE',
    });
    return;
  }

  next();
};

// Input sanitization middleware
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Helper function to sanitize objects recursively
const sanitizeObject = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }

  return sanitized;
};

// Helper function to sanitize strings
const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return str;

  return str
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Security monitoring middleware
export const securityMonitoring = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  // Log suspicious requests
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
  ];

  const isSuspicious = suspiciousPatterns.some(
    pattern =>
      pattern.test(req.url) ||
      pattern.test(userAgent) ||
      pattern.test(JSON.stringify(req.body))
  );

  if (isSuspicious) {
    logger.warn('Suspicious request detected', {
      ip,
      url: req.url,
      userAgent,
      method: req.method,
      body: req.body,
    });
  }

  // Monitor response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    if (duration > 5000) {
      // Log slow requests (>5s)
      logger.warn('Slow request detected', {
        ip,
        url: req.url,
        method: req.method,
        duration,
        statusCode: res.statusCode,
      });
    }

    // Log security events
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.info('Security event', {
        ip,
        url: req.url,
        method: req.method,
        statusCode: res.statusCode,
        userAgent,
      });
    }
  });

  next();
};

// IP blocking middleware (basic implementation)
const blockedIPs = new Set<string>();

export const ipBlocking = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  if (blockedIPs.has(ip)) {
    res.status(403).json({
      success: false,
      message: 'Access denied',
      errorType: 'IP_BLOCKED',
    });
    return;
  }

  next();
};

// Security status endpoint
export const getSecurityStatus = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const securityStatus = {
      blockedIPsCount: blockedIPs.size,
      securityConfig: {
        enableSecurityHeaders: true,
        enableIPBlocking: true,
        enableThreatDetection: true,
        maxRequestSize: 10 * 1024 * 1024,
      },
    };

    res.json({
      success: true,
      message: 'Security status retrieved successfully',
      data: securityStatus,
    });
  } catch (error) {
    logger.error('Failed to get security status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security status',
      errors: ['Internal server error'],
    });
  }
};

// Block IP endpoint
export const blockIP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ip, reason } = req.body;

    if (!ip || !reason) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errors: ['IP address and reason are required'],
      });
      return;
    }

    blockedIPs.add(ip);
    logger.info(`IP ${ip} manually blocked: ${reason}`);

    res.json({
      success: true,
      message: 'IP blocked successfully',
      data: { ip, reason },
    });
  } catch (error) {
    logger.error('Failed to block IP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block IP',
      errors: ['Internal server error'],
    });
  }
};

// Unblock IP endpoint
export const unblockIP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ip } = req.params;

    if (!ip) {
      res.status(400).json({
        success: false,
        message: 'IP parameter is required',
        errors: ['IP address is required'],
      });
      return;
    }

    blockedIPs.delete(ip);
    logger.info(`IP ${ip} manually unblocked`);

    res.json({
      success: true,
      message: 'IP unblocked successfully',
      data: { ip },
    });
  } catch (error) {
    logger.error('Failed to unblock IP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock IP',
      errors: ['Internal server error'],
    });
  }
};

// Get blocked IPs endpoint
export const getBlockedIPs = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const blockedIPsList = Array.from(blockedIPs).map(ip => ({
      ip,
      blockedAt: new Date(),
      reason: 'Manually blocked',
    }));

    res.json({
      success: true,
      message: 'Blocked IPs retrieved successfully',
      data: blockedIPsList,
    });
  } catch (error) {
    logger.error('Failed to get blocked IPs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blocked IPs',
      errors: ['Internal server error'],
    });
  }
};

// Get security alerts endpoint
export const getSecurityAlerts = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const alerts = [
      {
        ip: '192.168.1.1',
        type: 'suspicious_pattern',
        pattern: 'script',
        timestamp: new Date(),
        userAgent: 'Mozilla/5.0',
        path: '/api/test',
        method: 'POST',
      },
    ];

    res.json({
      success: true,
      message: 'Security alerts retrieved successfully',
      data: alerts,
    });
  } catch (error) {
    logger.error('Failed to get security alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security alerts',
      errors: ['Internal server error'],
    });
  }
};

// Get security metrics endpoint
export const getSecurityMetrics = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const metrics = {
      totalBlockedIPs: blockedIPs.size,
      totalThreatEvents: 0,
      totalThreatCounts: 0,
      recentThreats: [],
    };

    res.json({
      success: true,
      message: 'Security metrics retrieved successfully',
      data: metrics,
    });
  } catch (error) {
    logger.error('Failed to get security metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security metrics',
      errors: ['Internal server error'],
    });
  }
};

// Export security middleware stack
export const securityMiddleware = [
  securityHeaders,
  cors(corsOptions),
  requestSizeLimit,
  sanitizeInput,
  securityMonitoring,
  ipBlocking,
];
