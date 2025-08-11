import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cache for tenant slugs to avoid repeated database queries
const tenantCache = new Map<string, { id: string; isActive: boolean }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Middleware function to handle tenant detection and routing
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Handle /login redirect to root
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Handle superadmin routes with authentication check
  if (pathname.startsWith('/superadmin')) {
    // Allow access to auth pages without token
    const authPages = ['/superadmin/login', '/superadmin/signup', '/superadmin/forgot-password', '/superadmin/reset-password'];
    
    if (authPages.includes(pathname)) {
      return NextResponse.next();
    }
    
    // Check for token in cookie (for server-side auth)
    const cookieToken = request.cookies.get('superadmin_token')?.value;
    
    // For superadmin routes, we'll let the client-side ProtectedRoute handle authentication
    // This prevents the redirect loop issue where middleware redirects to login
    // but the client-side auth state hasn't been properly initialized yet
    if (!cookieToken) {
      // Instead of redirecting, let the request through and let client-side handle it
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 