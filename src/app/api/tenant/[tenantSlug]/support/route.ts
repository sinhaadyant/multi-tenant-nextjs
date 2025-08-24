import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { requireTenantAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { z } from 'zod';
import { notifySuperAdmin } from '@/lib/supportNotificationHelper';

// Validation schemas
const supportTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description must be less than 5000 characters'),
  category: z.enum(['general', 'technical', 'billing', 'feature-request', 'bug-report']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  attachments: z.array(z.object({
    filename: z.string(),
    originalName: z.string(),
    mimeType: z.string(),
    size: z.number().max(10 * 1024 * 1024), // 10MB max
    path: z.string()
  })).optional().default([])
});

const supportFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(['open', 'pending', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.enum(['general', 'technical', 'billing', 'feature-request', 'bug-report']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'status', 'priority']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  userId: z.string().optional()
});

export const GET = asyncHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
  
  if (!tenantSlug) {
    return createErrorResponse('Tenant slug is required', 400);
  }

  // Authenticate user and verify tenant access
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  const user = authResult as any;
  
  // Get tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true, slug: true, isActive: true }
  });

  if (!tenant) {
    return createErrorResponse('Tenant not found', 404);
  }

  if (!tenant.isActive) {
    return createErrorResponse('Tenant is inactive', 403);
  }

  // Verify user belongs to this tenant
  if (user.tenantId !== tenant.id) {
    return createErrorResponse('Access denied', 403);
  }

  // Parse and validate query parameters
  const filters = supportFiltersSchema.parse(Object.fromEntries(searchParams));
  
  // Build where clause
  const where: any = {
    tenantId: tenant.id,
  };

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.category) where.category = filters.category;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters.userId) where.userId = filters.userId;

  // Check if user has permission to view all tickets or only their own
  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: {
      role: {
        include: {
          permissions: {
            where: { moduleKey: 'support' }
          }
        }
      }
    }
  });

  const hasViewAllPermission = userRoles.some(userRole => 
    userRole.role.permissions.some(permission => permission.canViewAll)
  );

  // If user doesn't have viewAll permission, only show their own tickets
  if (!hasViewAllPermission) {
    where.userId = user.id;
  }

  const skip = (filters.page - 1) * filters.limit;

  // Get tickets with related data
  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
        attachments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        [filters.sortBy]: filters.sortOrder,
      },
      skip,
      take: filters.limit,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  // Transform data to include counts
  const ticketsWithCounts = tickets.map(ticket => ({
    ...ticket,
    _count: {
      comments: ticket.comments.length,
      attachments: ticket.attachments.length,
    },
    comments: undefined,
    attachments: undefined,
  }));

  const totalPages = Math.ceil(total / filters.limit);

  // Create audit log
  await createAuditLogFromRequest(
    req,
    { id: user.id, email: user.email, role: 'user' },
    'support.view',
    { 
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      filters: Object.keys(filters).filter(key => filters[key as keyof typeof filters])
    }
  );

  return createSuccessResponse({
    tickets: ticketsWithCounts,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      totalCount: total,
      totalPages,
      hasNextPage: filters.page < totalPages,
      hasPrevPage: filters.page > 1,
    }
  }, 'Support tickets retrieved successfully');
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
  
  if (!tenantSlug) {
    return createErrorResponse('Tenant slug is required', 400);
  }

  // Authenticate user and verify tenant access
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  const user = authResult as any;
  
  // Get tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true, slug: true, isActive: true }
  });

  if (!tenant) {
    return createErrorResponse('Tenant not found', 404);
  }

  if (!tenant.isActive) {
    return createErrorResponse('Tenant is inactive', 403);
  }

  // Verify user belongs to this tenant
  if (user.tenantId !== tenant.id) {
    return createErrorResponse('Access denied', 403);
  }

  // Check if user has permission to create support tickets
  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: {
      role: {
        include: {
          permissions: {
            where: { moduleKey: 'support' }
          }
        }
      }
    }
  });

  const hasCreatePermission = userRoles.some(userRole => 
    userRole.role.permissions.some(permission => permission.canCreate)
  );

  if (!hasCreatePermission) {
    return createErrorResponse('You do not have permission to create support tickets', 403);
  }

  const body = await req.json();
  
  // Validate request body
  const validationResult = supportTicketSchema.safeParse(body);
  if (!validationResult.success) {
    return createErrorResponse(
      'Validation failed',
      400,
      validationResult.error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }))
    );
  }

  const { title, description, category, priority, attachments } = validationResult.data;

  // Create support ticket
  const ticket = await prisma.supportTicket.create({
    data: {
      title,
      description,
      category,
      priority,
      status: 'open',
      tenantId: tenant.id,
      userId: user.id,
      attachments: {
        create: attachments.map(attachment => ({
          filename: attachment.filename,
          originalName: attachment.originalName,
          mimeType: attachment.mimeType,
          size: attachment.size,
          path: attachment.path
        }))
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      attachments: true,
    },
  });

  // Create audit log
  await createAuditLogFromRequest(
    req,
    { id: user.id, email: user.email, role: 'user' },
    'support.ticket.create',
    { 
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      ticketId: ticket.id,
      category,
      priority
    }
  );

  // Create notification for superadmin
  await notifySuperAdmin(
    ticket.id,
    ticket.title,
    user.id,
    user.email,
    user.name,
    tenant.id,
    tenant.slug,
    'created',
    `New support ticket "${title}" created by ${user.name}`
  );

  return createSuccessResponse({
    ticket
  }, 'Support ticket created successfully', 201);
});

// Helper functions for other resource types
async function getSupportCategories() {
  return [
    { key: 'general', label: 'General', description: 'General inquiries and questions' },
    { key: 'technical', label: 'Technical', description: 'Technical issues and problems' },
    { key: 'billing', label: 'Billing', description: 'Billing and payment questions' },
    { key: 'feature-request', label: 'Feature Request', description: 'Request new features' },
    { key: 'bug-report', label: 'Bug Report', description: 'Report bugs and issues' }
  ];
}

async function getKnowledgeBase(tenantId: string, search?: string) {
  // Placeholder for knowledge base implementation
  return {
    articles: [],
    categories: []
  };
}

async function getFAQ(tenantId: string, search?: string) {
  // Placeholder for FAQ implementation
  return {
    questions: [],
    categories: []
  };
} 