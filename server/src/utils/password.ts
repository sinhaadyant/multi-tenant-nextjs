import bcrypt from 'bcryptjs';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const saltRounds = env.BCRYPT_ROUNDS;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    logger.debug(`Password hashed successfully with ${saltRounds} rounds`);
    return hashedPassword;
  } catch (error) {
    logger.error('Password hashing failed:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Verify a password against its hash
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns True if password matches, false otherwise
 */
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    const isValid = await bcrypt.compare(password, hashedPassword);
    logger.debug(`Password verification result: ${isValid}`);
    return isValid;
  } catch (error) {
    logger.error('Password verification failed:', error);
    return false;
  }
};

/**
 * Generate a random password
 * @param length - Length of the password (default: 12)
 * @returns Random password string
 */
export const generateRandomPassword = (length: number = 12): string => {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Validation result with details
 */
export const validatePasswordStrength = (
  password: string
): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Missing character types
  if (!/[a-z]/.test(password)) {
    feedback.push('Include at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push('Include at least one uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    feedback.push('Include at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Include at least one special character');
  }

  // Common password check (basic)
  const commonPasswords = [
    'password',
    '123456',
    'qwerty',
    'admin',
    'letmein',
    'welcome',
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    feedback.push('Avoid common passwords');
    score = Math.max(0, score - 2);
  }

  const isValid = score >= 3 && feedback.length === 0;

  return {
    isValid,
    score,
    feedback,
  };
};

/**
 * Hash password with custom salt rounds (for testing or special cases)
 * @param password - Plain text password
 * @param saltRounds - Number of salt rounds
 * @returns Hashed password
 */
export const hashPasswordWithRounds = async (
  password: string,
  saltRounds: number
): Promise<string> => {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    logger.debug(`Password hashed with custom ${saltRounds} rounds`);
    return hashedPassword;
  } catch (error) {
    logger.error('Custom password hashing failed:', error);
    throw new Error('Failed to hash password with custom rounds');
  }
};

/**
 * Get bcrypt salt rounds from environment
 * @returns Number of salt rounds
 */
export const getSaltRounds = (): number => {
  return env.BCRYPT_ROUNDS;
};
