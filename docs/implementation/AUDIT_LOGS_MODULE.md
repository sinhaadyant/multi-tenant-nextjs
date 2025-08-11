# Tenant Audit Logs Module - Enhanced Implementation

## Overview

The Tenant Audit Logs module provides comprehensive activity tracking and security monitoring for multi-tenant applications. It records and provides visibility into important tenant-level system and user activities, serving security, compliance, and troubleshooting purposes.

## Core Features Implemented

### 1. Enhanced Activity Logging

The module captures critical tenant user and system events with comprehensive metadata:

**Tracked Events:**
- User login/logout and failed login attempts
- CRUD operations on key entities (users, roles, modules, content)
- Role and permission changes
- Module enable/disable actions
- Settings/configuration changes
- Support ticket activities
- Audit log access and exports

**Enhanced Metadata:**
- Timestamp, user ID, IP address, device info
- Action performed, affected resources/entities
- Success/failure status and severity levels
- Resource type and ID tracking
- Old and new values for updates
- Session and request correlation IDs

### 2. Log Storage & Retention Management

**Enhanced Database Schema:**
```sql
-- New fields added to AuditLog model
status       String      @default("success") // success, failure, warning
severity     String      @default("info") // info, warning, error, critical
resourceType String?     // user, role, module, setting, etc.
resourceId   String?     // ID of the affected resource
oldValues    String?     @db.LongText // JSON of previous values
newValues    String?     @db.LongText // JSON of new values
sessionId    String?     // For tracking user sessions
requestId    String?     // For correlating related actions
isArchived   Boolean     @default(false)
archivedAt   DateTime?
retentionExpiry DateTime? // When this log should be purged
```

**Retention Features:**
- Configurable retention policies per tenant
- Automatic archiving of old logs
- Scheduled purging of expired logs
- Compliance-ready export capabilities

### 3. Advanced Search & Filtering

**Enhanced Filters:**
- Date/time range filtering
- User email and action type filtering
- Status and severity filtering
- Resource type filtering
- IP address filtering
- Archived logs inclusion/exclusion

**Search Capabilities:**
- Full-text search across action descriptions
- Resource ID and type filtering
- Session and request correlation
- Advanced sorting by multiple fields

### 4. Security Monitoring & Alerts

**Suspicious Activity Detection:**
- Multiple failed login attempts (configurable threshold)
- Suspicious IP address changes
- Critical permission modifications
- Unusual data access patterns
- Bulk data access monitoring

**Security Alerts:**
- Real-time alert generation
- Configurable severity levels
- Alert storage and management
- Integration with notification system

### 5. Data Protection & Privacy

**Sensitive Data Handling:**
- Automatic masking of sensitive fields (passwords, tokens, etc.)
- GDPR-compliant data handling
- Configurable data retention policies
- Secure export capabilities

**Audit Trail Integrity:**
- Immutable log creation
- Tamper-evident storage
- Access logging for audit log viewing
- Digital signatures for critical operations

## API Endpoints

### Core Audit Logs API

**GET /api/tenant/[tenantSlug]/audit-logs**
- Fetch audit logs with advanced filtering
- Supports pagination and sorting
- Returns enhanced statistics

**GET /api/tenant/[tenantSlug]/audit-logs/export**
- Export logs in CSV or JSON format
- Supports filtered exports
- Compliance-ready formatting

### Retention Management API

**GET /api/tenant/[tenantSlug]/audit-logs/retention**
- Get current retention policy
- Retrieve audit log statistics

**POST /api/tenant/[tenantSlug]/audit-logs/retention**
- Update retention policy
- Configure archiving settings

**POST /api/tenant/[tenantSlug]/audit-logs/maintenance**
- Run manual maintenance tasks
- Archive old logs
- Purge expired logs

## Usage Examples

### Creating Audit Logs

```typescript
import { createAuditLog, auditUserAction, auditSecurityEvent } from '@/lib/audit';

// Basic audit log
await createAuditLog({
  action: 'user.login',
  details: { email: 'user@example.com', success: true },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  tenantId: 'tenant-123',
  userId: 'user-456',
  status: 'success',
  severity: 'info'
});

// User action with resource tracking
await auditUserAction(
  user,
  'user.update',
  'user',
  'user-456',
  { name: 'Old Name' },
  { name: 'New Name' }
);

// Security event
await auditSecurityEvent(
  user,
  'security.failed_login_threshold',
  'warning',
  { failedAttempts: 5, ipAddress: '192.168.1.1' }
);
```

### Security Monitoring

```typescript
import { 
  checkSuspiciousLoginActivity,
  checkSuspiciousIPActivity,
  checkPermissionChangeActivity 
} from '@/lib/securityMonitoring';

// Check for suspicious login activity
const alert = await checkSuspiciousLoginActivity(
  tenantId,
  userId,
  email,
  ipAddress,
  success
);

// Check for suspicious IP changes
const ipAlert = await checkSuspiciousIPActivity(
  tenantId,
  userId,
  ipAddress
);

// Check for critical permission changes
const permAlert = await checkPermissionChangeActivity(
  tenantId,
  userId,
  userEmail,
  action,
  details
);
```

### Retention Management

```typescript
import { 
  setRetentionPolicy,
  getRetentionPolicy,
  runAuditLogMaintenance 
} from '@/lib/auditRetention';

// Set retention policy
await setRetentionPolicy(tenantId, {
  retentionDays: 365,
  autoArchive: true,
  archiveAfterDays: 90,
  purgeAfterDays: 365
});

// Run maintenance
const result = await runAuditLogMaintenance(tenantId);
console.log(`Archived: ${result.archived}, Purged: ${result.purged}`);
```

## Configuration

### Environment Variables

```env
# Audit Log Configuration
AUDIT_LOG_RETENTION_DAYS=365
AUDIT_LOG_ARCHIVE_AFTER_DAYS=90
AUDIT_LOG_AUTO_ARCHIVE=true

# Security Thresholds
SECURITY_MAX_FAILED_LOGINS=5
SECURITY_FAILED_LOGIN_WINDOW=900000 # 15 minutes
SECURITY_SUSPICIOUS_IP_CHANGES=3
SECURITY_SUSPICIOUS_IP_WINDOW=3600000 # 1 hour
```

### Database Migration

Run the following migration to add the new audit log fields:

```bash
npx prisma migrate dev --name enhance_audit_logs
```

## Security Considerations

### Access Control
- All audit log access requires proper permissions
- Tenant isolation enforced at database level
- Role-based access control for audit log viewing
- Audit log access itself is logged

### Data Protection
- Sensitive data automatically masked in logs
- Encryption at rest for audit log data
- Secure transmission of audit log data
- Compliance with privacy regulations

### Performance
- Efficient indexing on frequently queried fields
- Pagination for large result sets
- Archiving to maintain database performance
- Batch operations for bulk audit logging

## Monitoring & Maintenance

### Automated Tasks
- Daily archiving of old logs
- Weekly purging of expired logs
- Monthly retention policy validation
- Quarterly security alert cleanup

### Manual Maintenance
- Retention policy updates
- Manual archiving/purging
- Security alert management
- Compliance report generation

## Compliance Features

### GDPR Compliance
- Right to be forgotten implementation
- Data retention policies
- Audit trail for data access
- Secure data export capabilities

### SOX Compliance
- Immutable audit trails
- Tamper-evident logging
- Access control logging
- Change management tracking

### HIPAA Compliance
- PHI data masking
- Access logging
- Security incident tracking
- Audit trail integrity

## Future Enhancements

### Planned Features
- Real-time log streaming
- Advanced analytics dashboard
- Machine learning anomaly detection
- Integration with SIEM systems
- Automated compliance reporting
- Enhanced visualization tools

### Performance Optimizations
- Database partitioning by tenant
- Read replicas for audit log queries
- Caching for frequently accessed data
- Compression for archived logs

## Troubleshooting

### Common Issues

**High Database Load:**
- Enable archiving to reduce active log volume
- Implement proper indexing
- Use pagination for large queries
- Consider read replicas

**Missing Audit Logs:**
- Check retention policies
- Verify archiving settings
- Review log creation permissions
- Check database connectivity

**Security Alert False Positives:**
- Adjust security thresholds
- Review alert conditions
- Update security rules
- Monitor alert patterns

### Debugging

Enable debug logging by setting:
```env
NODE_ENV=development
AUDIT_LOG_DEBUG=true
```

This will provide detailed logging of audit log operations and help identify issues.

## Support

For issues or questions regarding the Audit Logs module:

1. Check the troubleshooting section above
2. Review the API documentation
3. Examine the audit log entries for errors
4. Contact the development team with specific error details

The module is designed to be self-documenting through its comprehensive audit trail, making it easier to diagnose and resolve issues. 