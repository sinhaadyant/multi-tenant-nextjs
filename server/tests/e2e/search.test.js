const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const credentials = require('../credentials');

const prisma = new PrismaClient();

// Import the Express app
let app;
try {
  app = require('../src/index');
} catch (error) {
  console.log('⚠️  App not started, creating mock app for testing');
  const express = require('express');
  app = express();
  app.use(express.json());
}

describe('Search API - E2E Tests', () => {
  let adminUser;
  let regularUser;
  let testTenant;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    // Connect to test database
    await prisma.$connect();
    console.log('✅ Connected to test database');
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await prisma.$disconnect();
    console.log('✅ Disconnected from test database');
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.auditLog.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.tenant.deleteMany();

    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        domain: 'test.com',
        isActive: true,
      },
    });

    // Create admin user
    const adminPassword = await bcrypt.hash(
      credentials.users.admin.password,
      12
    );
    adminUser = await prisma.user.create({
      data: {
        email: credentials.users.admin.email,
        passwordHash: adminPassword,
        name: credentials.users.admin.name,
        tenantId: testTenant.id,
        isActive: credentials.users.admin.isActive,
        isSuperadmin: credentials.users.admin.isSuperadmin,
      },
    });

    // Create regular user
    const userPassword = await bcrypt.hash(credentials.users.user.password, 12);
    regularUser = await prisma.user.create({
      data: {
        email: credentials.users.user.email,
        passwordHash: userPassword,
        name: credentials.users.user.name,
        tenantId: testTenant.id,
        isActive: credentials.users.user.isActive,
        isSuperadmin: credentials.users.user.isSuperadmin,
      },
    });

    // Get tokens for testing
    const adminLoginResponse = await request(app).post('/api/auth/login').send({
      email: credentials.users.admin.email,
      password: credentials.users.admin.password,
    });

    const userLoginResponse = await request(app).post('/api/auth/login').send({
      email: credentials.users.user.email,
      password: credentials.users.user.password,
    });

    adminToken = adminLoginResponse.body.data.accessToken;
    userToken = userLoginResponse.body.data.accessToken;

    console.log('✅ Test data prepared');
  });

  describe('GET /api/search', () => {
    test('should perform global search with admin permissions', async () => {
      const response = await request(app)
        .get('/api/search?q=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');
      expect(Array.isArray(response.body.data.results)).toBe(true);

      console.log('✅ Global search successful with admin permissions');
    });

    test('should perform search with pagination', async () => {
      const response = await request(app)
        .get('/api/search?q=test&page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('meta');
      expect(response.body.data.meta).toHaveProperty('page');
      expect(response.body.data.meta).toHaveProperty('limit');
      expect(response.body.data.meta).toHaveProperty('total');
      expect(response.body.data.meta).toHaveProperty('totalPages');

      console.log('✅ Search with pagination successful');
    });

    test('should perform search with filters', async () => {
      const response = await request(app)
        .get('/api/search?q=user&filters[type]=user&filters[status]=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');

      console.log('✅ Search with filters successful');
    });

    test('should perform search with date range', async () => {
      const startDate = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/search?q=test&startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');

      console.log('✅ Search with date range successful');
    });

    test('should fail to search without authentication', async () => {
      const response = await request(app).get('/api/search?q=test').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Search failed without authentication');
    });

    test('should fail to search with insufficient permissions', async () => {
      const response = await request(app)
        .get('/api/search?q=test')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');

      console.log('✅ Search failed with insufficient permissions');
    });
  });

  describe('GET /api/search/users', () => {
    test('should search users with admin permissions', async () => {
      const response = await request(app)
        .get('/api/search/users?q=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(Array.isArray(response.body.data.users)).toBe(true);

      console.log('✅ User search successful with admin permissions');
    });

    test('should search users with filters', async () => {
      const response = await request(app)
        .get('/api/search/users?q=user&isActive=true&role=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');

      console.log('✅ User search with filters successful');
    });

    test('should fail to search users without authentication', async () => {
      const response = await request(app)
        .get('/api/search/users?q=test')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ User search failed without authentication');
    });
  });

  describe('GET /api/search/roles', () => {
    test('should search roles with admin permissions', async () => {
      const response = await request(app)
        .get('/api/search/roles?q=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('roles');
      expect(Array.isArray(response.body.data.roles)).toBe(true);

      console.log('✅ Role search successful with admin permissions');
    });

    test('should search roles with filters', async () => {
      const response = await request(app)
        .get('/api/search/roles?q=role&isGlobal=false')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('roles');

      console.log('✅ Role search with filters successful');
    });

    test('should fail to search roles without authentication', async () => {
      const response = await request(app)
        .get('/api/search/roles?q=test')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Role search failed without authentication');
    });
  });

  describe('GET /api/search/tenants', () => {
    test('should search tenants with admin permissions', async () => {
      const response = await request(app)
        .get('/api/search/tenants?q=test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tenants');
      expect(Array.isArray(response.body.data.tenants)).toBe(true);

      console.log('✅ Tenant search successful with admin permissions');
    });

    test('should search tenants with filters', async () => {
      const response = await request(app)
        .get('/api/search/tenants?q=tenant&isActive=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tenants');

      console.log('✅ Tenant search with filters successful');
    });

    test('should fail to search tenants without authentication', async () => {
      const response = await request(app)
        .get('/api/search/tenants?q=test')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Tenant search failed without authentication');
    });
  });

  describe('POST /api/search/advanced', () => {
    test('should perform advanced search with admin permissions', async () => {
      const searchData = {
        query: 'admin',
        filters: {
          type: ['user', 'role'],
          status: 'active',
        },
        sortBy: 'name',
        sortOrder: 'asc',
        page: 1,
        limit: 10,
      };

      const response = await request(app)
        .post('/api/search/advanced')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(searchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('meta');

      console.log('✅ Advanced search successful with admin permissions');
    });

    test('should perform advanced search with complex filters', async () => {
      const searchData = {
        query: 'test',
        filters: {
          type: ['user'],
          status: 'active',
          dateRange: {
            start: new Date(
              Date.now() - 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            end: new Date().toISOString(),
          },
        },
        sortBy: 'createdAt',
        sortOrder: 'desc',
        page: 1,
        limit: 5,
      };

      const response = await request(app)
        .post('/api/search/advanced')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(searchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');

      console.log('✅ Advanced search with complex filters successful');
    });

    test('should fail advanced search with invalid filters', async () => {
      const searchData = {
        query: 'test',
        filters: {
          invalidField: 'invalid',
        },
      };

      const response = await request(app)
        .post('/api/search/advanced')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(searchData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');

      console.log('✅ Advanced search failed with invalid filters');
    });

    test('should fail advanced search without authentication', async () => {
      const searchData = {
        query: 'test',
        filters: {},
      };

      const response = await request(app)
        .post('/api/search/advanced')
        .send(searchData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Advanced search failed without authentication');
    });
  });

  describe('GET /api/search/suggestions', () => {
    test('should get search suggestions with admin permissions', async () => {
      const response = await request(app)
        .get('/api/search/suggestions?q=ad')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('suggestions');
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);

      console.log('✅ Search suggestions successful with admin permissions');
    });

    test('should get search suggestions with type filter', async () => {
      const response = await request(app)
        .get('/api/search/suggestions?q=us&type=user')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('suggestions');

      console.log('✅ Search suggestions with type filter successful');
    });

    test('should fail to get suggestions without authentication', async () => {
      const response = await request(app)
        .get('/api/search/suggestions?q=test')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Search suggestions failed without authentication');
    });
  });

  describe('GET /api/search/history', () => {
    test('should get search history with admin permissions', async () => {
      const response = await request(app)
        .get('/api/search/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('history');
      expect(Array.isArray(response.body.data.history)).toBe(true);

      console.log('✅ Search history successful with admin permissions');
    });

    test('should get search history with pagination', async () => {
      const response = await request(app)
        .get('/api/search/history?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('history');
      expect(response.body.data).toHaveProperty('meta');

      console.log('✅ Search history with pagination successful');
    });

    test('should fail to get search history without authentication', async () => {
      const response = await request(app)
        .get('/api/search/history')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Search history failed without authentication');
    });
  });

  describe('DELETE /api/search/history', () => {
    test('should clear search history with admin permissions', async () => {
      const response = await request(app)
        .delete('/api/search/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(
        'Search history cleared successfully'
      );

      console.log('✅ Clear search history successful');
    });

    test('should fail to clear search history without authentication', async () => {
      const response = await request(app)
        .delete('/api/search/history')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Clear search history failed without authentication');
    });
  });

  // Edge Cases and Error Handling
  describe('Edge Cases and Error Handling', () => {
    test('should handle empty search query', async () => {
      const response = await request(app)
        .get('/api/search?q=')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');

      console.log('✅ Empty search query handled correctly');
    });

    test('should handle very long search query', async () => {
      const longQuery = 'a'.repeat(1000);
      const response = await request(app)
        .get(`/api/search?q=${longQuery}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Query too long');

      console.log('✅ Very long search query handled correctly');
    });

    test('should handle special characters in search query', async () => {
      const specialQuery = 'test@#$%^&*()_+-=[]{}|;:,.<>?';
      const response = await request(app)
        .get(`/api/search?q=${encodeURIComponent(specialQuery)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');

      console.log('✅ Special characters in search query handled correctly');
    });

    test('should handle concurrent search requests', async () => {
      const promises = Array(3)
        .fill()
        .map(() =>
          request(app)
            .get('/api/search?q=test')
            .set('Authorization', `Bearer ${adminToken}`)
        );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      console.log('✅ Concurrent search requests handled successfully');
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    test('should handle rapid search requests', async () => {
      const startTime = Date.now();

      // Make rapid search requests
      const promises = Array(10)
        .fill()
        .map((_, index) =>
          request(app)
            .get(`/api/search?q=test${index}`)
            .set('Authorization', `Bearer ${adminToken}`)
        );

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      const totalTime = endTime - startTime;
      console.log(`✅ 10 rapid search requests completed in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle large search results with pagination', async () => {
      const startTime = Date.now();

      // Test search with pagination
      const response = await request(app)
        .get('/api/search?q=test&page=1&limit=50')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(response.body.data.results.length).toBeLessThanOrEqual(50);

      const totalTime = endTime - startTime;
      console.log(
        `✅ Large search results with pagination completed in ${totalTime}ms`
      );
      expect(totalTime).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });

  // Data Scope Tests
  describe('Data Scope Tests', () => {
    test('should only return results from same tenant', async () => {
      // Create another tenant and user
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          domain: 'other.com',
          isActive: true,
        },
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other@other.com',
          passwordHash: await bcrypt.hash('Password123!', 12),
          name: 'Other User',
          tenantId: otherTenant.id,
          isActive: true,
        },
      });

      const response = await request(app)
        .get('/api/search/users?q=user')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify all returned users belong to the same tenant
      const allSameTenant = response.body.data.users.every(
        user => user.tenantId === testTenant.id
      );
      expect(allSameTenant).toBe(true);

      console.log('✅ Data scope filtering works correctly');
    });
  });
});
