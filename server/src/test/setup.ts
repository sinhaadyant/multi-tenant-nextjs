import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test database client
declare global {
  var __TEST_DB__: PrismaClient;
}

// Create test database client
const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env['DATABASE_URL_TEST'],
    },
  },
  log:
    process.env['NODE_ENV'] === 'test'
      ? []
      : ['query', 'info', 'warn', 'error'],
});

// Make test database available globally
global.__TEST_DB__ = testDb;

// Test utilities
export const testUtils = {
  // Clean database before each test
  async cleanDatabase() {
    const tablenames = await testDb.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter(name => name !== '_prisma_migrations')
      .map(name => `"public"."${name}"`)
      .join(', ');

    try {
      await testDb.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch (error) {
      console.log({ error });
    }
  },

  // Create test tenant
  async createTestTenant(data?: Partial<any>) {
    return await testDb.tenant.create({
      data: {
        name: 'Test Tenant',
        domain: 'test-tenant.example.com',
        isActive: true,
        ...data,
      },
    });
  },

  // Create test user
  async createTestUser(data?: Partial<any>) {
    const tenant = await this.createTestTenant();
    return await testDb.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashedPassword123',
        isActive: true,
        tenantId: tenant.id,
        ...data,
      },
    });
  },

  // Create test role
  async createTestRole(data?: Partial<any>) {
    const tenant = await this.createTestTenant();
    return await testDb.role.create({
      data: {
        name: 'Test Role',
        description: 'Test role for testing',
        isGlobal: false,
        tenantId: tenant.id,
        ...data,
      },
    });
  },

  // Create test module
  async createTestModule(data?: Partial<any>) {
    return await testDb.module.create({
      data: {
        name: 'Test Module',
        description: 'Test module for testing',
        isActive: true,
        ...data,
      },
    });
  },

  // Generate JWT token for testing
  generateTestToken(userId: string, tenantId: string) {
    // This is a simplified token generation for testing
    // In real implementation, use the actual JWT service
    return `test-token-${userId}-${tenantId}`;
  },
};

// Global test setup
beforeAll(async () => {
  // Ensure test database is ready
  await testDb.$connect();
});

// Global test teardown
afterAll(async () => {
  await testDb.$disconnect();
});

// Clean database before each test
beforeEach(async () => {
  await testUtils.cleanDatabase();
});

// Export test utilities
export { testDb };
