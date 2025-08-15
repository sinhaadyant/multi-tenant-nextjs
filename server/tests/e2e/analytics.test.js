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

describe('Analytics API - E2E Tests', () => {
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

  describe('GET /api/analytics/dashboard', () => {
    test('should get dashboard analytics with admin permissions', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analytics');
      expect(response.body.data.analytics).toHaveProperty('totalUsers');
      expect(response.body.data.analytics).toHaveProperty('totalTenants');
      expect(response.body.data.analytics).toHaveProperty('totalRoles');

      console.log('✅ Dashboard analytics successful with admin permissions');
    });

    test('should get dashboard analytics with date range', async () => {
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(
          `/api/analytics/dashboard?startDate=${startDate}&endDate=${endDate}`
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analytics');

      console.log('✅ Dashboard analytics with date range successful');
    });

    test('should fail to get dashboard analytics without authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Dashboard analytics failed without authentication');
    });

    test('should fail to get dashboard analytics with insufficient permissions', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');

      console.log(
        '✅ Dashboard analytics failed with insufficient permissions'
      );
    });
  });

  describe('GET /api/analytics/users', () => {
    test('should get user analytics with admin permissions', async () => {
      const response = await request(app)
        .get('/api/analytics/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analytics');
      expect(response.body.data.analytics).toHaveProperty('totalUsers');
      expect(response.body.data.analytics).toHaveProperty('activeUsers');
      expect(response.body.data.analytics).toHaveProperty('inactiveUsers');

      console.log('✅ User analytics successful with admin permissions');
    });

    test('should get user analytics with filters', async () => {
      const response = await request(app)
        .get('/api/analytics/users?isActive=true&role=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analytics');

      console.log('✅ User analytics with filters successful');
    });

    test('should get user growth analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/users/growth')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('growth');
      expect(Array.isArray(response.body.data.growth)).toBe(true);

      console.log('✅ User growth analytics successful');
    });

    test('should fail to get user analytics without authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/users')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ User analytics failed without authentication');
    });
  });

  describe('GET /api/analytics/tenants', () => {
    test('should get tenant analytics with admin permissions', async () => {
      const response = await request(app)
        .get('/api/analytics/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analytics');
      expect(response.body.data.analytics).toHaveProperty('totalTenants');
      expect(response.body.data.analytics).toHaveProperty('activeTenants');
      expect(response.body.data.analytics).toHaveProperty('inactiveTenants');

      console.log('✅ Tenant analytics successful with admin permissions');
    });

    test('should get tenant analytics with filters', async () => {
      const response = await request(app)
        .get('/api/analytics/tenants?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analytics');

      console.log('✅ Tenant analytics with filters successful');
    });

    test('should get tenant performance analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/tenants/performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('performance');
      expect(Array.isArray(response.body.data.performance)).toBe(true);

      console.log('✅ Tenant performance analytics successful');
    });

    test('should fail to get tenant analytics without authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/tenants')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Tenant analytics failed without authentication');
    });
  });

  describe('GET /api/analytics/roles', () => {
    test('should get role analytics with admin permissions', async () => {
      const response = await request(app)
        .get('/api/analytics/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analytics');
      expect(response.body.data.analytics).toHaveProperty('totalRoles');
      expect(response.body.data.analytics).toHaveProperty('globalRoles');
      expect(response.body.data.analytics).toHaveProperty('tenantRoles');

      console.log('✅ Role analytics successful with admin permissions');
    });

    test('should get role usage analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/roles/usage')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('usage');
      expect(Array.isArray(response.body.data.usage)).toBe(true);

      console.log('✅ Role usage analytics successful');
    });

    test('should fail to get role analytics without authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/roles')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Role analytics failed without authentication');
    });
  });

  describe('GET /api/analytics/activity', () => {
    test('should get activity analytics with admin permissions', async () => {
      const response = await request(app)
        .get('/api/analytics/activity')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analytics');
      expect(response.body.data.analytics).toHaveProperty('totalActivities');
      expect(response.body.data.analytics).toHaveProperty('loginActivities');
      expect(response.body.data.analytics).toHaveProperty('dataActivities');

      console.log('✅ Activity analytics successful with admin permissions');
    });

    test('should get activity analytics with date range', async () => {
      const startDate = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(
          `/api/analytics/activity?startDate=${startDate}&endDate=${endDate}`
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analytics');

      console.log('✅ Activity analytics with date range successful');
    });

    test('should get activity trends', async () => {
      const response = await request(app)
        .get('/api/analytics/activity/trends')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('trends');
      expect(Array.isArray(response.body.data.trends)).toBe(true);

      console.log('✅ Activity trends successful');
    });

    test('should fail to get activity analytics without authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/activity')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Activity analytics failed without authentication');
    });
  });

  describe('GET /api/analytics/performance', () => {
    test('should get performance analytics with admin permissions', async () => {
      const response = await request(app)
        .get('/api/analytics/performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analytics');
      expect(response.body.data.analytics).toHaveProperty('responseTime');
      expect(response.body.data.analytics).toHaveProperty('throughput');
      expect(response.body.data.analytics).toHaveProperty('errorRate');

      console.log('✅ Performance analytics successful with admin permissions');
    });

    test('should get performance metrics', async () => {
      const response = await request(app)
        .get('/api/analytics/performance/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('metrics');
      expect(Array.isArray(response.body.data.metrics)).toBe(true);

      console.log('✅ Performance metrics successful');
    });

    test('should fail to get performance analytics without authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/performance')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Performance analytics failed without authentication');
    });
  });

  describe('GET /api/analytics/security', () => {
    test('should get security analytics with admin permissions', async () => {
      const response = await request(app)
        .get('/api/analytics/security')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analytics');
      expect(response.body.data.analytics).toHaveProperty('failedLogins');
      expect(response.body.data.analytics).toHaveProperty(
        'suspiciousActivities'
      );
      expect(response.body.data.analytics).toHaveProperty('securityEvents');

      console.log('✅ Security analytics successful with admin permissions');
    });

    test('should get security incidents', async () => {
      const response = await request(app)
        .get('/api/analytics/security/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('incidents');
      expect(Array.isArray(response.body.data.incidents)).toBe(true);

      console.log('✅ Security incidents successful');
    });

    test('should fail to get security analytics without authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/security')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Security analytics failed without authentication');
    });
  });

  describe('POST /api/analytics/export', () => {
    test('should export analytics data with admin permissions', async () => {
      const exportData = {
        type: 'dashboard',
        format: 'csv',
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      };

      const response = await request(app)
        .post('/api/analytics/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(exportData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('exportUrl');
      expect(response.body.data).toHaveProperty('expiresAt');

      console.log('✅ Analytics export successful with admin permissions');
    });

    test('should export user analytics data', async () => {
      const exportData = {
        type: 'users',
        format: 'json',
        filters: {
          isActive: true,
        },
      };

      const response = await request(app)
        .post('/api/analytics/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(exportData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('exportUrl');

      console.log('✅ User analytics export successful');
    });

    test('should fail export with invalid format', async () => {
      const exportData = {
        type: 'dashboard',
        format: 'invalid',
      };

      const response = await request(app)
        .post('/api/analytics/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(exportData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid export format');

      console.log('✅ Analytics export failed with invalid format');
    });

    test('should fail to export analytics without authentication', async () => {
      const exportData = {
        type: 'dashboard',
        format: 'csv',
      };

      const response = await request(app)
        .post('/api/analytics/export')
        .send(exportData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Analytics export failed without authentication');
    });
  });

  describe('GET /api/analytics/reports', () => {
    test('should get analytics reports with admin permissions', async () => {
      const response = await request(app)
        .get('/api/analytics/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('reports');
      expect(Array.isArray(response.body.data.reports)).toBe(true);

      console.log('✅ Analytics reports successful with admin permissions');
    });

    test('should get specific report', async () => {
      const response = await request(app)
        .get('/api/analytics/reports/user-growth')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('report');

      console.log('✅ Specific report successful');
    });

    test('should fail to get reports without authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/reports')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Analytics reports failed without authentication');
    });
  });

  // Edge Cases and Error Handling
  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid date range', async () => {
      const startDate = new Date().toISOString();
      const endDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const response = await request(app)
        .get(
          `/api/analytics/dashboard?startDate=${startDate}&endDate=${endDate}`
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid date range');

      console.log('✅ Invalid date range handled correctly');
    });

    test('should handle very large date range', async () => {
      const startDate = new Date(
        Date.now() - 365 * 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(
          `/api/analytics/dashboard?startDate=${startDate}&endDate=${endDate}`
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analytics');

      console.log('✅ Large date range handled correctly');
    });

    test('should handle concurrent analytics requests', async () => {
      const promises = Array(3)
        .fill()
        .map(() =>
          request(app)
            .get('/api/analytics/dashboard')
            .set('Authorization', `Bearer ${adminToken}`)
        );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      console.log('✅ Concurrent analytics requests handled successfully');
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    test('should handle rapid analytics requests', async () => {
      const startTime = Date.now();

      // Make rapid analytics requests
      const promises = Array(5)
        .fill()
        .map(() =>
          request(app)
            .get('/api/analytics/dashboard')
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
      console.log(`✅ 5 rapid analytics requests completed in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle complex analytics queries', async () => {
      const startTime = Date.now();

      // Test complex analytics query
      const response = await request(app)
        .get('/api/analytics/users/growth?period=monthly&limit=12')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('growth');

      const totalTime = endTime - startTime;
      console.log(`✅ Complex analytics query completed in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });

  // Data Scope Tests
  describe('Data Scope Tests', () => {
    test('should only return analytics from same tenant', async () => {
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
        .get('/api/analytics/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify analytics only include data from the same tenant
      expect(response.body.data.analytics.totalUsers).toBe(2); // Only admin and regular user

      console.log('✅ Data scope filtering works correctly');
    });
  });
});
