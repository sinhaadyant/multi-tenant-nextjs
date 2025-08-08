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

  // Handle tenant-specific routes
  if (pathname.startsWith('/[') || pathname.match(/^\/[^\/]+$/)) {
    const tenantSlug = pathname.slice(1); // Remove leading slash
    
    // Skip if it's a known non-tenant route
    if (['superadmin', 'login', 'register', 'forgot-password'].includes(tenantSlug)) {
      return NextResponse.next();
    }

    try {
      // Check cache first
      const cachedTenant = tenantCache.get(tenantSlug);
      if (cachedTenant && Date.now() - parseInt(cachedTenant.id) < CACHE_TTL) {
        if (!cachedTenant.isActive) {
          return NextResponse.redirect(new URL('/404', request.url));
        }
        return NextResponse.next();
      }

      // Query database for tenant
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true, isActive: true }
      });

      if (!tenant) {
        return NextResponse.redirect(new URL('/404', request.url));
      }

      // Cache the result
      tenantCache.set(tenantSlug, {
        id: Date.now().toString(),
        isActive: tenant.isActive
      });

      if (!tenant.isActive) {
        return NextResponse.redirect(new URL('/404', request.url));
      }

      // Add tenant info to headers for use in components
      const response = NextResponse.next();
      response.headers.set('x-tenant-id', tenant.id);
      response.headers.set('x-tenant-slug', tenantSlug);
      
      return response;
    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.redirect(new URL('/500', request.url));
    }
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