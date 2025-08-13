// PrismaClient is imported in base repository
import { BaseRepository } from './prisma';

export interface TenantFilters {
  isActive?: boolean;
  search?: string;
}

export interface TenantListParams {
  page?: number;
  limit?: number;
  filters?: TenantFilters;
  orderBy?: any;
}

export class TenantRepository extends BaseRepository<any> {
  override async findById(id: string): Promise<any> {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
        roles: true,
      },
    });
  }

  async findByDomain(domain: string): Promise<any> {
    return this.prisma.tenant.findUnique({
      where: { domain },
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
        roles: true,
      },
    });
  }

  override async findMany(params: TenantListParams = {}): Promise<any[]> {
    const {
      page = 1,
      limit = 10,
      filters = {},
      orderBy = { createdAt: 'desc' },
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { domain: { contains: filters.search } },
      ];
    }

    return this.prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
        roles: true,
      },
    });
  }

  override async create(data: any): Promise<any> {
    return this.prisma.tenant.create({
      data,
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
        roles: true,
      },
    });
  }

  override async update(id: string, data: any): Promise<any> {
    return this.prisma.tenant.update({
      where: { id },
      data,
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
        roles: true,
      },
    });
  }

  override async delete(id: string): Promise<any> {
    return this.prisma.tenant.delete({
      where: { id },
    });
  }

  override async count(filters: TenantFilters = {}): Promise<number> {
    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { domain: { contains: filters.search } },
      ];
    }

    return this.prisma.tenant.count({ where });
  }

  async getTenantWithUsers(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          where: { isActive: true },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
        roles: true,
      },
    });
  }

  async getTenantStats(id: string) {
    const [userCount, roleCount] = await Promise.all([
      this.prisma.user.count({
        where: { tenantId: id, isActive: true },
      }),
      this.prisma.role.count({
        where: { tenantId: id },
      }),
    ]);

    return {
      userCount,
      roleCount,
    };
  }
}
