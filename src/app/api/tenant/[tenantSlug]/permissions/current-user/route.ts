import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

// GET /api/tenant/[tenantSlug]/permissions/current-user - Get current user's permissions and menu config
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    // User is already authenticated and verified by middleware
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Fetch user with roles and permissions
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenantId,
        isActive: true
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: {
                      include: {
                        module: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    if (!user.tenant || user.tenant.slug !== tenantSlug) {
      return createErrorResponse('Tenant mismatch', 403);
    }

    if (!user.tenant.isActive) {
      return createErrorResponse('Tenant is disabled', 403);
    }

    // Extract user permissions
    const userPermissions = new Set<string>();
    const modulePermissions = new Map<string, Set<string>>();
    const accessibleModules = new Set<string>();

    user.userRoles.forEach(userRole => {
      userRole.role.permissions.forEach(rp => {
        const permission = rp.permission;
        const moduleKey = permission.module.moduleKey;
        
        // Add to user permissions set
        userPermissions.add(`${moduleKey}:${permission.action}`);
        
        // Add to module permissions map
        if (!modulePermissions.has(moduleKey)) {
          modulePermissions.set(moduleKey, new Set());
        }
        modulePermissions.get(moduleKey)!.add(permission.action);
        
        // Mark module as accessible
        accessibleModules.add(moduleKey);
      });
    });

    // Fetch all modules with their hierarchy
    const allModules = await prisma.module.findMany({
      where: {
        isActive: true,
        isVisible: true
      },
      orderBy: [
        { orderIndex: 'asc' },
        { moduleName: 'asc' }
      ]
    });

    // Build menu structure based on user permissions
    const buildMenuItems = (modules: any[], parentKey: string | null = null) => {
      return modules
        .filter(module => {
          // Filter by parent
          if (parentKey === null) {
            return !module.parentModuleKey;
          }
          return module.parentModuleKey === parentKey;
        })
        .filter(module => {
          // Check if user has access to this module
          return accessibleModules.has(module.moduleKey);
        })
        .map(module => {
          const modulePerms = modulePermissions.get(module.moduleKey) || new Set();
          const children = buildMenuItems(modules, module.moduleKey);
          
          return {
            id: module.moduleKey,
            label: module.moduleName,
            icon: module.icon,
            path: module.path,
            description: module.description,
            permissions: Array.from(modulePerms),
            children: children.length > 0 ? children : undefined,
            hasChildren: children.length > 0
          };
        })
        .filter(item => {
          // Remove parent items that have no accessible children
          if (item.hasChildren && (!item.children || item.children.length === 0)) {
            return false;
          }
          return true;
        });
    };

    const menuItems = buildMenuItems(allModules);

    // Check if user has any accessible modules
    const hasAccess = accessibleModules.size > 0;

    // Build user profile with roles
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      tenant: user.tenant,
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        isDefault: ur.role.isDefault
      }))
    };

    return createSuccessResponse({
      user: userProfile,
      permissions: Array.from(userPermissions),
      modulePermissions: Object.fromEntries(
        Array.from(modulePermissions.entries()).map(([key, value]) => [key, Array.from(value)])
      ),
      accessibleModules: Array.from(accessibleModules),
      menuItems,
      hasAccess,
      totalPermissions: userPermissions.size,
      totalModules: accessibleModules.size
    }, 'User permissions retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching user permissions:', error);
    return createErrorResponse('Failed to fetch user permissions', 500);
  }
}); 