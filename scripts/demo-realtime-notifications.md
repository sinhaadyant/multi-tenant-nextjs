# Real-Time Notifications Demo Guide

This guide demonstrates how to test the real-time notification system between superadmin and tenant users.

## Prerequisites

1. Start the development server:
```bash
npm run dev
```

2. Ensure the WebSocket server is running (it starts automatically with the dev server)

## Testing Steps

### Step 1: Test WebSocket Connection

First, verify that the WebSocket server is working:

```bash
npm run test:websocket-connection
```

You should see:
- ✅ WebSocket connected successfully
- 🔗 Socket ID: [some-id]
- 🌐 Transport: websocket

### Step 2: Test Real-Time Notifications

Run the comprehensive test:

```bash
npm run test:notification-realtime
```

This will:
1. Login as superadmin
2. Find the target user (anil@cc.com)
3. Send a notification to that specific user
4. Verify the notification was created in the database

### Step 3: Manual Testing

#### Superadmin Side:
1. Open http://localhost:3000/superadmin/login
2. Login with superadmin credentials
3. Go to Notifications page
4. Create a new notification targeting a specific user
5. Set status to "sent"

#### Tenant User Side:
1. Open http://localhost:3000/acme-corp/login
2. Login as anil@cc.com
3. You should immediately see:
   - Toast notification appears
   - Notification count increases
   - New notification appears in the dropdown

## Expected Behavior

### When Superadmin Sends Notification:
1. **Immediate Toast**: User sees a toast notification
2. **Count Update**: Notification badge count increases
3. **Real-time List**: New notification appears in dropdown
4. **WebSocket Status**: Shows connected status (green dot)

### WebSocket Indicators:
- **Green dot**: WebSocket connected
- **Gray dot**: WebSocket disconnected
- **"(offline)" text**: Shows when disconnected

## Troubleshooting

### If notifications don't appear immediately:
1. Check browser console for WebSocket errors
2. Verify user is logged in and socket is connected
3. Check if notification status is set to "sent"
4. Ensure target user ID is correct

### If WebSocket doesn't connect:
1. Check if server is running on port 3000
2. Verify no firewall blocking WebSocket connections
3. Check browser console for connection errors

## API Endpoints

### Superadmin Notifications:
- `POST /api/superadmin/notifications` - Create notification
- `GET /api/superadmin/notifications` - List notifications

### Tenant Notifications:
- `GET /api/tenant/[tenantSlug]/notifications/my` - Get user notifications
- `PATCH /api/tenant/[tenantSlug]/notifications/my/mark-read` - Mark as read

## WebSocket Events

### Client to Server:
- `join_user_room` - Join user-specific room
- `join_tenant_room` - Join tenant room
- `notification_read` - Mark notification as read

### Server to Client:
- `notification` - New notification received
- `notification_count_update` - Unread count updated

## Database Schema

### Key Tables:
- `notifications` - Main notification records
- `userNotifications` - User-specific notification instances
- `users` - User records
- `tenants` - Tenant records

### Important Fields:
- `status` - Notification status (draft, sent, etc.)
- `isRead` - Whether user has read the notification
- `targetType` - Who the notification is for (user, tenant, all)
- `targetUserIds` - Specific users to notify
