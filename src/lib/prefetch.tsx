import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import React from 'react';

// Prefetch configuration
const PREFETCH_CONFIG = {
  // Routes that should be prefetched on hover
  hoverPrefetch: [
    '/superadmin/dashboard',
    '/superadmin/tenants',
    '/superadmin/users',
    '/superadmin/roles',
    '/superadmin/audit',
    '/superadmin/reports',
    '/superadmin/settings',
  ],
  
  // Routes that should be prefetched immediately
  immediatePrefetch: [
    '/superadmin/login',
    '/superadmin/profile',
  ],
  
  // Routes that should be prefetched on viewport entry
  viewportPrefetch: [
    '/superadmin/notifications',
    '/superadmin/support',
  ],
};

// Prefetch a specific route
export const prefetchRoute = (href: string) => {
  if (typeof window !== 'undefined') {
    // Use Next.js router prefetch if available
    const router = (window as any).__NEXT_ROUTER_BASEPATH;
    if (router) {
      router.prefetch(href);
    } else {
      // Fallback: create a link element and trigger prefetch
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }
  }
};

// Hook for prefetching routes on hover
export const usePrefetchOnHover = (href: string) => {
  const router = useRouter();
  
  const handleMouseEnter = useCallback(() => {
    router.prefetch(href);
  }, [router, href]);

  return { onMouseEnter: handleMouseEnter };
};

// Hook for prefetching routes on viewport entry
export const usePrefetchOnViewport = (href: string, options: { threshold?: number; rootMargin?: string } = {}) => {
  const router = useRouter();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            router.prefetch(href);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '50px',
      }
    );

    const element = document.querySelector(`[data-prefetch="${href}"]`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [router, href, options.threshold, options.rootMargin]);
};

// Component for prefetching routes
export const PrefetchLink = ({ 
  href, 
  children, 
  className, 
  prefetchType = 'hover' 
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetchType?: 'hover' | 'viewport' | 'immediate';
}) => {
  const router = useRouter();
  
  useEffect(() => {
    if (prefetchType === 'immediate') {
      router.prefetch(href);
    }
  }, [router, href, prefetchType]);

  const hoverProps = prefetchType === 'hover' ? usePrefetchOnHover(href) : {};
  const viewportProps = prefetchType === 'viewport' ? { 'data-prefetch': href } : {};

  return (
    <a
      href={href}
      className={className}
      {...hoverProps}
      {...viewportProps}
    >
      {children}
    </a>
  );
};

// Initialize prefetching for important routes
export const initializePrefetching = () => {
  if (typeof window === 'undefined') return;

  // Prefetch immediate routes
  PREFETCH_CONFIG.immediatePrefetch.forEach(route => {
    prefetchRoute(route);
  });

  // Set up viewport prefetching
  PREFETCH_CONFIG.viewportPrefetch.forEach(route => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetchRoute(route);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    // Create invisible elements for viewport detection
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.top = '0';
    element.style.left = '0';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.pointerEvents = 'none';
    element.setAttribute('data-prefetch', route);
    document.body.appendChild(element);
    
    observer.observe(element);
  });
};

// Prefetch tenant-specific routes
export const prefetchTenantRoutes = (tenantSlug: string) => {
  const tenantRoutes = [
    `/${tenantSlug}/dashboard`,
    `/${tenantSlug}/profile`,
    `/${tenantSlug}/users`,
    `/${tenantSlug}/settings`,
  ];

  tenantRoutes.forEach(route => {
    prefetchRoute(route);
  });
};

// Prefetch based on user role
export const prefetchRoleBasedRoutes = (role: string) => {
  const roleRoutes = {
    superadmin: [
      '/superadmin/dashboard',
      '/superadmin/tenants',
      '/superadmin/users',
      '/superadmin/audit',
    ],
    admin: [
      '/admin/dashboard',
      '/admin/users',
      '/admin/settings',
    ],
    user: [
      '/dashboard',
      '/profile',
      '/settings',
    ],
  };

  const routes = roleRoutes[role as keyof typeof roleRoutes] || [];
  routes.forEach(route => {
    prefetchRoute(route);
  });
};

// Prefetch critical resources
export const prefetchCriticalResources = () => {
  const criticalResources = [
    '/api/superadmin/dashboard',
    '/api/superadmin/tenants',
    '/api/superadmin/users',
  ];

  criticalResources.forEach(resource => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      link.as = 'fetch';
      document.head.appendChild(link);
    }
  });
};

// Auto-initialize prefetching when the module is loaded
if (typeof window !== 'undefined') {
  // Initialize after a short delay to avoid blocking initial render
  setTimeout(() => {
    initializePrefetching();
  }, 1000);
} 