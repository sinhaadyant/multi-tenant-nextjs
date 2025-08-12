# Clerk Redirect Setup Guide

## Issue
After social login, Clerk redirects to `/superadmin/login/create/sso-callback` instead of directly to the dashboard.

## Solution

### 1. Environment Variables
Add these to your `.env.local`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Clerk URLs - Important for redirects
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/superadmin/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/superadmin/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/

# Clerk Webhook
CLERK_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Clerk Dashboard Configuration

1. **Go to your Clerk Dashboard**
2. **Navigate to "Paths"**
3. **Set the following paths:**
   - Sign in: `/auth/sign-in`
   - Sign up: `/auth/sign-up`
   - After sign in: `/superadmin/dashboard`
   - After sign up: `/superadmin/dashboard`
   - After sign out: `/`

### 3. Social Provider Configuration

1. **Go to "User & Authentication" → "Social Connections"**
2. **Enable Google and Apple providers**
3. **Configure OAuth credentials for each provider**

### 4. Current Implementation

✅ **What's Working:**
- SSO callback page created at `/superadmin/login/create/sso-callback`
- Role-based redirects implemented
- Loading state during authentication

### 5. Testing

1. **Start your development server**
2. **Visit `/superadmin/login`**
3. **Click "Continue with Google" or "Continue with Apple"**
4. **Should redirect to `/superadmin/dashboard` after successful authentication**

### 6. Alternative Solution

If the redirect issue persists, you can also:

1. **Use the SSO callback page** (already implemented)
2. **Configure Clerk to use a custom domain** for better redirect handling
3. **Use Clerk's hosted pages** instead of custom pages

## Files Modified

- `src/app/superadmin/login/page.tsx` - Updated SignIn component
- `src/app/superadmin/login/create/sso-callback/page.tsx` - Created SSO callback handler

The SSO callback page will now properly handle the redirect and show a loading state while completing the authentication process.
