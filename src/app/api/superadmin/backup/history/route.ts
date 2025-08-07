import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/backup/history - Get backup history
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📋 Fetching backup history');
  }

  try {
    // Authenticate SuperAdmin
    const authResult = await requireSuperAdmin(req);
    if (authResult instanceof NextResponse) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Authentication failed:', authResult.status, authResult.statusText);
      }
      return authResult;
    }

    const superAdmin = authResult as any;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ SuperAdmin authenticated:', superAdmin.email);
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get backup audit logs
    const backupLogs = await prisma.auditLog.findMany({
      where: {
        action: 'create_backup',
        superAdminId: superAdmin.id
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        details: true,
        createdAt: true,
        ipAddress: true
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Found backup logs:', backupLogs.length);
    }

    // Get total count
    const totalCount = await prisma.auditLog.count({
      where: {
        action: 'create_backup',
        superAdminId: superAdmin.id
      }
    });

    // Get last backup date
    const lastBackup = await prisma.auditLog.findFirst({
      where: {
        action: 'create_backup',
        superAdminId: superAdmin.id
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    // Transform audit logs to backup history format
    const backups = backupLogs.map(log => {
      // Extract filename from details
      const details = typeof log.details === 'string' ? log.details : '';
      const filenameMatch = details.match(/backup generated: (.+?) with options/);
      const filename = filenameMatch ? filenameMatch[1] : `backup_${log.id}.sql`;
      
      // Extract options from details
      const optionsMatch = details.match(/options: (.+)$/);
      let options = {};
      if (optionsMatch) {
        try {
          options = JSON.parse(optionsMatch[1]);
        } catch (e) {
          // Ignore parsing errors
        }
      }

      return {
        id: log.id,
        filename,
        status: 'completed' as const,
        createdAt: log.createdAt.toISOString(),
        fileSize: Math.floor(Math.random() * 1000000) + 100000, // Mock file size
        duration: Math.floor(Math.random() * 5000) + 1000, // Mock duration
        description: `Backup created with options: ${Object.keys(options).filter(k => options[k as keyof typeof options]).join(', ')}`
      };
    });

    // Calculate total size (mock for now)
    const totalSize = backups.reduce((sum, backup) => sum + backup.fileSize, 0);

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Backup history fetched successfully:', backups.length);
    }

    // Return response with proper structure
    const responseData = {
      backups,
      totalCount,
      lastBackupDate: lastBackup?.createdAt.toISOString() || null,
      totalSize,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };

    return createSuccessResponse(responseData, 'Backup history fetched successfully');

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching backup history:', error);
    }
    throw error;
  }
}); 