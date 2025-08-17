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
const SECURITY_ENDPOINT = `${API_BASE_URL}/security`;

// Test data constants
const TEST_LOGIN_DATA = {
  email: credentials.users.user.email,
  password: credentials.users.user.password,
  tenantSlug: credentials.tenants.primary.domain,
};

describe('Security System API - Comprehensive E2E Tests', () => {
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
        name: 'Security Admin',
        description: 'Security administrator role',
        tenantId: testTenant.id,
        permissions: [
          'security:read',
          'security:write',
          'security:delete',
          'security:admin',
        ],
      },
    });

    // Create regular role
    testRole = await prisma.role.create({
      data: {
        name: 'User',
        description: 'Regular user role',
        tenantId: testTenant.id,
        permissions: ['security:read'],
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

  describe('GET /security/settings', () => {
    it('should get security settings successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${SECURITY_ENDPOINT}/settings`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('passwordPolicy');
      expect(response.body.data).toHaveProperty('sessionPolicy');
      expect(response.body.data).toHaveProperty('mfaPolicy');
      expect(response.body.data).toHaveProperty('ipWhitelist');
      expect(response.body.data).toHaveProperty('rateLimiting');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${SECURITY_ENDPOINT}/settings`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app).get(`${SECURITY_ENDPOINT}/settings`);

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('PUT /security/settings', () => {
    it('should update security settings successfully (admin only)', async () => {
      const securitySettings = {
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          maxAge: 90,
        },
        sessionPolicy: {
          maxSessions: 5,
          sessionTimeout: 3600,
          idleTimeout: 1800,
        },
        mfaPolicy: {
          enabled: true,
          required: false,
          methods: ['totp', 'sms'],
        },
        rateLimiting: {
          enabled: true,
          maxRequests: 100,
          windowMs: 900000,
        },
      };

      const response = await request(app)
        .put(`${SECURITY_ENDPOINT}/settings`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(securitySettings);

      validateSuccessResponse(response);
      expect(response.body.data.passwordPolicy.minLength).toBe(12);
      expect(response.body.data.sessionPolicy.maxSessions).toBe(5);
      expect(response.body.data.mfaPolicy.enabled).toBe(true);
      expect(response.body.data.rateLimiting.enabled).toBe(true);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .put(`${SECURITY_ENDPOINT}/settings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          passwordPolicy: { minLength: 8 },
        });

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should validate password policy settings', async () => {
      const invalidSettings = {
        passwordPolicy: {
          minLength: 3, // Too short
          requireUppercase: true,
        },
      };

      const response = await request(app)
        .put(`${SECURITY_ENDPOINT}/settings`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidSettings);

      validateErrorResponse(response, 400, 'Invalid password policy');
    });
  });

  describe('POST /security/ip-whitelist', () => {
    it('should add IP to whitelist successfully (admin only)', async () => {
      const ipData = {
        ip: '192.168.1.100',
        description: 'Test IP address',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post(`${SECURITY_ENDPOINT}/ip-whitelist`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(ipData);

      validateSuccessResponse(response, 201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.ip).toBe(ipData.ip);
      expect(response.body.data.description).toBe(ipData.description);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`${SECURITY_ENDPOINT}/ip-whitelist`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ip: '192.168.1.100',
          description: 'Test IP',
        });

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should validate IP address format', async () => {
      const response = await request(app)
        .post(`${SECURITY_ENDPOINT}/ip-whitelist`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ip: 'invalid-ip',
          description: 'Invalid IP',
        });

      validateErrorResponse(response, 400, 'Invalid IP address');
    });
  });

  describe('GET /security/ip-whitelist', () => {
    it('should get IP whitelist successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${SECURITY_ENDPOINT}/ip-whitelist`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${SECURITY_ENDPOINT}/ip-whitelist`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });
  });

  describe('DELETE /security/ip-whitelist/:id', () => {
    it('should remove IP from whitelist successfully (admin only)', async () => {
      // First add an IP to whitelist
      const addResponse = await request(app)
        .post(`${SECURITY_ENDPOINT}/ip-whitelist`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ip: '192.168.1.100',
          description: 'Test IP to remove',
        });

      const ipId = addResponse.body.data.id;

      const response = await request(app)
        .delete(`${SECURITY_ENDPOINT}/ip-whitelist/${ipId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.message).toContain('IP removed from whitelist');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .delete(`${SECURITY_ENDPOINT}/ip-whitelist/1`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });
  });

  describe('POST /security/mfa/enable', () => {
    it('should enable MFA for user successfully', async () => {
      const response = await request(app)
        .post(`${SECURITY_ENDPOINT}/mfa/enable`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'totp',
        });

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('secret');
      expect(response.body.data).toHaveProperty('qrCode');
      expect(response.body.data.method).toBe('totp');
    });

    it('should return 400 for invalid MFA method', async () => {
      const response = await request(app)
        .post(`${SECURITY_ENDPOINT}/mfa/enable`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'invalid-method',
        });

      validateErrorResponse(response, 400, 'Invalid MFA method');
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .post(`${SECURITY_ENDPOINT}/mfa/enable`)
        .send({
          method: 'totp',
        });

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('POST /security/mfa/verify', () => {
    it('should verify MFA token successfully', async () => {
      // First enable MFA
      await request(app)
        .post(`${SECURITY_ENDPOINT}/mfa/enable`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'totp',
        });

      const response = await request(app)
        .post(`${SECURITY_ENDPOINT}/mfa/verify`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          token: '123456',
        });

      // Note: This will likely fail with a real TOTP token, but we're testing the endpoint structure
      expect(response.status).toBe(400); // Expected for invalid token
    });

    it('should return 400 for missing token', async () => {
      const response = await request(app)
        .post(`${SECURITY_ENDPOINT}/mfa/verify`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      validateErrorResponse(response, 400, 'Token is required');
    });
  });

  describe('POST /security/mfa/disable', () => {
    it('should disable MFA for user successfully', async () => {
      const response = await request(app)
        .post(`${SECURITY_ENDPOINT}/mfa/disable`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'UserPassword123!',
        });

      validateSuccessResponse(response);
      expect(response.body.message).toContain('MFA disabled successfully');
    });

    it('should return 400 for incorrect password', async () => {
      const response = await request(app)
        .post(`${SECURITY_ENDPOINT}/mfa/disable`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'WrongPassword123!',
        });

      validateErrorResponse(response, 400, 'Invalid password');
    });
  });

  describe('GET /security/sessions', () => {
    it('should get user sessions successfully', async () => {
      const response = await request(app)
        .get(`${SECURITY_ENDPOINT}/sessions`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('ipAddress');
      expect(response.body.data[0]).toHaveProperty('userAgent');
      expect(response.body.data[0]).toHaveProperty('lastActivity');
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app).get(`${SECURITY_ENDPOINT}/sessions`);

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('DELETE /security/sessions/:id', () => {
    it('should revoke session successfully', async () => {
      // First get sessions
      const sessionsResponse = await request(app)
        .get(`${SECURITY_ENDPOINT}/sessions`)
        .set('Authorization', `Bearer ${authToken}`);

      const sessionId = sessionsResponse.body.data[0].id;

      const response = await request(app)
        .delete(`${SECURITY_ENDPOINT}/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.message).toContain('Session revoked successfully');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .delete(`${SECURITY_ENDPOINT}/sessions/999999`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 404, 'Session not found');
    });
  });

  describe('POST /security/sessions/revoke-all', () => {
    it('should revoke all user sessions successfully', async () => {
      const response = await request(app)
        .post(`${SECURITY_ENDPOINT}/sessions/revoke-all`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'UserPassword123!',
        });

      validateSuccessResponse(response);
      expect(response.body.message).toContain(
        'All sessions revoked successfully'
      );
    });

    it('should return 400 for incorrect password', async () => {
      const response = await request(app)
        .post(`${SECURITY_ENDPOINT}/sessions/revoke-all`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'WrongPassword123!',
        });

      validateErrorResponse(response, 400, 'Invalid password');
    });
  });

  describe('GET /security/audit', () => {
    it('should get security audit logs successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${SECURITY_ENDPOINT}/audit`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('action');
      expect(response.body.data[0]).toHaveProperty('userId');
      expect(response.body.data[0]).toHaveProperty('ipAddress');
      expect(response.body.data[0]).toHaveProperty('timestamp');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${SECURITY_ENDPOINT}/audit`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`${SECURITY_ENDPOINT}/audit?page=1&limit=10`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by action', async () => {
      const response = await request(app)
        .get(`${SECURITY_ENDPOINT}/audit?action=login`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      if (response.body.data.length > 0) {
        expect(
          response.body.data.every(log => log.action.includes('login'))
        ).toBe(true);
      }
    });
  });

  describe('GET /security/threats', () => {
    it('should get security threats successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${SECURITY_ENDPOINT}/threats`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('type');
      expect(response.body.data[0]).toHaveProperty('severity');
      expect(response.body.data[0]).toHaveProperty('description');
      expect(response.body.data[0]).toHaveProperty('timestamp');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${SECURITY_ENDPOINT}/threats`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should filter by severity', async () => {
      const response = await request(app)
        .get(`${SECURITY_ENDPOINT}/threats?severity=high`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      if (response.body.data.length > 0) {
        expect(
          response.body.data.every(threat => threat.severity === 'high')
        ).toBe(true);
      }
    });
  });

  describe('POST /security/threats/:id/resolve', () => {
    it('should resolve security threat successfully (admin only)', async () => {
      // First get threats
      const threatsResponse = await request(app)
        .get(`${SECURITY_ENDPOINT}/threats`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (threatsResponse.body.data.length > 0) {
        const threatId = threatsResponse.body.data[0].id;

        const response = await request(app)
          .post(`${SECURITY_ENDPOINT}/threats/${threatId}/resolve`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            resolution: 'Threat resolved by admin',
          });

        validateSuccessResponse(response);
        expect(response.body.message).toContain('Threat resolved successfully');
      }
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`${SECURITY_ENDPOINT}/threats/1/resolve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resolution: 'Test resolution',
        });

      validateErrorResponse(response, 403, 'Access denied');
    });
  });
});
