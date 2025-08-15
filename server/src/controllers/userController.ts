import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PermissionService } from '@/services/PermissionService';
import { createAuditLog } from '../services/auditService';

const prisma = new PrismaClient();
const permissionService = PermissionService.getInstance();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  tenantId: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
});

const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string()).optional(),
});

const bulkOperationSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
  action: z.enum(['activate', 'deactivate', 'delete']),
  reason: z.string().optional(),
});

export class UserController {
  // Create user
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      // Check permission
      if (!req.user || !req?.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }
      const hasPermission = await permissionService.hasPermission(
        req?.user?.id,
        'users',
        'create'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create users',
        });
        return;
      }

      // Validate input
      const validatedData = createUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await prisma?.user?.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);

      // Create user
      const user = await prisma?.user?.create({
        data: {
          email: validatedData.email,
          passwordHash: hashedPassword,
          name: `${validatedData.firstName} ${validatedData.lastName}`,
          tenantId: validatedData.tenantId || req.user?.tenantId,
          isActive: true,
        },
        include: {
          tenant: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      // Assign roles if provided
      if (validatedData.roleIds && validatedData?.roleIds?.length > 0) {
        const roleAssignments = validatedData?.roleIds?.map(roleId => ({
          userId: user?.id,
          roleId,
        }));

        await prisma?.userRole?.createMany({
          data: roleAssignments,
          skipDuplicates: true,
        });
      }

      // Create audit log
      await createAuditLog({
        action: 'CREATE',
        resource: 'user',
        userId: req.user?.id || 'system',
        tenantId: req.user?.tenantId,
        details: { email: user?.email },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: {
            id: user?.id,
            email: user?.email,
            name: user?.name,
            isActive: user?.isActive,
            tenantId: user?.tenantId,
            createdAt: user?.createdAt,
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        });
      }

      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get users with pagination and filtering
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      // Check permission
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }
      const hasPermission = await permissionService.hasPermission(
        req?.user?.id,
        'users',
        'read'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view users',
        });
        return;
      }

      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build where clause with data scope
      let whereClause: any = {};

      // Superadmin can see all users, others can only see users in their tenant
      if (!req.user?.isSuperadmin) {
        whereClause.tenantId = req.user?.tenantId;
      }

      // Get users with pagination
      const [users, total] = await Promise.all([
        prisma?.user?.findMany({
          where: whereClause,
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                domain: true,
              },
            },
            userRoles: {
              include: {
                role: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
          orderBy: {
            [sortBy as string]: sortOrder as 'asc' | 'desc',
          },
          skip: offset,
          take: limitNum,
        }),
        prisma?.user?.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: users.map(user => ({
            id: user?.id,
            email: user?.email,
            name: user?.name,
            isActive: user?.isActive,
            tenantId: user?.tenantId,
            tenant: user?.tenant,
            roles: user?.userRoles.map(ur => ur.role),
            createdAt: user?.createdAt,
            updatedAt: user?.updatedAt,
          })),
        },
        meta: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Error retrieving users:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get user by ID
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check permission
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }
      const hasPermission = await permissionService.hasPermission(
        req?.user?.id,
        'users',
        'read'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view users',
        });
        return;
      }

      // Build where clause with data scope
      let whereClause: any = { id };

      // Superadmin can see all users, others can only see users in their tenant
      if (!req.user?.isSuperadmin) {
        whereClause.tenantId = req.user?.tenantId;
      }

      const user = await prisma?.user?.findFirst({
        where: whereClause,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: {
          user: {
            id: user?.id,
            email: user?.email,
            name: user?.name,
            isActive: user?.isActive,
            tenantId: user?.tenantId,
            tenant: user?.tenant,
            roles: user?.userRoles.map(ur => ur.role),
            createdAt: user?.createdAt,
            updatedAt: user?.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error('Error retrieving user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Update user
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check permission
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }
      const hasPermission = await permissionService.hasPermission(
        req?.user?.id,
        'users',
        'update'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update users',
        });
        return;
      }

      // Validate input
      const validatedData = updateUserSchema.parse(req.body);

      // Check if user exists and user has access
      let whereClause: any = { id };

      // Superadmin can see all users, others can only see users in their tenant
      if (!req.user?.isSuperadmin) {
        whereClause.tenantId = req.user?.tenantId;
      }

      const existingUser = await prisma?.user?.findFirst({
        where: whereClause,
      });

      if (!existingUser) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Check if email is being changed and if it's already taken
      if (validatedData.email && validatedData.email !== existingUser?.email) {
        const emailExists = await prisma?.user?.findUnique({
          where: { email: validatedData.email },
        });

        if (emailExists) {
          res.status(400).json({
            success: false,
            message: 'Email already exists',
          });
          return;
        }
      }

      // Update user
      const updateData: any = {};
      if (validatedData.email) updateData.email = validatedData.email;
      if (validatedData.firstName || validatedData.lastName) {
        updateData.name = `${validatedData.firstName || existingUser?.name.split(' ')[0]} ${validatedData.lastName || existingUser?.name.split(' ')[1]}`;
      }
      if (validatedData.isActive !== undefined)
        updateData.isActive = validatedData.isActive;

      const updatedUser = await prisma?.user?.update({
        where: { id },
        data: updateData,
        include: {
          tenant: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      // Update roles if provided
      if (validatedData.roleIds) {
        // Remove existing roles
        await prisma?.userRole?.deleteMany({
          where: { userId: id },
        });

        // Add new roles
        if (validatedData?.roleIds?.length > 0) {
          const roleAssignments = validatedData?.roleIds?.map(roleId => ({
            userId: id || '',
            roleId,
          }));

          await prisma?.userRole?.createMany({
            data: roleAssignments,
          });
        }
      }

      // Create audit log
      await createAuditLog({
        action: 'UPDATE',

        userId: req.user?.id || 'system',
        tenantId: req.user?.tenantId,
        details: { updatedFields: Object.keys(updateData) },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: 'User updated successfully',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            isActive: updatedUser.isActive,
            tenantId: updatedUser.tenantId,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        });
      }

      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Delete user
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check permission
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }
      const hasPermission = await permissionService.hasPermission(
        req?.user?.id,
        'users',
        'delete'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete users',
        });
        return;
      }

      // Check if user exists and user has access
      let whereClause: any = { id };

      // Superadmin can see all users, others can only see users in their tenant
      if (!req.user?.isSuperadmin) {
        whereClause.tenantId = req.user?.tenantId;
      }

      const existingUser = await prisma?.user?.findFirst({
        where: whereClause,
      });

      if (!existingUser) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Prevent deletion of superadmin
      if (existingUser?.isSuperadmin) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete superadmin user',
        });
        return;
      }

      // Delete user (cascade will handle related records)
      await prisma?.user?.delete({
        where: { id },
      });

      // Create audit log
      await createAuditLog({
        action: 'DELETE',
        resource: 'user',
        userId: req.user?.id || 'system',
        tenantId: req.user?.tenantId,
        details: { email: existingUser?.email },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Bulk operations
  async bulkOperation(req: Request, res: Response): Promise<void> {
    try {
      // Check permission
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }
      const hasPermission = await permissionService.hasPermission(
        req?.user?.id,
        'users',
        'update'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to perform bulk operations',
        });
        return;
      }

      // Validate input
      const validatedData = bulkOperationSchema.parse(req.body);

      // Build where clause with data scope
      let whereClause: any = {};

      // Superadmin can see all users, others can only see users in their tenant
      if (!req.user?.isSuperadmin) {
        whereClause.tenantId = req.user?.tenantId;
      }

      // Get users that user has access to
      const accessibleUsers = await prisma?.user?.findMany({
        where: whereClause,
        select: { id: true, email: true, isSuperadmin: true },
      });

      if (accessibleUsers.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No accessible users found',
        });
        return;
      }

      const userIds = accessibleUsers.map(user => user?.id);

      // Perform bulk operation
      let updateData: any = {};
      let operationMessage = '';

      switch (validatedData.action) {
        case 'activate':
          updateData.isActive = true;
          operationMessage = 'activated';
          break;
        case 'deactivate':
          updateData.isActive = false;
          operationMessage = 'deactivated';
          break;
        case 'delete':
          // Prevent deletion of superadmin users
          const superadminUsers = accessibleUsers.filter(
            user => user?.isSuperadmin
          );
          if (superadminUsers.length > 0) {
            res.status(400).json({
              success: false,
              message: 'Cannot delete superadmin users',
              data: {
                superadminEmails: superadminUsers.map(user => user?.email),
              },
            });
            return;
          }

          await prisma?.user?.deleteMany({
            where: { id: { in: userIds } },
          });
          operationMessage = 'deleted';
          break;
      }

      if (validatedData.action !== 'delete') {
        await prisma?.user?.updateMany({
          where: { id: { in: userIds } },
          data: updateData,
        });
      }

      // Create audit log
      await createAuditLog({
        action: validatedData?.action?.toUpperCase(),
        resource: 'user',
        userId: req.user?.id || 'system',
        tenantId: req.user?.tenantId,
        details: {
          action: validatedData.action,
          userIds,
          reason: validatedData.reason,
        },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: `${userIds.length} users ${operationMessage} successfully`,
        data: {
          processedCount: userIds.length,
          action: validatedData.action,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        });
      }

      console.error('Error performing bulk operation:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get current user profile
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await prisma?.user?.findUnique({
        where: { id: req.user?.id },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          user: {
            id: user?.id,
            email: user?.email,
            name: user?.name,
            isActive: user?.isActive,
            isSuperadmin: user?.isSuperadmin,
            tenantId: user?.tenantId,
            tenant: user?.tenant,
            roles: user?.userRoles.map(ur => ur.role),
            createdAt: user?.createdAt,
            updatedAt: user?.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error('Error retrieving current user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Update current user profile
  async updateCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // const { firstName, lastName, phone } = req.body;

      // Validate input
      const updateSchema = z.object({
        firstName: z.string().min(1, 'First name is required').optional(),
        lastName: z.string().min(1, 'Last name is required').optional(),
        phone: z.string().optional(),
      });

      const validatedData = updateSchema.parse(req.body);

      // Update user
      const updateData: any = {};
      if (validatedData.firstName || validatedData.lastName) {
        const currentName = req.user?.email.split(' ');
        updateData.name = `${validatedData.firstName || currentName?.[0] || 'User'} ${validatedData.lastName || currentName?.[1] || 'Name'}`;
      }
      if (validatedData.phone !== undefined)
        updateData.phone = validatedData.phone;

      const updatedUser = await prisma?.user?.update({
        where: { id: req.user?.id },
        data: updateData,
        include: {
          tenant: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      // Create audit log
      await createAuditLog({
        action: 'UPDATE',
        resource: 'user',
        userId: req.user?.id || 'system',
        tenantId: req.user?.tenantId,
        details: { updatedFields: Object.keys(updateData) },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            isActive: updatedUser.isActive,
            isSuperadmin: updatedUser.isSuperadmin,
            tenantId: updatedUser.tenantId,
            tenant: updatedUser.tenant,
            roles: updatedUser?.userRoles?.map(ur => ur.role),
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        });
      }

      console.error('Error updating current user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export const userController = new UserController();
