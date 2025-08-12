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

    // Get backups from the Backup model
    const backups = await prisma.backup.findMany({
      where: {
        createdById: superAdmin.id
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Found backups:', backups.length);
    }

    // Get total count
    const totalCount = await prisma.backup.count({
      where: {
        createdById: superAdmin.id
      }
    });

    // Get last backup date
    const lastBackup = await prisma.backup.findFirst({
      where: {
        createdById: superAdmin.id,
        status: 'completed'
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    // Calculate total size
    const totalSizeResult = await prisma.backup.aggregate({
      where: {
        createdById: superAdmin.id,
        status: 'completed'
      },
      _sum: { fileSize: true }
    });

    const totalSize = totalSizeResult._sum.fileSize || 0;

    // Transform backups to match expected format
    const transformedBackups = backups.map(backup => ({
      id: backup.id,
      filename: backup.filename,
      status: backup.status as 'completed' | 'failed' | 'processing',
      createdAt: backup.createdAt.toISOString(),
      completedAt: backup.completedAt?.toISOString(),
      fileSize: backup.fileSize,
      duration: backup.duration,
      description: backup.description,
      createdBy: backup.createdBy
    }));

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Backup history fetched successfully:', transformedBackups.length);
    }

    // Return response with proper structure
    const responseData = {
      backups: transformedBackups,
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