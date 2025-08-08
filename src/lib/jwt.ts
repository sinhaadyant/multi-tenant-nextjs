import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const JWT_SECRET = (process.env.JWT_SECRET || 'your-secret-key') as string;
const JWT_ACCESS_EXPIRES_IN = (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as string; // Short-lived access token
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string; // Long-lived refresh token
const REFRESH_TOKEN_SECRET = (process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key') as string;

export interface JWTPayload {
  id: string;
  email: string;
  role: 'superadmin' | 'user';
  tenantId?: string;
  jti?: string; // JWT ID for tracking/revocation
}

export interface RefreshTokenPayload {
  id: string;
  email: string;
  role: 'superadmin' | 'user';
  tokenId: string; // Unique token identifier
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  refreshExpiresAt: number;
}

// Generate unique token ID
export const generateTokenId = (): string => {
  return randomBytes(32).toString('hex');
};

// Generate access token (short-lived)
export const generateAccessToken = (payload: JWTPayload): string => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Generating access token for:', payload.email);
  }
  
  const tokenPayload = {
    ...payload,
    jti: generateTokenId(),
  };
  
  return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN });
};

// Generate refresh token (long-lived)
export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Generating refresh token for:', payload.email);
  }
  
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

// Generate both tokens
export const generateTokenPair = (userPayload: Omit<JWTPayload, 'jti'>): TokenPair => {
  const tokenId = generateTokenId();
  
  const accessTokenPayload: JWTPayload = {
    ...userPayload,
    jti: tokenId,
  };
  
  const refreshTokenPayload: RefreshTokenPayload = {
    id: userPayload.id,
    email: userPayload.email,
    role: userPayload.role,
    tokenId,
  };
  
  const accessToken = generateAccessToken(accessTokenPayload);
  const refreshToken = generateRefreshToken(refreshTokenPayload);
  
  // Calculate expiration times
  const accessTokenDecoded = jwt.decode(accessToken) as any;
  const refreshTokenDecoded = jwt.decode(refreshToken) as any;
  
  return {
    accessToken,
    refreshToken,
    expiresAt: accessTokenDecoded.exp * 1000, // Convert to milliseconds
    refreshExpiresAt: refreshTokenDecoded.exp * 1000,
  };
};

// Legacy function for backward compatibility
export const generateToken = (payload: JWTPayload): string => {
  return generateAccessToken(payload);
};

// Verify access token
export const verifyAccessToken = (token: string): JWTPayload => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Verifying access token');
  }
  
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

// Verify refresh token
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Verifying refresh token');
  }
  
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
};

// Legacy function for backward compatibility
export const verifyToken = (token: string): JWTPayload => {
  return verifyAccessToken(token);
};

export const hashPassword = async (password: string): Promise<string> => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 Hashing password');
  }
  
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔓 Comparing password');
  }
  
  return bcrypt.compare(password, hashedPassword);
}; 