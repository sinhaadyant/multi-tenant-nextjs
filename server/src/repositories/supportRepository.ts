import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma';

export interface SupportTicketFilters {
  tenantId?: string;
  userId?: string;
  status?: string;
  search?: string;
}

export interface SupportTicketListParams {
  page?: number;
  limit?: number;
  filters?: SupportTicketFilters;
  orderBy?: any;
}

export class SupportRepository extends BaseRepository<any> {
  // Support Tickets
  async findTicketById(id: string): Promise<any> {
    return this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        tenant: true,
        user: true,
        replies: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
      },
    });
  }

  async findTickets(params: SupportTicketListParams = {}): Promise<any[]> {
    const {
      page = 1,
      limit = 10,
      filters = {},
      orderBy = { createdAt: 'desc' },
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    return this.prisma.supportTicket.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        tenant: true,
        user: true,
        replies: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
      },
    });
  }

  async createTicket(data: any): Promise<any> {
    return this.prisma.supportTicket.create({
      data,
      include: {
        tenant: true,
        user: true,
        replies: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
      },
    });
  }

  async updateTicket(id: string, data: any): Promise<any> {
    return this.prisma.supportTicket.update({
      where: { id },
      data,
      include: {
        tenant: true,
        user: true,
        replies: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
      },
    });
  }

  async deleteTicket(id: string): Promise<any> {
    return this.prisma.supportTicket.delete({
      where: { id },
    });
  }

  async countTickets(filters: SupportTicketFilters = {}): Promise<number> {
    const where: any = {};

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    return this.prisma.supportTicket.count({ where });
  }

  // Support Replies
  async findReplyById(id: string): Promise<any> {
    return this.prisma.supportReply.findUnique({
      where: { id },
      include: {
        ticket: true,
        user: true,
      },
    });
  }

  async findRepliesByTicketId(ticketId: string): Promise<any[]> {
    return this.prisma.supportReply.findMany({
      where: { ticketId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createReply(data: any): Promise<any> {
    return this.prisma.supportReply.create({
      data,
      include: {
        ticket: true,
        user: true,
      },
    });
  }

  async updateReply(id: string, data: any): Promise<any> {
    return this.prisma.supportReply.update({
      where: { id },
      data,
      include: {
        ticket: true,
        user: true,
      },
    });
  }

  async deleteReply(id: string): Promise<any> {
    return this.prisma.supportReply.delete({
      where: { id },
    });
  }

  // Support Attachments
  async findAttachmentById(id: string): Promise<any> {
    return this.prisma.supportAttachment.findUnique({
      where: { id },
      include: {
        ticket: true,
      },
    });
  }

  async findAttachmentsByTicketId(ticketId: string): Promise<any[]> {
    return this.prisma.supportAttachment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createAttachment(data: any): Promise<any> {
    return this.prisma.supportAttachment.create({
      data,
      include: {
        ticket: true,
      },
    });
  }

  async deleteAttachment(id: string): Promise<any> {
    return this.prisma.supportAttachment.delete({
      where: { id },
    });
  }

  // Statistics
  async getTicketStats(tenantId?: string) {
    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const [total, open, inProgress, resolved, closed] = await Promise.all([
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.count({ where: { ...where, status: 'open' } }),
      this.prisma.supportTicket.count({
        where: { ...where, status: 'in_progress' },
      }),
      this.prisma.supportTicket.count({
        where: { ...where, status: 'resolved' },
      }),
      this.prisma.supportTicket.count({
        where: { ...where, status: 'closed' },
      }),
    ]);

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
    };
  }
}
