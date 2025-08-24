import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { checkTenantPermission } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';
import { updateNotificationSchema } from '@/lib/validations/superadmin';

export const GET = withTenantAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ tenantSlug: string; id: string }> }
) => {
  try {
    const { tenantSlug, id } = await params;
    const user = req.user!;

    // Check permission to view notifications
    const hasPermission = await checkTenantPermission(user, user.tenantId!, 'notifications.view');
    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    // Get tenant ID from slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    // Get notification
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        targetTenantId: tenant.id,
        isActive: true
      },
      include: {
        superAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!notification) {
      return createErrorResponse('Notification not found', 404);
    }

    return createSuccessResponse({ notification }, 'Notification retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching notification:', error);
    return createErrorResponse('Internal server error', 500);
  }
});


