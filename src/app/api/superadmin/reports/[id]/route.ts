import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/reports/[id] - Get single report
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Fetching report details:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const report = await prisma.report.findUnique({
      where: { id: id },
      include: {
        superAdmin: {
          select: { name: true, email: true }
        },
        tenant: {
          select: { name: true, slug: true }
        }
      }
    });

    if (!report) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Report not found:', id);
      }
      return createErrorResponse('Report not found', 404);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Report fetched successfully:', report.name);
    }

    return createSuccessResponse({
      report: {
        id: report.id,
        name: report.name,
        type: report.type,
        data: JSON.parse(report.data),
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        createdBy: report.superAdmin?.name || 'System',
        tenant: report.tenant ? {
          id: report.tenantId,
          name: report.tenant.name,
          slug: report.tenant.slug
        } : null
      }
    }, 'Report fetched successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching report:', error);
    }
    throw error;
  }
});

// PUT /api/superadmin/reports/[id] - Update report
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Updating report:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { name } = await req.json();

  try {
    // Check if report exists
    const existingReport = await prisma.report.findUnique({
      where: { id: id }
    });

    if (!existingReport) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Report not found:', id);
      }
      return createErrorResponse('Report not found', 404);
    }

    // Update report
    const report = await prisma.report.update({
      where: { id: id },
      data: {
        name: name || undefined
      },
      include: {
        superAdmin: {
          select: { name: true, email: true }
        },
        tenant: {
          select: { name: true, slug: true }
        }
      }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'report.update',
      {
        reportId: report.id,
        reportName: report.name,
        changes: { name }
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Report updated successfully:', report.name);
    }

    return createSuccessResponse({
      report: {
        id: report.id,
        name: report.name,
        type: report.type,
        data: JSON.parse(report.data),
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        createdBy: report.superAdmin?.name || 'System',
        tenant: report.tenant ? {
          id: report.tenantId,
          name: report.tenant.name,
          slug: report.tenant.slug
        } : null
      }
    }, 'Report updated successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating report:', error);
    }
    throw error;
  }
});

// DELETE /api/superadmin/reports/[id] - Delete report
export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Deleting report:', id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Check if report exists
    const existingReport = await prisma.report.findUnique({
      where: { id: id },
      include: {
        superAdmin: {
          select: { name: true }
        },
        tenant: {
          select: { name: true }
        }
      }
    });

    if (!existingReport) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Report not found:', id);
      }
      return createErrorResponse('Report not found', 404);
    }

    // Delete report
    await prisma.report.delete({
      where: { id: id }
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'report.delete',
      {
        reportId: existingReport.id,
        reportName: existingReport.name,
        reportType: existingReport.type,
        createdBy: existingReport.superAdmin?.name || 'System',
        tenant: existingReport.tenant?.name || 'System Report'
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Report deleted successfully:', existingReport.name);
    }

    return createSuccessResponse({}, 'Report deleted successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error deleting report:', error);
    }
    throw error;
  }
}); 