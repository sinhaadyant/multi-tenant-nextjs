import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '@/utils/jwt';
import { unauthorizedResponse } from '@/utils/apiResponse';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Authentication middleware
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      unauthorizedResponse(res, 'Access token required');
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      unauthorizedResponse(res, 'Invalid or expired token');
    }
  } catch (error) {
    unauthorizedResponse(res, 'Authentication failed');
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
      } catch (error) {
        // Token is invalid but we don't fail the request
        console.warn('Invalid token in optional auth:', error);
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Superadmin only middleware
export const superadminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    unauthorizedResponse(res, 'Authentication required');
    return;
  }

  if (!req.user.isSuperadmin) {
    unauthorizedResponse(res, 'Superadmin access required');
    return;
  }

  next();
};

// Tenant user middleware (non-superadmin)
export const tenantUserMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    unauthorizedResponse(res, 'Authentication required');
    return;
  }

  if (req.user.isSuperadmin) {
    unauthorizedResponse(res, 'Tenant user access required');
    return;
  }

  if (!req.user.tenantId) {
    unauthorizedResponse(res, 'Tenant context required');
    return;
  }

  next();
};
