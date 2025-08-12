import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/reports/[id]/download - Download report
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Downloading report:', params.id);
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const superAdmin = authResult as any;
  const reportId = params.id;

  try {
    // Find the report
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        superAdminId: superAdmin.id
      },
      include: {
        superAdmin: {
          select: { name: true, email: true }
        }
      }
    });

    if (!report) {
      return createErrorResponse('Report not found', 404);
    }

    // Note: Report model doesn't have status field, so we'll skip status check
    // if (report.status !== 'ready') {
    //   return createErrorResponse('Report is not ready for download', 400);
    // }

    // TODO: Generate actual report content based on type and filters
    // This is a placeholder implementation
    const reportContent = generateReportContent(report);

    // Create audit log for download
    await prisma.auditLog.create({
      data: {
        action: 'report_download',
        details: `Downloaded report: ${report.type}`,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        superAdmin: {
          connect: { id: superAdmin.id }
        }
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Report downloaded successfully:', reportId);
    }

    // Return the report file
    const headers = new Headers();
    headers.set('Content-Type', getContentType('json')); // Default to JSON since Report model doesn't have format field
    headers.set('Content-Disposition', `attachment; filename="${report.name}.json"`);

    return new NextResponse(reportContent, {
      status: 200,
      headers
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error downloading report:', error);
    }
    throw error;
  }
});

// Helper function to generate report content (placeholder)
function generateReportContent(report: any): string {
  const timestamp = new Date().toLocaleString();
  
  // Since Report model doesn't have format, status, or filters fields, we'll use available fields
  return JSON.stringify({
    reportType: report.type,
    reportName: report.name,
    generatedDate: timestamp,
    generatedBy: report.superAdmin?.name || 'Unknown',
    createdAt: report.createdAt,
    data: report.data
  }, null, 2);
}

// Helper function to get content type
function getContentType(format: string): string {
  switch (format) {
    case 'csv':
      return 'text/csv';
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'pdf':
      return 'application/pdf';
    case 'json':
      return 'application/json';
    default:
      return 'text/plain';
  }
} 