import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { dataScopeService } from '../services/DataScopeService';
import { permissionService } from '../services/PermissionService';
import {
  authMiddleware,
  requirePermission,
  AuthenticatedUser,
} from '../middleware/auth';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

// Example controller demonstrating the integration of enhanced auth and data scope filtering

export class ExampleController {
  /**
   * Get users with data scope filtering
   * Demonstrates: Permission checking + Data scope filtering
   */
  static getUsers = [
    authMiddleware,
    requirePermission('Users', 'read'),
    async (req: Request, res: Response) => {
      try {
        const user = req.user as AuthenticatedUser;
        const { limit = 10, offset = 0, status } = req.query;

        // Build base query
        const query = {
          where: {
            isActive: true,
            ...(status && { status: status as string }),
          },
          take: Number(limit),
          skip: Number(offset),
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        };

        // Apply data scope filtering
        const scopedQuery = await dataScopeService.applyDataScopeFilter(
          query,
          user.id,
          'Users',
          'users'
        );

        // Execute query
        const users = await prisma.user.findMany(scopedQuery as any);
        const total = await prisma.user.count({
          where: (scopedQuery as any).where,
        });

        logger.info(
          `User ${user.id} retrieved ${users.length} users with data scope filtering`
        );

        res.json({
          success: true,
          data: users,
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: total > Number(offset) + users.length,
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in getUsers: ${errorMessage}`);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch users',
        });
      }
    },
  ];

  /**
   * Create a new user
   * Demonstrates: Permission checking + Data scope validation
   */
  static createUser = [
    authMiddleware,
    requirePermission('Users', 'create'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const user = req.user as AuthenticatedUser;
        const userData = req.body;

        // Check if user can create users in their scope
        const dataScope = await permissionService.getDataScope(
          user.id,
          'Users'
        );

        // Ensure the new user is created within the user's scope
        if (dataScope.scope === 'tenant' && user.tenantId) {
          userData.tenantId = user.tenantId;
        } else if (dataScope.scope === 'own') {
          // Users with 'own' scope typically can't create other users
          res.status(403).json({
            success: false,
            error: 'Insufficient permissions to create users',
          });
          return;
        }

        const newUser = await prisma.user.create({
          data: userData,
          include: { userRoles: true },
        });

        logger.info(`User ${user.id} created new user ${newUser.id}`);

        res.status(201).json({
          success: true,
          data: newUser,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in createUser: ${errorMessage}`);
        res.status(500).json({
          success: false,
          error: 'Failed to create user',
        });
      }
    },
  ];

  /**
   * Get a specific user by ID
   * Demonstrates: Permission checking + Data access validation
   */
  static getUserById = [
    authMiddleware,
    requirePermission('Users', 'read'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const user = req.user as AuthenticatedUser;
        const { userId } = req.params;

        // Get the target user
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        });

        if (!targetUser) {
          res.status(404).json({
            success: false,
            error: 'User not found',
          });
          return;
        }

        // Validate data access
        const canAccess = await dataScopeService.validateDataAccess(
          user.id,
          targetUser,
          'Users',
          'users'
        );

        if (!canAccess) {
          logger.warn(
            `User ${user.id} attempted to access user ${userId} without permission`
          );
          res.status(403).json({
            success: false,
            error: 'Access denied',
          });
          return;
        }

        logger.info(`User ${user.id} accessed user ${userId}`);

        res.json({
          success: true,
          data: targetUser,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in getUserById: ${errorMessage}`);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch user',
        });
      }
    },
  ];

  /**
   * Update a user
   * Demonstrates: Permission checking + Data access validation + Update
   */
  static updateUser = [
    authMiddleware,
    requirePermission('Users', 'update'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const user = req.user as AuthenticatedUser;
        const { userId } = req.params;
        const updateData = req.body;

        // Get the target user
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!targetUser) {
          res.status(404).json({
            success: false,
            error: 'User not found',
          });
          return;
        }

        // Validate data access
        const canAccess = await dataScopeService.validateDataAccess(
          user.id,
          targetUser,
          'Users',
          'users'
        );

        if (!canAccess) {
          logger.warn(
            `User ${user.id} attempted to update user ${userId} without permission`
          );
          res.status(403).json({
            success: false,
            error: 'Access denied',
          });
          return;
        }

        // Apply data scope to update data
        const dataScope = await permissionService.getDataScope(
          user.id,
          'Users'
        );
        if (dataScope.scope === 'tenant' && user.tenantId) {
          updateData.tenantId = user.tenantId;
        }

        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: updateData,
          include: { userRoles: true },
        });

        logger.info(`User ${user.id} updated user ${userId}`);

        res.json({
          success: true,
          data: updatedUser,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in updateUser: ${errorMessage}`);
        res.status(500).json({
          success: false,
          error: 'Failed to update user',
        });
      }
    },
  ];

  /**
   * Delete a user
   * Demonstrates: Permission checking + Data access validation + Delete
   */
  static deleteUser = [
    authMiddleware,
    requirePermission('Users', 'delete'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const user = req.user as AuthenticatedUser;
        const { userId } = req.params;

        // Prevent self-deletion
        if (user.id === userId) {
          res.status(400).json({
            success: false,
            error: 'Cannot delete your own account',
          });
          return;
        }

        // Get the target user
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!targetUser) {
          res.status(404).json({
            success: false,
            error: 'User not found',
          });
          return;
        }

        // Validate data access
        const canAccess = await dataScopeService.validateDataAccess(
          user.id,
          targetUser,
          'Users',
          'users'
        );

        if (!canAccess) {
          logger.warn(
            `User ${user.id} attempted to delete user ${userId} without permission`
          );
          res.status(403).json({
            success: false,
            error: 'Access denied',
          });
          return;
        }

        // Soft delete (set isActive to false)
        await prisma.user.update({
          where: { id: userId },
          data: { isActive: false },
        });

        logger.info(`User ${user.id} deleted user ${userId}`);

        res.json({
          success: true,
          message: 'User deleted successfully',
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in deleteUser: ${errorMessage}`);
        res.status(500).json({
          success: false,
          error: 'Failed to delete user',
        });
      }
    },
  ];

  /**
   * Get support tickets with data scope filtering
   * Demonstrates: Different module permissions + Complex data scope
   */
  static getSupportTickets = [
    authMiddleware,
    requirePermission('Support', 'read'),
    async (req: Request, res: Response) => {
      try {
        const user = req.user as AuthenticatedUser;
        const { limit = 10, offset = 0, status } = req.query;

        // Build base query
        const query = {
          where: {
            ...(status && { status: status as string }),
          },
          take: Number(limit),
          skip: Number(offset),
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            replies: {
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        };

        // Apply data scope filtering
        const scopedQuery = await dataScopeService.applyDataScopeFilter(
          query,
          user.id,
          'Support',
          'support_tickets'
        );

        // Execute query
        const tickets = await prisma.supportTicket.findMany(scopedQuery as any);
        const total = await prisma.supportTicket.count({
          where: (scopedQuery as any).where,
        });

        logger.info(
          `User ${user.id} retrieved ${tickets.length} support tickets`
        );

        res.json({
          success: true,
          data: tickets,
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: total > Number(offset) + tickets.length,
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in getSupportTickets: ${errorMessage}`);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch support tickets',
        });
      }
    },
  ];

  /**
   * Get user's own profile
   * Demonstrates: Own data access + Permission checking
   */
  static getOwnProfile = [
    authMiddleware,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const user = req.user as AuthenticatedUser;

        // Get user's own profile with full details
        const profile = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        module: true,
                        submodule: true,
                      },
                    },
                  },
                },
              },
            },
            tenant: true,
          },
        });

        if (!profile) {
          res.status(404).json({
            success: false,
            error: 'Profile not found',
          });
          return;
        }

        logger.info(`User ${user.id} accessed their own profile`);

        res.json({
          success: true,
          data: profile,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in getOwnProfile: ${errorMessage}`);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch profile',
        });
      }
    },
  ];

  /**
   * Get user permissions
   * Demonstrates: Permission service integration + Caching
   */
  static getUserPermissions = [
    authMiddleware,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const user = req.user as AuthenticatedUser;

        // Get detailed permissions from PermissionService
        const permissions = await permissionService.getUserPermissions(user.id);
        const accessibleModules = await permissionService.getAccessibleModules(
          user.id
        );

        logger.info(`User ${user.id} retrieved their permissions`);

        res.json({
          success: true,
          data: {
            permissions: permissions.permissions,
            accessibleModules,
            isSuperadmin: permissions.isSuperadmin,
            accessibleTenants: permissions.accessibleTenants,
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in getUserPermissions: ${errorMessage}`);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch permissions',
        });
      }
    },
  ];

  /**
   * Bulk operations with data scope validation
   * Demonstrates: Bulk validation + Data scope filtering
   */
  static bulkUpdateUsers = [
    authMiddleware,
    requirePermission('Users', 'update'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const user = req.user as AuthenticatedUser;
        const { userIds, updateData } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
          res.status(400).json({
            success: false,
            error: 'User IDs array is required',
          });
          return;
        }

        // Get all target users
        const targetUsers = await prisma.user.findMany({
          where: { id: { in: userIds } },
        });

        // Validate bulk data access
        const { validRecords, invalidRecords } =
          await dataScopeService.validateBulkDataAccess(
            user.id,
            targetUsers,
            'Users',
            'users'
          );

        if (invalidRecords.length > 0) {
          logger.warn(
            `User ${user.id} attempted to update ${invalidRecords.length} users without permission`
          );
          res.status(403).json({
            success: false,
            error: `Access denied to ${invalidRecords.length} users`,
            invalidUserIds: invalidRecords.map(u => u.id),
          });
          return;
        }

        // Apply data scope to update data
        const dataScope = await permissionService.getDataScope(
          user.id,
          'Users'
        );
        if (dataScope.scope === 'tenant' && user.tenantId) {
          updateData.tenantId = user.tenantId;
        }

        // Perform bulk update
        const updateResult = await prisma.user.updateMany({
          where: { id: { in: validRecords.map(u => u.id) } },
          data: updateData,
        });

        logger.info(`User ${user.id} bulk updated ${updateResult.count} users`);

        res.json({
          success: true,
          message: `Successfully updated ${updateResult.count} users`,
          updatedCount: updateResult.count,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in bulkUpdateUsers: ${errorMessage}`);
        res.status(500).json({
          success: false,
          error: 'Failed to bulk update users',
        });
      }
    },
  ];
}
