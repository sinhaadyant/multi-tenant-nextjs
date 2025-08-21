# Tenant Support Module Enhancement Plan

## Overview
Enhance the existing tenant support module to include:
1. Chat-like interface for ticket conversations
2. Automatic notifications when replies are added
3. Proper CRUD operations with permissions
4. Enhanced user experience

## Current State Analysis

### ✅ Existing Components
- `src/app/[tenantSlug]/support-tickets/page.tsx` - Main tenant support page
- `src/components/support-tickets/EnhancedTicketDetails.tsx` - Current ticket details
- `src/components/support-tickets/EnhancedTicketList.tsx` - Current ticket list
- `src/components/support-tickets/EnhancedTicketForm.tsx` - Current ticket form
- `src/hooks/useSupportTickets.ts` - Current support hooks
- `src/app/api/tenant/[tenantSlug]/support/route.ts` - Current support API

### ✅ Existing Features
- Basic CRUD operations
- Permission-based access control
- File attachments
- Reply functionality
- Status management

## Enhancement Requirements

### 1. Chat-like Interface Implementation

**Target Component**: `src/components/support-tickets/EnhancedTicketDetails.tsx`

**Changes Needed**:
- Replace current reply display with chat bubbles
- Add message alignment (left for users, right for admins/superadmins)
- Add avatars for different user types
- Add timestamp formatting
- Add attachment display in messages
- Add empty state for no conversations

**Visual Design**:
```
┌─────────────────────────────────────────────────────────────┐
│                    Conversation                              │
│ ────────────────────────────────────────────────────────── │
│                                                             │
│ [👤] Hi, I need help with my account settings              │
│ User • Aug 21, 2025 2:25 PM                                │
│                                                             │
│                                    [🛡️] Hello! I can help  │
│                                    Admin • 2:30 PM          │
│                                                             │
│ [👤] I cannot access user management                       │
│ User • Aug 21, 2025 2:35 PM                                │
│                                                             │
│                                    [🛡️] Let me check your  │
│                                    permissions...           │
│                                    Admin • 2:40 PM          │
│                                    [📎] settings.pdf        │
└─────────────────────────────────────────────────────────────┘
```

### 2. Notification System Enhancement

**Target API**: `src/app/api/tenant/[tenantSlug]/support/[id]/replies/route.ts`

**Changes Needed**:
- Add notification creation when replies are added
- Notify appropriate users based on ticket ownership
- Include rich metadata in notifications
- Support for different notification types

**Notification Types**:
```json
{
  "title": "Support Ticket Update",
  "message": "Your support ticket \"[Ticket Title]\" has received a new response.",
  "priority": "medium",
  "targetType": "user",
  "metadata": {
    "ticketId": "ticket_id",
    "ticketTitle": "Ticket Title",
    "replyId": "reply_id",
    "userEmail": "user@example.com",
    "userName": "User Name"
  }
}
```

### 3. Permission-based CRUD Operations

**Current Permissions**:
- `support:read` - View tickets
- `support:create` - Create tickets
- `support:update` - Update tickets and reply
- `support:delete` - Delete tickets

**Enhancement**:
- Add granular permissions for different actions
- Implement proper permission checks in all components
- Add role-based access control for ticket management

### 4. Enhanced User Experience

**Features to Add**:
- Real-time updates (optional WebSocket integration)
- Message status indicators
- Rich text support for replies
- File preview capabilities
- Search within conversations
- Pagination for long conversations

## Implementation Steps

### Step 1: Update Type Definitions
**File**: `src/hooks/useSupportTickets.ts`
- Add `superadmin` to `commenterType`
- Add notification-related types
- Add enhanced metadata types

### Step 2: Enhance API Routes
**Files**:
- `src/app/api/tenant/[tenantSlug]/support/[id]/replies/route.ts`
- `src/app/api/tenant/[tenantSlug]/support/route.ts`

**Changes**:
- Add notification creation logic
- Enhance response data structure
- Add proper error handling

### Step 3: Update Frontend Components
**Files**:
- `src/components/support-tickets/EnhancedTicketDetails.tsx`
- `src/components/support-tickets/EnhancedTicketList.tsx`
- `src/components/support-tickets/EnhancedTicketForm.tsx`

**Changes**:
- Implement chat-like interface
- Add proper permission checks
- Enhance user experience

### Step 4: Add Notification Integration
**Files**:
- `src/hooks/useSupportTickets.ts`
- Notification-related components

**Changes**:
- Add notification hooks
- Integrate with existing notification system
- Add real-time notification updates

## Technical Implementation Details

### Chat Interface Components

**Message Bubble Component**:
```typescript
interface MessageBubbleProps {
  comment: SupportTicketComment;
  isOwnMessage: boolean;
  onDownloadAttachment: (attachment: any) => void;
}
```

**Avatar Component**:
```typescript
interface AvatarProps {
  commenterType: 'user' | 'admin' | 'superadmin';
  size?: 'sm' | 'md' | 'lg';
}
```

### Notification Integration

**Notification Creation**:
```typescript
const createNotification = async (ticket: SupportTicket, reply: SupportTicketComment) => {
  // Create notification based on ticket ownership
  // Include rich metadata
  // Send to appropriate users
};
```

### Permission System

**Enhanced Permissions**:
```typescript
const permissions = {
  'support:read': 'View support tickets',
  'support:create': 'Create support tickets',
  'support:update': 'Update tickets and reply',
  'support:delete': 'Delete support tickets',
  'support:assign': 'Assign tickets to users',
  'support:close': 'Close support tickets'
};
```

## Testing Strategy

### 1. Unit Tests
- Test permission checks
- Test notification creation
- Test chat interface components

### 2. Integration Tests
- Test complete ticket workflow
- Test notification delivery
- Test permission enforcement

### 3. User Acceptance Tests
- Test chat interface usability
- Test notification effectiveness
- Test permission-based access

## Expected Outcomes

### ✅ Enhanced User Experience
- Modern chat-like interface
- Real-time notifications
- Better visual feedback

### ✅ Improved Functionality
- Comprehensive CRUD operations
- Proper permission enforcement
- Rich notification system

### ✅ Better Maintainability
- Modular component structure
- Clear separation of concerns
- Comprehensive error handling

## Next Steps

1. **Phase 1**: Implement chat interface in EnhancedTicketDetails
2. **Phase 2**: Add notification system to reply API
3. **Phase 3**: Enhance permission system
4. **Phase 4**: Add advanced features (real-time, search, etc.)
5. **Phase 5**: Comprehensive testing and optimization

This enhancement will provide tenants with a modern, intuitive support experience that matches the SuperAdmin functionality while maintaining proper security and permissions.
