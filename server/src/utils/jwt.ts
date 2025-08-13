import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { env } from '@/config/env';

// Read JWT keys
const getPrivateKey = (): string => {
  try {
    return fs.readFileSync(path.resolve(env.JWT_PRIVATE_KEY_PATH), 'utf8');
  } catch (error) {
    throw new Error(`Failed to read private key: ${error}`);
  }
};

const getPublicKey = (): string => {
  try {
    return fs.readFileSync(path.resolve(env.JWT_PUBLIC_KEY_PATH), 'utf8');
  } catch (error) {
    throw new Error(`Failed to read public key: ${error}`);
  }
};

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  tenantId?: string;
  isSuperadmin: boolean;
  roles: string[];
  permissions: string[];
}

// Generate access token
export const generateAccessToken = (payload: JWTPayload): string => {
  try {
    const privateKey = getPrivateKey();
    return jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      expiresIn: env.JWT_ACCESS_TOKEN_EXPIRY,
      issuer: 'multi-tenant-platform',
      audience: 'multi-tenant-platform-users',
    } as jwt.SignOptions);
  } catch (error) {
    throw new Error(`Failed to generate access token: ${error}`);
  }
};

// Generate refresh token
export const generateRefreshToken = (
  payload: Pick<JWTPayload, 'userId'>
): string => {
  try {
    return jwt.sign(payload, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: env.JWT_REFRESH_TOKEN_EXPIRY,
      issuer: 'multi-tenant-platform',
      audience: 'multi-tenant-platform-users',
    } as jwt.SignOptions);
  } catch (error) {
    throw new Error(`Failed to generate refresh token: ${error}`);
  }
};

// Verify access token
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const publicKey = getPublicKey();
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'multi-tenant-platform',
      audience: 'multi-tenant-platform-users',
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error(`Token verification failed: ${error}`);
  }
};

// Verify refresh token
export const verifyRefreshToken = (
  token: string
): Pick<JWTPayload, 'userId'> => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'multi-tenant-platform',
      audience: 'multi-tenant-platform-users',
    }) as Pick<JWTPayload, 'userId'>;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw new Error(`Refresh token verification failed: ${error}`);
  }
};

// Decode token without verification (for debugging)
export const decodeToken = (token: string): any => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error(`Failed to decode token: ${error}`);
  }
};
