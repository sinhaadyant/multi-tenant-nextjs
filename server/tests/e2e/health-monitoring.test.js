const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const credentials = require('../credentials');

const prisma = new PrismaClient();

// Import the Express app for testing
const app = require('./test-app-ts');

// Constants for API endpoints and test data
const API_BASE_URL = '/api';
const HEALTH_ENDPOINT = `${API_BASE_URL}/health`;

// Test data constants
const TEST_LOGIN_DATA = {
  email: credentials.users.user.email,
  password: credentials.users.user.password,
  tenantSlug: credentials.tenants.primary.domain,
};

describe('Health Monitoring API - Comprehensive E2E Tests', () => {
  let testUser, testTenant, testRole, adminUser;
  let authToken, adminToken;

  // Helper function to validate error response
  const validateErrorResponse = (response, expectedStatus, expectedMessage) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body.success).toBe(false);
    if (expectedMessage) {
      expect(response.body.message).toContain(expectedMessage);
    }
  };

  // Helper function to validate success response
  const validateSuccessResponse = (response, expectedStatus = 200) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBeDefined();
  };

  beforeAll(async () => {
    await prisma.$connect();
    console.log('✅ Connected to test database');
  });

  afterAll(async () => {
    await prisma.$disconnect();
    console.log('✅ Disconnected from test database');
  });

  beforeEach(async () => {
    // Clean up test data before each test
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

    // Create admin role
    const adminRole = await prisma.role.create({
      data: {
        name: 'Health Admin',
        description: 'Health monitoring administrator role',
        tenantId: testTenant.id,
        permissions: [
          'health:read',
          'health:write',
          'health:delete',
          'health:admin',
        ],
      },
    });

    // Create regular role
    testRole = await prisma.role.create({
      data: {
        name: 'User',
        description: 'Regular user role',
        tenantId: testTenant.id,
        permissions: ['health:read'],
      },
    });

    // Create admin user
    const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: adminPassword,
        name: 'Admin User',
        tenantId: testTenant.id,
        isActive: true,
      },
    });

    // Create regular user
    const userPassword = await bcrypt.hash('UserPassword123!', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        password: userPassword,
        name: 'Test User',
        tenantId: testTenant.id,
        isActive: true,
      },
    });

    // Assign roles
    await prisma.userRole.createMany({
      data: [
        { userId: adminUser.id, roleId: adminRole.id },
        { userId: testUser.id, roleId: testRole.id },
      ],
    });

    // Login as admin
    const adminLoginResponse = await request(app)
      .post(`${API_BASE_URL}/auth/login`)
      .send({
        email: 'admin@test.com',
        password: 'AdminPassword123!',
        tenantSlug: 'test.com',
      });

    adminToken = adminLoginResponse.body.data.accessToken;

    // Login as regular user
    const userLoginResponse = await request(app)
      .post(`${API_BASE_URL}/auth/login`)
      .send({
        email: 'user@test.com',
        password: 'UserPassword123!',
        tenantSlug: 'test.com',
      });

    authToken = userLoginResponse.body.data.accessToken;
  });

  describe('GET /health', () => {
    it('should get basic health status successfully', async () => {
      const response = await request(app).get(`${HEALTH_ENDPOINT}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data.status).toBe('healthy');
    });
  });

  describe('GET /health/detailed', () => {
    it('should get detailed health status successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/detailed`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('services');
      expect(response.body.data).toHaveProperty('database');
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data).toHaveProperty('cpu');
      expect(response.body.data).toHaveProperty('disk');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/detailed`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app).get(`${HEALTH_ENDPOINT}/detailed`);

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('GET /health/services', () => {
    it('should get service health status successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/services`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('status');
      expect(response.body.data[0]).toHaveProperty('responseTime');
      expect(response.body.data[0]).toHaveProperty('lastChecked');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/services`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });
  });

  describe('GET /health/database', () => {
    it('should get database health status successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/database`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('connection');
      expect(response.body.data).toHaveProperty('responseTime');
      expect(response.body.data).toHaveProperty('activeConnections');
      expect(response.body.data).toHaveProperty('maxConnections');
      expect(response.body.data).toHaveProperty('lastChecked');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/database`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });
  });

  describe('GET /health/system', () => {
    it('should get system health status successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/system`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data).toHaveProperty('cpu');
      expect(response.body.data).toHaveProperty('disk');
      expect(response.body.data).toHaveProperty('network');
      expect(response.body.data).toHaveProperty('load');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('lastChecked');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/system`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });
  });

  describe('GET /health/metrics', () => {
    it('should get health metrics successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/metrics`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('requests');
      expect(response.body.data).toHaveProperty('errors');
      expect(response.body.data).toHaveProperty('responseTime');
      expect(response.body.data).toHaveProperty('throughput');
      expect(response.body.data).toHaveProperty('memoryUsage');
      expect(response.body.data).toHaveProperty('cpuUsage');
      expect(response.body.data).toHaveProperty('diskUsage');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/metrics`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should support time range filtering', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/metrics?period=1h`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
    });
  });

  describe('POST /health/check', () => {
    it('should perform health check successfully (admin only)', async () => {
      const response = await request(app)
        .post(`${HEALTH_ENDPOINT}/check`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          services: ['database', 'redis', 'external-api'],
          timeout: 5000,
        });

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('duration');
      expect(response.body.data.results).toBeInstanceOf(Array);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`${HEALTH_ENDPOINT}/check`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          services: ['database'],
        });

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should validate service names', async () => {
      const response = await request(app)
        .post(`${HEALTH_ENDPOINT}/check`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          services: ['invalid-service'],
        });

      validateErrorResponse(response, 400, 'Invalid service');
    });
  });

  describe('GET /health/alerts', () => {
    it('should get health alerts successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/alerts`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('type');
        expect(response.body.data[0]).toHaveProperty('severity');
        expect(response.body.data[0]).toHaveProperty('message');
        expect(response.body.data[0]).toHaveProperty('timestamp');
        expect(response.body.data[0]).toHaveProperty('resolved');
      }
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/alerts`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should filter by severity', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/alerts?severity=critical`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      if (response.body.data.length > 0) {
        expect(
          response.body.data.every(alert => alert.severity === 'critical')
        ).toBe(true);
      }
    });

    it('should filter by resolved status', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/alerts?resolved=false`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      if (response.body.data.length > 0) {
        expect(
          response.body.data.every(alert => alert.resolved === false)
        ).toBe(true);
      }
    });
  });

  describe('POST /health/alerts/:id/resolve', () => {
    it('should resolve health alert successfully (admin only)', async () => {
      // First get alerts
      const alertsResponse = await request(app)
        .get(`${HEALTH_ENDPOINT}/alerts`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (alertsResponse.body.data.length > 0) {
        const alertId = alertsResponse.body.data[0].id;

        const response = await request(app)
          .post(`${HEALTH_ENDPOINT}/alerts/${alertId}/resolve`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            resolution: 'Alert resolved by admin',
          });

        validateSuccessResponse(response);
        expect(response.body.message).toContain('Alert resolved successfully');
      }
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`${HEALTH_ENDPOINT}/alerts/1/resolve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resolution: 'Test resolution',
        });

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent alert', async () => {
      const response = await request(app)
        .post(`${HEALTH_ENDPOINT}/alerts/999999/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          resolution: 'Test resolution',
        });

      validateErrorResponse(response, 404, 'Alert not found');
    });
  });

  describe('GET /health/history', () => {
    it('should get health history successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/history`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('timestamp');
        expect(response.body.data[0]).toHaveProperty('status');
        expect(response.body.data[0]).toHaveProperty('metrics');
        expect(response.body.data[0]).toHaveProperty('alerts');
      }
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/history`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/history?page=1&limit=10`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.pagination).toBeDefined();
    });

    it('should support date range filtering', async () => {
      const startDate = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(
          `${HEALTH_ENDPOINT}/history?startDate=${startDate}&endDate=${endDate}`
        )
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
    });
  });

  describe('GET /health/export', () => {
    it('should export health data successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/export?format=json`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should export health data as CSV (admin only)', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/export?format=csv`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${HEALTH_ENDPOINT}/export?format=json`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should support date range filtering for export', async () => {
      const startDate = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(
          `${HEALTH_ENDPOINT}/export?format=json&startDate=${startDate}&endDate=${endDate}`
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });
});
