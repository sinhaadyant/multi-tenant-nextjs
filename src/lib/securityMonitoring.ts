import { prisma } from '@/lib/prisma';
import { auditSecurityEvent } from './audit';

export interface SecurityAlert {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'permission_change' | 'data_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  tenantId: string;
  userId?: string;
  ipAddress?: string;
  details: any;
  isResolved: boolean;
  createdAt: Date;
}

// In-memory storage for security alerts (in production, use a proper database table)
const securityAlerts = new Map<string, SecurityAlert>();

// Security thresholds
const SECURITY_THRESHOLDS = {
  MAX_FAILED_LOGINS: 5,
  MAX_FAILED_LOGINS_WINDOW: 15 * 60 * 1000, // 15 minutes
  SUSPICIOUS_IP_CHANGES: 3,
  SUSPICIOUS_IP_WINDOW: 60 * 60 * 1000, // 1 hour
};

// Track failed login attempts
const failedLoginAttempts = new Map<string, { count: number; lastAttempt: number; ips: Set<string> }>();

/**
 * Check for suspicious login activity
 */
export const checkSuspiciousLoginActivity = async (
  tenantId: string,
  userId: string,
  email: string,
  ipAddress: string,
  success: boolean
): Promise<SecurityAlert | null> => {
  const key = `${tenantId}:${userId}`;
  
  if (!success) {
    const current = failedLoginAttempts.get(key) || { 
      count: 0, 
      lastAttempt: 0, 
      ips: new Set() 
    };
    
    current.count++;
    current.lastAttempt = Date.now();
    current.ips.add(ipAddress);
    
    failedLoginAttempts.set(key, current);
    
    if (current.count >= SECURITY_THRESHOLDS.MAX_FAILED_LOGINS) {
      await auditSecurityEvent(
        { id: userId, email, role: 'user', tenantId },
        'security.failed_login_threshold',
        'warning',
        {
          email,
          failedAttempts: current.count,
          ips: Array.from(current.ips)
        }
      );
      
      return {
        id: `alert_${Date.now()}`,
        type: 'failed_login',
        severity: 'high',
        title: 'Multiple Failed Login Attempts',
        description: `User ${email} has had ${current.count} failed login attempts`,
        tenantId,
        userId,
        ipAddress,
        details: {
          email,
          failedAttempts: current.count,
          ips: Array.from(current.ips)
        },
        isResolved: false,
        createdAt: new Date()
      };
    }
  } else {
    failedLoginAttempts.delete(key);
  }
  
  return null;
};

/**
 * Check for suspicious IP address changes
 */
export const checkSuspiciousIPActivity = async (
  tenantId: string,
  userId: string,
  ipAddress: string
): Promise<SecurityAlert | null> => {
  try {
    const recentLogins = await prisma.auditLog.findMany({
      where: {
        tenantId,
        userId,
        action: { contains: 'login' },
        createdAt: {
          gte: new Date(Date.now() - SECURITY_THRESHOLDS.SUSPICIOUS_IP_WINDOW)
        }
      },
      select: { ipAddress: true },
      orderBy: { createdAt: 'desc' }
    });
    
    const uniqueIPs = new Set(recentLogins.map(log => log.ipAddress).filter(Boolean));
    uniqueIPs.add(ipAddress);
    
    if (uniqueIPs.size > SECURITY_THRESHOLDS.SUSPICIOUS_IP_CHANGES) {
      return {
        id: `alert_${Date.now()}`,
        type: 'suspicious_activity',
        severity: 'medium',
        title: 'Suspicious IP Address Activity',
        description: `User has logged in from ${uniqueIPs.size} different IP addresses recently`,
        tenantId,
        userId,
        ipAddress,
        details: {
          uniqueIPs: Array.from(uniqueIPs),
          timeWindow: SECURITY_THRESHOLDS.SUSPICIOUS_IP_WINDOW
        },
        isResolved: false,
        createdAt: new Date()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error checking suspicious IP activity:', error);
    return null;
  }
};

/**
 * Check for unusual permission changes
 */
export const checkPermissionChangeActivity = async (
  tenantId: string,
  userId: string,
  userEmail: string,
  action: string,
  details: any
): Promise<SecurityAlert | null> => {
  const criticalPermissions = ['admin', 'superadmin', 'owner', 'root', 'system'];
  
  const isCriticalChange = criticalPermissions.some(perm => 
    action.toLowerCase().includes(perm) || 
    JSON.stringify(details).toLowerCase().includes(perm)
  );
  
  if (isCriticalChange) {
    await auditSecurityEvent(
      { id: userId, email: userEmail, role: 'user', tenantId },
      'security.critical_permission_change',
      'critical',
      { action, details }
    );
    
    return {
      id: `alert_${Date.now()}`,
      type: 'permission_change',
      severity: 'critical',
      title: 'Critical Permission Change Detected',
      description: `Critical permission change: ${action}`,
      tenantId,
      userId,
      details: { action, details, criticalPermissions },
      isResolved: false,
      createdAt: new Date()
    };
  }
  
  return null;
};

/**
 * Check for unusual data access patterns
 */
export const checkDataAccessActivity = async (
  tenantId: string,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string
): Promise<SecurityAlert | null> => {
  try {
    // Check for bulk data access
    const recentAccess = await prisma.auditLog.count({
      where: {
        tenantId,
        userId,
        action: { contains: 'view' },
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });
    
    if (recentAccess > 100) {
      return {
        id: `alert_${Date.now()}`,
        type: 'data_access',
        severity: 'medium',
        title: 'Unusual Data Access Pattern',
        description: `User has accessed ${recentAccess} records in the last hour`,
        tenantId,
        userId,
        details: {
          action,
          resourceType,
          resourceId,
          accessCount: recentAccess,
          timeWindow: '1 hour'
        },
        isResolved: false,
        createdAt: new Date()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error checking data access activity:', error);
    return null;
  }
};

/**
 * Store security alert in memory (in production, use a proper database)
 */
export const storeSecurityAlert = (alert: SecurityAlert): void => {
  securityAlerts.set(alert.id, alert);
  console.log(`🔔 Security alert stored: ${alert.title}`);
};

/**
 * Get security alerts for a tenant from memory
 */
export const getSecurityAlerts = (
  tenantId: string,
  options: {
    resolved?: boolean;
    severity?: string[];
    limit?: number;
  } = {}
): { alerts: SecurityAlert[]; total: number } => {
  const alerts = Array.from(securityAlerts.values())
    .filter(alert => alert.tenantId === tenantId)
    .filter(alert => options.resolved === undefined || alert.isResolved === options.resolved)
    .filter(alert => !options.severity || options.severity.includes(alert.severity))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, options.limit || 50);

  return {
    alerts,
    total: alerts.length
  };
}; 