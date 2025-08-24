# Tenant Notifications Module

## Overview

The Tenant Notifications Module provides a complete CRUD (Create, Read, Update, Delete) system for managing notifications within tenant organizations. It allows tenant administrators to create, manage, and send notifications to all users within their tenant or to specific users.

## Features

### Core Functionality
- **Create Notifications**: Draft, send immediately, or schedule notifications
- **View Notifications**: List all notifications with filtering and pagination
- **Edit Notifications**: Update notification content and settings
- **Delete Notifications**: Remove notifications from the system
- **Target Audience**: Send to all tenant users or specific users
- **Real-time Updates**: WebSocket integration for instant notification delivery

### Notification Types
- **Info**: General information notifications
- **Warning**: Important warnings and alerts
- **Error**: Critical error notifications
- **Success**: Success and confirmation messages
- **Announcement**: Important announcements

### Priority Levels
- **Low**: Non-urgent notifications
- **Medium**: Standard priority notifications
- **High**: Important notifications
- **Urgent**: Critical notifications requiring immediate attention

### Status Management
- **Draft**: Notifications saved but not sent
- **Sent**: Notifications that have been delivered
- **Scheduled**: Notifications scheduled for future delivery

## API Endpoints

### Base URL
```
/api/tenant/{tenantSlug}/notifications
```

### Endpoints

#### GET /api/tenant/{tenantSlug}/notifications
List all notifications with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search in title and message
- `sortBy` (string): Sort field (createdAt, title, type, priority, status)
- `sortOrder` (string): Sort direction (asc, desc)
- `type` (string): Filter by notification type
- `status` (string): Filter by status
- `priority` (string): Filter by priority

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "stats": {
      "total": 25,
      "draft": 5,
      "sent": 15,
      "scheduled": 5
    },
    "permissions": {
      "canView": true,
      "canCreate": true,
      "canUpdate": true,
      "canDelete": true
    }
  }
}
```

#### POST /api/tenant/{tenantSlug}/notifications
Create a new notification.

**Request Body:**
```json
{
  "title": "Notification Title",
  "message": "Notification message content",
  "type": "info",
  "priority": "medium",
  "targetType": "all_tenant_users",
  "targetUserIds": ["user1", "user2"],
  "scheduledAt": "2024-01-01T10:00:00Z",
  "status": "draft"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "notification-id",
      "title": "Notification Title",
      "type": "info",
      "status": "draft",
      "createdAt": "2024-01-01T09:00:00Z"
    }
  }
}
```

#### PUT /api/tenant/{tenantSlug}/notifications
Update an existing notification.

**Request Body:**
```json
{
  "id": "notification-id",
  "title": "Updated Title",
  "message": "Updated message",
  "type": "warning",
  "priority": "high"
}
```

#### DELETE /api/tenant/{tenantSlug}/notifications?id={notificationId}
Delete a notification.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Notification deleted successfully"
  }
}
```

## Frontend Components

### TenantNotificationsList
Main component for displaying and managing notifications.

**Features:**
- Data table with sorting and filtering
- Statistics cards showing notification counts
- Create, edit, view, and delete actions
- Permission-based UI rendering

**Usage:**
```tsx
import TenantNotificationsList from '@/components/tenant/notifications/TenantNotificationsList';

<TenantNotificationsList />
```

### TenantNotificationForm
Form component for creating and editing notifications.

**Features:**
- Form validation using Zod
- User selection for specific targeting
- Preview functionality
- Scheduling options

**Usage:**
```tsx
import TenantNotificationForm from '@/components/tenant/notifications/TenantNotificationForm';

<TenantNotificationForm
  notification={existingNotification} // Optional for editing
  onSuccess={handleSuccess}
  onCancel={handleCancel}
/>
```

### TenantNotificationView
Component for viewing notification details.

**Features:**
- Detailed notification information
- Recipient statistics
- Creation and update timestamps
- Created by information

**Usage:**
```tsx
import TenantNotificationView from '@/components/tenant/notifications/TenantNotificationView';

<TenantNotificationView
  notification={notification}
  onClose={handleClose}
/>
```

## React Hooks

### useTenantNotifications
Hook for fetching notifications list with filtering and pagination.

```tsx
const {
  data,
  isLoading,
  error,
  refetch
} = useTenantNotifications(
  page,
  limit,
  search,
  sortBy,
  sortOrder,
  typeFilter,
  statusFilter,
  priorityFilter
);
```

### useCreateTenantNotification
Hook for creating new notifications.

```tsx
const createMutation = useCreateTenantNotification();

const handleCreate = async (data) => {
  await createMutation.mutateAsync(data);
};
```

### useUpdateTenantNotification
Hook for updating existing notifications.

```tsx
const updateMutation = useUpdateTenantNotification();

const handleUpdate = async (data) => {
  await updateMutation.mutateAsync(data);
};
```

### useDeleteTenantNotification
Hook for deleting notifications.

```tsx
const deleteMutation = useDeleteTenantNotification();

const handleDelete = async (notificationId) => {
  await deleteMutation.mutateAsync(notificationId);
};
```

## Permissions

The module uses the following permissions:

- `notifications.view`: View notifications list and details
- `notifications.create`: Create new notifications
- `notifications.update`: Edit existing notifications
- `notifications.delete`: Delete notifications

## WebSocket Integration

The notifications module integrates with the WebSocket system for real-time delivery:

- **New Notifications**: Instant delivery to target users
- **Count Updates**: Real-time unread count updates
- **Read Status**: Live updates when notifications are marked as read

## Database Schema

### Notification Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(50) NOT NULL,
  targetType VARCHAR(50) NOT NULL,
  targetUserIds TEXT[],
  status VARCHAR(50) NOT NULL,
  scheduledAt TIMESTAMP,
  tenantId UUID NOT NULL,
  createdBy UUID NOT NULL,
  createdByType VARCHAR(50) NOT NULL,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### UserNotification Table
```sql
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY,
  notificationId UUID NOT NULL,
  userId UUID NOT NULL,
  isRead BOOLEAN DEFAULT false,
  readAt TIMESTAMP,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

## Usage Examples

### Creating a Notification
```tsx
const createNotification = async () => {
  const notificationData = {
    title: "System Maintenance",
    message: "Scheduled maintenance will occur tonight at 2 AM.",
    type: "warning",
    priority: "high",
    targetType: "all_tenant_users",
    status: "sent"
  };

  await createMutation.mutateAsync(notificationData);
};
```

### Targeting Specific Users
```tsx
const createSpecificNotification = async () => {
  const notificationData = {
    title: "Personal Message",
    message: "This is a personal notification.",
    type: "info",
    priority: "medium",
    targetType: "specific_users",
    targetUserIds: ["user1", "user2", "user3"],
    status: "sent"
  };

  await createMutation.mutateAsync(notificationData);
};
```

### Scheduling a Notification
```tsx
const scheduleNotification = async () => {
  const notificationData = {
    title: "Scheduled Announcement",
    message: "This will be sent at the scheduled time.",
    type: "announcement",
    priority: "medium",
    targetType: "all_tenant_users",
    scheduledAt: "2024-01-01T10:00:00Z",
    status: "scheduled"
  };

  await createMutation.mutateAsync(notificationData);
};
```

## Testing

### API Testing
```bash
npm run test:tenant-notifications
```

### WebSocket Testing
```bash
npm run test:websocket
```

## Error Handling

The module includes comprehensive error handling:

- **Validation Errors**: Form validation using Zod schemas
- **Permission Errors**: 403 responses for insufficient permissions
- **Database Errors**: Proper error messages for database operations
- **WebSocket Errors**: Graceful fallback when WebSocket is unavailable

## Security Considerations

- **Tenant Isolation**: Notifications are scoped to tenant boundaries
- **Permission Checks**: All operations require appropriate permissions
- **Input Validation**: All inputs are validated using Zod schemas
- **Audit Logging**: All operations are logged for audit purposes

## Performance Considerations

- **Pagination**: Large datasets are paginated for better performance
- **Indexing**: Database indexes on frequently queried fields
- **Caching**: React Query caching for improved user experience
- **WebSocket**: Real-time updates without polling

## Future Enhancements

- **Notification Templates**: Pre-defined templates for common notifications
- **Bulk Operations**: Bulk create, update, and delete operations
- **Advanced Scheduling**: Recurring notifications and complex scheduling
- **Notification Analytics**: Detailed analytics and reporting
- **Email Integration**: Email delivery for important notifications
- **Mobile Push Notifications**: Push notifications for mobile apps
