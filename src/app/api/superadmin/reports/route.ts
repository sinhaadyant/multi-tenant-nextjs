import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { z } from 'zod';

// Validation schemas
const generateReportSchema = z.object({
  reportType: z.enum(['user_activity', 'tenant_summary', 'login_history', 'audit_logs', 'system_health']),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  tenantId: z.string().optional(),
  format: z.enum(['csv', 'excel', 'pdf']),
  filters: z.record(z.any()).optional()
});

const listReportsSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  search: z.string().optional(),
  reportType: z.string().optional(),
  status: z.enum(['generating', 'ready', 'failed']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['createdAt', 'reportType', 'status', 'generatedBy']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// GET /api/superadmin/reports - List reports
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Fetching reports list');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const superAdmin = authResult as any;
  const { searchParams } = new URL(req.url);

  // Validate query parameters
  const queryParams = Object.fromEntries(searchParams.entries());
  const validatedParams = listReportsSchema.parse(queryParams);

  const {
    page = 1,
    limit = 10,
    search,
    reportType,
    status,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = validatedParams;

  // Build where clause
  const where: any = {
    generatedBy: superAdmin.id
  };

  if (search) {
    where.OR = [
      { reportType: { contains: search } },
      { fileName: { contains: search } },
      { generatedBy: { name: { contains: search } } }
    ];
  }

  if (reportType) {
    where.reportType = reportType;
  }

  if (status) {
    where.status = status;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      where.createdAt.gte = new Date(dateFrom);
    }
    if (dateTo) {
      where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    }
  }

  try {
    // Get reports with pagination
    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          generatedBy: {
            select: { name: true, email: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.report.count({ where })
    ]);

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Reports fetched successfully:', { count: reports.length, totalCount });
    }

    return createSuccessResponse({
      reports,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching reports:', error);
    }
    throw error;
  }
});

// POST /api/superadmin/reports - Generate new report
export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Generating new report');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const superAdmin = authResult as any;
  const body = await req.json();

  // Validate request body
  const validatedData = generateReportSchema.parse(body);

  try {
    // Create report record
    const report = await prisma.report.create({
      data: {
        reportType: validatedData.reportType,
        dateFrom: new Date(validatedData.dateFrom),
        dateTo: new Date(validatedData.dateTo),
        tenantId: validatedData.tenantId,
        format: validatedData.format,
        filters: validatedData.filters || {},
        status: 'generating',
        fileName: `${validatedData.reportType}_${new Date().toISOString().split('T')[0]}.${validatedData.format}`,
        generatedBy: {
          connect: { id: superAdmin.id }
        }
      },
      include: {
        generatedBy: {
          select: { name: true, email: true }
        }
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Report generation initiated:', report.id);
    }

    // TODO: Trigger actual report generation in background
    // This would typically be handled by a background job/queue

    return createSuccessResponse({
      report,
      message: 'Report generation initiated successfully'
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error generating report:', error);
    }
    throw error;
  }
}); 