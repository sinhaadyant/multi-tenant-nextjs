import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { withSuperAdminAuth } from '@/lib/authMiddleware';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withSuperAdminAuth(async (req: NextRequest, user: any) => {
    try {
      const { id: tenantId } = await params;

      // Validate tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return createErrorResponse('Tenant not found', 404);
      }

      // Get roles for this tenant
      const roles = await prisma.role.findMany({
        where: {
          tenantId: tenantId,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          isDefault: true,
          color: true,
          priority: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: [
          { priority: 'asc' },
          { name: 'asc' }
        ]
      });

      return createSuccessResponse({ roles }, 'Roles retrieved successfully');
    } catch (error: any) {
      console.error('Error fetching tenant roles:', error);
      return createErrorResponse('Failed to fetch roles', 500);
    }
  })(req);
}
