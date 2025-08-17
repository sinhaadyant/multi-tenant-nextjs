import { PrismaClient } from "@prisma/client";

export class DatabaseHelper {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL ||
            "mysql://root:password@localhost:3306/multi_tenant_admin_test",
        },
      },
    });
  }

  async cleanup() {
    // Clean up test data in reverse order of dependencies
    await this.prisma.auditLog.deleteMany({});
    await this.prisma.userSession.deleteMany({});
    await this.prisma.fileUpload.deleteMany({});
    await this.prisma.ticketReply.deleteMany({});
    await this.prisma.supportTicket.deleteMany({});
    await this.prisma.userRole.deleteMany({});
    await this.prisma.permission.deleteMany({});
    await this.prisma.user.deleteMany({});
    await this.prisma.role.deleteMany({});
    await this.prisma.module.deleteMany({});
    await this.prisma.tenant.deleteMany({});
  }

  async createTestTenant(data: any = {}) {
    return await this.prisma.tenant.create({
      data: {
        name: `Test Tenant ${Date.now()}`,
        domain: `test-${Date.now()}.example.com`,
        status: "active",
        ...data,
      },
    });
  }

  async createTestUser(data: any = {}) {
    return await this.prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: "hashedPassword",
        firstName: "Test",
        lastName: "User",
        status: "active",
        ...data,
      },
    });
  }

  async createTestRole(data: any = {}) {
    return await this.prisma.role.create({
      data: {
        name: `Test Role ${Date.now()}`,
        description: "Test role for API testing",
        type: "tenant",
        ...data,
      },
    });
  }

  async createTestModule(data: any = {}) {
    return await this.prisma.module.create({
      data: {
        name: `Test Module ${Date.now()}`,
        description: "Test module for API testing",
        icon: "test-icon",
        order: 1,
        ...data,
      },
    });
  }

  async assignUserToRole(userId: string, roleId: string) {
    return await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}
