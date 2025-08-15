import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env['NODE_ENV'] = 'test';

  // Initialize test database connection
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env['DATABASE_URL_TEST'] || process.env['DATABASE_URL'],
      },
    },
  });

  // Connect to database for tests
  await prisma.$connect();
  console.log('✅ Connected to test database');
});

// Global test teardown
afterAll(async () => {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env['DATABASE_URL_TEST'] || process.env['DATABASE_URL'],
      },
    },
  });

  // Disconnect from database after tests
  await prisma.$disconnect();
  console.log('✅ Disconnected from test database');
});

// Global test utilities
(global as any).testUtils = {
  generateTestData: () => ({
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    tenantName: `Test Tenant ${Date.now()}`,
    roleName: `Test Role ${Date.now()}`,
  }),

  generateAuthHeaders: (token: string) => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }),

  generateTenantHeaders: (tenantId: string) => ({
    'X-Tenant-ID': tenantId,
    'Content-Type': 'application/json',
  }),
};

// Extend global types
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        generateTestData: () => {
          email: string;
          password: string;
          firstName: string;
          lastName: string;
          tenantName: string;
          roleName: string;
        };
        generateAuthHeaders: (token: string) => {
          Authorization: string;
          'Content-Type': string;
        };
        generateTenantHeaders: (tenantId: string) => {
          'X-Tenant-ID': string;
          'Content-Type': string;
        };
      };
    }
  }
}
