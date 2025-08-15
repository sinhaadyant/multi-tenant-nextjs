import { PrismaClient } from '@prisma/client';
import { logger } from '@/config/logger';

const prisma = new PrismaClient();

interface AuditLogData {
  action: string;
  userId: string;
  tenantId?: string;
  resource?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        userId: data.userId,
        tenantId: data.tenantId,
        details: data.details ? data.details : null,
        ipAddress: data.ipAddress,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main operation
  }
};

export const getAuditLogs = async (
  userId?: string,
  tenantId?: string,
  action?: string,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (userId) where.userId = userId;
  if (tenantId) where.tenantId = tenantId;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
