import jwt from 'jsonwebtoken';

export interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  payload?: any;
  error?: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: 'superadmin' | 'user';
  tenantId?: string;
  jti?: string;
  exp?: number;
  iat?: number;
}

/**
 * Validate JWT token and return detailed result
 */
export const validateToken = (token: string, secret?: string): TokenValidationResult => {
  // In browser environment, we can't verify the signature, so we only check expiration
  const isBrowser = typeof window !== 'undefined';
  
  if (isBrowser) {
    return validateTokenInBrowser(token);
  }
  
  // Server-side validation with signature verification
  return validateTokenInServer(token, secret || process.env.JWT_SECRET!);
};

/**
 * Validate token in browser (only check expiration)
 */
const validateTokenInBrowser = (token: string): TokenValidationResult => {
  try {
    if (!token) {
      return {
        isValid: false,
        isExpired: false,
        error: 'No token provided'
      };
    }

    // Decode token to check expiration
    const decoded = jwt.decode(token) as JWTPayload;
    
    if (!decoded) {
      return {
        isValid: false,
        isExpired: false,
        error: 'Invalid token format'
      };
    }

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = decoded.exp ? decoded.exp < currentTime : false;

    if (isExpired) {
      return {
        isValid: false,
        isExpired: true,
        payload: decoded,
        error: 'Token has expired'
      };
    }

    return {
      isValid: true,
      isExpired: false,
      payload: decoded
    };

  } catch (error: any) {
    return {
      isValid: false,
      isExpired: false,
      error: error.message || 'Token validation failed'
    };
  }
};

/**
 * Validate token on server (with signature verification)
 */
const validateTokenInServer = (token: string, secret: string): TokenValidationResult => {
  try {
    if (!token) {
      return {
        isValid: false,
        isExpired: false,
        error: 'No token provided'
      };
    }

    // Decode token without verification first to check expiration
    const decoded = jwt.decode(token) as JWTPayload;
    
    if (!decoded) {
      return {
        isValid: false,
        isExpired: false,
        error: 'Invalid token format'
      };
    }

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = decoded.exp ? decoded.exp < currentTime : false;

    if (isExpired) {
      return {
        isValid: false,
        isExpired: true,
        payload: decoded,
        error: 'Token has expired'
      };
    }

    // Verify token signature
    jwt.verify(token, secret);

    return {
      isValid: true,
      isExpired: false,
      payload: decoded
    };

  } catch (error: any) {
    return {
      isValid: false,
      isExpired: false,
      error: error.message || 'Token validation failed'
    };
  }
};

/**
 * Check if token will expire soon (within 5 minutes)
 */
export const isTokenExpiringSoon = (token: string, bufferMinutes: number = 5): boolean => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    const bufferSeconds = bufferMinutes * 60;
    
    return decoded.exp < (currentTime + bufferSeconds);
  } catch {
    return true;
  }
};

/**
 * Get token expiration time
 */
export const getTokenExpirationTime = (token: string): number | null => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded?.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
  } catch {
    return null;
  }
};

/**
 * Extract user info from token
 */
export const extractUserFromToken = (token: string): { id: string; email: string; role: string } | null => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded) return null;

    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
  } catch {
    return null;
  }
};

/**
 * Check if token is valid for superadmin access
 */
export const isSuperAdminToken = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded?.role === 'superadmin';
  } catch {
    return false;
  }
}; 