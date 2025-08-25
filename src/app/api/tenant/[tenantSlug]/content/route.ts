import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';

export const GET = async (req: NextRequest, { params }: { params: { tenantSlug: string } }) => {
  try {
    const { tenantSlug } = await params;
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return createErrorResponse('Unauthorized', 401);
    }
    const token = auth.substring(7);
    const decoded = verifyAccessToken(token);

    // Example response
    return createSuccessResponse({ tenantSlug, user: decoded }, 'Content fetched');
  } catch (error: any) {
    return createErrorResponse(error.message || 'Failed', 500);
  }
};

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

    const decoded = await verifyAccessToken(token);
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
    const { type, title, content, excerpt, category, tags, seo, status, publishDate } = body;

    // Validate required fields
    if (!type || !title || !content) {
      return createErrorResponse('Missing required fields', 400);
    }

    let contentItem: any;

    switch (type) {
      case 'article':
        contentItem = await createArticle(tenant.id, user.id, body);
        break;
      case 'page':
        contentItem = await createPage(tenant.id, user.id, body);
        break;
      default:
        return createErrorResponse('Invalid content type', 400);
    }

    // Create audit log
    await createAuditLogFromRequest(
      req,
      { id: user.id, email: user.email, role: 'user' },
      'content.create',
      { 
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        contentType: type,
        contentId: contentItem.id,
        title
      }
    );

    return createSuccessResponse(contentItem, 'Content created successfully');

  } catch (error: any) {
    console.error('Error creating content:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
}

// Helper functions
async function getArticles(tenantId: string, page: number, limit: number, status: string, category: string, search: string) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    tenantId,
    type: 'article'
  };

  if (status) {
    where.status = status;
  }

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Get articles with pagination
  const [articles, totalArticles] = await Promise.all([
    prisma.content.findMany({
      where,
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        },
        versions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.content.count({ where })
  ]);

  return {
    articles: articles.map(article => ({
      id: article.id,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      category: article.category,
      tags: article.tags || [],
      status: article.status,
      seo: article.seo || {},
      publishDate: article.publishDate?.toISOString(),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      author: article.author ? {
        name: article.author.name,
        email: article.author.email
      } : null,
      version: article.versions[0]?.version || 1
    })),
    pagination: {
      page,
      limit,
      total: totalArticles,
      totalPages: Math.ceil(totalArticles / limit)
    }
  };
}

async function getPages(tenantId: string, page: number, limit: number, status: string, search: string) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    tenantId,
    type: 'page'
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Get pages with pagination
  const [pages, totalPages] = await Promise.all([
    prisma.content.findMany({
      where,
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.content.count({ where })
  ]);

  return {
    pages: pages.map(page => ({
      id: page.id,
      title: page.title,
      content: page.content,
      slug: page.slug,
      status: page.status,
      seo: page.seo || {},
      createdAt: page.createdAt.toISOString(),
      updatedAt: page.updatedAt.toISOString(),
      author: page.author ? {
        name: page.author.name,
        email: page.author.email
      } : null
    })),
    pagination: {
      page,
      limit,
      total: totalPages,
      totalPages: Math.ceil(totalPages / limit)
    }
  };
}

async function getMedia(tenantId: string, page: number, limit: number, search: string) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    tenantId
  };

  if (search) {
    where.OR = [
      { filename: { contains: search, mode: 'insensitive' } },
      { originalName: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Get media with pagination
  const [media, totalMedia] = await Promise.all([
    prisma.media.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.media.count({ where })
  ]);

  return {
    media: media.map(item => ({
      id: item.id,
      filename: item.filename,
      originalName: item.originalName,
      mimeType: item.mimeType,
      size: item.size,
      url: item.url,
      thumbnailUrl: item.thumbnailUrl,
      uploadedAt: item.uploadedAt.toISOString(),
      uploadedBy: item.uploadedBy ? {
        name: item.uploadedBy.name,
        email: item.uploadedBy.email
      } : null
    })),
    pagination: {
      page,
      limit,
      total: totalMedia,
      totalPages: Math.ceil(totalMedia / limit)
    }
  };
}

async function getContentCategories(tenantId: string) {
  const categories = await prisma.contentCategory.findMany({
    where: { 
      tenantId,
      isActive: true 
    },
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

async function getDrafts(tenantId: string, userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [drafts, totalDrafts] = await Promise.all([
    prisma.content.findMany({
      where: {
        tenantId,
        status: 'draft',
        authorId: userId
      },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.content.count({
      where: {
        tenantId,
        status: 'draft',
        authorId: userId
      }
    })
  ]);

  return {
    drafts: drafts.map(draft => ({
      id: draft.id,
      title: draft.title,
      type: draft.type,
      category: draft.category,
      updatedAt: draft.updatedAt.toISOString(),
      author: draft.author ? {
        name: draft.author.name,
        email: draft.author.email
      } : null
    })),
    pagination: {
      page,
      limit,
      total: totalDrafts,
      totalPages: Math.ceil(totalDrafts / limit)
    }
  };
}

async function createArticle(tenantId: string, userId: string, data: any) {
  const { title, content, excerpt, category, tags, seo, status, publishDate } = data;

  // Generate slug from title
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const article = await prisma.content.create({
    data: {
      title,
      content,
      excerpt,
      category,
      tags: tags || [],
      seo: seo || {},
      status: status || 'draft',
      type: 'article',
      slug,
      publishDate: publishDate ? new Date(publishDate) : null,
      tenantId,
      authorId: userId
    },
    include: {
      author: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  // Create initial version
  await prisma.contentVersion.create({
    data: {
      contentId: article.id,
      version: 1,
      title,
      content,
      excerpt,
      category,
      tags: tags || [],
      seo: seo || {},
      createdBy: userId
    }
  });

  return {
    id: article.id,
    title: article.title,
    content: article.content,
    excerpt: article.excerpt,
    category: article.category,
    tags: article.tags,
    status: article.status,
    seo: article.seo,
    slug: article.slug,
    publishDate: article.publishDate?.toISOString(),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    author: article.author ? {
      name: article.author.name,
      email: article.author.email
    } : null
  };
}

async function createPage(tenantId: string, userId: string, data: any) {
  const { title, content, slug, seo, status } = data;

  // Generate slug if not provided
  const pageSlug = slug || title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const page = await prisma.content.create({
    data: {
      title,
      content,
      seo: seo || {},
      status: status || 'draft',
      type: 'page',
      slug: pageSlug,
      tenantId,
      authorId: userId
    },
    include: {
      author: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  return {
    id: page.id,
    title: page.title,
    content: page.content,
    slug: page.slug,
    status: page.status,
    seo: page.seo,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    author: page.author ? {
      name: page.author.name,
      email: page.author.email
    } : null
  };
} 