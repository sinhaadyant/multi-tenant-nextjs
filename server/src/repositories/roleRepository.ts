import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma';

export interface RoleFilters {
  tenantId?: string;
  isGlobal?: boolean;
  search?: string;
}

export interface RoleListParams {
  page?: number;
  limit?: number;
  filters?: RoleFilters;
  orderBy?: any;
}

export class RoleRepository extends BaseRepository<any> {
  override async findById(id: string): Promise<any> {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        tenant: true,
        userRoles: {
          include: {
            user: true,
          },
        },
        rolePermissions: {
          include: {
            module: true,
            submodule: true,
          },
        },
      },
    });
  }

  override async findMany(params: RoleListParams = {}): Promise<any[]> {
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

    if (filters.isGlobal !== undefined) {
      where.isGlobal = filters.isGlobal;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    return this.prisma.role.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        tenant: true,
        userRoles: {
          include: {
            user: true,
          },
        },
        rolePermissions: {
          include: {
            module: true,
            submodule: true,
          },
        },
      },
    });
  }

  override async create(data: any): Promise<any> {
    return this.prisma.role.create({
      data,
      include: {
        tenant: true,
        userRoles: {
          include: {
            user: true,
          },
        },
        rolePermissions: {
          include: {
            module: true,
            submodule: true,
          },
        },
      },
    });
  }

  override async update(id: string, data: any): Promise<any> {
    return this.prisma.role.update({
      where: { id },
      data,
      include: {
        tenant: true,
        userRoles: {
          include: {
            user: true,
          },
        },
        rolePermissions: {
          include: {
            module: true,
            submodule: true,
          },
        },
      },
    });
  }

  override async delete(id: string): Promise<any> {
    return this.prisma.role.delete({
      where: { id },
    });
  }

  override async count(filters: RoleFilters = {}): Promise<number> {
    const where: any = {};

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters.isGlobal !== undefined) {
      where.isGlobal = filters.isGlobal;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    return this.prisma.role.count({ where });
  }

  async getGlobalRoles(): Promise<any[]> {
    return this.prisma.role.findMany({
      where: { isGlobal: true },
      include: {
        userRoles: {
          include: {
            user: true,
          },
        },
        rolePermissions: {
          include: {
            module: true,
            submodule: true,
          },
        },
      },
    });
  }

  async getTenantRoles(tenantId: string): Promise<any[]> {
    return this.prisma.role.findMany({
      where: { tenantId },
      include: {
        tenant: true,
        userRoles: {
          include: {
            user: true,
          },
        },
        rolePermissions: {
          include: {
            module: true,
            submodule: true,
          },
        },
      },
    });
  }
}
