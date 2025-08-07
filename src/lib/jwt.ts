import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = (process.env.JWT_SECRET || 'your-secret-key') as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as string;

export interface JWTPayload {
  id: string;
  email: string;
  role: 'superadmin' | 'user';
  tenantId?: string;
}

export const generateToken = (payload: JWTPayload): string => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Generating JWT token for:', payload.email);
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
};

export const verifyToken = (token: string): JWTPayload => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Verifying JWT token');
  }
  
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
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