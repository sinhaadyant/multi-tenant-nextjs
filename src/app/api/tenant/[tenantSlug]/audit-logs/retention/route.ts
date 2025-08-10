import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { 
  getRetentionPolicy, 
  setRetentionPolicy, 
  getAuditLogStats 
} from '@/lib/auditRetention';
import { createAuditLogFromRequest } from '@/lib/audit';

// GET /api/tenant/[tenantSlug]/audit-logs/retention - Get retention policy
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId!;

    const policy = await getRetentionPolicy(tenantId);
    const stats = await getAuditLogStats(tenantId);

    // Create audit log for this action
    await createAuditLogFromRequest(req, { id: userId, email: req.user!.email || '', role: 'user' }, 'audit.retention.view', {
      tenantId: tenantId
    });

    return createSuccessResponse({
      policy,
      stats
    }, 'Retention policy fetched successfully');

  } catch (error: any) {
    console.error('Error fetching retention policy:', error);
    return createErrorResponse('Failed to fetch retention policy', 500);
  }
});

// POST /api/tenant/[tenantSlug]/audit-logs/retention - Set retention policy
export const POST = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId!;
    const body = await req.json();

    const { retentionDays, autoArchive, archiveAfterDays, purgeAfterDays } = body;

    // Validate input
    if (retentionDays && (retentionDays < 30 || retentionDays > 3650)) {
      return createErrorResponse('Retention days must be between 30 and 3650', 400);
    }

    await setRetentionPolicy(tenantId, {
      tenantId,
      retentionDays: retentionDays || 365,
      autoArchive: autoArchive || false,
      archiveAfterDays: archiveAfterDays || 90,
      purgeAfterDays: purgeAfterDays || 365
    });

    // Create audit log for this action
    await createAuditLogFromRequest(req, { id: userId, email: req.user!.email || '', role: 'user' }, 'audit.retention.update', {
      tenantId: tenantId,
      policy: { retentionDays, autoArchive, archiveAfterDays, purgeAfterDays }
    });

    return createSuccessResponse({}, 'Retention policy updated successfully');

  } catch (error: any) {
    console.error('Error updating retention policy:', error);
    return createErrorResponse('Failed to update retention policy', 500);
  }
}); 