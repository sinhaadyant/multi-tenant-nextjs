// PrismaClient is imported in base repository
import { BaseRepository } from './prisma';

export interface UserFilters {
  tenantId?: string;
  isActive?: boolean;
  isSuperadmin?: boolean;
  search?: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  filters?: UserFilters;
  orderBy?: any;
}

export class UserRepository extends BaseRepository<any> {
  override async findById(id: string): Promise<any | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<any | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  override async findMany(params: UserListParams = {}): Promise<any[]> {
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

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isSuperadmin !== undefined) {
      where.isSuperadmin = filters.isSuperadmin;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  override async create(data: any): Promise<any> {
    return this.prisma.user.create({
      data,
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  override async update(id: string, data: any): Promise<any> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async softDelete(id: string): Promise<any> {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  override async delete(id: string): Promise<any> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  override async count(filters: UserFilters = {}): Promise<number> {
    const where: any = {};

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isSuperadmin !== undefined) {
      where.isSuperadmin = filters.isSuperadmin;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } },
      ];
    }

    return this.prisma.user.count({ where });
  }

  async updateLastLogin(id: string): Promise<any> {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  }

  async getUserRoles(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    });
  }
}
