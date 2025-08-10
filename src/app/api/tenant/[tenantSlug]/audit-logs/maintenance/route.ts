import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { runAuditLogMaintenance } from '@/lib/auditRetention';
import { createAuditLogFromRequest } from '@/lib/audit';

// POST /api/tenant/[tenantSlug]/audit-logs/maintenance - Run maintenance
export const POST = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId!;

    const result = await runAuditLogMaintenance(tenantId);

    // Create audit log for this action
    await createAuditLogFromRequest(req, { id: userId, email: req.user!.email || '', role: 'user' }, 'audit.maintenance.run', {
      tenantId: tenantId,
      result
    });

    return createSuccessResponse(result, 'Maintenance completed successfully');

  } catch (error: any) {
    console.error('Error running maintenance:', error);
    return createErrorResponse('Failed to run maintenance', 500);
  }
}); 