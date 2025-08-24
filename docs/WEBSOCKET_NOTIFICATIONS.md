# WebSocket Real-Time Notifications System

This document describes the implementation of real-time notifications using WebSocket technology for both tenant users and superadmins.

## Overview

The notification system provides real-time updates for:
- **New notifications** with toast alerts
- **Unread count updates** in the header
- **Read status changes** when notifications are marked as read
- **Live notification lists** that update automatically

## Architecture

### Components

1. **WebSocket Server** (`server/websocket-server.js`)
   - Handles real-time connections
   - Manages user rooms and tenant rooms
   - Broadcasts notifications to appropriate users

2. **Client Socket Library** (`src/lib/socket.ts`)
   - Manages WebSocket connections
   - Handles authentication and reconnection
   - Provides toast notifications

3. **React Hook** (`src/hooks/useNotificationSocket.ts`)
   - Manages socket lifecycle in React components
   - Handles query invalidation for real-time updates
   - Provides connection status

4. **Notification Components**
   - `TenantNotificationDropdown.tsx` - For tenant users
   - `SuperAdminNotificationDropdown.tsx` - For superadmins

## Features

### Real-Time Notifications
- **Instant delivery**: Notifications appear immediately when sent
- **Toast alerts**: New notifications show as toast messages
- **Visual indicators**: Unread count badges with animation
- **Connection status**: Visual indicator when WebSocket is disconnected

### Room Management
- **User rooms**: Individual user notifications
- **Tenant rooms**: Notifications for all users in a tenant
- **SuperAdmin rooms**: Notifications for all superadmins
- **Global rooms**: Notifications for all connected users

### Authentication & Security
- **User verification**: Validates users against database
- **Room access control**: Users only receive notifications they're authorized for
- **Secure connections**: WebSocket connections require valid authentication

## Usage

### Starting the Application

```bash
# Development mode (includes WebSocket server)
npm run dev

# Production mode (includes WebSocket server)
npm run start
```

The WebSocket server is integrated with Next.js and runs on the same port (3000 by default).

### Environment Variables

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Using in Components

```tsx
import { useNotificationSocket } from '@/hooks/useNotificationSocket';

function MyComponent() {
  const { isConnected } = useNotificationSocket({
    userId: user.id,
    userType: 'user', // or 'superadmin'
    tenantId: tenant.id, // for tenant users
    enabled: true
  });

  return (
    <div>
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
}
```

## API Integration

### Sending Notifications

When creating notifications via API, the system automatically:

1. **Creates notification** in database
2. **Broadcasts via WebSocket** if status is 'sent'
3. **Updates unread counts** for affected users
4. **Shows toast notifications** to connected users

### Target Types

- `specific_users`: Send to specific user IDs
- `entire_tenant`: Send to all users in a tenant
- `multiple_tenants`: Send to multiple tenants
- `superadmin`: Send to all superadmins
- `all`: Send to all connected users

## Event Types

### Client Events (sent to server)
- `join_user_room`: Join individual user room
- `join_tenant_room`: Join tenant room
- `join_superadmin_room`: Join superadmin room
- `notification_read`: Mark notification as read

### Server Events (sent to client)
- `notification`: New notification received
- `notification_count_update`: Unread count updated
- `notification_read`: Notification marked as read

## Error Handling

### Connection Issues
- **Automatic reconnection**: Attempts to reconnect on disconnection
- **Fallback polling**: Falls back to HTTP polling if WebSocket fails
- **Graceful degradation**: System works without WebSocket (slower updates)

### Authentication Failures
- **User validation**: Verifies user exists and is active
- **Room access**: Ensures users only access authorized rooms
- **Secure disconnection**: Removes users from rooms on authentication failure

## Performance Considerations

### Optimization
- **Room-based broadcasting**: Only sends to relevant users
- **Connection pooling**: Efficiently manages multiple connections
- **Query invalidation**: Updates React Query cache for real-time UI

### Scalability
- **Horizontal scaling**: WebSocket server can be scaled independently
- **Load balancing**: Multiple WebSocket servers can be load balanced
- **Database efficiency**: Minimal database queries for real-time features

## Monitoring

### Connection Status
- **Connected users count**: Track active connections
- **Room occupancy**: Monitor room membership
- **Error logging**: Log connection and authentication errors

### Performance Metrics
- **Message delivery**: Track notification delivery success
- **Connection stability**: Monitor reconnection frequency
- **Response times**: Measure notification delivery latency

## Troubleshooting

### Common Issues

1. **WebSocket not connecting**
   - Check if server is running on correct port
   - Verify CORS settings
   - Check authentication credentials

2. **Notifications not appearing**
   - Verify user is in correct rooms
   - Check notification target type
   - Ensure WebSocket server is running

3. **Count not updating**
   - Check database connection
   - Verify user permissions
   - Check query invalidation

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed WebSocket connection and event logs.

## Security Best Practices

1. **Authentication**: Always validate users before allowing connections
2. **Authorization**: Ensure users only access authorized rooms
3. **Input validation**: Validate all WebSocket event data
4. **Rate limiting**: Implement rate limiting for WebSocket events
5. **Secure transport**: Use WSS in production environments

## Future Enhancements

- **Push notifications**: Browser push notifications
- **Email integration**: Fallback email notifications
- **Notification preferences**: User-configurable notification settings
- **Advanced filtering**: Real-time notification filtering
- **Analytics**: Notification engagement tracking
