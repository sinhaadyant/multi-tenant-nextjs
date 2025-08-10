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
  
  // Enhanced fields
  status?: 'success' | 'failure' | 'warning';
  severity?: 'info' | 'warning' | 'error' | 'critical';
  resourceType?: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  sessionId?: string;
  requestId?: string;
}

export interface AuditLogOptions {
  retentionDays?: number; // How long to keep this log
  autoArchive?: boolean; // Whether to auto-archive after retention period
  maskSensitiveData?: boolean; // Whether to mask sensitive information
}

// Sensitive fields that should be masked in audit logs
const SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'key', 'credential', 
  'ssn', 'credit_card', 'bank_account', 'api_key'
];

// Mask sensitive data in audit logs
const maskSensitiveData = (data: any): any => {
  if (typeof data === 'string') {
    // Check if string contains sensitive patterns
    if (SENSITIVE_FIELDS.some(field => 
      data.toLowerCase().includes(field.toLowerCase())
    )) {
      return '[REDACTED]';
    }
    return data;
  }
  
  if (typeof data === 'object' && data !== null) {
    const masked = Array.isArray(data) ? [] : {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_FIELDS.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        masked[key] = '[REDACTED]';
      } else {
        masked[key] = maskSensitiveData(value);
      }
    }
    return masked;
  }
  
  return data;
};

export const createAuditLog = async (
  data: AuditLogData, 
  options: AuditLogOptions = {}
): Promise<void> => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📝 Creating audit log:', data.action);
  }

  try {
    // Calculate retention expiry
    const retentionDays = options.retentionDays || 365; // Default 1 year
    const retentionExpiry = new Date();
    retentionExpiry.setDate(retentionExpiry.getDate() + retentionDays);

    // Mask sensitive data if requested
    const maskedDetails = options.maskSensitiveData && data.details 
      ? maskSensitiveData(data.details) 
      : data.details;
    
    const maskedOldValues = options.maskSensitiveData && data.oldValues 
      ? maskSensitiveData(data.oldValues) 
      : data.oldValues;
    
    const maskedNewValues = options.maskSensitiveData && data.newValues 
      ? maskSensitiveData(data.newValues) 
      : data.newValues;

    await prisma.auditLog.create({
      data: {
        action: data.action,
        details: maskedDetails ? JSON.stringify(maskedDetails) : undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        tenantId: data.tenantId,
        userId: data.userId,
        superAdminId: data.superAdminId,
        status: data.status || 'success',
        severity: data.severity || 'info',
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        oldValues: maskedOldValues ? JSON.stringify(maskedOldValues) : undefined,
        newValues: maskedNewValues ? JSON.stringify(maskedNewValues) : undefined,
        sessionId: data.sessionId,
        requestId: data.requestId,
        retentionExpiry: retentionExpiry,
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
  details?: any,
  options: AuditLogOptions = {}
): Promise<void> => {
  const ipAddress = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const requestId = req.headers.get('x-request-id') || 
                   req.headers.get('x-correlation-id') || 
                   undefined;

  await createAuditLog({
    action,
    details,
    ipAddress: ipAddress.toString(),
    userAgent,
    superAdminId: user.role === 'superadmin' ? user.id : undefined,
    userId: user.role === 'user' ? user.id : undefined,
    tenantId: user.tenantId,
    requestId,
  }, options);
};

// Enhanced audit logging for specific actions
export const auditUserAction = async (
  user: JWTPayload,
  action: string,
  resourceType: string,
  resourceId: string,
  oldValues?: any,
  newValues?: any,
  options: AuditLogOptions = {}
): Promise<void> => {
  await createAuditLog({
    action,
    resourceType,
    resourceId,
    oldValues,
    newValues,
    superAdminId: user.role === 'superadmin' ? user.id : undefined,
    userId: user.role === 'user' ? user.id : undefined,
    tenantId: user.tenantId,
  }, options);
};

// Audit logging for security events
export const auditSecurityEvent = async (
  user: JWTPayload,
  action: string,
  severity: 'warning' | 'error' | 'critical',
  details?: any,
  options: AuditLogOptions = {}
): Promise<void> => {
  await createAuditLog({
    action,
    details,
    severity,
    status: 'failure',
    superAdminId: user.role === 'superadmin' ? user.id : undefined,
    userId: user.role === 'user' ? user.id : undefined,
    tenantId: user.tenantId,
  }, options);
};

// Batch audit logging for performance
export const createBatchAuditLogs = async (
  logs: AuditLogData[],
  options: AuditLogOptions = {}
): Promise<void> => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📝 Creating ${logs.length} batch audit logs`);
  }

  try {
    const retentionDays = options.retentionDays || 365;
    const retentionExpiry = new Date();
    retentionExpiry.setDate(retentionExpiry.getDate() + retentionDays);

    const auditLogData = logs.map(log => ({
      action: log.action,
      details: log.details ? JSON.stringify(log.details) : undefined,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      tenantId: log.tenantId,
      userId: log.userId,
      superAdminId: log.superAdminId,
      status: log.status || 'success',
      severity: log.severity || 'info',
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      oldValues: log.oldValues ? JSON.stringify(log.oldValues) : undefined,
      newValues: log.newValues ? JSON.stringify(log.newValues) : undefined,
      sessionId: log.sessionId,
      requestId: log.requestId,
      retentionExpiry: retentionExpiry,
    }));

    await prisma.auditLog.createMany({
      data: auditLogData
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Batch audit logs created successfully');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Failed to create batch audit logs:', error);
    }
  }
}; 