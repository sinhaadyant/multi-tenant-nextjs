import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';

// GET /api/tenant/[tenantSlug]/permissions - Get all available permissions grouped by module
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  // Get authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized - No token provided', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify JWT token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.tenantId) {
      return createErrorResponse('Invalid token', 401);
    }

    // Fetch user with roles and permissions
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: decoded.tenantId,
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
      return createErrorResponse('User not found', 404);
    }

    if (!user.tenant || user.tenant.slug !== tenantSlug) {
      return createErrorResponse('Tenant mismatch', 403);
    }

    if (!user.tenant.isActive) {
      return createErrorResponse('Tenant is disabled', 403);
    }

    // Check if user has permission to view permissions
    const hasPermission = user.userRoles.some(userRole =>
      userRole.role.permissions.some(rp => 
        rp.permission.module === 'roles' && 
        (rp.permission.action === 'read' || rp.permission.action === 'create')
      )
    );

    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions to view permissions', 403);
    }

    // Fetch all active permissions
    const permissions = await prisma.permission.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { module: 'asc' },
        { submodule: 'asc' },
        { action: 'asc' }
      ]
    });

    // Group permissions by module
    const modulesMap = new Map<string, {
      name: string;
      description?: string;
      permissions: Array<{
        id: string;
        name: string;
        description?: string;
        module: string;
        submodule?: string;
        action: string;
      }>;
    }>();

    permissions.forEach(permission => {
      const moduleKey = permission.module;
      
      if (!modulesMap.has(moduleKey)) {
        modulesMap.set(moduleKey, {
          name: permission.module,
          description: getModuleDescription(permission.module),
          permissions: []
        });
      }
      
      modulesMap.get(moduleKey)!.permissions.push({
        id: permission.id,
        name: permission.name,
        description: permission.description,
        module: permission.module,
        submodule: permission.submodule,
        action: permission.action
      });
    });

    // Convert to array format
    const modules = Array.from(modulesMap.values());

    return createSuccessResponse({
      modules,
      totalPermissions: permissions.length,
      totalModules: modules.length
    }, 'Permissions retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    return createErrorResponse('Failed to fetch permissions', 500);
  }
});

// Helper function to get module descriptions
function getModuleDescription(module: string): string {
  const descriptions: Record<string, string> = {
    'dashboard': 'Access to dashboard and analytics',
    'users': 'User management and administration',
    'roles': 'Role and permission management',
    'reports': 'Report generation and viewing',
    'settings': 'System and tenant settings',
    'audit': 'Audit logs and activity tracking',
    'notifications': 'Notification management',
    'backup': 'Data backup and restore',
    'support': 'Support ticket management',
    'analytics': 'Advanced analytics and insights',
    'content': 'Content management',
    'billing': 'Billing and subscription management',
    'api': 'API access and management',
    'security': 'Security settings and policies',
    'integrations': 'Third-party integrations'
  };

  return descriptions[module.toLowerCase()] || `Access to ${module} module`;
} 