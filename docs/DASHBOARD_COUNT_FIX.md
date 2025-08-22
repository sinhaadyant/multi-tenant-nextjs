# Dashboard Count Fix

## Issue
The tenant dashboard was showing counts as 0 even when there was data available. This was caused by two main issues:

1. **API returning undefined values**: The dashboard stats API was returning `undefined` values when users didn't have specific permissions, but the frontend expected numbers.

2. **Expired JWT tokens**: The JWT access tokens were expiring, causing authentication failures that prevented the dashboard from loading data.

## Fixes Applied

### 1. Fixed API Response Values
**File**: `src/app/api/tenant/[tenantSlug]/dashboard/stats/route.ts`

**Problem**: The API was returning `undefined` for counts when users lacked permissions:
```typescript
totalUsers: totalUsers !== null ? totalUsers : undefined,
```

**Solution**: Changed to return `0` instead of `undefined`:
```typescript
totalUsers: totalUsers !== null ? totalUsers : 0,
```

This ensures the frontend always receives valid numbers, even when the user doesn't have permission to view specific data.

### 2. Improved Token Refresh Logic
**File**: `src/lib/api.ts`

**Problem**: The token refresh mechanism wasn't properly handling expired refresh tokens.

**Solution**: Added check for expired refresh tokens:
```typescript
// Check if refresh token is also expired
if (isTokenExpired(refreshToken)) {
  if (process.env.NODE_ENV === 'development') {
    console.log('❌ Refresh token is also expired');
  }
  throw new Error('Refresh token expired');
}
```

### 3. Enhanced Error Handling
**File**: `src/components/tenant/TenantDashboardClient.tsx`

**Improvements**:
- Better authentication error detection
- Improved refresh error handling
- Added development tools for token debugging
- Added clear tokens functionality for development

### 4. Added Token Clearing Script
**File**: `scripts/clear-expired-tokens.js`

A utility script that can be run in the browser console to clear all expired tokens and force a re-login.

## How to Use

### For Users
1. If you see counts as 0, try refreshing the dashboard
2. If the issue persists, log out and log back in
3. In development mode, use the "Clear Tokens" button to force a re-login

### For Developers
1. Use the "Debug Token" button to check token status
2. Use the "Clear Tokens" button to force a re-login
3. Run the token clearing script in browser console if needed

### Manual Token Clearing
If you need to manually clear tokens, run this in the browser console:
```javascript
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

## Testing
To test the fix:
1. Log in to a tenant dashboard
2. Verify that counts are showing correctly
3. Check browser console for any authentication errors
4. Test the refresh functionality

## Prevention
To prevent this issue in the future:
1. Monitor token expiration times
2. Implement proactive token refresh
3. Add better error logging for authentication issues
4. Consider implementing a "Remember Me" feature for longer sessions
