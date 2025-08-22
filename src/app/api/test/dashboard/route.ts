import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test basic dashboard data fetching
    const tenantCount = await prisma.tenant.count();
    const userCount = await prisma.user.count();
    const roleCount = await prisma.role.count();
    const moduleCount = await prisma.module.count();
    
    return NextResponse.json({
      success: true,
      message: 'Dashboard data fetch successful',
      timestamp: new Date().toISOString(),
      data: {
        tenantCount,
        userCount,
        roleCount,
        moduleCount,
        modules: await prisma.module.findMany({
          where: { isActive: true },
          select: {
            id: true,
            moduleKey: true,
            moduleName: true,
            isActive: true
          },
          take: 5
        })
      }
    });
  } catch (error: any) {
    console.error('Dashboard test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Dashboard data fetch failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
