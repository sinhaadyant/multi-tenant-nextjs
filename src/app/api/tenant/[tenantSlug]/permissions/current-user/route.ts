import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
    
    if (!tenantSlug) {
      return createErrorResponse('Tenant slug is required', 400);
    }

    // Verify authentication token
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return createErrorResponse('No authentication token found', 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return createErrorResponse('Invalid authentication token', 401);
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true, slug: true, isActive: true }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    if (!tenant.isActive) {
      return createErrorResponse('Tenant is inactive', 403);
    }

    // Get user with roles and permissions
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: tenant.id,
        isActive: true
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
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
      return createErrorResponse('User not found or not authorized for this tenant', 404);
    }

    // Extract all permissions from user's roles
    const allPermissions: string[] = [];
    const modulePermissions: { [key: string]: string[] } = {};
    const accessibleModules: string[] = [];

    user.userRoles.forEach(userRole => {
      userRole.role.permissions.forEach(rp => {
        const permission = rp.permission;
        const permissionKey = `${permission.module}:${permission.action}`;
        
        // Add to all permissions
        if (!allPermissions.includes(permissionKey)) {
          allPermissions.push(permissionKey);
        }

        // Add to module permissions
        if (!modulePermissions[permission.module]) {
          modulePermissions[permission.module] = [];
        }
        if (!modulePermissions[permission.module].includes(permission.action)) {
          modulePermissions[permission.module].push(permission.action);
        }

        // Add to accessible modules
        if (!accessibleModules.includes(permission.module)) {
          accessibleModules.push(permission.module);
        }
      });
    });

    // Generate menu items based on permissions
    const menuItems = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "LayoutDashboard",
        path: "/dashboard",
        description: "Main dashboard with overview and analytics",
        permissions: ["dashboard:view"],
        hasChildren: false
      },
      {
        id: "users",
        label: "Users",
        icon: "Users",
        path: "/users",
        description: "Manage users and their roles",
        permissions: ["users:view"],
        hasChildren: false
      },
      {
        id: "roles",
        label: "Roles",
        icon: "Shield",
        path: "/roles",
        description: "Manage roles and permissions",
        permissions: ["roles:view"],
        hasChildren: false
      },
      {
        id: "audit",
        label: "Audit Logs",
        icon: "ClipboardList",
        path: "/audit",
        description: "View system audit logs",
        permissions: ["audit:view"],
        hasChildren: false
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: "Bell",
        path: "/notifications",
        description: "Manage notifications",
        permissions: ["notifications:view"],
        hasChildren: false
      },
      {
        id: "utilities",
        label: "Settings",
        icon: "Settings",
        path: "/utilities",
        description: "System and tenant settings",
        permissions: ["settings:view"],
        hasChildren: false
      }
    ].filter(item => {
      // Filter menu items based on user permissions
      return item.permissions.some(permission => allPermissions.includes(permission));
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      { id: user.id, email: user.email, role: 'user' },
      'user.permissions.fetch',
      { 
        userId: user.id,
        tenantId: tenant.id,
        permissionsCount: allPermissions.length,
        modulesCount: accessibleModules.length
      }
    );

    const userPermissionsData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        tenant: user.tenant,
        roles: user.userRoles.map(userRole => ({
          id: userRole.role.id,
          name: userRole.role.name,
          description: userRole.role.description,
          isDefault: userRole.role.isDefault
        }))
      },
      permissions: allPermissions,
      modulePermissions: modulePermissions,
      accessibleModules: accessibleModules,
      menuItems: menuItems,
      hasAccess: allPermissions.length > 0,
      totalPermissions: allPermissions.length,
      totalModules: accessibleModules.length
    };

    return createSuccessResponse(userPermissionsData, 'User permissions fetched successfully');

  } catch (error: any) {
    console.error('Error fetching user permissions:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    return createSuccessResponse({ message: 'API endpoint working' }, 'Success');
  } catch (error: any) {
    console.error('Error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
