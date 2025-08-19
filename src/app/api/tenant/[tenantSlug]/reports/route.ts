import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { checkTenantPermission } from '@/lib/permissions';
import { z } from 'zod';

// Validation schemas
const createReportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  type: z.string(),
  data: z.string().optional(),
  status: z.string().default('generating')
});

const bulkActionSchema = z.object({
  reportIds: z.array(z.string()),
  action: z.enum(['activate', 'deactivate', 'delete'])
});

// GET /api/tenant/[tenantSlug]/reports - Get reports list with filters and pagination
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check permissions
    const hasViewPermission = await checkTenantPermission(req.user!, tenantId!, 'reports.view');
    if (!hasViewPermission) {
      return createErrorResponse('Insufficient permissions to view reports', 403);
    }

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const type = url.searchParams.get('type') || '';
    const status = url.searchParams.get('status') || '';

    // Build where clause
    const where: any = {
      tenantId: tenantId
    };

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Add type filter
    if (type) {
      where.type = type;
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch reports with pagination
    const [reports, totalReports] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          superAdmin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }),
      prisma.report.count({ where })
    ]);

    // Calculate statistics
    const reportStats = {
      total: totalReports,
      byType: reports.reduce((acc, report) => {
        acc[report.type] = (acc[report.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: reports.reduce((acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    // Format response
    const formattedReports = reports.map(report => ({
      id: report.id,
      name: report.name,
      type: report.type,
      data: report.data,
      status: report.status,
      createdAt: report.createdAt,
      createdBy: report.superAdmin,
      tenant: report.tenant
    }));

    return createSuccessResponse({
      reports: formattedReports,
      pagination: {
        page,
        limit,
        total: totalReports,
        totalPages: Math.ceil(totalReports / limit),
        hasNext: page * limit < totalReports,
        hasPrev: page > 1
      },
      stats: reportStats,
      permissions: {
        canView: hasViewPermission,
        canCreate: await checkTenantPermission(req.user!, tenantId!, 'reports.create'),
        canUpdate: await checkTenantPermission(req.user!, tenantId!, 'reports.update'),
        canDelete: await checkTenantPermission(req.user!, tenantId!, 'reports.delete')
      }
    }, 'Reports retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch reports',
      error.status || 500
    );
  }
});

// POST /api/tenant/[tenantSlug]/reports - Create new report
export const POST = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Check create permission
    const hasCreatePermission = await checkTenantPermission(req.user!, tenantId!, 'reports.create');
    if (!hasCreatePermission) {
      return createErrorResponse('Insufficient permissions to create reports', 403);
    }

    const body = await req.json();
    const validatedData = createReportSchema.parse(body);

    // Check if report name already exists in tenant
    const existingReport = await prisma.report.findFirst({
      where: {
        name: validatedData.name,
        tenantId: tenantId
      }
    });

    if (existingReport) {
      return createErrorResponse('Report with this name already exists in this tenant', 400);
    }

    // Create report
    const newReport = await prisma.report.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        data: validatedData.data || '',
        status: validatedData.status,
        tenantId: tenantId,
        superAdminId: userId
      }
    });

    // Create audit log
    await createAuditLogFromRequest(req, req.user! as any, 'report.created', {
      details: `Created report: ${newReport.name}`,
      resource: 'report',
      resourceId: newReport.id
    });

    return createSuccessResponse({
      report: {
        id: newReport.id,
        name: newReport.name,
        type: newReport.type,
        status: newReport.status,
        createdAt: newReport.createdAt
      }
    }, 'Report created successfully');

  } catch (error: any) {
    console.error('Error creating report:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Validation error: ' + error.errors[0].message, 400);
    }
    return createErrorResponse(
      error.message || 'Failed to create report',
      error.status || 500
    );
  }
});

// PUT /api/tenant/[tenantSlug]/reports - Bulk actions
export const PUT = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    const body = await req.json();
    const validatedData = bulkActionSchema.parse(body);

    // Check permissions based on action
    let hasPermission = false;
    switch (validatedData.action) {
      case 'activate':
      case 'deactivate':
        hasPermission = await checkTenantPermission(req.user!, tenantId!, 'reports.update');
        break;
      case 'delete':
        hasPermission = await checkTenantPermission(req.user!, tenantId!, 'reports.delete');
        break;
    }

    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions for this action', 403);
    }

    // Verify all reports belong to the tenant
    const reports = await prisma.report.findMany({
      where: {
        id: { in: validatedData.reportIds },
        tenantId: tenantId
      }
    });

    if (reports.length !== validatedData.reportIds.length) {
      return createErrorResponse('Some reports not found or do not belong to this tenant', 400);
    }

    let result;
    switch (validatedData.action) {
      case 'activate':
        result = await prisma.report.updateMany({
          where: { 
            id: { in: validatedData.reportIds }, 
            tenantId: tenantId
          },
          data: { status: 'ready' }
        });
        break;
      case 'deactivate':
        result = await prisma.report.updateMany({
          where: { 
            id: { in: validatedData.reportIds }, 
            tenantId: tenantId
          },
          data: { status: 'generating' }
        });
        break;
      case 'delete':
        result = await prisma.report.deleteMany({
          where: { 
            id: { in: validatedData.reportIds }, 
            tenantId: tenantId
          }
        });
        break;
    }

    // Create audit log
    await createAuditLogFromRequest(req, req.user! as any, `reports.${validatedData.action}`, {
      details: `${validatedData.action} action performed on ${validatedData.reportIds.length} reports`,
      resource: 'report',
      resourceId: validatedData.reportIds.join(',')
    });

    return createSuccessResponse({
      action: validatedData.action,
      affectedReports: result.count,
      reportIds: validatedData.reportIds
    }, `Bulk action '${validatedData.action}' completed successfully`);

  } catch (error: any) {
    console.error('Error performing bulk action:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Validation error: ' + error.errors[0].message, 400);
    }
    return createErrorResponse(
      error.message || 'Failed to perform bulk action',
      error.status || 500
    );
  }
}); 