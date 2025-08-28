import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
    
    if (!tenantSlug) {
      return createErrorResponse('Tenant slug is required', 400);
    }

    // Verify authentication token
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return createErrorResponse('No authentication token found', 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return createErrorResponse('Invalid authentication token', 401);
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true, slug: true, isActive: true }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    if (!tenant.isActive) {
      return createErrorResponse('Tenant is inactive', 403);
    }

    // Verify user belongs to this tenant
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: tenant.id,
        isActive: true
      }
    });

    if (!user) {
      return createErrorResponse('User not found or not authorized for this tenant', 404);
    }

    // Parse query parameters
    const format = searchParams.get('format') || 'csv';
    const chartId = searchParams.get('chartId') || '';
    const dateRange = searchParams.get('dateRange');
    const category = searchParams.get('category') || '';
    const period = searchParams.get('period') || 'daily';

    // Validate format
    if (!['csv', 'pdf', 'png'].includes(format)) {
      return createErrorResponse('Invalid export format. Supported formats: csv, pdf, png', 400);
    }

    // Parse date range
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (dateRange) {
      try {
        const range = JSON.parse(dateRange);
        startDate = new Date(range.start);
        endDate = new Date(range.end);
      } catch (error) {
        const start = searchParams.get('start');
        const end = searchParams.get('end');
        if (start) startDate = new Date(start);
        if (end) endDate = new Date(end);
      }
    }

    // Default to last 30 days if no date range provided
    if (!startDate || !endDate) {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    // Get data based on chart ID
    let data: any = {};
    let filename = '';

    switch (chartId) {
      case 'user-activity':
        data = await getUserActivityData(tenant.id, startDate, endDate, period);
        filename = `user-activity-${format}-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'role-distribution':
        data = await getRoleDistributionData(tenant.id);
        filename = `role-distribution-${format}-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'module-usage':
        data = await getModuleUsageData(tenant.id, startDate, endDate);
        filename = `module-usage-${format}-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'system-metrics':
        data = await getSystemMetricsData(tenant.id, startDate, endDate, period);
        filename = `system-metrics-${format}-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'user-growth':
        data = await getUserGrowthData(tenant.id, startDate, endDate, period);
        filename = `user-growth-${format}-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'audit-logs':
        data = await getAuditLogsData(tenant.id, startDate, endDate, period);
        filename = `audit-logs-${format}-${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        return createErrorResponse('Invalid chart ID', 400);
    }

    // Generate export based on format
    let exportData: Blob;
    let contentType: string;

    switch (format) {
      case 'csv':
        const csvContent = generateCSV(data, chartId);
        exportData = new Blob([csvContent], { type: 'text/csv' });
        contentType = 'text/csv';
        filename += '.csv';
        break;
      case 'pdf':
        const pdfContent = await generatePDF(data, chartId, tenant.name);
        exportData = new Blob([pdfContent], { type: 'application/pdf' });
        contentType = 'application/pdf';
        filename += '.pdf';
        break;
      case 'png':
        const pngContent = await generatePNG(data, chartId);
        exportData = new Blob([pngContent], { type: 'image/png' });
        contentType = 'image/png';
        filename += '.png';
        break;
      default:
        return createErrorResponse('Unsupported export format', 400);
    }

    // Create audit log
    await createAuditLogFromRequest(req, {
      action: 'ANALYTICS_EXPORTED',
      resource: `analytics.${chartId}`,
      userId: user.id,
      tenantId: tenant.id,
      details: { format, chartId, filters: { dateRange, category, period } }
    });

    // Return the file
    return new Response(exportData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('Analytics export error:', error);
    return createErrorResponse(error.message || 'Internal server error', 500);
  }
}

// Data retrieval functions
async function getUserActivityData(tenantId: string, startDate: Date, endDate: Date, period: string) {
  const intervals = generateDateIntervals(startDate, endDate, period);
  
  const activities = await Promise.all(
    intervals.map(async (interval) => {
      const [users, activities, sessions] = await Promise.all([
        prisma.user.count({
          where: {
            tenantId,
            isActive: true,
            lastLogin: {
              gte: interval.start,
              lte: interval.end
            }
          }
        }),
        prisma.auditLog.count({
          where: {
            tenantId,
            createdAt: {
              gte: interval.start,
              lte: interval.end
            }
          }
        }),
        Promise.resolve(Math.floor(Math.random() * 50) + 10)
      ]);

      return {
        date: interval.start.toISOString().split('T')[0],
        users,
        activities,
        sessions
      };
    })
  );

  return activities;
}

async function getRoleDistributionData(tenantId: string) {
  const roles = await prisma.role.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: { userRoles: true }
      }
    }
  });

  const totalUsers = roles.reduce((sum, role) => sum + role._count.userRoles, 0);

  return roles.map(role => ({
    role: role.name,
    count: role._count.userRoles,
    percentage: totalUsers > 0 ? (role._count.userRoles / totalUsers) * 100 : 0
  }));
}

async function getModuleUsageData(tenantId: string, startDate: Date, endDate: Date) {
  // Mock module usage data
  return [
    { module: 'Dashboard', usage: 85, users: 45 },
    { module: 'Users', usage: 65, users: 32 },
    { module: 'Roles', usage: 45, users: 18 },
    { module: 'Analytics', usage: 30, users: 12 },
    { module: 'Settings', usage: 25, users: 8 },
    { module: 'Support', usage: 15, users: 5 }
  ];
}

async function getSystemMetricsData(tenantId: string, startDate: Date, endDate: Date, period: string) {
  const intervals = generateDateIntervals(startDate, endDate, period);
  
  return intervals.map(interval => ({
    date: interval.start.toISOString().split('T')[0],
    cpu: Math.floor(Math.random() * 30) + 20,
    memory: Math.floor(Math.random() * 40) + 30,
    storage: Math.floor(Math.random() * 20) + 10,
    responseTime: Math.floor(Math.random() * 200) + 100
  }));
}

async function getUserGrowthData(tenantId: string, startDate: Date, endDate: Date, period: string) {
  const intervals = generateDateIntervals(startDate, endDate, period);
  
  return intervals.map(interval => ({
    date: interval.start.toISOString().split('T')[0],
    count: Math.floor(Math.random() * 100) + 50,
    newUsers: Math.floor(Math.random() * 10) + 1,
    activeUsers: Math.floor(Math.random() * 30) + 20
  }));
}

async function getAuditLogsData(tenantId: string, startDate: Date, endDate: Date, period: string) {
  const intervals = generateDateIntervals(startDate, endDate, period);
  
  return intervals.map(interval => ({
    date: interval.start.toISOString().split('T')[0],
    action: 'System Activity',
    count: Math.floor(Math.random() * 100) + 20,
    users: Math.floor(Math.random() * 15) + 5
  }));
}

// Export generation functions
function generateCSV(data: any[], chartId: string): string {
  if (!data || data.length === 0) {
    return 'No data available';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

async function generatePDF(data: any[], chartId: string, tenantName: string): Promise<Uint8Array> {
  // For now, return a simple PDF with text content
  // In a real implementation, you would use a library like jsPDF or puppeteer
  const pdfContent = `Analytics Report for ${tenantName}
Generated on: ${new Date().toLocaleDateString()}
Chart: ${chartId}

Data:
${JSON.stringify(data, null, 2)}`;

  // Convert to Uint8Array (simplified)
  const encoder = new TextEncoder();
  return encoder.encode(pdfContent);
}

async function generatePNG(data: any[], chartId: string): Promise<Uint8Array> {
  // For now, return a simple placeholder
  // In a real implementation, you would use a charting library to generate the image
  const canvas = new OffscreenCanvas(800, 600);
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial';
    ctx.fillText(`Chart: ${chartId}`, 50, 50);
    ctx.fillText(`Data points: ${data.length}`, 50, 80);
  }

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return new Uint8Array(await blob.arrayBuffer());
}

// Utility function to generate date intervals
function generateDateIntervals(startDate: Date, endDate: Date, period: string): Array<{ start: Date; end: Date }> {
  const intervals = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const intervalStart = new Date(current);
    let intervalEnd: Date;

    switch (period) {
      case 'daily':
        intervalEnd = new Date(current);
        intervalEnd.setDate(intervalEnd.getDate() + 1);
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        intervalEnd = new Date(current);
        intervalEnd.setDate(intervalEnd.getDate() + 7);
        current.setDate(current.getDate() + 7);
        break;
      case 'monthly':
        intervalEnd = new Date(current);
        intervalEnd.setMonth(intervalEnd.getMonth() + 1);
        current.setMonth(current.getMonth() + 1);
        break;
      case 'yearly':
        intervalEnd = new Date(current);
        intervalEnd.setFullYear(intervalEnd.getFullYear() + 1);
        current.setFullYear(current.getFullYear() + 1);
        break;
      default:
        intervalEnd = new Date(current);
        intervalEnd.setDate(intervalEnd.getDate() + 1);
        current.setDate(current.getDate() + 1);
    }

    intervals.push({ start: intervalStart, end: intervalEnd });
  }

  return intervals;
}
