# Audit Logs Module Implementation

## Overview

The Audit Logs module provides comprehensive logging and monitoring capabilities for the Superadmin panel, capturing every critical action taken across the platform with real-time data integration.

## Features Implemented

### ✅ Core Features

1. **Log List View**
   - Paginated, searchable, and sortable table of logs
   - Real-time data from database
   - Responsive design with dark mode support

2. **Advanced Filtering**
   - Date range filtering (24h, 7d, 30d, 90d, custom)
   - Action type filtering (CREATE, UPDATE, DELETE, LOGIN, etc.)
   - Actor filtering (User/Superadmin who performed the action)
   - Target entity filtering (Tenant, User, Role, etc.)
   - Search by email, tenant name, or action

3. **Log Details View**
   - Modal with comprehensive log information
   - Timestamp and formatted time display
   - Actor details (user ID, name, role)
   - IP address & User-Agent parsing
   - Entity affected information
   - Before and after JSON diff for updates
   - Error messages for failed actions

4. **Real-time Updates**
   - Polling-based real-time updates (30-second intervals)
   - Automatic refresh when on first page with no filters
   - Live statistics updates

5. **Security**
   - Superadmin-only access
   - JWT token authentication
   - Comprehensive permission checking
   - All permission-sensitive actions logged

6. **Error Handling**
   - Error boundaries with fallback UI
   - Retry functionality
   - Graceful error display
   - Loading states and skeleton loaders

7. **UX Enhancements**
   - Skeleton loaders for data loading
   - Empty state messages
   - Performance optimized for large datasets
   - Responsive design
   - Dark mode support

8. **Export Functionality**
   - CSV export with all log data
   - JSON export for API integration
   - Filtered export based on current filters
   - Automatic file naming with date

### ✅ Backend Integration

1. **Database Schema**
   - Comprehensive AuditLog model with relationships
   - Support for SuperAdmin, User, and Tenant actions
   - JSON details field for flexible data storage
   - Proper indexing for performance

2. **API Endpoints**
   - `GET /api/superadmin/audit-logs` - Fetch logs with filtering
   - `GET /api/superadmin/audit-logs/export` - Export logs
   - Proper authentication and authorization
   - Comprehensive error handling

3. **Audit Service**
   - Centralized audit logging service
   - Automatic IP and User-Agent capture
   - Request-based logging integration
   - Flexible details storage

## Components Structure

```
src/
├── hooks/
│   └── useAuditLogs.ts              # Main hook for audit logs management
├── components/superadmin/
│   ├── AuditLogsTable.tsx           # Main table component
│   ├── AuditLogsFilters.tsx         # Advanced filtering component
│   └── AuditLogsDetailsModal.tsx    # Log details modal
├── app/api/superadmin/audit-logs/
│   ├── route.ts                     # Main API endpoint
│   └── export/route.ts              # Export API endpoint
├── lib/
│   └── audit.ts                     # Audit service utilities
└── scripts/
    └── seed-audit-logs.ts           # Sample data seeding
```

## Usage

### 1. Accessing Audit Logs

Navigate to `/superadmin/audit` in the Superadmin panel. Only authenticated superadmins can access this page.

### 2. Filtering and Searching

- **Date Range**: Use predefined ranges or custom date selection
- **Action Type**: Filter by specific actions (tenant.create, user.update, etc.)
- **Search**: Search by user email, tenant name, or action description
- **Sort**: Click column headers to sort by timestamp, actor, action, or target

### 3. Viewing Log Details

Click the eye icon (👁️) next to any log entry to view detailed information including:
- Complete actor information
- Technical details (IP, User-Agent, Browser)
- Before/after changes for updates
- Full JSON details

### 4. Exporting Data

- **CSV Export**: Download filtered logs as CSV file
- **JSON Export**: Download filtered logs as JSON for API integration
- Exports include all current filter settings

### 5. Real-time Monitoring

The system automatically refreshes data every 30 seconds when:
- You're on the first page
- No specific filters are applied
- This ensures you see the latest activity

## Data Seeding

To populate the database with sample audit log data:

```bash
npm run db:seed-audit-logs
```

This will create 200 sample audit logs spanning the last 30 days with realistic data including:
- Various action types
- Different actors (SuperAdmins and Users)
- Multiple tenants
- Realistic timestamps and IP addresses
- Sample JSON details for different action types

## API Reference

### GET /api/superadmin/audit-logs

**Query Parameters:**
- `page` (number): Page number for pagination
- `limit` (number): Number of records per page
- `tenantName` (string): Filter by tenant name
- `userEmail` (string): Filter by user email
- `actionType` (string): Filter by action type
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)
- `sortBy` (string): Sort field
- `sortOrder` (string): 'asc' or 'desc'

**Response:**
```json
{
  "success": true,
  "data": {
    "auditLogs": [...],
    "stats": {
      "total": 150,
      "actionBreakdown": [...]
    }
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalPages": 3,
    "totalRecords": 150
  }
}
```

### GET /api/superadmin/audit-logs/export

**Query Parameters:**
- `format` (string): 'csv' or 'json'
- All filtering parameters from main endpoint

**Response:** File download (CSV or JSON)

## Database Schema

```sql
model AuditLog {
  id          String   @id @default(cuid())
  action      String   // e.g., "user.login", "tenant.create"
  details     Json?    // Additional details about the action
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  
  // Foreign keys
  tenantId    String?
  userId      String?
  superAdminId String?
  
  // Relations
  tenant      Tenant?     @relation(fields: [tenantId], references: [id])
  user        User?       @relation(fields: [userId], references: [id])
  superAdmin  SuperAdmin? @relation(fields: [superAdminId], references: [id])
}
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Only SuperAdmin users can access audit logs
3. **Data Privacy**: Sensitive information is properly handled
4. **Rate Limiting**: Consider implementing rate limiting for export endpoints
5. **Audit Trail**: All access to audit logs is itself logged

## Performance Optimizations

1. **Database Indexing**: Proper indexes on frequently queried fields
2. **Pagination**: Efficient pagination to handle large datasets
3. **Caching**: Consider implementing Redis caching for frequently accessed data
4. **Query Optimization**: Optimized database queries with proper joins
5. **Lazy Loading**: Components load data only when needed

## Future Enhancements

1. **WebSocket Integration**: Real-time updates via WebSocket
2. **Advanced Analytics**: Charts and graphs for audit data
3. **Alert System**: Configurable alerts for suspicious activities
4. **Retention Policies**: Automatic cleanup of old audit logs
5. **Advanced Search**: Full-text search capabilities
6. **Bulk Operations**: Bulk export and management features

## Troubleshooting

### Common Issues

1. **No logs appearing**: Check if audit logs are being created by the audit service
2. **Export failing**: Verify file permissions and disk space
3. **Slow performance**: Check database indexes and query optimization
4. **Authentication errors**: Verify JWT token validity and permissions

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed console output for audit operations.

## Contributing

When adding new audit log entries:

1. Use the `createAuditLog` function from `src/lib/audit.ts`
2. Follow the established action naming convention
3. Include relevant details in the JSON field
4. Test with the audit logs interface
5. Update documentation if adding new action types 