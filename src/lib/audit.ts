import { prisma } from '@/lib/prisma';
import { JWTPayload } from '@/lib/jwt';

export interface AuditLogData {
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  tenantId?: string;
  userId?: string;
  superAdminId?: string;
}

export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📝 Creating audit log:', data.action);
  }

  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        details: data.details ? JSON.stringify(data.details) : undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        tenantId: data.tenantId,
        userId: data.userId,
        superAdminId: data.superAdminId,
      }
    });

          if (process.env.NODE_ENV === 'development') {
        console.log('✅ Audit log created successfully');
      }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Failed to create audit log:', error);
    }
    // Don't throw error for audit logging failures
  }
};

export const createAuditLogFromRequest = async (
  req: Request,
  user: JWTPayload,
  action: string,
  details?: any
): Promise<void> => {
  const ipAddress = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  await createAuditLog({
    action,
    details,
    ipAddress: ipAddress.toString(),
    userAgent,
    superAdminId: user.role === 'superadmin' ? user.id : undefined,
    userId: user.role === 'user' ? user.id : undefined,
    tenantId: user.tenantId,
  });
}; 