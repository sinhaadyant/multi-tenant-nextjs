import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLog } from '@/lib/audit';

// GET /api/superadmin/backup/[id] - Get backup details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const superAdmin = await requireSuperAdmin(request);
    if (!superAdmin) {
      return createErrorResponse('Unauthorized', 401);
    }

    const backup = await prisma.backup.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!backup) {
      return createErrorResponse('Backup not found', 404);
    }

    // Create audit log
    await createAuditLog({
      action: 'VIEW_BACKUP_DETAILS',
      entityType: 'BACKUP',
      entityId: backup.id,
      userId: superAdmin.id,
      details: { backupId: backup.id }
    });

    return createSuccessResponse('Backup details retrieved successfully', {
      id: backup.id,
      filename: backup.filename,
      status: backup.status,
      createdAt: backup.createdAt.toISOString(),
      completedAt: backup.completedAt?.toISOString(),
      fileSize: backup.fileSize,
      duration: backup.duration,
      description: backup.description,
      options: backup.options,
      createdBy: backup.createdBy
    });
  } catch (error: any) {
    console.error('Get backup details error:', error);
    return createErrorResponse('Failed to retrieve backup details', 500);
  }
}

// DELETE /api/superadmin/backup/[id] - Delete backup
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const superAdmin = await requireSuperAdmin(request);
    if (!superAdmin) {
      return createErrorResponse('Unauthorized', 401);
    }

    const backup = await prisma.backup.findUnique({
      where: { id: params.id }
    });

    if (!backup) {
      return createErrorResponse('Backup not found', 404);
    }

    // In a real implementation, you would also delete the actual backup file
    // from storage (S3, local filesystem, etc.)

    await prisma.backup.delete({
      where: { id: params.id }
    });

    // Create audit log
    await createAuditLog({
      action: 'DELETE_BACKUP',
      entityType: 'BACKUP',
      entityId: backup.id,
      userId: superAdmin.id,
      details: { 
        backupId: backup.id,
        filename: backup.filename,
        fileSize: backup.fileSize
      }
    });

    return createSuccessResponse('Backup deleted successfully');
  } catch (error: any) {
    console.error('Delete backup error:', error);
    return createErrorResponse('Failed to delete backup', 500);
  }
}

// PUT /api/superadmin/backup/[id] - Update backup
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const superAdmin = await requireSuperAdmin(request);
    if (!superAdmin) {
      return createErrorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { description, status } = body;

    const backup = await prisma.backup.findUnique({
      where: { id: params.id }
    });

    if (!backup) {
      return createErrorResponse('Backup not found', 404);
    }

    const updatedBackup = await prisma.backup.update({
      where: { id: params.id },
      data: {
        ...(description && { description }),
        ...(status && { status }),
        ...(status === 'completed' && { completedAt: new Date() })
      }
    });

    // Create audit log
    await createAuditLog({
      action: 'UPDATE_BACKUP',
      entityType: 'BACKUP',
      entityId: backup.id,
      userId: superAdmin.id,
      details: { 
        backupId: backup.id,
        changes: { description, status }
      }
    });

    return createSuccessResponse('Backup updated successfully', {
      id: updatedBackup.id,
      filename: updatedBackup.filename,
      status: updatedBackup.status,
      description: updatedBackup.description
    });
  } catch (error: any) {
    console.error('Update backup error:', error);
    return createErrorResponse('Failed to update backup', 500);
  }
}
