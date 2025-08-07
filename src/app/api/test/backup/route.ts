import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse } from '@/lib/apiResponse';

// GET /api/test/backup - Test endpoint to check backup logs
export const GET = async (req: NextRequest) => {
  try {
    // Check if we can connect to the database
    await prisma.$connect();
    
    // Get all audit logs with create_backup action
    const backupLogs = await prisma.auditLog.findMany({
      where: {
        action: 'create_backup'
      },
      select: {
        id: true,
        action: true,
        details: true,
        createdAt: true,
        superAdminId: true
      },
      take: 5
    });

    // Get total count
    const totalCount = await prisma.auditLog.count({
      where: {
        action: 'create_backup'
      }
    });

    return createSuccessResponse({
      message: 'Database connection successful',
      backupLogs,
      totalCount,
      timestamp: new Date().toISOString()
    }, 'Test completed successfully');

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}; 