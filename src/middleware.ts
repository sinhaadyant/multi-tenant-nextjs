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

  // Handle superadmin routes with authentication check
  if (pathname.startsWith('/superadmin')) {
    const token = request.cookies.get('superadmin_token')?.value;
    
    // Allow access to auth pages without token
    const authPages = ['/superadmin/login', '/superadmin/signup', '/superadmin/forgot-password', '/superadmin/reset-password'];
    
    if (!token && !authPages.includes(pathname)) {
      return NextResponse.redirect(new URL('/superadmin/login', request.url));
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