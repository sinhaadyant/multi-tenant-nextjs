import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createAuditLog } from '@/services/auditService';
import { PermissionService } from '@/services/PermissionService';

const prisma = new PrismaClient();
const permissionService = PermissionService.getInstance();

// Validation schemas
const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  tenantId: z.string().optional(),
  isGlobal: z.boolean().default(false),
  permissions: z
    .array(
      z.object({
        moduleId: z.string(),
        submoduleId: z.string().optional(),
        canCreate: z.boolean().default(false),
        canRead: z.boolean().default(false),
        canUpdate: z.boolean().default(false),
        canDelete: z.boolean().default(false),
        canViewAll: z.boolean().default(false),
      })
    )
    .optional(),
});

const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').optional(),
  description: z.string().optional(),
  isGlobal: z.boolean().optional(),
  permissions: z
    .array(
      z.object({
        moduleId: z.string(),
        submoduleId: z.string().optional(),
        canCreate: z.boolean().default(false),
        canRead: z.boolean().default(false),
        canUpdate: z.boolean().default(false),
        canDelete: z.boolean().default(false),
        canViewAll: z.boolean().default(false),
      })
    )
    .optional(),
});

const cloneRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  tenantId: z.string().optional(),
});

export class RoleController {
  // Create role
  async createRole(req: Request, res: Response): Promise<void> {
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
        'roles',
        'create'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create roles',
        });
      }

      // Validate input
      const validatedData = createRoleSchema.parse(req.body);

      // Check if role already exists in the same tenant
      const existingRole = await prisma?.role?.findFirst({
        where: {
          name: validatedData.name,
          tenantId: validatedData.tenantId || req.user?.tenantId || null,
        },
      });

      if (existingRole) {
        res.status(400).json({
          success: false,
          message: 'Role with this name already exists in this tenant',
        });
      }

      // Create role
      const role = await prisma?.role?.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          tenantId: validatedData.tenantId || req.user?.tenantId || null,
          isGlobal: validatedData.isGlobal,
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Create permissions if provided
      if (validatedData.permissions && validatedData?.permissions?.length > 0) {
        const permissions = validatedData?.permissions?.map(permission => ({
          roleId: role?.id,
          moduleId: permission.moduleId,
          submoduleId: permission.submoduleId,
          canCreate: permission.canCreate,
          canRead: permission.canRead,
          canUpdate: permission.canUpdate,
          canDelete: permission.canDelete,
          canViewAll: permission.canViewAll,
        }));

        await prisma?.rolePermission?.createMany({
          data: permissions || [],
        });
      }

      // Create audit log
      await createAuditLog({
        action: 'CREATE',
        resource: 'role',

        userId: req.user?.id || 'system',
        tenantId: req.user?.tenantId || undefined,
        details: { name: role?.name, isGlobal: role?.isGlobal },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: {
          role: {
            id: role?.id,
            name: role?.name,
            description: role?.description,
            isGlobal: role?.isGlobal,
            tenantId: role?.tenantId,
            tenant: role?.tenant,
            createdAt: role?.createdAt,
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

      console.error('Error creating role:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get roles with pagination and filtering
  async getRoles(req: Request, res: Response): Promise<void> {
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
        'roles',
        'read'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view roles',
        });
        return;
      }

      const {
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        isGlobal,
        tenantId,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build where clause with data scope
      let whereClause: any = {};

      // Superadmin can see all roles, others can only see roles in their tenant
      if (!req.user?.isSuperadmin) {
        whereClause.tenantId = req.user?.tenantId;
      }

      // Add search filter
      if (search) {
        whereClause.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Add global filter
      if (isGlobal !== undefined) {
        whereClause.isGlobal = isGlobal === 'true';
      }

      // Add tenant filter
      if (tenantId) {
        whereClause.tenantId = tenantId as string;
      }

      // Get roles with pagination
      const [roles, total] = await Promise.all([
        prisma?.role?.findMany({
          where: whereClause,
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
              },
            },
            rolePermissions: {
              include: {
                module: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                submodule: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: {
                userRoles: true,
              },
            },
          },
          orderBy: {
            [sortBy as string]: sortOrder as 'asc' | 'desc',
          },
          skip: offset,
          take: limitNum,
        }),
        prisma?.role?.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        message: 'Roles retrieved successfully',
        data: {
          roles: roles.map(role => ({
            id: role?.id,
            name: role?.name,
            description: role?.description,
            isGlobal: role?.isGlobal,
            tenantId: role?.tenantId,
            tenant: role?.tenant,
            permissions: role?.rolePermissions.map(rp => ({
              id: rp.id,
              module: rp.module,
              submodule: rp.submodule,
              canCreate: rp.canCreate,
              canRead: rp.canRead,
              canUpdate: rp.canUpdate,
              canDelete: rp.canDelete,
              canViewAll: rp.canViewAll,
            })),
            userCount: role?._count.userRoles,
            createdAt: role?.createdAt,
            updatedAt: role?.updatedAt,
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
      console.error('Error retrieving roles:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get role by ID
  async getRoleById(req: Request, res: Response): Promise<void> {
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
        'roles',
        'read'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view roles',
        });
        return;
      }

      // Build where clause with data scope
      let whereClause: any = { id };

      // Superadmin can see all roles, others can only see roles in their tenant
      if (!req.user?.isSuperadmin) {
        whereClause.tenantId = req.user?.tenantId;
      }

      const role = await prisma?.role?.findFirst({
        where: whereClause,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
          rolePermissions: {
            include: {
              module: {
                select: {
                  id: true,
                  name: true,
                },
              },
              submodule: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          userRoles: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Role not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Role retrieved successfully',
        data: {
          role: {
            id: role?.id,
            name: role?.name,
            description: role?.description,
            isGlobal: role?.isGlobal,
            tenantId: role?.tenantId,
            tenant: role?.tenant,
            permissions: role?.rolePermissions.map(rp => ({
              id: rp.id,
              module: rp.module,
              submodule: rp.submodule,
              canCreate: rp.canCreate,
              canRead: rp.canRead,
              canUpdate: rp.canUpdate,
              canDelete: rp.canDelete,
              canViewAll: rp.canViewAll,
            })),
            users: role?.userRoles.map(ur => ur.user),
            createdAt: role?.createdAt,
            updatedAt: role?.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error('Error retrieving role:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Update role
  async updateRole(req: Request, res: Response): Promise<void> {
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
        'roles',
        'update'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update roles',
        });
        return;
      }

      // Validate input
      const validatedData = updateRoleSchema.parse(req.body);

      // Check if role exists and user has access
      let whereClause: any = { id };

      // Superadmin can see all roles, others can only see roles in their tenant
      if (!req.user?.isSuperadmin) {
        whereClause.tenantId = req.user?.tenantId;
      }

      const existingRole = await prisma?.role?.findFirst({
        where: whereClause,
      });

      if (!existingRole) {
        res.status(404).json({
          success: false,
          message: 'Role not found',
        });
      }

      // Check if name is being changed and if it's already taken
      if (validatedData.name && validatedData.name !== existingRole?.name) {
        const nameExists = await prisma?.role?.findFirst({
          where: {
            name: validatedData.name,
            tenantId: existingRole?.tenantId,
            id: { not: id },
          },
        });

        if (nameExists) {
          res.status(400).json({
            success: false,
            message: 'Role name already exists in this tenant',
          });
          return;
        }
      }

      // Update role
      const updateData: any = {};
      if (validatedData.name) updateData.name = validatedData.name;
      if (validatedData.description !== undefined)
        updateData.description = validatedData.description;
      if (validatedData.isGlobal !== undefined)
        updateData.isGlobal = validatedData.isGlobal;

      const updatedRole = await prisma?.role?.update({
        where: { id },
        data: updateData,
        include: {
          tenant: true,
        },
      });

      // Update permissions if provided
      if (validatedData.permissions) {
        // Remove existing permissions
        await prisma?.rolePermission?.deleteMany({
          where: { roleId: id },
        });

        // Add new permissions
        if (validatedData?.permissions?.length > 0) {
          const permissions = validatedData?.permissions?.map(permission => ({
            roleId: id || '',
            moduleId: permission.moduleId,
            submoduleId: permission.submoduleId,
            canCreate: permission.canCreate,
            canRead: permission.canRead,
            canUpdate: permission.canUpdate,
            canDelete: permission.canDelete,
            canViewAll: permission.canViewAll,
          }));

          await prisma?.rolePermission?.createMany({
            data: permissions || [],
          });
        }
      }

      // Create audit log
      await createAuditLog({
        action: 'UPDATE',
        resource: 'role',

        userId: req.user?.id || 'system',
        tenantId: req.user?.tenantId || undefined,
        details: { updatedFields: Object.keys(updateData) },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Role updated successfully',
        data: {
          role: {
            id: updatedRole.id,
            name: updatedRole.name,
            description: updatedRole.description,
            isGlobal: updatedRole.isGlobal,
            tenantId: updatedRole.tenantId,
            createdAt: updatedRole.createdAt,
            updatedAt: updatedRole.updatedAt,
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

      console.error('Error updating role:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Delete role
  async deleteRole(req: Request, res: Response): Promise<void> {
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
        'roles',
        'delete'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete roles',
        });
        return;
      }

      // Check if role exists and user has access
      let whereClause: any = { id };

      // Superadmin can see all roles, others can only see roles in their tenant
      if (!req.user?.isSuperadmin) {
        whereClause.tenantId = req.user?.tenantId;
      }

      const existingRole = await prisma?.role?.findFirst({
        where: whereClause,
        include: {
          userRoles: {
            select: { id: true },
          },
        },
      });

      if (!existingRole) {
        res.status(404).json({
          success: false,
          message: 'Role not found',
        });
      }

      // Check if role is assigned to any users
      if (existingRole?.userRoles && existingRole.userRoles.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete role that is assigned to users',
          data: {
            userCount: existingRole?.userRoles.length,
          },
        });
      }

      // Delete role (cascade will handle related records)
      await prisma?.role?.delete({
        where: { id },
      });

      // Create audit log
      await createAuditLog({
        action: 'DELETE',
        resource: 'role',
        userId: req.user?.id || 'system',
        tenantId: req.user?.tenantId || undefined,
        details: { name: existingRole?.name },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Role deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Clone role
  async cloneRole(req: Request, res: Response): Promise<void> {
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
        'roles',
        'create'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create roles',
        });
      }

      // Validate input
      const validatedData = cloneRoleSchema.parse(req.body);

      // Check if source role exists and user has access
      let whereClause: any = { id };

      // Superadmin can see all roles, others can only see roles in their tenant
      if (!req.user?.isSuperadmin) {
        whereClause.tenantId = req.user?.tenantId;
      }

      const sourceRole = await prisma?.role?.findFirst({
        where: whereClause,
        include: {
          rolePermissions: true,
        },
      });

      if (!sourceRole) {
        res.status(404).json({
          success: false,
          message: 'Source role not found',
        });
        return;
      }

      // Check if new role name already exists
      const existingRole = await prisma?.role?.findFirst({
        where: {
          name: validatedData.name,
          tenantId: validatedData.tenantId || sourceRole?.tenantId,
        },
      });

      if (existingRole) {
        res.status(400).json({
          success: false,
          message: 'Role with this name already exists in this tenant',
        });
      }

      // Create new role
      const newRole = await prisma?.role?.create({
        data: {
          name: validatedData.name,
          description: validatedData.description || sourceRole?.description,
          tenantId: validatedData.tenantId || sourceRole?.tenantId,
          isGlobal: sourceRole?.isGlobal,
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Clone permissions
      if (
        sourceRole?.rolePermissions &&
        sourceRole.rolePermissions.length > 0
      ) {
        const permissions = sourceRole?.rolePermissions.map(permission => ({
          roleId: newRole.id,
          moduleId: permission.moduleId,
          submoduleId: permission.submoduleId,
          canCreate: permission.canCreate,
          canRead: permission.canRead,
          canUpdate: permission.canUpdate,
          canDelete: permission.canDelete,
          canViewAll: permission.canViewAll,
        }));

        await prisma?.rolePermission?.createMany({
          data: permissions || [],
        });
      }

      // Create audit log
      await createAuditLog({
        action: 'CREATE',
        resource: 'role',
        userId: req.user?.id || 'system',
        tenantId: req.user?.tenantId || undefined,
        details: {
          name: newRole.name,
          clonedFrom: sourceRole?.name,
          permissionCount: sourceRole?.rolePermissions.length,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json({
        success: true,
        message: 'Role cloned successfully',
        data: {
          role: {
            id: newRole.id,
            name: newRole.name,
            description: newRole.description,
            isGlobal: newRole.isGlobal,
            tenantId: newRole.tenantId,
            tenant: newRole.tenant,
            createdAt: newRole.createdAt,
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

      console.error('Error cloning role:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export const roleController = new RoleController();
