import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

export class TestDatabase {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env['DATABASE_URL_TEST'],
        },
      },
    });
  }

  /**
   * Run database migrations for test database
   */
  async runMigrations() {
    try {
      // Run Prisma migrations
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: process.env['DATABASE_URL_TEST'] },
        stdio: 'inherit',
      });
    } catch (error) {
      console.error('Failed to run migrations:', error);
      throw error;
    }
  }

  /**
   * Seed test database with initial data
   */
  async seedDatabase() {
    try {
      // Create test tenant
      const testTenant = await this.prisma.tenant.create({
        data: {
          name: 'Test Organization',
          domain: 'test.example.com',
          isActive: true,
        },
      });

      // Create test modules
      const userModule = await this.prisma.module.create({
        data: {
          name: 'User Management',
          description: 'Manage users and their permissions',
          orderIndex: 1,
          isActive: true,
        },
      });

      const roleModule = await this.prisma.module.create({
        data: {
          name: 'Role Management',
          description: 'Manage roles and permissions',
          orderIndex: 2,
          isActive: true,
        },
      });

      // Create test roles
      const adminRole = await this.prisma.role.create({
        data: {
          name: 'Administrator',
          description: 'Full system access',
          isGlobal: false,
          tenantId: testTenant.id,
        },
      });

      const userRole = await this.prisma.role.create({
        data: {
          name: 'User',
          description: 'Standard user access',
          isGlobal: false,
          tenantId: testTenant.id,
        },
      });

      // Create test admin user
      const adminUser = await this.prisma.user.create({
        data: {
          email: 'admin@test.com',
          name: 'Admin User',
          passwordHash:
            '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', // password123
          isActive: true,
          tenantId: testTenant.id,
        },
      });

      // Create test regular user
      const regularUser = await this.prisma.user.create({
        data: {
          email: 'user@test.com',
          name: 'Regular User',
          passwordHash:
            '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', // password123
          isActive: true,
          tenantId: testTenant.id,
        },
      });

      return {
        tenant: testTenant,
        modules: { userModule, roleModule },
        roles: { adminRole, userRole },
        users: { adminUser, regularUser },
      };
    } catch (error) {
      console.error('Failed to seed database:', error);
      throw error;
    }
  }

  /**
   * Clean all data from test database
   */
  async cleanDatabase() {
    try {
      // Get all table names
      const tables = await this.prisma.$queryRaw<
        Array<{ tablename: string }>
      >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

      const tableNames = tables
        .map(({ tablename }) => tablename)
        .filter(name => name !== '_prisma_migrations')
        .map(name => `"public"."${name}"`)
        .join(', ');

      if (tableNames) {
        await this.prisma.$executeRawUnsafe(
          `TRUNCATE TABLE ${tableNames} CASCADE;`
        );
      }
    } catch (error) {
      console.error('Failed to clean database:', error);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }

  /**
   * Get Prisma client instance
   */
  getClient() {
    return this.prisma;
  }
}

// Export singleton instance
export const testDatabase = new TestDatabase();
