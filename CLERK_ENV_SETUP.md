# Clerk Environment Variables Setup

## Create `.env.local` file in your project root:

```env
# Clerk Authentication - Replace with your actual keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Clerk URLs - These control where users are redirected
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/superadmin/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/superadmin/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/

# Clerk Webhook (optional - for syncing user data)
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Steps to Fix Redirect Issue:

1. **Get your Clerk keys** from [clerk.com](https://clerk.com)
2. **Create `.env.local`** with the above variables
3. **Replace the placeholder values** with your actual Clerk keys
4. **Restart your development server**
5. **Test the social login flow**

## Alternative Solution:

If the redirect issue still persists, try this approach:

1. **Remove all redirect URLs** from the SignIn component
2. **Let Clerk handle redirects automatically** using environment variables only
3. **Use Clerk's hosted pages** instead of custom pages

The current implementation now uses a simpler approach that should work better with Clerk's default behavior.
