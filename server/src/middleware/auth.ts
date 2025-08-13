import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '@/utils/jwt';
import { UserService } from '@/services/userService';
import { AuthenticationError, AuthorizationError } from '@/utils/errors';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

const userService = new UserService();

// Authentication middleware
export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Access token required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = verifyAccessToken(token);

      // Load user from database to ensure they still exist and are active
      const user = await userService.getUserById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive');
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Invalid or expired token');
    }
  } catch (error) {
    next(error);
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
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
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }

  if (!req.user.isSuperadmin) {
    throw new AuthorizationError('Superadmin access required');
  }

  next();
};

// Tenant user middleware (non-superadmin)
export const tenantUserMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }

  if (req.user.isSuperadmin) {
    throw new AuthorizationError('Tenant user access required');
  }

  if (!req.user.tenantId) {
    throw new AuthorizationError('Tenant context required');
  }

  next();
};
