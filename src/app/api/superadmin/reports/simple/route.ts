import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';

export async function GET(req: NextRequest) {
  try {
    console.log('📊 Simple reports API called');

    // Authenticate SuperAdmin
    const authResult = await requireSuperAdmin(req);
    if (authResult instanceof NextResponse) {
      console.log('❌ Authentication failed in simple route');
      return authResult;
    }

    const superAdmin = authResult as any;
    console.log('✅ Authentication successful for:', superAdmin.email);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build where clause
    const where: any = {
      superAdminId: superAdmin.id
    };

    // Get reports with pagination
    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          superAdmin: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.report.count({ where })
    ]);

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    console.log('✅ Simple reports fetched successfully:', { 
      count: reports.length, 
      totalCount, 
      page, 
      limit 
    });

    return NextResponse.json({
      success: true,
      message: 'Reports fetched successfully',
      data: {
        reports,
        pagination: {
          page,
          limit,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('❌ Simple reports API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch reports',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
