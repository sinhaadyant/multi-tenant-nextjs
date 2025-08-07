import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';

export interface SearchResult {
  id: string;
  type: 'user' | 'tenant' | 'superadmin' | 'support_ticket' | 'audit_log';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  icon: string;
  metadata?: Record<string, any>;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type'); // Optional filter by type

    if (!query.trim()) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const searchTerm = query.trim();
    const results: SearchResult[] = [];

    // Search Users
    if (!type || type === 'user') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        include: {
          tenant: {
            select: { name: true, slug: true },
          },
          role: {
            select: { name: true },
          },
        },
        take: limit,
      });

      users.forEach((user) => {
        results.push({
          id: user.id,
          type: 'user',
          title: user.name,
          subtitle: user.email,
          description: `${user.role?.name || 'No Role'} • ${user.tenant?.name || 'No Tenant'}`,
          url: `/superadmin/users/${user.id}`,
          icon: '🧑‍💼',
          metadata: {
            tenant: user.tenant?.name,
            role: user.role?.name,
            isActive: user.isActive,
          },
        });
      });
    }

    // Search Tenants
    if (!type || type === 'tenant') {
      const tenants = await prisma.tenant.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { slug: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: limit,
      });

      tenants.forEach((tenant) => {
        results.push({
          id: tenant.id,
          type: 'tenant',
          title: tenant.name,
          subtitle: tenant.slug,
          description: `${tenant.plan} Plan • ${tenant.region}`,
          url: `/superadmin/tenants/${tenant.id}`,
          icon: '🏢',
          metadata: {
            plan: tenant.plan,
            region: tenant.region,
            status: tenant.isActive ? 'Active' : 'Inactive',
          },
        });
      });
    }

    // Search Support Tickets
    if (!type || type === 'support_ticket') {
      const tickets = await prisma.supportTicket.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        include: {
          tenant: {
            select: { name: true },
          },
          user: {
            select: { name: true },
          },
        },
        take: limit,
      });

      tickets.forEach((ticket) => {
        results.push({
          id: ticket.id,
          type: 'support_ticket',
          title: ticket.title,
          subtitle: `#${ticket.id.slice(-8)}`,
          description: `${ticket.status} • ${ticket.priority} • ${ticket.tenant?.name || ticket.user?.name || 'Unknown'}`,
          url: `/superadmin/support/${ticket.id}`,
          icon: '🎫',
          metadata: {
            status: ticket.status,
            priority: ticket.priority,
            category: ticket.category,
            isForwarded: ticket.isForwarded,
          },
        });
      });
    }

    // Search Audit Logs
    if (!type || type === 'audit_log') {
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          OR: [
            { action: { contains: searchTerm, mode: 'insensitive' } },
            { details: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        include: {
          user: {
            select: { name: true },
          },
          tenant: {
            select: { name: true },
          },
          superAdmin: {
            select: { name: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      auditLogs.forEach((log) => {
        const actor = log.user?.name || log.tenant?.name || log.superAdmin?.name || 'System';
        results.push({
          id: log.id,
          type: 'audit_log',
          title: log.action,
          subtitle: actor,
          description: log.details ? log.details.substring(0, 100) + '...' : 'No details',
          url: `/superadmin/audit/${log.id}`,
          icon: '📋',
          metadata: {
            actor,
            ipAddress: log.ipAddress,
            createdAt: log.createdAt,
          },
        });
      });
    }

    // Sort results by relevance (exact matches first, then partial matches)
    const sortedResults = results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchTerm.toLowerCase() || 
                    a.subtitle?.toLowerCase() === searchTerm.toLowerCase();
      const bExact = b.title.toLowerCase() === searchTerm.toLowerCase() || 
                    b.subtitle?.toLowerCase() === searchTerm.toLowerCase();
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Then sort by type priority
      const typePriority = { user: 1, tenant: 2, support_ticket: 3, audit_log: 4 };
      return (typePriority[a.type] || 5) - (typePriority[b.type] || 5);
    });

    return NextResponse.json({
      results: sortedResults.slice(0, limit),
      total: sortedResults.length,
      query: searchTerm,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', results: [], total: 0 },
      { status: 500 }
    );
  }
} 