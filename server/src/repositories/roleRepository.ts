// PrismaClient is imported in base repository
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

  async findByName(name: string, tenantId?: string): Promise<any | null> {
    const where: any = { name };
    if (tenantId !== undefined) {
      where.tenantId = tenantId;
    }
    return this.prisma.role.findFirst({ where });
  }

  async getUsersWithRole(roleId: string): Promise<any[]> {
    return this.prisma.userRole.findMany({
      where: { roleId },
      include: {
        user: true,
        role: true,
      },
    });
  }

  async getRoleWithUsers(roleId: string): Promise<any | null> {
    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        userRoles: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async getRoleWithPermissions(roleId: string): Promise<any | null> {
    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            module: true,
            submodule: true,
          },
        },
      },
    });
  }

  async getUserRole(userId: string, roleId: string): Promise<any | null> {
    return this.prisma.userRole.findFirst({
      where: { userId, roleId },
    });
  }

  async assignUserToRole(userId: string, roleId: string): Promise<any> {
    return this.prisma.userRole.create({
      data: { userId, roleId },
    });
  }

  async removeUserFromRole(userId: string, roleId: string): Promise<any> {
    return this.prisma.userRole.deleteMany({
      where: { userId, roleId },
    });
  }

  async createPermission(roleId: string, permission: any): Promise<any> {
    return this.prisma.rolePermission.create({
      data: {
        roleId,
        moduleId: permission.moduleId,
        submoduleId: permission.submoduleId,
        canCreate: permission.canCreate,
        canRead: permission.canRead,
        canUpdate: permission.canUpdate,
        canDelete: permission.canDelete,
        canViewAll: permission.canViewAll,
      },
    });
  }

  async updatePermission(
    roleId: string,
    moduleId: string,
    submoduleId: string | null,
    permission: any
  ): Promise<any> {
    return this.prisma.rolePermission.updateMany({
      where: { roleId, moduleId, submoduleId },
      data: permission,
    });
  }

  async deletePermission(
    roleId: string,
    moduleId: string,
    submoduleId: string | null
  ): Promise<any> {
    return this.prisma.rolePermission.deleteMany({
      where: { roleId, moduleId, submoduleId },
    });
  }

  async applyBulkPermissionUpdate(
    roleId: string,
    permissions: any[]
  ): Promise<void> {
    await this.prisma.$transaction(async (tx: any) => {
      // Delete existing permissions for this role
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // Create new permissions
      for (const permission of permissions) {
        await tx.rolePermission.create({
          data: {
            roleId,
            moduleId: permission.moduleId,
            submoduleId: permission.submoduleId,
            canCreate: permission.canCreate,
            canRead: permission.canRead,
            canUpdate: permission.canUpdate,
            canDelete: permission.canDelete,
            canViewAll: permission.canViewAll,
          },
        });
      }
    });
  }

  async getRolePermissionsByModule(
    moduleId: string,
    roleIds: string[]
  ): Promise<any[]> {
    return this.prisma.rolePermission.findMany({
      where: {
        roleId: { in: roleIds },
        moduleId,
        submoduleId: null,
      },
    });
  }

  async getRolePermissionsBySubmodule(
    moduleId: string,
    submoduleId: string,
    roleIds: string[]
  ): Promise<any[]> {
    return this.prisma.rolePermission.findMany({
      where: {
        roleId: { in: roleIds },
        moduleId,
        submoduleId,
      },
    });
  }

  async getRolePermissionsBySubmodules(
    submoduleIds: string[],
    roleIds: string[]
  ): Promise<any[]> {
    return this.prisma.rolePermission.findMany({
      where: {
        roleId: { in: roleIds },
        submoduleId: { in: submoduleIds },
      },
    });
  }

  async getRolePermissionsByRoles(roleIds: string[]): Promise<any[]> {
    return this.prisma.rolePermission.findMany({
      where: {
        roleId: { in: roleIds },
      },
    });
  }

  async getRolePermissions(roleId: string): Promise<any[]> {
    return this.prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        module: true,
        submodule: true,
      },
    });
  }

  async getPermissionsByModule(moduleId: string): Promise<any[]> {
    return this.prisma.rolePermission.findMany({
      where: { moduleId },
      include: {
        role: true,
        module: true,
        submodule: true,
      },
    });
  }

  async getPermissionsBySubmodule(
    moduleId: string,
    submoduleId: string
  ): Promise<any[]> {
    return this.prisma.rolePermission.findMany({
      where: { moduleId, submoduleId },
      include: {
        role: true,
        module: true,
        submodule: true,
      },
    });
  }

  async getAllPermissions(): Promise<any[]> {
    return this.prisma.rolePermission.findMany({
      include: {
        role: true,
        module: true,
        submodule: true,
      },
    });
  }
}
