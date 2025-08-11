# Notification Module Implementation

## Overview

The Notification Module has been successfully implemented for the multi-tenant Next.js application. This module provides comprehensive notification management capabilities with permission-based access control, supporting both superadmin and tenant-level operations.

## 🗄️ Database Schema

### Enhanced Notification Model

```prisma
model Notification {
  id             String      @id @default(cuid())
  title          String      @db.VarChar(255)
  message        String      @db.Text
  type           String      @default("info") // info, warning, alert, promotional, system_update
  priority       String      @default("medium") // low, medium, high
  status         String      @default("draft") // draft, sent, scheduled, cancelled
  scheduledAt    DateTime?
  sentAt         DateTime?
  isActive       Boolean     @default(true)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  createdBy      String?
  createdByType  String      @default("superadmin") // superadmin, tenant_admin, user
  targetType     String      @default("superadmin") // superadmin, specific_users, multiple_users, entire_tenant, multiple_tenants
  targetTenantId String?
  attachments    String?     @db.Text // JSON array of attachment objects
  metadata       String?     @db.Text // Additional metadata as JSON
  
  // Relations
  superAdmin     SuperAdmin? @relation(fields: [createdBy], references: [id])
  tenant         Tenant?     @relation(fields: [targetTenantId], references: [id])
  userNotifications UserNotification[]

  @@index([createdBy], map: "notifications_createdBy_fkey")
  @@index([targetTenantId], map: "notifications_targetTenantId_fkey")
  @@index([status], map: "notifications_status_idx")
  @@index([type], map: "notifications_type_idx")
  @@index([priority], map: "notifications_priority_idx")
  @@index([createdAt], map: "notifications_createdAt_idx")
  @@map("notifications")
}

model UserNotification {
  id             String      @id @default(cuid())
  notificationId String
  userId         String
  tenantId       String?
  isRead         Boolean     @default(false)
  readAt         DateTime?
  isActive       Boolean     @default(true)
  createdAt      DateTime    @default(now())
  
  // Relations
  notification   Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant         Tenant?      @relation(fields: [tenantId], references: [id])

  @@unique([notificationId, userId])
  @@index([userId], map: "user_notifications_userId_fkey")
  @@index([notificationId], map: "user_notifications_notificationId_fkey")
  @@index([tenantId], map: "user_notifications_tenantId_fkey")
  @@index([isRead], map: "user_notifications_isRead_idx")
  @@index([createdAt], map: "user_notifications_createdAt_idx")
  @@map("user_notifications")
}
```

## 🔐 Permissions System

### Notification Permissions

The following permissions have been added to the system:

1. **view_notifications** - View notifications list and details
2. **create_notifications** - Create new notifications
3. **edit_notifications** - Edit existing notifications
4. **delete_notifications** - Delete notifications
5. **send_notifications** - Send notifications to target audience

### Permission Assignment

- All notification permissions are automatically assigned to superadmin roles
- Tenant roles can be configured to have specific notification permissions
- Permissions are enforced at the API level for all notification operations

## 🚀 API Endpoints

### Superadmin Notification APIs

#### GET `/api/superadmin/notifications`
- **Purpose**: Fetch notifications with filtering and pagination
- **Permissions**: `view_notifications`
- **Features**:
  - Search by title/message
  - Filter by type, status, priority, target type
  - Date range filtering
  - Sorting and pagination
  - Statistics (total, draft, sent, scheduled, cancelled)

#### POST `/api/superadmin/notifications`
- **Purpose**: Create new notification
- **Permissions**: `create_notifications`
- **Features**:
  - Full notification creation with all fields
  - Validation using Zod schemas
  - Audit logging

#### GET `/api/superadmin/notifications/[id]`
- **Purpose**: Get single notification details
- **Permissions**: `view_notifications`
- **Features**:
  - Complete notification details
  - Recipient information
  - Attachment details

#### PUT `/api/superadmin/notifications/[id]`
- **Purpose**: Update notification
- **Permissions**: `edit_notifications`
- **Features**:
  - Edit draft notifications only
  - Full field updates
  - Audit logging

#### DELETE `/api/superadmin/notifications/[id]`
- **Purpose**: Delete notification (soft delete)
- **Permissions**: `delete_notifications`
- **Features**:
  - Soft delete (sets isActive to false)
  - Audit logging

#### PATCH `/api/superadmin/notifications/[id]`
- **Purpose**: Send notification
- **Permissions**: `send_notifications`
- **Features**:
  - Send draft/scheduled notifications
  - Update status to 'sent'
  - Create user notification records

### Tenant Notification APIs

#### GET `/api/tenant/[tenantSlug]/notifications`
- **Purpose**: Fetch tenant-specific notifications
- **Permissions**: `view_notifications` (tenant context)
- **Features**:
  - Tenant-scoped notifications
  - Same filtering as superadmin API
  - Tenant-specific statistics

#### POST `/api/tenant/[tenantSlug]/notifications`
- **Purpose**: Create tenant notification
- **Permissions**: `create_notifications` (tenant context)
- **Features**:
  - Tenant-scoped notification creation
  - Automatic tenant assignment

#### GET `/api/tenant/[tenantSlug]/notifications/my`
- **Purpose**: Fetch user's notifications
- **Features**:
  - User-specific notifications
  - Read/unread status
  - Pagination and filtering

#### PATCH `/api/tenant/[tenantSlug]/notifications/my`
- **Purpose**: Mark notifications as read
- **Features**:
  - Mark specific notifications as read
  - Mark all notifications as read

#### PATCH `/api/tenant/[tenantSlug]/notifications/my/mark-read`
- **Purpose**: Mark notifications as read (dedicated endpoint)
- **Features**:
  - Same functionality as above but dedicated endpoint

## 🎨 Frontend Components

### Superadmin Notification Management

#### `/superadmin/notifications` - Main Notifications Page
- **Features**:
  - Comprehensive notification listing with table view
  - Advanced filtering (type, status, priority, target type, date range)
  - Search functionality
  - Statistics dashboard
  - Pagination
  - Action buttons (view, edit, delete, send)
  - Permission-based action visibility

#### `/superadmin/notifications/create` - Create Notification Form
- **Features**:
  - Full notification creation form
  - All required fields (title, message, type, priority, target type)
  - Validation
  - Responsive design

### Notification Types

1. **Info** - General information notifications
2. **Warning** - Warning notifications
3. **Alert** - Critical alert notifications
4. **Promotional** - Marketing/promotional notifications
5. **System Update** - System-related notifications

### Priority Levels

1. **Low** - Non-urgent notifications
2. **Medium** - Standard priority notifications
3. **High** - High priority notifications

### Target Types

1. **Super Admin** - Superadmin users only
2. **Specific Users** - Selected individual users
3. **Multiple Users** - Multiple selected users
4. **Entire Tenant** - All users in a specific tenant
5. **Multiple Tenants** - Users across multiple tenants

## 🔧 Technical Implementation

### Validation Schemas

Enhanced validation schemas in `src/lib/validations/superadmin.ts`:

```typescript
export const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message must be less than 2000 characters'),
  type: z.enum(['info', 'warning', 'alert', 'promotional', 'system_update']),
  priority: z.enum(['low', 'medium', 'high']),
  targetType: z.enum(['superadmin', 'specific_users', 'multiple_users', 'entire_tenant', 'multiple_tenants']),
  targetTenantId: z.string().optional(),
  targetUserIds: z.array(z.string()).optional(),
  scheduledAt: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    originalName: z.string(),
    mimeType: z.string(),
    size: z.number(),
    url: z.string()
  })).optional(),
  metadata: z.record(z.any()).optional(),
});
```

### React Query Hooks

Enhanced hooks in `src/hooks/useNotifications.ts`:

- `useNotifications()` - Fetch notifications with filtering
- `useCreateNotification()` - Create notifications
- `useUpdateNotification()` - Update notifications
- `useDeleteNotification()` - Delete notifications
- `useSendNotification()` - Send notifications
- `useNotification()` - Get single notification

### Authentication & Authorization

- **Superadmin APIs**: Use `verifySuperAdminToken` and `checkPermission`
- **Tenant APIs**: Use `withTenantAuth` middleware and `checkTenantPermission`
- **Permission checks**: Enforced at API level for all operations
- **Audit logging**: All notification actions are logged

## 📊 Features Implemented

### ✅ Core Features

1. **Notification Creation**
   - Title and message with validation
   - Type selection (info, warning, alert, promotional, system_update)
   - Priority levels (low, medium, high)
   - Target audience selection
   - Status management (draft, sent, scheduled, cancelled)
   - Optional attachments and metadata

2. **Permission-based Access**
   - Create, view, edit, delete, send permissions
   - Role-based access control
   - Tenant-scoped permissions
   - API-level permission enforcement

3. **Notification Management**
   - Comprehensive listing with filters
   - Search functionality
   - Pagination
   - Statistics dashboard
   - Bulk operations

4. **User Notification System**
   - User-specific notification delivery
   - Read/unread status tracking
   - Mark as read functionality
   - Notification history

5. **Audit Tracking**
   - All notification actions logged
   - User ID, timestamp, and changes recorded
   - Integration with existing audit system

### ✅ Advanced Features

1. **Scheduling System**
   - Schedule notifications for future delivery
   - Automatic status updates
   - Scheduled notification management

2. **Target Audience Management**
   - Multiple target types supported
   - User and tenant selection
   - Flexible targeting options

3. **Attachment Support**
   - File upload capability
   - Multiple file types
   - File metadata tracking

4. **Statistics & Analytics**
   - Real-time notification statistics
   - Status-based counts
   - Performance metrics

## 🚀 Usage Examples

### Creating a Notification (Superadmin)

```typescript
const createNotification = useCreateNotification();

const handleCreate = async () => {
  await createNotification.mutateAsync({
    title: "System Maintenance",
    message: "Scheduled maintenance on Sunday at 2 AM",
    type: "info",
    priority: "medium",
    targetType: "entire_tenant",
    targetTenantId: "tenant-id",
  });
};
```

### Fetching Notifications with Filters

```typescript
const { data, isLoading } = useNotifications({
  search: "maintenance",
  type: ["info", "warning"],
  status: ["sent"],
  priority: ["high"],
  page: 1,
  limit: 10,
});
```

### Marking Notifications as Read

```typescript
const markReadMutation = useMarkNotificationsAsRead(tenantSlug);

await markReadMutation.mutateAsync({
  notificationIds: ["notification-id-1", "notification-id-2"],
  markAllAsRead: false,
});
```

## 🔄 Database Migration

The notification module includes:

1. **Enhanced Notification table** with new fields
2. **UserNotification mapping table** for user-specific notifications
3. **Database indexes** for optimal performance
4. **Foreign key relationships** for data integrity

## 📝 Next Steps

### Potential Enhancements

1. **Real-time Notifications**
   - WebSocket integration
   - Push notifications
   - Real-time delivery

2. **Advanced Scheduling**
   - Recurring notifications
   - Time zone support
   - Advanced scheduling rules

3. **Notification Templates**
   - Pre-defined templates
   - Template management
   - Dynamic content

4. **Advanced Analytics**
   - Delivery statistics
   - Read rate analytics
   - User engagement metrics

5. **Email Integration**
   - Email notification delivery
   - Email templates
   - Email tracking

## 🧪 Testing

The notification module includes:

- **E2E Tests**: Comprehensive end-to-end testing
- **API Tests**: API endpoint testing
- **Component Tests**: Frontend component testing
- **Permission Tests**: Authorization testing

## 📚 Documentation

- **API Documentation**: Complete API reference
- **Component Documentation**: Frontend component usage
- **Permission Guide**: Permission configuration guide
- **Migration Guide**: Database migration instructions

---

The Notification Module is now fully implemented and ready for production use. It provides a comprehensive, scalable, and secure notification system that integrates seamlessly with the existing multi-tenant architecture. 