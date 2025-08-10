# Authentication Implementation Guide

## Overview
This document outlines the comprehensive authentication system implemented to handle 401 errors and automatic redirects to login pages. The system includes centralized middleware, enhanced API client, and proper token management.

## 🔐 Core Components

### 1. Authentication Middleware (`src/lib/authMiddleware.ts`)

Centralized middleware for API route protection with different authentication levels:

```typescript
// Basic authentication
export const withAuth = (handler, options) => { ... }

// Tenant-specific authentication
export const withTenantAuth = (handler) => { ... }

// SuperAdmin authentication
export const withSuperAdminAuth = (handler) => { ... }

// Optional authentication
export const withOptionalAuth = (handler) => { ... }
```

#### Usage Examples:

```typescript
// Require authentication for any user
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  // req.user is guaranteed to exist
  const userId = req.user!.id;
  // ... your logic
});

// Require tenant authentication
export const GET = withTenantAuth(async (req: AuthenticatedRequest) => {
  // req.user has tenantId and tenantSlug
  const tenantId = req.user!.tenantId;
  // ... your logic
});

// Require SuperAdmin role
export const GET = withSuperAdminAuth(async (req: AuthenticatedRequest) => {
  // req.user.role is guaranteed to be 'superadmin'
  // ... your logic
});
```

### 2. Enhanced API Client (`src/lib/api.ts`)

Automatic token management and 401 error handling:

#### Features:
- **Automatic Token Injection**: Adds Bearer token to all requests
- **Token Validation**: Checks token expiration before requests
- **401 Error Handling**: Automatically clears auth data and redirects to login
- **Smart Redirects**: Determines correct login page based on current route
- **Toast Notifications**: User-friendly error messages

#### Automatic Redirect Logic:
```typescript
const redirectToLogin = () => {
  const currentPath = window.location.pathname;
  
  if (currentPath.startsWith('/superadmin')) {
    return '/superadmin/login';
  } else if (currentPath.includes('/[tenantSlug]')) {
    // Extract tenant slug and redirect to tenant login
    return `/${tenantSlug}/login`;
  }
  
  return '/login';
};
```

### 3. Protected Route Component (`src/components/auth/ProtectedRoute.tsx`)

Client-side route protection with automatic redirects:

```typescript
// Basic protection
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Role-based protection
<ProtectedRoute allowedRoles={['superadmin']}>
  <SuperAdminPanel />
</ProtectedRoute>

// Tenant-specific protection
<ProtectedRoute requireAuth={true}>
  <TenantDashboard />
</ProtectedRoute>
```

### 4. Enhanced Auth Hook (`src/hooks/useAuth.ts`)

Comprehensive authentication state management:

```typescript
const { 
  user, 
  isAuthenticated, 
  isLoading, 
  login, 
  logout, 
  checkAuthStatus 
} = useAuth();
```

## 🚀 Implementation Steps

### Step 1: Update Existing API Routes

Replace manual token verification with middleware:

#### Before:
```typescript
export const GET = asyncHandler(async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Unauthorized', 401);
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return createErrorResponse('Invalid token', 401);
  }
  
  // ... your logic
});
```

#### After:
```typescript
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  // req.user is already verified and available
  const userId = req.user!.id;
  
  // ... your logic
});
```

### Step 2: Update API Routes by Type

#### Tenant Routes:
```typescript
// Use withTenantAuth for tenant-specific routes
export const GET = withTenantAuth(async (req: AuthenticatedRequest) => {
  const tenantId = req.user!.tenantId;
  const tenantSlug = req.user!.tenantSlug;
  // ... your logic
});
```

#### SuperAdmin Routes:
```typescript
// Use withSuperAdminAuth for superadmin-only routes
export const GET = withSuperAdminAuth(async (req: AuthenticatedRequest) => {
  // Only superadmins can access this
  // ... your logic
});
```

#### Public Routes:
```typescript
// Use withOptionalAuth for routes that work with or without auth
export const GET = withOptionalAuth(async (req: AuthenticatedRequest) => {
  if (req.user) {
    // User is authenticated
    // ... authenticated logic
  } else {
    // User is not authenticated
    // ... public logic
  }
});
```

### Step 3: Update Client Components

#### Replace old auth patterns:
```typescript
// Old pattern
const { isAuthenticated, user } = useAuth();
if (!isAuthenticated) {
  router.push('/login');
  return null;
}

// New pattern
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

### Step 4: Add Authentication to Layouts

#### Tenant Layout:
```typescript
// src/app/[tenantSlug]/layout.tsx
export default function TenantLayout({ children }) {
  return (
    <ProtectedRoute requireAuth={true}>
      <DynamicPermissionsProvider>
        {/* Your layout */}
        {children}
      </DynamicPermissionsProvider>
    </ProtectedRoute>
  );
}
```

#### SuperAdmin Layout:
```typescript
// src/app/superadmin/layout.tsx
export default function SuperAdminLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={['superadmin']}>
      {/* Your layout */}
      {children}
    </ProtectedRoute>
  );
}
```

## 📋 API Routes to Update

### Tenant Routes:
- `src/app/api/tenant/[tenantSlug]/permissions/current-user/route.ts` ✅
- `src/app/api/tenant/[tenantSlug]/dashboard/stats/route.ts` ✅
- `src/app/api/tenant/[tenantSlug]/dashboard/charts/route.ts`
- `src/app/api/tenant/[tenantSlug]/users/route.ts`
- `src/app/api/tenant/[tenantSlug]/roles/route.ts`
- `src/app/api/tenant/[tenantSlug]/audit-logs/route.ts`
- `src/app/api/tenant/[tenantSlug]/notifications/route.ts`
- `src/app/api/tenant/[tenantSlug]/support/route.ts`

### SuperAdmin Routes:
- `src/app/api/superadmin/dashboard/route.ts`
- `src/app/api/superadmin/tenants/route.ts`
- `src/app/api/superadmin/users/route.ts`
- `src/app/api/superadmin/audit/route.ts`
- `src/app/api/superadmin/reports/route.ts`

### Auth Routes:
- `src/app/api/auth/verify/route.ts` ✅
- `src/app/api/auth/logout/route.ts` ✅
- `src/app/api/auth/refresh/route.ts` ✅

## 🔧 Configuration

### Environment Variables:
```env
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=90d
REFRESH_TOKEN_SECRET=your-refresh-secret-key
```

### Token Storage:
The system automatically manages tokens in multiple locations:
- `localStorage.auth_token` (primary)
- `sessionStorage.access_token` (fallback)
- `localStorage.refresh_token` (refresh token)

## 🛡️ Security Features

### 1. Token Validation
- Automatic expiration checking
- Format validation
- Payload verification

### 2. Automatic Cleanup
- Clears all token locations on logout/expiry
- Removes cookies and localStorage items
- Resets Redux state

### 3. Smart Redirects
- Determines correct login page based on current route
- Preserves intended destination for post-login redirect
- Handles tenant-specific logins

### 4. Error Handling
- Graceful 401 error handling
- User-friendly toast notifications
- Automatic session cleanup

## 📱 User Experience

### Login Flow:
1. User enters credentials
2. System validates and stores tokens
3. Redirects to intended page or dashboard
4. Shows success notification

### Session Expiry:
1. API returns 401 error
2. System automatically clears auth data
3. Shows "Session expired" notification
4. Redirects to appropriate login page
5. Preserves current page for post-login redirect

### Logout Flow:
1. User clicks logout
2. System calls logout API
3. Clears all local auth data
4. Shows success notification
5. Redirects to login page

## 🧪 Testing

### Test Authentication:
```bash
# Test token verification
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/auth/verify

# Test protected route
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/tenant/your-tenant/dashboard/stats

# Test without token (should return 401)
curl http://localhost:3000/api/tenant/your-tenant/dashboard/stats
```

### Test Redirects:
1. Open browser dev tools
2. Clear localStorage and sessionStorage
3. Navigate to protected route
4. Should automatically redirect to login

## 🚨 Error Handling

### Common Issues:

#### 1. 401 Errors Everywhere
**Cause**: Missing or invalid tokens
**Solution**: Check token storage and validation logic

#### 2. Infinite Redirects
**Cause**: Login page not properly configured
**Solution**: Ensure login routes are excluded from protection

#### 3. Token Not Being Sent
**Cause**: API client not properly configured
**Solution**: Verify axios interceptors are working

#### 4. Wrong Login Page Redirect
**Cause**: Route detection logic incorrect
**Solution**: Check `redirectToLogin` function in api.ts

## 📈 Performance Optimizations

### 1. Token Caching
- Tokens are cached in localStorage
- Automatic validation before requests
- Lazy loading of auth state

### 2. Minimal API Calls
- Auth verification only when needed
- Cached user permissions
- Efficient token refresh

### 3. Optimistic Updates
- Immediate UI updates
- Background token validation
- Graceful error handling

## 🔄 Migration Checklist

- [ ] Update all API routes to use middleware
- [ ] Replace manual token verification
- [ ] Update client components to use ProtectedRoute
- [ ] Test authentication flows
- [ ] Verify redirect logic
- [ ] Test error handling
- [ ] Update documentation
- [ ] Performance testing

## 🎯 Benefits

1. **Centralized Security**: All authentication logic in one place
2. **Automatic Handling**: No manual 401 error handling needed
3. **Better UX**: Smooth redirects and notifications
4. **Maintainable**: Easy to update and extend
5. **Secure**: Proper token validation and cleanup
6. **Flexible**: Different auth levels for different routes

This implementation provides a robust, secure, and user-friendly authentication system that automatically handles 401 errors and redirects users to the appropriate login pages. 