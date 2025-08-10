import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
    
    if (!tenantSlug) {
      return createErrorResponse('Tenant slug is required', 400);
    }

    // Verify authentication token
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return createErrorResponse('No authentication token found', 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return createErrorResponse('Invalid authentication token', 401);
    }

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
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: tenant.id,
        isActive: true
      }
    });

    if (!user) {
      return createErrorResponse('User not found or not authorized for this tenant', 404);
    }

    // Parse query parameters
    const resourceType = searchParams.get('type') || 'tickets';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const category = searchParams.get('category') || '';

    let data: any = {};

    switch (resourceType) {
      case 'tickets':
        data = await getSupportTickets(tenant.id, user.id, page, limit, status, priority, category);
        break;
      case 'knowledge-base':
        data = await getKnowledgeBase(tenant.id, searchParams.get('search') || '');
        break;
      case 'faq':
        data = await getFAQ(tenant.id, searchParams.get('search') || '');
        break;
      case 'categories':
        data = await getSupportCategories();
        break;
      default:
        return createErrorResponse('Invalid resource type', 400);
    }

    // Create audit log
    await createAuditLogFromRequest(
      req,
      { id: user.id, email: user.email, role: 'user' },
      'support.view',
      { 
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        resourceType
      }
    );

    return createSuccessResponse(data, 'Support data retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching support data:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
    
    if (!tenantSlug) {
      return createErrorResponse('Tenant slug is required', 400);
    }

    // Verify authentication token
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return createErrorResponse('No authentication token found', 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return createErrorResponse('Invalid authentication token', 401);
    }

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
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: tenant.id,
        isActive: true
      }
    });

    if (!user) {
      return createErrorResponse('User not found or not authorized for this tenant', 404);
    }

    const body = await req.json();
    const { title, description, category, priority, attachments } = body;

    // Validate required fields
    if (!title || !description || !category) {
      return createErrorResponse('Missing required fields', 400);
    }

    // Create support ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        title,
        description,
        category,
        priority: priority || 'medium',
        status: 'open',
        tenantId: tenant.id,
        createdBy: user.id,
        assignedTo: null,
        attachments: attachments || []
      },
      include: {
        createdByUser: {
          select: {
            name: true,
            email: true
          }
        },
        assignedToUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
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

    return createSuccessResponse(ticket, 'Support ticket created successfully');

  } catch (error: any) {
    console.error('Error creating support ticket:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
}

// Helper functions
async function getSupportTickets(tenantId: string, userId: string, page: number, limit: number, status: string, priority: string, category: string) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    tenantId
  };

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (category) {
    where.category = category;
  }

  // Get tickets with pagination
  const [tickets, totalTickets] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        createdByUser: {
          select: {
            name: true,
            email: true
          }
        },
        assignedToUser: {
          select: {
            name: true,
            email: true
          }
        },
        messages: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.supportTicket.count({ where })
  ]);

  // Get ticket statistics
  const stats = await prisma.supportTicket.groupBy({
    by: ['status'],
    where: { tenantId },
    _count: {
      id: true
    }
  });

  return {
    tickets: tickets.map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      createdBy: ticket.createdByUser ? {
        name: ticket.createdByUser.name,
        email: ticket.createdByUser.email
      } : null,
      assignedTo: ticket.assignedToUser ? {
        name: ticket.assignedToUser.name,
        email: ticket.assignedToUser.email
      } : null,
      messageCount: ticket.messages.length,
      lastMessage: ticket.messages.length > 0 ? {
        content: ticket.messages[ticket.messages.length - 1].content,
        createdAt: ticket.messages[ticket.messages.length - 1].createdAt.toISOString(),
        user: ticket.messages[ticket.messages.length - 1].user ? {
          name: ticket.messages[ticket.messages.length - 1].user.name,
          email: ticket.messages[ticket.messages.length - 1].user.email
        } : null
      } : null
    })),
    pagination: {
      page,
      limit,
      total: totalTickets,
      totalPages: Math.ceil(totalTickets / limit)
    },
    stats: stats.map(stat => ({
      status: stat.status,
      count: stat._count.id
    }))
  };
}

async function getKnowledgeBase(tenantId: string, search: string) {
  const where: any = {
    isActive: true
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } }
    ];
  }

  const articles = await prisma.knowledgeBaseArticle.findMany({
    where,
    include: {
      category: {
        select: {
          name: true,
          description: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  return {
    articles: articles.map(article => ({
      id: article.id,
      title: article.title,
      content: article.content,
      category: article.category?.name || 'General',
      tags: article.tags || [],
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString()
    }))
  };
}

async function getFAQ(tenantId: string, search: string) {
  const where: any = {
    isActive: true
  };

  if (search) {
    where.OR = [
      { question: { contains: search, mode: 'insensitive' } },
      { answer: { contains: search, mode: 'insensitive' } }
    ];
  }

  const faqs = await prisma.faq.findMany({
    where,
    include: {
      category: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      orderIndex: 'asc'
    }
  });

  return {
    faqs: faqs.map(faq => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category?.name || 'General',
      orderIndex: faq.orderIndex
    }))
  };
}

async function getSupportCategories() {
  const categories = await prisma.supportCategory.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' }
  });

  return {
    categories: categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      orderIndex: category.orderIndex
    }))
  };
} 