import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Test Auth API route called');
    
    // Test authentication
    const authResult = await requireSuperAdmin(req);
    if (authResult instanceof NextResponse) {
      console.log('❌ Authentication failed');
      return authResult;
    }

    const superAdmin = authResult as any;
    console.log('✅ Authentication successful for:', superAdmin.email);
    
    // Get reports for this SuperAdmin
    const reports = await prisma.report.findMany({
      where: { superAdminId: superAdmin.id },
      take: 5
    });
    
    return NextResponse.json({
      success: true,
      message: 'Test Auth API route working',
      data: {
        superAdmin: {
          id: superAdmin.id,
          email: superAdmin.email
        },
        reportsCount: reports.length,
        reports: reports.map(r => ({
          id: r.id,
          name: r.name,
          type: r.type,
          status: r.status
        })),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Test Auth API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test Auth API error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
