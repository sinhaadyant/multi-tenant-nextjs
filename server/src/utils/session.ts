import { Request } from 'express';
import { redisClient } from '@/config/redis';
import { logger } from '@/config/logger';
import { createDeviceFingerprint } from './deviceFingerprint';
import { generateAccessToken, generateRefreshToken, JWTPayload } from './jwt';

export interface SessionData {
  userId: string;
  email: string;
  tenantId?: string;
  isSuperadmin: boolean;
  deviceId: string;
  deviceInfo: any;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  permissions?: any;
  dataScopes?: any;
  sessionId?: string;
  expiresAt?: Date;
}

export interface SessionToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface SessionLimits {
  maxSessionsPerUser: number;
  maxSessionsPerDevice: number;
  sessionTimeout: number; // in seconds
  refreshTokenTimeout: number; // in seconds
}

// Default session limits
export const defaultSessionLimits: SessionLimits = {
  maxSessionsPerUser: 5,
  maxSessionsPerDevice: 1,
  sessionTimeout: 15 * 60, // 15 minutes
  refreshTokenTimeout: 7 * 24 * 60 * 60, // 7 days
};

/**
 * Create a new session for a user
 */
export const createSession = async (
  req: Request,
  user: JWTPayload,
  permissions?: any,
  dataScopes?: any
): Promise<SessionToken> => {
  try {
    const deviceFingerprint = createDeviceFingerprint(req);
    const sessionId = `session:${user.userId}:${deviceFingerprint.id}`;

    // Check session limits
    await enforceSessionLimits(user.userId, deviceFingerprint.id);

    // Create session data
    const sessionData: SessionData = {
      userId: user.userId,
      email: user.email,
      tenantId: user.tenantId,
      isSuperadmin: user.isSuperadmin,
      deviceId: deviceFingerprint.id,
      deviceInfo: deviceFingerprint.info,
      ipAddress: deviceFingerprint.info.ipAddress,
      userAgent: deviceFingerprint.info.userAgent,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      permissions,
      dataScopes,
    };

    // Store session in Redis
    await redisClient.setEx(
      sessionId,
      defaultSessionLimits.refreshTokenTimeout,
      JSON.stringify(sessionData)
    );

    // Store device fingerprint
    await redisClient.setEx(
      `device:${user.userId}:${deviceFingerprint.id}`,
      defaultSessionLimits.refreshTokenTimeout,
      JSON.stringify(deviceFingerprint)
    );

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken({ userId: user.userId });

    // Store refresh token
    await redisClient.setEx(
      `refresh:${refreshToken}`,
      defaultSessionLimits.refreshTokenTimeout,
      JSON.stringify({
        userId: user.userId,
        deviceId: deviceFingerprint.id,
        sessionId,
      })
    );

    logger.info(
      `Session created for user ${user.userId} on device ${deviceFingerprint.id}`
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: defaultSessionLimits.sessionTimeout,
      refreshExpiresIn: defaultSessionLimits.refreshTokenTimeout,
    };
  } catch (error) {
    logger.error('Failed to create session:', error);
    throw new Error('Failed to create session');
  }
};

/**
 * Validate and refresh session
 */
export const refreshSession = async (
  refreshToken: string,
  req: Request
): Promise<SessionToken | null> => {
  try {
    // Get refresh token data from Redis
    const refreshData = await redisClient.get(`refresh:${refreshToken}`);
    if (!refreshData) {
      logger.warn('Invalid refresh token');
      return null;
    }

    const { deviceId, sessionId } = JSON.parse(refreshData);

    // Get session data
    const sessionData = await redisClient.get(sessionId);
    if (!sessionData) {
      logger.warn('Session not found');
      await redisClient.del(`refresh:${refreshToken}`);
      return null;
    }

    const session: SessionData = JSON.parse(sessionData);

    // Validate device fingerprint
    const currentDevice = createDeviceFingerprint(req);
    if (currentDevice.id !== deviceId) {
      logger.warn('Device fingerprint mismatch');
      await invalidateSession(sessionId, refreshToken);
      return null;
    }

    // Update session activity
    session.lastActivity = new Date();
    await redisClient.setEx(
      sessionId,
      defaultSessionLimits.refreshTokenTimeout,
      JSON.stringify(session)
    );

    // Generate new tokens
    const userPayload: JWTPayload = {
      userId: session.userId,
      email: session.email,
      tenantId: session.tenantId,
      isSuperadmin: session.isSuperadmin,
      roles: [],
      permissions: [],
    };

    const accessToken = generateAccessToken(userPayload);
    const newRefreshToken = generateRefreshToken({ userId: session.userId });

    // Store new refresh token
    await redisClient.setEx(
      `refresh:${newRefreshToken}`,
      defaultSessionLimits.refreshTokenTimeout,
      JSON.stringify({
        userId: session.userId,
        deviceId: session.deviceId,
        sessionId,
      })
    );

    // Remove old refresh token
    await redisClient.del(`refresh:${refreshToken}`);

    logger.info(`Session refreshed for user ${session.userId}`);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: defaultSessionLimits.sessionTimeout,
      refreshExpiresIn: defaultSessionLimits.refreshTokenTimeout,
    };
  } catch (error) {
    logger.error('Failed to refresh session:', error);
    return null;
  }
};

/**
 * Invalidate a session
 */
export const invalidateSession = async (
  sessionId: string,
  refreshToken?: string
): Promise<void> => {
  try {
    // Remove session data
    await redisClient.del(sessionId);

    // Remove refresh token if provided
    if (refreshToken) {
      await redisClient.del(`refresh:${refreshToken}`);
    }

    logger.info(`Session invalidated: ${sessionId}`);
  } catch (error) {
    logger.error('Failed to invalidate session:', error);
  }
};

/**
 * Invalidate all sessions for a user
 */
export const invalidateAllUserSessions = async (
  userId: string
): Promise<void> => {
  try {
    // Get all session keys for the user
    const sessionKeys = await redisClient.keys(`session:${userId}:*`);
    const refreshKeys = await redisClient.keys(`refresh:*`);

    // Get refresh tokens for this user
    const userRefreshTokens: string[] = [];
    for (const refreshKey of refreshKeys) {
      const refreshData = await redisClient.get(refreshKey);
      if (refreshData) {
        const { userId: refreshUserId } = JSON.parse(refreshData);
        if (refreshUserId === userId) {
          userRefreshTokens.push(refreshKey);
        }
      }
    }

    // Remove all sessions and refresh tokens
    const keysToDelete = [...sessionKeys, ...userRefreshTokens];
    if (keysToDelete.length > 0) {
      await redisClient.del(keysToDelete);
    }

    logger.info(`All sessions invalidated for user ${userId}`);
  } catch (error) {
    logger.error('Failed to invalidate all user sessions:', error);
  }
};

/**
 * Get active sessions for a user
 */
export const getUserSessions = async (
  userId: string
): Promise<SessionData[]> => {
  try {
    const sessionKeys = await redisClient.keys(`session:${userId}:*`);
    const sessions: SessionData[] = [];

    for (const sessionKey of sessionKeys) {
      const sessionData = await redisClient.get(sessionKey);
      if (sessionData) {
        const session: SessionData = JSON.parse(sessionData);
        if (session.isActive) {
          sessions.push(session);
        }
      }
    }

    return sessions.sort(
      (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()
    );
  } catch (error) {
    logger.error('Failed to get user sessions:', error);
    return [];
  }
};

/**
 * Update session activity
 */
export const updateSessionActivity = async (
  sessionId: string
): Promise<void> => {
  try {
    const sessionData = await redisClient.get(sessionId);
    if (sessionData) {
      const session: SessionData = JSON.parse(sessionData);
      session.lastActivity = new Date();

      await redisClient.setEx(
        sessionId,
        defaultSessionLimits.refreshTokenTimeout,
        JSON.stringify(session)
      );
    }
  } catch (error) {
    logger.error('Failed to update session activity:', error);
  }
};

/**
 * Enforce session limits
 */
export const enforceSessionLimits = async (
  userId: string,
  deviceId: string
): Promise<void> => {
  try {
    // Get current sessions for user
    const userSessions = await getUserSessions(userId);

    // Check max sessions per user
    if (userSessions.length >= defaultSessionLimits.maxSessionsPerUser) {
      // Remove oldest session
      const oldestSession = userSessions[userSessions.length - 1];
      if (oldestSession) {
        await invalidateSession(`session:${userId}:${oldestSession.deviceId}`);
      }
    }

    // Check max sessions per device
    const deviceSessions = userSessions.filter(s => s.deviceId === deviceId);
    if (deviceSessions.length >= defaultSessionLimits.maxSessionsPerDevice) {
      // Remove oldest session for this device
      const oldestDeviceSession = deviceSessions[deviceSessions.length - 1];
      if (oldestDeviceSession) {
        await invalidateSession(
          `session:${userId}:${oldestDeviceSession.deviceId}`
        );
      }
    }
  } catch (error) {
    logger.error('Failed to enforce session limits:', error);
  }
};

/**
 * Clean up expired sessions
 */
export const cleanupExpiredSessions = async (): Promise<void> => {
  try {
    const sessionKeys = await redisClient.keys('session:*');
    const refreshKeys = await redisClient.keys('refresh:*');

    let expiredCount = 0;

    // Check session expiration
    for (const sessionKey of sessionKeys) {
      const ttl = await redisClient.ttl(sessionKey);
      if (ttl <= 0) {
        await redisClient.del(sessionKey);
        expiredCount++;
      }
    }

    // Check refresh token expiration
    for (const refreshKey of refreshKeys) {
      const ttl = await redisClient.ttl(refreshKey);
      if (ttl <= 0) {
        await redisClient.del(refreshKey);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.info(`Cleaned up ${expiredCount} expired sessions/tokens`);
    }
  } catch (error) {
    logger.error('Failed to cleanup expired sessions:', error);
  }
};

/**
 * Get session statistics
 */
export const getSessionStats = async (): Promise<{
  totalSessions: number;
  activeSessions: number;
  totalRefreshTokens: number;
}> => {
  try {
    const sessionKeys = await redisClient.keys('session:*');
    const refreshKeys = await redisClient.keys('refresh:*');

    let activeSessions = 0;
    for (const sessionKey of sessionKeys) {
      const sessionData = await redisClient.get(sessionKey);
      if (sessionData) {
        const session: SessionData = JSON.parse(sessionData);
        if (session.isActive) {
          activeSessions++;
        }
      }
    }

    return {
      totalSessions: sessionKeys.length,
      activeSessions,
      totalRefreshTokens: refreshKeys.length,
    };
  } catch (error) {
    logger.error('Failed to get session stats:', error);
    return {
      totalSessions: 0,
      activeSessions: 0,
      totalRefreshTokens: 0,
    };
  }
};

/**
 * Check if session is valid
 */
export const isSessionValid = async (sessionId: string): Promise<boolean> => {
  try {
    const sessionData = await redisClient.get(sessionId);
    if (!sessionData) {
      return false;
    }

    const session: SessionData = JSON.parse(sessionData);
    return session.isActive;
  } catch (error) {
    logger.error('Failed to check session validity:', error);
    return false;
  }
};

export default {
  createSession,
  refreshSession,
  invalidateSession,
  invalidateAllUserSessions,
  getUserSessions,
  updateSessionActivity,
  enforceSessionLimits,
  cleanupExpiredSessions,
  getSessionStats,
  isSessionValid,
};
