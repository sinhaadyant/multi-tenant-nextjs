# Tenant Login and Role-Based Permissions Fixes

## Overview

This document outlines the comprehensive fixes implemented to resolve tenant login redirect issues and implement proper role-based permissions for the multi-tenant NextJS application.

## Issues Identified and Fixed

### 1. Tenant Login Redirect Issue

**Problem**: After successful login, users were being redirected back to the login page instead of the dashboard.

**Root Causes**:
- Race conditions in token storage and authentication state management
- Inconsistent token storage across multiple locations
- Authentication context not properly synchronized
- Redirect logic not handling edge cases

**Fixes Implemented**:

#### A. Enhanced Token Storage (`src/app/[tenantSlug]/login/page.tsx`)
```typescript
// Clear existing tokens before storing new ones
localStorage.removeItem('auth_token');
localStorage.removeItem('tenant_auth_token');
sessionStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');

// Store tokens in multiple locations for redundancy
localStorage.setItem('auth_token', result.data.token);
localStorage.setItem('tenant_auth_token', result.data.token);
sessionStorage.setItem('access_token', result.data.token);

// Add delay to ensure tokens are stored before redirect
await new Promise(resolve => setTimeout(resolve, 100));

// Implement fallback redirect mechanism
setTimeout(() => {
  if (window.location.pathname !== dashboardPath) {
    window.location.href = dashboardPath;
  }
}, 500);
```

#### B. Improved Authentication Context (`src/context/TenantAuthContext.tsx`)
```typescript
// Enhanced token retrieval with multiple fallbacks
const getAuthToken = () => {
  return localStorage.getItem('tenant_auth_token') || 
         localStorage.getItem('auth_token') || 
         sessionStorage.getItem('access_token');
};

// Better error handling and auth data clearing
const clearAuthData = () => {
  setUser(null);
  setPermissions([]);
  setRoles([]);
  setTenant(null);
  setError(null);
  
  // Clear all tokens
  localStorage.removeItem('auth_token');
  localStorage.removeItem('tenant_auth_token');
  localStorage.removeItem('refresh_token');
  sessionStorage.removeItem('access_token');
};
```

### 2. Role-Based Permissions Implementation

**Problem**: Sidebar navigation and data access were not properly filtered based on user roles and permissions.

**Fixes Implemented**:

#### A. Enhanced Permission Checking (`src/context/TenantAuthContext.tsx`)
```typescript
const hasPermission = (module: string, action: string): boolean => {
  if (!permissions || permissions.length === 0) {
    console.log(`🔒 No permissions available for module: ${module}, action: ${action}`);
    return false;
  }
  
  const hasPerm = permissions.some(p => p.moduleKey === module && p[action as keyof Permission] === true);
  console.log(`🔒 Permission check - module: ${module}, action: ${action}, result: ${hasPerm}`);
  return hasPerm;
};

const hasRole = (roleName: string): boolean => {
  if (!roles || roles.length === 0) {
    console.log(`🔒 No roles available for role: ${roleName}`);
    return false;
  }
  
  const hasRoleCheck = roles.some(r => r.name.toLowerCase() === roleName.toLowerCase());
  console.log(`🔒 Role check - role: ${roleName}, result: ${hasRoleCheck}`);
  return hasRoleCheck;
};
```

#### B. Dynamic Sidebar Navigation (`src/layout/TenantSidebar.tsx`)
```typescript
// Permission-based navigation items
const getTenantNavElements = (): NavItem[] => {
  const navItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "home",
      path: `/${tenantSlug}/dashboard`,
      requiredPermission: "dashboard:view"
    }
  ];

  // User Management - only show if user has permissions
  if (hasAnyPermission("users")) {
    navItems.push({
      id: "users",
      label: "User Management",
      icon: "users",
      path: `/${tenantSlug}/users`,
      requiredPermission: "users:view"
    });
  }

  // Role-based utilities (admin only)
  if (hasRole("admin") || hasRole("superadmin")) {
    navItems.push({
      id: "utilities",
      label: "Utilities",
      icon: "wrench",
      children: [
        { 
          id: "debugPermissions", 
          label: "Debug Permissions", 
          path: `/${tenantSlug}/debug-permissions`,
          requiredPermission: "utilities:debug"
        }
      ],
      requiredPermission: "utilities:view"
    });
  }
};
```

#### C. Permission Checking Function
```typescript
const checkPermission = (permission?: string, role?: string) => {
  if (!permission && !role) return true;
  
  if (role && !hasRole(role)) return false;
  if (permission) {
    const [module, action] = permission.split(':');
    if (!hasPermission(module, action)) return false;
  }
  
  return true;
};
```

### 3. Enhanced Authentication Protection

**Problem**: Protected routes were not properly handling authentication state and redirects.

**Fixes Implemented**:

#### A. Improved Protected Route (`src/components/auth/TenantProtectedRoute.tsx`)
```typescript
const TenantProtectedRoute: React.FC<TenantProtectedRouteProps> = ({
  children,
  requireAuth = true,
  allowedRoles = [],
  redirectTo,
  fallback
}) => {
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for auth to load
      if (isLoading) return;

      // If not authenticated, redirect to login
      if (!user) {
        if (!redirectAttempted) {
          setRedirectAttempted(true);
          const loginUrl = redirectTo || `/${tenantSlug}/login`;
          router.push(loginUrl);
        }
        return;
      }

      // Check role permissions
      if (allowedRoles.length > 0) {
        const hasRequiredRole = allowedRoles.some(role => hasRole(role));
        
        if (!hasRequiredRole) {
          if (!redirectAttempted) {
            setRedirectAttempted(true);
            router.push(`/${tenantSlug}/unauthorized`);
          }
          return;
        }
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [isLoading, user, requireAuth, allowedRoles, redirectTo, pathname, router, tenantSlug, hasRole, redirectAttempted]);
};
```

### 4. New Tenant Header Component

**Problem**: The header was using SuperAdmin components instead of tenant-specific ones.

**Fixes Implemented**:

#### A. Tenant-Specific Header (`src/components/header/TenantHeader.tsx`)
```typescript
const TenantHeader: React.FC = () => {
  const { user, tenant, hasRole, logout } = useTenantAuth();

  const getUserRoleDisplay = () => {
    if (!user?.roles || user.roles.length === 0) return 'User';
    
    const roleNames = user.roles.map(role => role.name);
    if (roleNames.includes('Admin')) return 'Admin';
    if (roleNames.includes('Manager')) return 'Manager';
    return roleNames[0] || 'User';
  };

  const handleLogout = () => {
    logout();
    router.push(`/${tenantSlug}/login`);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-white px-4 shadow-sm">
      {/* Search Bar */}
      <div className="relative hidden md:block">
        <input type="text" placeholder="Search..." />
      </div>

      {/* User Menu with Role Display */}
      <div className="flex items-center space-x-4">
        {tenant && (
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-lg">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">{tenant.name}</span>
            <span className="text-xs text-gray-500 capitalize">{tenant.plan}</span>
          </div>
        )}

        {/* User Dropdown with Role-Based Actions */}
        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{getUserRoleDisplay()}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg">
              <div className="p-4 border-b">
                <p className="text-sm font-semibold">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <div className="flex items-center mt-2">
                  <Shield className="w-3 h-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-500">{getUserRoleDisplay()}</span>
                </div>
              </div>

              <div className="py-1">
                <Link href={`/${tenantSlug}/profile`}>Profile</Link>
                
                {hasRole('admin') && (
                  <Link href={`/${tenantSlug}/settings`}>Settings</Link>
                )}

                <button onClick={handleLogout}>Sign out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
```

### 5. Permission-Based Data Access

**Problem**: Dashboard and other components were not filtering data based on user permissions.

**Fixes Implemented**:

#### A. Enhanced Dashboard (`src/components/tenant/TenantDashboardClient.tsx`)
```typescript
const TenantDashboardClient: React.FC = () => {
  const { user, tenant, hasPermission } = useTenantAuth();
  
  // Get permissions for different modules
  const userPermissions = useDataPermissions('users');
  const rolePermissions = useDataPermissions('roles');
  const contentPermissions = useDataPermissions('content');
  const notificationPermissions = useDataPermissions('notifications');
  const auditPermissions = useDataPermissions('audit');

  // Permission-based stats display
  return (
    <div className="space-y-6">
      {/* Stats Cards - Only show if user has permissions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {userPermissions.canView && (
          <CountCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            bgColor="bg-blue-100 dark:bg-blue-900"
            iconColor="text-blue-600 dark:text-blue-400"
          />
        )}
        
        {rolePermissions.canView && (
          <CountCard
            title="Total Roles"
            value={stats.totalRoles}
            icon={Shield}
            bgColor="bg-purple-100 dark:bg-purple-900"
            iconColor="text-purple-600 dark:text-purple-400"
          />
        )}
        
        {/* Quick Actions - Permission-based */}
        <div className="grid grid-cols-2 gap-3">
          {userPermissions.canCreate && (
            <button className="p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 mb-2" />
              <p className="text-sm font-medium">Add User</p>
            </button>
          )}
          
          {rolePermissions.canCreate && (
            <button className="p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600 mb-2" />
              <p className="text-sm font-medium">Create Role</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

## Testing and Verification

### Comprehensive Test Script

A comprehensive test script (`test-tenant-fixes.js`) has been created to verify all fixes:

```bash
node test-tenant-fixes.js
```

**Test Coverage**:
1. Tenant information retrieval
2. User login with different roles
3. User profile fetching
4. Role and permission validation
5. Dashboard access verification
6. Token validation
7. Logout functionality

### Manual Testing Steps

1. **Login Flow**:
   - Navigate to `http://localhost:3000/acme-corp/login`
   - Login with admin credentials
   - Verify redirect to dashboard
   - Check that tokens are properly stored

2. **Role-Based Navigation**:
   - Login as admin user
   - Verify all menu items are visible
   - Login as regular user
   - Verify only permitted menu items are visible

3. **Permission-Based Data**:
   - Check dashboard stats based on permissions
   - Verify quick actions are filtered by permissions
   - Test different user roles

4. **Header Functionality**:
   - Verify user information display
   - Test role-based menu items
   - Verify logout functionality

## Configuration and Setup

### Required Environment Variables

```env
JWT_SECRET=your-jwt-secret-here
DATABASE_URL=your-database-url
NODE_ENV=development
```

### Database Schema Requirements

Ensure the following tables exist with proper relationships:
- `tenants` - Tenant information
- `users` - User accounts with tenant association
- `roles` - Role definitions
- `userRoles` - User-role assignments
- `permissions` - Permission definitions
- `rolePermissions` - Role-permission assignments

### API Endpoints

The following API endpoints must be functional:
- `POST /api/tenant/auth/login` - Tenant login
- `GET /api/tenant/[tenantSlug]/me` - User profile
- `GET /api/tenant/[tenantSlug]/info` - Tenant information
- `POST /api/tenant/[tenantSlug]/logout` - Logout
- `GET /api/tenant/[tenantSlug]/dashboard` - Dashboard data

## Troubleshooting

### Common Issues and Solutions

1. **Login redirects back to login page**:
   - Check browser console for token storage errors
   - Verify API endpoints are responding correctly
   - Check authentication context state

2. **Sidebar items not showing**:
   - Verify user has proper roles assigned
   - Check permission assignments in database
   - Review permission checking logic

3. **Dashboard data not loading**:
   - Check API authentication headers
   - Verify user permissions for dashboard access
   - Review API response format

4. **Token validation failures**:
   - Check JWT secret configuration
   - Verify token expiration settings
   - Review token storage locations

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` and check browser console for detailed logs:

```typescript
console.log('🔍 Token Debug:', {
  tenantAuthToken: localStorage.getItem('tenant_auth_token'),
  authToken: localStorage.getItem('auth_token'),
  accessToken: sessionStorage.getItem('access_token'),
  finalToken: token ? 'present' : 'missing',
  hasToken: !!token
});
```

## Performance Considerations

1. **Token Storage**: Multiple storage locations provide redundancy but may impact performance slightly
2. **Permission Checking**: Cached permission checks reduce API calls
3. **Role-Based Navigation**: Dynamic menu generation based on permissions
4. **Authentication Context**: Optimized to prevent unnecessary re-renders

## Security Considerations

1. **Token Security**: Tokens stored in localStorage with proper expiration
2. **Permission Validation**: Server-side validation of all permissions
3. **Role-Based Access**: Proper role checking on both client and server
4. **Authentication State**: Secure handling of authentication state

## Future Enhancements

1. **Real-time Permission Updates**: WebSocket-based permission updates
2. **Advanced Role Hierarchy**: Support for role inheritance
3. **Permission Groups**: Group-based permission management
4. **Audit Logging**: Comprehensive audit trail for permission changes
5. **Multi-factor Authentication**: Enhanced security for sensitive operations

## Conclusion

These fixes provide a robust, secure, and scalable solution for tenant authentication and role-based permissions. The implementation ensures proper separation of concerns, maintains security best practices, and provides a smooth user experience across all tenant environments.
