import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class TestDatabase {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
        },
      },
    });
  }

  async connect() {
    await this.prisma.$connect();
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }

  async cleanDatabase() {
    const tablenames = await this.prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter(name => name !== '_prisma_migrations')
      .map(name => `"public"."${name}"`)
      .join(', ');

    try {
      await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch (error) {
      console.log({ error });
    }
  }

  async createSuperadmin() {
    const hashedPassword = await bcrypt.hash('Superadmin123!', 12);

    const superadmin = await this.prisma.user.create({
      data: {
        email: 'superadmin@test.com',
        passwordHash: hashedPassword,
        name: 'Super Admin',
        isActive: true,
        isSuperadmin: true,
      },
    });

    return superadmin;
  }

  async createTenant(data: { name: string; domain: string; settings?: any }) {
    return await this.prisma.tenant.create({
      data: {
        name: data.name,
        domain: data.domain,
        isActive: true,
      },
    });
  }

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantId?: string;
    isSuperadmin?: boolean;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 12);

    return await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        name: `${data.firstName} ${data.lastName}`,
        tenantId: data.tenantId,
        isSuperadmin: data.isSuperadmin || false,
        isActive: true,
      },
    });
  }

  async createRole(data: {
    name: string;
    description?: string;
    tenantId?: string;
    isGlobal?: boolean;
  }) {
    return await this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        tenantId: data.tenantId,
        isGlobal: data.isGlobal || false,
      },
    });
  }

  async createModule(data: {
    name: string;
    description?: string;
    icon?: string;
    order?: number;
  }) {
    return await this.prisma.module.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: true,
      },
    });
  }

  async createSubmodule(data: {
    name: string;
    description?: string;
    moduleId: string;
    order?: number;
  }) {
    return await this.prisma.submodule.create({
      data: {
        name: data.name,
        description: data.description,
        moduleId: data.moduleId,
        order: data.order || 0,
        isActive: true,
      },
    });
  }

  async createPermission(data: {
    roleId: string;
    submoduleId: string;
    canCreate?: boolean;
    canRead?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
    canViewAll?: boolean;
  }) {
    return await this.prisma.permission.create({
      data: {
        roleId: data.roleId,
        submoduleId: data.submoduleId,
        canCreate: data.canCreate || false,
        canRead: data.canRead || false,
        canUpdate: data.canUpdate || false,
        canDelete: data.canDelete || false,
        canViewAll: data.canViewAll || false,
      },
    });
  }

  async assignRoleToUser(userId: string, roleId: string) {
    return await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  async generateAuthToken(user: any) {
    const payload = {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      isSuperadmin: user.isSuperadmin,
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h',
    });
  }

  async getUserWithPermissions(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    submodule: {
                      include: {
                        module: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        tenant: true,
      },
    });
  }

  async getPrisma() {
    return this.prisma;
  }
}

export const testDatabase = new TestDatabase();
