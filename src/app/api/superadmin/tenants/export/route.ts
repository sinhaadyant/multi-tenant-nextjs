import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// Helper function to convert data to CSV
const convertToCSV = (data: any[], headers: string[]) => {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma or newline
      if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};

// GET /api/superadmin/tenants/export - Export tenants data
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Exporting tenants data');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (!authResult.success) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Authentication failed for tenant export API:', authResult.error);
    }
    return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const plan = searchParams.get('plan') || '';

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { slug: { contains: search } },
      { domain: { contains: search } }
    ];
  }

  if (status) {
    where.isActive = status === 'active';
  }

  if (plan) {
    where.plan = plan;
  }

  try {
    // Get all tenants with user counts
    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        _count: { select: { users: true } },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Tenants data fetched for export:', tenants.length);
    }

    // Prepare data for export
    const exportData = tenants.map(tenant => ({
      'Tenant ID': tenant.id,
      'Name': tenant.name,
      'Slug': tenant.slug,
      'Domain': tenant.domain || '',
      'Description': tenant.description || '',
      'Plan': tenant.plan,
      'Region': tenant.region,
      'Status': tenant.isActive ? 'Active' : 'Inactive',
      'User Count': tenant._count.users,
      'Features': Array.isArray(tenant.features) ? tenant.features.join(', ') : tenant.features || '',
      'Created At': tenant.createdAt.toISOString(),
      'Updated At': tenant.updatedAt.toISOString(),
      'Metadata': JSON.stringify(tenant.metadata || {})
    }));

    const headers = [
      'Tenant ID', 'Name', 'Slug', 'Domain', 'Description', 'Plan', 
      'Region', 'Status', 'User Count', 'Features', 'Created At', 
      'Updated At', 'Metadata'
    ];

    if (format === 'csv') {
      const csvContent = convertToCSV(exportData, headers);
      
      // Create response with CSV content
      const response = new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="tenants-export-${new Date().toISOString().split('T')[0]}.csv"`,
          'Cache-Control': 'no-cache'
        }
      });

      return response;
    } else {
      // Return JSON format
      return createSuccessResponse({
        tenants: exportData,
        totalCount: tenants.length,
        exportDate: new Date().toISOString(),
        filters: { search, status, plan }
      }, 'Tenants exported successfully', 200);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error exporting tenants:', error);
    }
    throw error;
  }
}); 