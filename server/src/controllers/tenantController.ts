import { PermissionService } from '@/services/PermissionService';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createAuditLog } from '../services/auditService';
// import { DataScopeService } from '../services/DataScopeService';

const prisma = new PrismaClient();
const permissionService = PermissionService.getInstance();

// Validation schemas
const createTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  domain: z
    .string()
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain format')
    .optional(),
  isActive: z.boolean().default(true),
  loginRestrictions: z.record(z.any()).optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required').optional(),
  domain: z
    .string()
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain format')
    .optional(),
  isActive: z.boolean().optional(),
  loginRestrictions: z.record(z.any()).optional(),
});

const bulkOperationSchema = z.object({
  tenantIds: z.array(z.string()).min(1, 'At least one tenant ID is required'),
  action: z.enum(['activate', 'deactivate', 'delete']),
  reason: z.string().optional(),
});

export class TenantController {
  // Create tenant
  async createTenant(req: Request, res: Response): Promise<void> {
    try {
      // Check permission
      const hasPermission = await permissionService.hasPermission(
        req.user?.id || '',
        'tenants',
        'create'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create tenants',
        });
        return;
      }

      // Validate input
      const validatedData = createTenantSchema.parse(req.body);

      // Check if tenant with same domain already exists
      if (validatedData.domain) {
        const existingTenant = await prisma?.tenant?.findUnique({
          where: { domain: validatedData.domain },
        });

        if (existingTenant) {
          res.status(400).json({
            success: false,
            message: 'Tenant with this domain already exists',
          });
          return;
        }
      }

      // Create tenant
      const tenant = await prisma?.tenant?.create({
        data: {
          name: validatedData.name,
          domain: validatedData.domain,
          isActive: validatedData.isActive,
          loginRestrictions: validatedData.loginRestrictions,
        },
      });

      // Create audit log
      await createAuditLog({
        action: 'CREATE',
        resource: 'tenant',
        userId: req.user?.id || 'system',
        tenantId: req.user?.tenantId,
        details: { name: tenant?.name, domain: tenant?.domain },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json({
        success: true,
        message: 'Tenant created successfully',
        data: {
          tenant: {
            id: tenant?.id,
            name: tenant?.name,
            domain: tenant?.domain,
            isActive: tenant?.isActive,
            createdAt: tenant?.createdAt,
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

      console.error('Error creating tenant:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get tenants with pagination and filtering
  async getTenants(req: Request, res: Response): Promise<void> {
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
        'tenants',
        'read'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view tenants',
        });
      }

      const {
        page = 1,
        limit = 10,
        // search = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        // isActive,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build where clause with data scope
      let whereClause: any = {};

      // Superadmin can see all tenants, others can only see their own tenant
      if (!req.user?.isSuperadmin) {
        whereClause.id = req.user?.tenantId;
      }

      // Get tenants with pagination
      const [tenants, total] = await Promise.all([
        prisma?.tenant?.findMany({
          where: whereClause,
          include: {
            _count: {
              select: {
                users: true,
                roles: true,
              },
            },
          },
          orderBy: {
            [sortBy as string]: sortOrder as 'asc' | 'desc',
          },
          skip: offset,
          take: limitNum,
        }),
        prisma?.tenant?.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        message: 'Tenants retrieved successfully',
        data: {
          tenants: tenants.map(tenant => ({
            id: tenant?.id,
            name: tenant?.name,
            domain: tenant?.domain,
            isActive: tenant?.isActive,
            userCount: tenant?._count.users,
            roleCount: tenant?._count.roles,
            createdAt: tenant?.createdAt,
            updatedAt: tenant?.updatedAt,
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
      console.error('Error retrieving tenants:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get tenant by ID
  async getTenantById(req: Request, res: Response): Promise<void> {
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
        'tenants',
        'read'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view tenants',
        });
      }

      // Build where clause with data scope
      let whereClause: any = { id };

      // Superadmin can see all tenants, others can only see their own tenant
      if (!req.user?.isSuperadmin) {
        whereClause.id = req.user?.tenantId;
      }

      const tenant = await prisma?.tenant?.findFirst({
        where: whereClause,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
              createdAt: true,
            },
            take: 10, // Limit to first 10 users
          },
          roles: {
            select: {
              id: true,
              name: true,
              description: true,
              isGlobal: true,
              createdAt: true,
            },
            take: 10, // Limit to first 10 roles
          },
          _count: {
            select: {
              users: true,
              roles: true,
            },
          },
        },
      });

      if (!tenant) {
        res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }

      res.json({
        success: true,
        message: 'Tenant retrieved successfully',
        data: {
          tenant: {
            id: tenant?.id,
            name: tenant?.name,
            domain: tenant?.domain,
            isActive: tenant?.isActive,
            loginRestrictions: tenant?.loginRestrictions,
            users: tenant?.users,
            roles: tenant?.roles,
            userCount: tenant?._count.users,
            roleCount: tenant?._count.roles,
            createdAt: tenant?.createdAt,
            updatedAt: tenant?.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error('Error retrieving tenant:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Update tenant
  async updateTenant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check permission
      const hasPermission = await permissionService.hasPermission(
        req.user?.id || '',
        'tenants',
        'update'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update tenants',
        });
      }

      // Validate input
      const validatedData = updateTenantSchema.parse(req.body);

      // Check if tenant exists and user has access
      let whereClause: any = { id };

      // Superadmin can see all tenants, others can only see their own tenant
      if (!req.user?.isSuperadmin) {
        whereClause.id = req.user?.tenantId;
      }

      const existingTenant = await prisma?.tenant?.findFirst({
        where: whereClause,
      });

      if (!existingTenant) {
        res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }

      // Check if domain is being changed and if it's already taken
      if (
        validatedData.domain &&
        validatedData.domain !== existingTenant?.domain
      ) {
        const domainExists = await prisma?.tenant?.findUnique({
          where: { domain: validatedData.domain },
        });

        if (domainExists) {
          res.status(400).json({
            success: false,
            message: 'Domain already exists',
          });
        }
      }

      // Update tenant
      const updateData: any = {};
      if (validatedData.name) updateData.name = validatedData.name;
      if (validatedData.domain !== undefined)
        updateData.domain = validatedData.domain;
      if (validatedData.isActive !== undefined)
        updateData.isActive = validatedData.isActive;
      if (validatedData.loginRestrictions !== undefined)
        updateData.loginRestrictions = validatedData.loginRestrictions;

      const updatedTenant = await prisma?.tenant?.update({
        where: { id },
        data: updateData,
      });

      // Create audit log
      await createAuditLog({
        action: 'UPDATE',
        resource: 'tenant',
        userId: req.user?.id || 'system',
        tenantId: req.user?.tenantId,
        details: { updatedFields: Object.keys(updateData) },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Tenant updated successfully',
        data: {
          tenant: {
            id: updatedTenant.id,
            name: updatedTenant.name,
            domain: updatedTenant.domain,
            isActive: updatedTenant.isActive,
            createdAt: updatedTenant.createdAt,
            updatedAt: updatedTenant.updatedAt,
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

      console.error('Error updating tenant:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Delete tenant
  async deleteTenant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check permission
      const hasPermission = await permissionService.hasPermission(
        req.user?.id || '',
        'tenants',
        'delete'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete tenants',
        });
      }

      // Check if tenant exists and user has access
      let whereClause: any = { id };

      // Superadmin can see all tenants, others can only see their own tenant
      if (!req.user?.isSuperadmin) {
        whereClause.id = req.user?.tenantId;
      }

      const existingTenant = await prisma?.tenant?.findFirst({
        where: whereClause,
        include: {
          _count: {
            select: {
              users: true,
              roles: true,
            },
          },
        },
      });

      if (!existingTenant) {
        res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }

      // Check if tenant has users or roles
      if (
        (existingTenant?._count?.users && existingTenant._count.users > 0) ||
        (existingTenant?._count?.roles && existingTenant._count.roles > 0)
      ) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete tenant that has users or roles',
          data: {
            userCount: existingTenant?._count.users,
            roleCount: existingTenant?._count.roles,
          },
        });
      }

      // Delete tenant (cascade will handle related records)
      await prisma?.tenant?.delete({
        where: { id },
      });

      // Create audit log
      await createAuditLog({
        action: 'DELETE',
        resource: 'tenant',
        userId: req.user?.id || 'system',
        tenantId: req.user?.tenantId,
        details: { name: existingTenant?.name, domain: existingTenant?.domain },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Tenant deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting tenant:', error);
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
      const hasPermission = await permissionService.hasPermission(
        req.user?.id || '',
        'tenants',
        'update'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to perform bulk operations',
        });
      }

      // Validate input
      const validatedData = bulkOperationSchema.parse(req.body);

      // Build where clause with data scope
      let whereClause: any = {};

      // Superadmin can see all tenants, others can only see their own tenant
      if (!req.user?.isSuperadmin) {
        whereClause.id = req.user?.tenantId;
      }

      // Get tenants that user has access to
      const accessibleTenants = await prisma?.tenant?.findMany({
        where: whereClause,
        select: { id: true, name: true, domain: true },
      });

      if (accessibleTenants.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No accessible tenants found',
        });
      }

      const tenantIds = accessibleTenants.map(tenant => tenant?.id);

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
          // Check if any tenant has users or roles
          const tenantsWithData = await prisma?.tenant?.findMany({
            where: { id: { in: tenantIds } },
            include: {
              _count: {
                select: {
                  users: true,
                  roles: true,
                },
              },
            },
          });

          const tenantsWithUsersOrRoles = tenantsWithData.filter(
            tenant => tenant?._count.users > 0 || tenant?._count.roles > 0
          );

          if (tenantsWithUsersOrRoles.length > 0) {
            res.status(400).json({
              success: false,
              message: 'Cannot delete tenants that have users or roles',
              data: {
                tenants: tenantsWithUsersOrRoles.map(tenant => ({
                  id: tenant?.id,
                  name: tenant?.name,
                  userCount: tenant?._count.users,
                  roleCount: tenant?._count.roles,
                })),
              },
            });
          }

          await prisma?.tenant?.deleteMany({
            where: { id: { in: tenantIds } },
          });
          operationMessage = 'deleted';
          break;
      }

      if (validatedData.action !== 'delete') {
        await prisma?.tenant?.updateMany({
          where: { id: { in: tenantIds } },
          data: updateData,
        });
      }

      // Create audit log
      await createAuditLog({
        action: validatedData?.action?.toUpperCase(),
        resource: 'tenant',
        userId: req.user?.id || 'system',
        tenantId: req.user?.tenantId,
        details: {
          action: validatedData.action,
          tenantIds,
          reason: validatedData.reason,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: `${tenantIds.length} tenants ${operationMessage} successfully`,
        data: {
          processedCount: tenantIds.length,
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

  // Get tenant statistics
  async getTenantStats(req: Request, res: Response): Promise<void> {
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
        'tenants',
        'read'
      );
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view tenant statistics',
        });
      }

      // Build where clause with data scope
      let whereClause: any = {};

      // Superadmin can see all tenants, others can only see their own tenant
      if (!req.user?.isSuperadmin) {
        whereClause.id = req.user?.tenantId;
      }

      // Get tenant statistics
      const [totalTenants, activeTenants, totalUsers, totalRoles] =
        await Promise.all([
          prisma?.tenant?.count({ where: whereClause }),
          prisma?.tenant?.count({ where: { ...whereClause, isActive: true } }),
          prisma?.user?.count({
            where: { tenantId: { in: Object.keys(whereClause) } },
          }),
          prisma?.role?.count({
            where: { tenantId: { in: Object.keys(whereClause) } },
          }),
        ]);

      res.json({
        success: true,
        message: 'Tenant statistics retrieved successfully',
        data: {
          stats: {
            totalTenants,
            activeTenants,
            inactiveTenants: totalTenants - activeTenants,
            totalUsers,
            totalRoles,
          },
        },
      });
    } catch (error) {
      console.error('Error retrieving tenant statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export const tenantController = new TenantController();
