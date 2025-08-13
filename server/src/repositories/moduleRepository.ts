import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma';

export interface ModuleFilters {
  isActive?: boolean;
  search?: string;
}

export interface ModuleListParams {
  page?: number;
  limit?: number;
  filters?: ModuleFilters;
  orderBy?: any;
}

export class ModuleRepository extends BaseRepository<any> {
  override async findById(id: string): Promise<any> {
    return this.prisma.module.findUnique({
      where: { id },
      include: {
        submodules: {
          orderBy: { orderIndex: 'asc' },
        },
        rolePermissions: {
          include: {
            role: true,
            submodule: true,
          },
        },
      },
    });
  }

  override async findMany(params: ModuleListParams = {}): Promise<any[]> {
    const {
      page = 1,
      limit = 10,
      filters = {},
      orderBy = { orderIndex: 'asc' },
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    return this.prisma.module.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        submodules: {
          orderBy: { orderIndex: 'asc' },
        },
        rolePermissions: {
          include: {
            role: true,
            submodule: true,
          },
        },
      },
    });
  }

  override async create(data: any): Promise<any> {
    return this.prisma.module.create({
      data,
      include: {
        submodules: {
          orderBy: { orderIndex: 'asc' },
        },
        rolePermissions: {
          include: {
            role: true,
            submodule: true,
          },
        },
      },
    });
  }

  override async update(id: string, data: any): Promise<any> {
    return this.prisma.module.update({
      where: { id },
      data,
      include: {
        submodules: {
          orderBy: { orderIndex: 'asc' },
        },
        rolePermissions: {
          include: {
            role: true,
            submodule: true,
          },
        },
      },
    });
  }

  override async delete(id: string): Promise<any> {
    return this.prisma.module.delete({
      where: { id },
    });
  }

  override async count(filters: ModuleFilters = {}): Promise<number> {
    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    return this.prisma.module.count({ where });
  }

  async getActiveModules(): Promise<any[]> {
    return this.prisma.module.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
      include: {
        submodules: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async createSubmodule(moduleId: string, data: any): Promise<any> {
    return this.prisma.submodule.create({
      data: {
        ...data,
        moduleId,
      },
      include: {
        module: true,
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async updateSubmodule(id: string, data: any): Promise<any> {
    return this.prisma.submodule.update({
      where: { id },
      data,
      include: {
        module: true,
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async deleteSubmodule(id: string): Promise<any> {
    return this.prisma.submodule.delete({
      where: { id },
    });
  }

  async updateModuleOrder(
    updates: { id: string; orderIndex: number }[]
  ): Promise<void> {
    await this.prisma.$transaction(
      updates.map(({ id, orderIndex }) =>
        this.prisma.module.update({
          where: { id },
          data: { orderIndex },
        })
      )
    );
  }

  async updateSubmoduleOrder(
    updates: { id: string; orderIndex: number }[]
  ): Promise<void> {
    await this.prisma.$transaction(
      updates.map(({ id, orderIndex }) =>
        this.prisma.submodule.update({
          where: { id },
          data: { orderIndex },
        })
      )
    );
  }
}
