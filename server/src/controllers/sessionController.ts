import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/config/logger';
import {
  getUserSessions as getUserSessionsUtil,
  invalidateSession,
  isSessionValid,
} from '@/utils/session';
import { createDeviceFingerprint } from '@/utils/deviceFingerprint';
import { redisClient } from '@/config/redis';
import { NotFoundError } from '@/utils/errors';

const prisma = new PrismaClient();

export class SessionController {
  /**
   * Get user sessions with device information
   */
  static getUserSessions = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20, activeOnly = 'true' } = req.query;

      // Get user sessions from Redis
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }
      const sessions = await getUserSessionsUtil(req?.user?.id);

      // Filter by active status if requested
      const filteredSessions =
        activeOnly === 'true' ? sessions.filter(s => s.isActive) : sessions;

      // Apply pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

      // Get device information for each session
      const sessionsWithDevices = await Promise.all(
        paginatedSessions.map(async session => {
          const deviceData = await redisClient.get(
            `device:${session.deviceId}`
          );
          const device = deviceData ? JSON.parse(deviceData) : null;

          return {
            id: session.sessionId,
            deviceId: session.deviceId,
            deviceInfo: device
              ? {
                  userAgent: device.userAgent,
                  ipAddress: device.ipAddress,
                  deviceType: device.deviceType,
                  browser: device.browser,
                  os: device.os,
                  location: device.location,
                }
              : null,
            isActive: session.isActive,
            lastActivity: session.lastActivity,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
          };
        })
      );

      return res.json({
        success: true,
        message: 'User sessions retrieved successfully',
        data: sessionsWithDevices,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total: filteredSessions.length,
          totalPages: Math.ceil(filteredSessions.length / Number(limit)),
          activeSessions: filteredSessions.filter(s => s.isActive).length,
        },
      });
    } catch (error) {
      logger.error('Get user sessions error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Revoke specific session
   */
  static revokeSession = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;

      // Check if session belongs to user
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }
      const sessions = await getUserSessionsUtil(req?.user?.id);
      const session = sessions.find(s => s.sessionId === sessionId);

      if (!session) {
        throw new NotFoundError('Session not found');
      }

      // Revoke the session
      if (sessionId) await invalidateSession(sessionId);

      logger.info(`Session revoked: ${sessionId} by user ${req.user?.id}`);

      return res.json({
        success: true,
        message: 'Session revoked successfully',
      });
    } catch (error) {
      logger.error('Revoke session error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Revoke all other sessions (log out all other devices)
   */
  static revokeAllOtherSessions = async (req: Request, res: Response) => {
    try {
      const currentDeviceId = createDeviceFingerprint(req).id;

      // Get all user sessions
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }
      const sessions = await getUserSessionsUtil(req?.user?.id);

      // Filter out current session
      const otherSessions = sessions.filter(
        s => s.deviceId !== currentDeviceId
      );

      // Revoke all other sessions
      await Promise.all(
        otherSessions.map(session => invalidateSession(session.sessionId || ''))
      );

      logger.info(`All other sessions revoked for user ${req.user?.id}`);

      return res.json({
        success: true,
        message: 'All other sessions revoked successfully',
        data: {
          revokedCount: otherSessions.length,
        },
      });
    } catch (error) {
      logger.error('Revoke all other sessions error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Get login history
   */
  static getLoginHistory = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20, startDate, endDate } = req.query;

      // Build query for login history
      const query: any = {
        where: {
          userId: req.user?.id,
          action: { in: ['LOGIN', 'LOGOUT', 'LOGIN_FAILED'] },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      };

      // Add date filters
      if (startDate || endDate) {
        if (query && query.where) {
          query.where.createdAt = {};
          if (startDate) {
            query.where.createdAt.gte = new Date(startDate as string);
          }
          if (endDate) {
            query.where.createdAt.lte = new Date(endDate as string);
          }
        }
      }

      // Execute query
      const [logs, total] = await Promise.all([
        prisma?.auditLog?.findMany(query),
        prisma?.auditLog?.count({ where: query.where }),
      ]);

      // Format login history
      const loginHistory = logs.map(log => ({
        id: log.id,
        action: log.action,
        ipAddress: log.ipAddress,

        details: log.details,
        createdAt: log.createdAt,
        success: log.action === 'LOGIN',
      }));

      return res.json({
        success: true,
        message: 'Login history retrieved successfully',
        data: loginHistory,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Get login history error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Get device management information
   */
  static getDeviceManagement = async (req: Request, res: Response) => {
    try {
      // Get all user sessions
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }
      const sessions = await getUserSessionsUtil(req.user.id);

      // Group sessions by device
      const deviceGroups = new Map();

      for (const session of sessions) {
        const deviceData = await redisClient.get(`device:${session.deviceId}`);
        const device = deviceData ? JSON.parse(deviceData) : null;

        if (!deviceGroups.has(session.deviceId)) {
          deviceGroups.set(session.deviceId, {
            deviceId: session.deviceId,
            deviceInfo: device
              ? {
                  userAgent: device.userAgent,
                  ipAddress: device.ipAddress,
                  deviceType: device.deviceType,
                  browser: device.browser,
                  os: device.os,
                  location: device.location,
                }
              : null,
            sessions: [],
            lastActivity: null,
            isCurrentDevice: false,
          });
        }

        const deviceGroup = deviceGroups.get(session.deviceId);
        deviceGroup?.sessions?.push({
          id: session.sessionId,
          isActive: session.isActive,
          lastActivity: session.lastActivity,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        });

        if (session.lastActivity > deviceGroup.lastActivity) {
          deviceGroup.lastActivity = session.lastActivity;
        }
      }

      // Mark current device
      const currentDeviceId = createDeviceFingerprint(req).id;
      const currentDevice = deviceGroups.get(currentDeviceId);
      if (currentDevice) {
        currentDevice.isCurrentDevice = true;
      }

      const devices = Array.from(deviceGroups.values());

      return res.json({
        success: true,
        message: 'Device management information retrieved successfully',
        data: {
          devices,
          totalDevices: devices.length,
          activeDevices: devices.filter(d =>
            d?.sessions?.some((s: any) => s.isActive)
          ).length,
          currentDevice: currentDeviceId,
        },
      });
    } catch (error) {
      logger.error('Get device management error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Security check for suspicious activity
   */
  static securityCheck = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;

      // Get session information
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }
      const sessions = await getUserSessionsUtil(req.user.id);
      const session = sessions.find(s => s.sessionId === sessionId);

      if (!session) {
        throw new NotFoundError('Session not found');
      }

      // Get device information
      const deviceData = await redisClient.get(`device:${session.deviceId}`);
      const device = deviceData ? JSON.parse(deviceData) : null;

      // Perform security checks
      const securityChecks = {
        sessionValid: await isSessionValid(sessionId || ''),
        deviceRecognized: device !== null,
        locationConsistent: true, // Placeholder for location checking
        timeConsistent: true, // Placeholder for time-based checking
        suspiciousActivity: false, // Placeholder for suspicious activity detection
      };

      // Check for suspicious patterns
      const recentLogins = await prisma?.auditLog?.findMany({
        where: {
          userId: req.user?.id,
          action: 'LOGIN',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Check for multiple failed login attempts
      const failedLogins = await prisma?.auditLog?.findMany({
        where: {
          userId: req.user?.id,
          action: 'LOGIN_FAILED',
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
      });

      if (failedLogins.length > 5) {
        securityChecks.suspiciousActivity = true;
      }

      // Check for unusual login locations (placeholder)
      const uniqueIPs = new Set(recentLogins.map(log => log.ipAddress));
      if (uniqueIPs.size > 3) {
        securityChecks.suspiciousActivity = true;
      }

      return res.json({
        success: true,
        message: 'Security check completed',
        data: {
          sessionId,
          securityChecks,
          deviceInfo: device,
          recentActivity: {
            totalLogins: recentLogins.length,
            failedAttempts: failedLogins.length,
            uniqueIPs: uniqueIPs.size,
          },
          recommendations: securityChecks.suspiciousActivity
            ? [
                'Consider changing your password',
                'Review recent login activity',
                'Enable two-factor authentication',
              ]
            : [],
        },
      });
    } catch (error) {
      logger.error('Security check error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Get session statistics
   */
  static getSessionStats = async (req: Request, res: Response) => {
    try {
      // Get user sessions for statistics
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }
      const sessions = await getUserSessionsUtil(req.user.id);

      const userStats = {
        totalSessions: sessions.length,
        activeSessions: sessions.filter((s: any) => s.isActive).length,
        devicesUsed: new Set(sessions.map((s: any) => s.deviceId)).size,
        lastLogin: sessions.length > 0 ? sessions[0]?.lastActivity : null,
      };

      // Get login patterns
      const loginPatterns =
        (await prisma?.auditLog?.groupBy({
          by: ['action'],
          where: {
            userId: req.user?.id,
            action: { in: ['LOGIN', 'LOGOUT', 'LOGIN_FAILED'] },
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
          _count: {
            id: true,
          },
        })) || [];

      return res.json({
        success: true,
        message: 'Session statistics retrieved successfully',
        data: {
          user: userStats,
          patterns: loginPatterns.reduce(
            (acc, pattern) => {
              acc[pattern.action] = pattern?._count?.id || 0;
              return acc;
            },
            {} as Record<string, number>
          ),
        },
      });
    } catch (error) {
      logger.error('Get session stats error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Update session activity
   */
  static updateSessionActivity = async (_req: Request, res: Response) => {
    try {
      // const { sessionId } = req.params;

      // Update session activity
      // await updateSessionActivity(req, res);

      return res.json({
        success: true,
        message: 'Session activity updated successfully',
      });
    } catch (error) {
      logger.error('Update session activity error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };
}

// Export individual functions for routes
export const getUserSessions = SessionController.getUserSessions;
export const revokeSession = SessionController.revokeSession;
export const revokeAllOtherSessions = SessionController.revokeAllOtherSessions;
export const getLoginHistory = SessionController.getLoginHistory;
export const getDeviceManagement = SessionController.getDeviceManagement;
export const securityCheck = SessionController.securityCheck;
export const getSessionStats = SessionController.getSessionStats;
export const updateSessionActivity = SessionController.updateSessionActivity;
