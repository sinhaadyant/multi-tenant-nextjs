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
const AUDIT_ENDPOINT = `${API_BASE_URL}/audit`;

// Test data constants
const TEST_LOGIN_DATA = {
  email: credentials.users.user.email,
  password: credentials.users.user.password,
  tenantSlug: credentials.tenants.primary.domain,
};

describe('Audit System API - Comprehensive E2E Tests', () => {
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

    // Create admin role
    const adminRole = await prisma.role.create({
      data: {
        name: 'Audit Admin',
        description: 'Audit administrator role',
        tenantId: testTenant.id,
        permissions: [
          'audit:read',
          'audit:write',
          'audit:delete',
          'audit:admin',
        ],
      },
    });

    // Create regular role
    testRole = await prisma.role.create({
      data: {
        name: 'User',
        description: 'Regular user role',
        tenantId: testTenant.id,
        permissions: ['audit:read'],
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

  describe('GET /audit/logs', () => {
    beforeEach(async () => {
      // Create test audit logs
      await prisma.auditLog.createMany({
        data: [
          {
            userId: testUser.id,
            tenantId: testTenant.id,
            action: 'user.login',
            resource: 'auth',
            resourceId: testUser.id,
            details: { ip: '192.168.1.100', userAgent: 'Test Browser' },
            ipAddress: '192.168.1.100',
            userAgent: 'Test Browser',
            status: 'success',
          },
          {
            userId: testUser.id,
            tenantId: testTenant.id,
            action: 'user.profile.update',
            resource: 'user',
            resourceId: testUser.id,
            details: {
              field: 'name',
              oldValue: 'Old Name',
              newValue: 'New Name',
            },
            ipAddress: '192.168.1.100',
            userAgent: 'Test Browser',
            status: 'success',
          },
          {
            userId: adminUser.id,
            tenantId: testTenant.id,
            action: 'user.create',
            resource: 'user',
            resourceId: 'new-user-id',
            details: { email: 'newuser@test.com', name: 'New User' },
            ipAddress: '192.168.1.101',
            userAgent: 'Admin Browser',
            status: 'success',
          },
          {
            userId: testUser.id,
            tenantId: testTenant.id,
            action: 'user.login',
            resource: 'auth',
            resourceId: testUser.id,
            details: { ip: '192.168.1.100', userAgent: 'Test Browser' },
            ipAddress: '192.168.1.100',
            userAgent: 'Test Browser',
            status: 'failed',
            errorMessage: 'Invalid credentials',
          },
        ],
      });
    });

    it('should get audit logs successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/logs`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(4);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('action');
      expect(response.body.data[0]).toHaveProperty('resource');
      expect(response.body.data[0]).toHaveProperty('userId');
      expect(response.body.data[0]).toHaveProperty('timestamp');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/logs`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/logs?page=1&limit=2`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by action', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/logs?action=user.login`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.every(log => log.action === 'user.login')).toBe(
        true
      );
    });

    it('should filter by resource', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/logs?resource=auth`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.every(log => log.resource === 'auth')).toBe(
        true
      );
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/logs?status=success`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.every(log => log.status === 'success')).toBe(
        true
      );
    });

    it('should filter by user ID', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/logs?userId=${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.every(log => log.userId === testUser.id)).toBe(
        true
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/logs?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.length).toBeGreaterThanOrEqual(4);
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app).get(`${AUDIT_ENDPOINT}/logs`);

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('GET /audit/logs/:id', () => {
    let testAuditLog;

    beforeEach(async () => {
      testAuditLog = await prisma.auditLog.create({
        data: {
          userId: testUser.id,
          tenantId: testTenant.id,
          action: 'user.login',
          resource: 'auth',
          resourceId: testUser.id,
          details: { ip: '192.168.1.100', userAgent: 'Test Browser' },
          ipAddress: '192.168.1.100',
          userAgent: 'Test Browser',
          status: 'success',
        },
      });
    });

    it('should get audit log by ID successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/logs/${testAuditLog.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.id).toBe(testAuditLog.id);
      expect(response.body.data.action).toBe('user.login');
      expect(response.body.data.resource).toBe('auth');
      expect(response.body.data.userId).toBe(testUser.id);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/logs/${testAuditLog.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent audit log', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/logs/999999`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateErrorResponse(response, 404, 'Audit log not found');
    });
  });

  describe('GET /audit/logs/user/:userId', () => {
    beforeEach(async () => {
      // Create test audit logs for specific user
      await prisma.auditLog.createMany({
        data: [
          {
            userId: testUser.id,
            tenantId: testTenant.id,
            action: 'user.login',
            resource: 'auth',
            resourceId: testUser.id,
            details: { ip: '192.168.1.100', userAgent: 'Test Browser' },
            ipAddress: '192.168.1.100',
            userAgent: 'Test Browser',
            status: 'success',
          },
          {
            userId: testUser.id,
            tenantId: testTenant.id,
            action: 'user.profile.update',
            resource: 'user',
            resourceId: testUser.id,
            details: {
              field: 'name',
              oldValue: 'Old Name',
              newValue: 'New Name',
            },
            ipAddress: '192.168.1.100',
            userAgent: 'Test Browser',
            status: 'success',
          },
        ],
      });
    });

    it('should get audit logs for specific user (admin only)', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/logs/user/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.every(log => log.userId === testUser.id)).toBe(
        true
      );
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/logs/user/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/logs/user/999999`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateErrorResponse(response, 404, 'User not found');
    });
  });

  describe('GET /audit/logs/resource/:resource/:resourceId', () => {
    beforeEach(async () => {
      // Create test audit logs for specific resource
      await prisma.auditLog.createMany({
        data: [
          {
            userId: testUser.id,
            tenantId: testTenant.id,
            action: 'user.create',
            resource: 'user',
            resourceId: 'user-123',
            details: { email: 'user@test.com', name: 'Test User' },
            ipAddress: '192.168.1.100',
            userAgent: 'Test Browser',
            status: 'success',
          },
          {
            userId: adminUser.id,
            tenantId: testTenant.id,
            action: 'user.update',
            resource: 'user',
            resourceId: 'user-123',
            details: {
              field: 'name',
              oldValue: 'Test User',
              newValue: 'Updated User',
            },
            ipAddress: '192.168.1.101',
            userAgent: 'Admin Browser',
            status: 'success',
          },
        ],
      });
    });

    it('should get audit logs for specific resource (admin only)', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/logs/resource/user/user-123`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(
        response.body.data.every(
          log => log.resource === 'user' && log.resourceId === 'user-123'
        )
      ).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/logs/resource/user/user-123`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });
  });

  describe('POST /audit/logs', () => {
    it('should create audit log successfully (admin only)', async () => {
      const auditLogData = {
        userId: testUser.id,
        action: 'test.action',
        resource: 'test',
        resourceId: 'test-123',
        details: { test: 'data' },
        ipAddress: '192.168.1.100',
        userAgent: 'Test Browser',
        status: 'success',
      };

      const response = await request(app)
        .post(`${AUDIT_ENDPOINT}/logs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(auditLogData);

      validateSuccessResponse(response, 201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.action).toBe(auditLogData.action);
      expect(response.body.data.resource).toBe(auditLogData.resource);
      expect(response.body.data.userId).toBe(testUser.id);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`${AUDIT_ENDPOINT}/logs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUser.id,
          action: 'test.action',
          resource: 'test',
          resourceId: 'test-123',
        });

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        action: 'test.action',
        // Missing required fields
      };

      const response = await request(app)
        .post(`${AUDIT_ENDPOINT}/logs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      validateErrorResponse(response, 400);
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app).post(`${AUDIT_ENDPOINT}/logs`).send({
        userId: testUser.id,
        action: 'test.action',
        resource: 'test',
        resourceId: 'test-123',
      });

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('GET /audit/analytics', () => {
    beforeEach(async () => {
      // Create test audit logs with different actions and statuses
      await prisma.auditLog.createMany({
        data: [
          {
            userId: testUser.id,
            tenantId: testTenant.id,
            action: 'user.login',
            resource: 'auth',
            resourceId: testUser.id,
            details: { ip: '192.168.1.100', userAgent: 'Test Browser' },
            ipAddress: '192.168.1.100',
            userAgent: 'Test Browser',
            status: 'success',
          },
          {
            userId: testUser.id,
            tenantId: testTenant.id,
            action: 'user.login',
            resource: 'auth',
            resourceId: testUser.id,
            details: { ip: '192.168.1.100', userAgent: 'Test Browser' },
            ipAddress: '192.168.1.100',
            userAgent: 'Test Browser',
            status: 'failed',
            errorMessage: 'Invalid credentials',
          },
          {
            userId: adminUser.id,
            tenantId: testTenant.id,
            action: 'user.create',
            resource: 'user',
            resourceId: 'new-user-id',
            details: { email: 'newuser@test.com', name: 'New User' },
            ipAddress: '192.168.1.101',
            userAgent: 'Admin Browser',
            status: 'success',
          },
          {
            userId: adminUser.id,
            tenantId: testTenant.id,
            action: 'user.delete',
            resource: 'user',
            resourceId: 'deleted-user-id',
            details: { email: 'deleted@test.com', name: 'Deleted User' },
            ipAddress: '192.168.1.101',
            userAgent: 'Admin Browser',
            status: 'success',
          },
        ],
      });
    });

    it('should get audit analytics successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('totalLogs');
      expect(response.body.data).toHaveProperty('successfulActions');
      expect(response.body.data).toHaveProperty('failedActions');
      expect(response.body.data).toHaveProperty('actionsByType');
      expect(response.body.data).toHaveProperty('resourcesByType');
      expect(response.body.data).toHaveProperty('activityByHour');
      expect(response.body.data).toHaveProperty('topUsers');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/analytics`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should support date range filtering', async () => {
      const startDate = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(
          `${AUDIT_ENDPOINT}/analytics?startDate=${startDate}&endDate=${endDate}`
        )
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.totalLogs).toBeGreaterThanOrEqual(4);
    });
  });

  describe('GET /audit/export', () => {
    beforeEach(async () => {
      // Create test audit logs
      await prisma.auditLog.createMany({
        data: [
          {
            userId: testUser.id,
            tenantId: testTenant.id,
            action: 'user.login',
            resource: 'auth',
            resourceId: testUser.id,
            details: { ip: '192.168.1.100', userAgent: 'Test Browser' },
            ipAddress: '192.168.1.100',
            userAgent: 'Test Browser',
            status: 'success',
          },
          {
            userId: adminUser.id,
            tenantId: testTenant.id,
            action: 'user.create',
            resource: 'user',
            resourceId: 'new-user-id',
            details: { email: 'newuser@test.com', name: 'New User' },
            ipAddress: '192.168.1.101',
            userAgent: 'Admin Browser',
            status: 'success',
          },
        ],
      });
    });

    it('should export audit logs as CSV (admin only)', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/export?format=csv`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should export audit logs as JSON (admin only)', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/export?format=json`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${AUDIT_ENDPOINT}/export?format=csv`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should support date range filtering for export', async () => {
      const startDate = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(
          `${AUDIT_ENDPOINT}/export?format=csv&startDate=${startDate}&endDate=${endDate}`
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
    });
  });

  describe('DELETE /audit/logs', () => {
    beforeEach(async () => {
      // Create test audit logs
      await prisma.auditLog.createMany({
        data: [
          {
            userId: testUser.id,
            tenantId: testTenant.id,
            action: 'user.login',
            resource: 'auth',
            resourceId: testUser.id,
            details: { ip: '192.168.1.100', userAgent: 'Test Browser' },
            ipAddress: '192.168.1.100',
            userAgent: 'Test Browser',
            status: 'success',
          },
          {
            userId: adminUser.id,
            tenantId: testTenant.id,
            action: 'user.create',
            resource: 'user',
            resourceId: 'new-user-id',
            details: { email: 'newuser@test.com', name: 'New User' },
            ipAddress: '192.168.1.101',
            userAgent: 'Admin Browser',
            status: 'success',
          },
        ],
      });
    });

    it('should delete audit logs older than specified days (admin only)', async () => {
      const response = await request(app)
        .delete(`${AUDIT_ENDPOINT}/logs?olderThan=30`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.message).toContain(
        'Audit logs deleted successfully'
      );
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .delete(`${AUDIT_ENDPOINT}/logs?olderThan=30`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should require olderThan parameter', async () => {
      const response = await request(app)
        .delete(`${AUDIT_ENDPOINT}/logs`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateErrorResponse(response, 400, 'olderThan parameter is required');
    });
  });
});
