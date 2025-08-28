# Remember Me Functionality Implementation

## Overview

This document describes the implementation of the "Remember Me" functionality for both tenant and superadmin users in the multi-tenant NextJS application. The feature allows users to extend their session duration from 7 days to 30 days when they check the "Remember Me" checkbox during login.

## Problem Statement

The application had several issues with session management:

1. **"Remember Me" functionality was not properly implemented** - The checkbox existed but didn't affect token expiration
2. **Session duration was not configurable** - Currently hardcoded to 3 months for refresh tokens
3. **Multiple logout issues** - Users were being logged out multiple times due to improper token management
4. **Refresh token handling was inconsistent** - Different storage mechanisms for different user types

## Solution Implementation

### 1. JWT Configuration Updates (`src/lib/jwt.ts`)

**Changes Made:**
- Added configurable session durations based on "Remember Me" preference
- Updated token generation to support different expiration times
- Added environment variables for session configuration

**Key Features:**
- **Access Token**: 15 minutes (configurable via `JWT_ACCESS_EXPIRES_IN`)
- **Refresh Token (Regular)**: 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)
- **Refresh Token (Remember Me)**: 30 days (configurable via `JWT_REFRESH_EXPIRES_IN_REMEMBER`)

```typescript
// Environment variables
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN_REMEMBER=30d
```

### 2. API Endpoint Updates

#### SuperAdmin Login (`src/app/api/superadmin/auth/login/route.ts`)
- Added `rememberMe` parameter support
- Updated token generation to use "Remember Me" preference
- Enhanced audit logging to track "Remember Me" usage
- Updated cookie expiration based on "Remember Me" preference

#### Tenant Login (`src/app/api/tenant/auth/login/route.ts`)
- Added `rememberMe` parameter support
- Updated token generation to use "Remember Me" preference
- Enhanced audit logging to track "Remember Me" usage

#### Tenant Refresh Token (`src/app/api/tenant/auth/refresh/route.ts`)
- Created new endpoint for tenant token refresh
- Consistent with superadmin refresh token implementation
- Proper error handling and audit logging

### 3. Frontend Updates

#### SignInForm Component (`src/components/auth/SignInForm.tsx`)
- Updated to pass `rememberMe` parameter to login API
- Enhanced token storage with "Remember Me" preference
- Updated cookie management for superadmin users

#### Storage Management (`src/lib/simpleStorage.ts`)
- Added configurable session duration support
- Updated token storage to respect "Remember Me" preference
- Enhanced cookie management with appropriate expiration times

#### Authentication Hook (`src/hooks/useAuth.ts`)
- Fixed multiple logout issues by preventing concurrent logout calls
- Enhanced refresh token functionality with proper endpoint routing
- Improved error handling for token refresh failures
- Added proper type safety and error handling

## Usage

### For Users

1. **Regular Login**: Users can log in normally, and their session will last for 7 days
2. **Remember Me Login**: Users can check the "Keep me logged in" checkbox during login, and their session will last for 30 days

### For Developers

#### Testing the Functionality

Run the test script to verify the implementation:

```bash
node scripts/test-remember-me.js
```

#### Environment Configuration

Add these environment variables to your `.env` file:

```env
# JWT Configuration
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN_REMEMBER=30d
JWT_SECRET=your-secret-key
REFRESH_TOKEN_SECRET=your-refresh-secret-key
```

#### API Usage

**SuperAdmin Login:**
```javascript
const response = await fetch('/api/superadmin/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'password123',
    rememberMe: true // or false
  })
});
```

**Tenant Login:**
```javascript
const response = await fetch('/api/tenant/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    tenantSlug: 'my-tenant',
    rememberMe: true // or false
  })
});
```

## Security Considerations

### 1. Token Security
- Access tokens remain short-lived (15 minutes) for security
- Refresh tokens are properly stored and validated
- Token revocation is implemented for logout

### 2. Session Management
- Sessions are properly tracked in the database
- Audit logs record "Remember Me" usage
- Proper cleanup on logout

### 3. Cookie Security
- Cookies use appropriate security flags
- Expiration times are properly set
- SameSite policy is enforced

## Troubleshooting

### Common Issues

1. **Users still getting logged out frequently**
   - Check if refresh token endpoint is working correctly
   - Verify token expiration times in environment variables
   - Check browser storage for token persistence

2. **"Remember Me" not working**
   - Verify the checkbox state is being passed to the API
   - Check if the `rememberMe` parameter is being processed correctly
   - Verify token generation is using the correct expiration time

3. **Multiple logout calls**
   - Check if the logout function is being called multiple times
   - Verify the loading state is preventing concurrent logout calls
   - Check for proper cleanup in the `clearAuth` function

### Information

Enable debug logging by setting `NODE_ENV=development` in your environment. This will provide detailed logs for:

- Token generation and expiration times
- Login attempts and "Remember Me" usage
- Token refresh operations
- Logout operations

## Future Enhancements

1. **Device Management**: Allow users to view and manage their active sessions
2. **Session Analytics**: Track session duration and usage patterns
3. **Advanced Security**: Implement device fingerprinting and suspicious activity detection
4. **Custom Session Duration**: Allow administrators to configure session durations per tenant

## Conclusion

The "Remember Me" functionality has been successfully implemented with proper security measures and comprehensive error handling. The solution addresses all the original issues while maintaining backward compatibility and providing a better user experience.

For any questions or issues, please refer to the test script and documentation provided in this implementation.
