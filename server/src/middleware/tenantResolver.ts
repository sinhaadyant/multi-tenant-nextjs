import { Request, Response, NextFunction } from 'express';
import { TenantService } from '@/services/tenantService';
import { NotFoundError, BadRequestError } from '@/utils/errors';

// Extend Express Request interface to include tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: any;
    }
  }
}

const tenantService = new TenantService();

export interface TenantResolverOptions {
  required?: boolean;
  allowSuperadmin?: boolean;
  resolveFromToken?: boolean;
  resolveFromHeader?: boolean;
  resolveFromSubdomain?: boolean;
}

export const tenantResolver = (options: TenantResolverOptions = {}) => {
  const {
    required = false,
    allowSuperadmin = true,
    resolveFromToken = true,
    resolveFromHeader = true,
    resolveFromSubdomain = true,
  } = options;

  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      let tenant = null;
      let resolvedFrom = '';

      // 1. Resolve from JWT token (if user is authenticated)
      if (resolveFromToken && req.user) {
        if (req.user.tenantId) {
          try {
            tenant = await tenantService.getTenantById(req.user.tenantId);
            resolvedFrom = 'token';
          } catch (error) {
            // Token has tenantId but tenant doesn't exist
            throw new BadRequestError('Invalid tenant in token');
          }
        }
      }

      // 2. Resolve from X-Tenant header
      if (!tenant && resolveFromHeader) {
        const tenantHeader = req.headers['x-tenant'] as string;
        if (tenantHeader) {
          try {
            tenant = await tenantService.getTenantBySlug(tenantHeader);
            resolvedFrom = 'header';
          } catch (error) {
            throw new NotFoundError('Tenant not found');
          }
        }
      }

      // 3. Resolve from subdomain
      if (!tenant && resolveFromSubdomain) {
        const hostname = req.hostname;
        const subdomain = extractSubdomain(hostname);

        if (subdomain) {
          try {
            tenant = await tenantService.getTenantBySlug(subdomain);
            resolvedFrom = 'subdomain';
          } catch (error) {
            // Don't throw error for subdomain resolution as it might be a public route
            console.warn(`Tenant not found for subdomain: ${subdomain}`);
          }
        }
      }

      // 4. Check if tenant is required
      if (required && !tenant) {
        throw new BadRequestError('Tenant context is required');
      }

      // 5. Validate tenant is active
      if (tenant && !tenant.isActive) {
        throw new BadRequestError('Tenant is inactive');
      }

      // 6. Check superadmin access
      if (tenant && req.user && req.user.isSuperadmin && !allowSuperadmin) {
        throw new BadRequestError(
          'Superadmin access not allowed for this endpoint'
        );
      }

      // 7. Attach tenant to request
      req.tenant = tenant;

      // 8. Log tenant resolution for debugging
      if (tenant) {
        console.log(`Tenant resolved: ${tenant.name} (${resolvedFrom})`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Helper function to extract subdomain from hostname
const extractSubdomain = (hostname: string): string | null => {
  // Remove port if present
  const cleanHostname = hostname.split(':')[0];

  if (!cleanHostname) {
    return null;
  }

  // Split by dots
  const parts = cleanHostname.split('.');

  // If we have at least 3 parts (subdomain.domain.tld) or 2 parts in development
  if (parts.length >= 2) {
    const subdomain = parts[0];

    if (!subdomain) {
      return null;
    }

    // Skip common subdomains that aren't tenant-specific
    const skipSubdomains = ['www', 'api', 'admin', 'app', 'portal'];
    if (!skipSubdomains.includes(subdomain.toLowerCase())) {
      return subdomain;
    }
  }

  return null;
};

// Convenience middleware for required tenant
export const requireTenant = tenantResolver({ required: true });

// Convenience middleware for optional tenant
export const optionalTenant = tenantResolver({ required: false });

// Convenience middleware for tenant-only (no superadmin)
export const tenantOnly = tenantResolver({
  required: true,
  allowSuperadmin: false,
});
