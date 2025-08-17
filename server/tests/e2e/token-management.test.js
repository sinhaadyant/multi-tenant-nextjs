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
const TOKEN_ENDPOINT = `${API_BASE_URL}/tokens`;

// Test data constants
const TEST_LOGIN_DATA = {
  email: credentials.users.user.email,
  password: credentials.users.user.password,
  tenantSlug: credentials.tenants.primary.domain,
};

describe('Token Management API - Comprehensive E2E Tests', () => {
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
    await prisma.refreshToken.deleteMany();
    await prisma.resetToken.deleteMany();
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
        name: 'Token Admin',
        description: 'Token administrator role',
        tenantId: testTenant.id,
        permissions: [
          'token:read',
          'token:write',
          'token:delete',
          'token:admin',
        ],
      },
    });

    // Create regular role
    testRole = await prisma.role.create({
      data: {
        name: 'User',
        description: 'Regular user role',
        tenantId: testTenant.id,
        permissions: ['token:read', 'token:write'],
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

  describe('POST /tokens/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      // Create a refresh token for testing
      refreshToken = await prisma.refreshToken.create({
        data: {
          token: 'test-refresh-token-123',
          userId: testUser.id,
          tenantId: testTenant.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          isRevoked: false,
        },
      });
    });

    it('should refresh access token successfully', async () => {
      const response = await request(app)
        .post(`${TOKEN_ENDPOINT}/refresh`)
        .send({
          refreshToken: refreshToken.token,
          tenantSlug: 'test.com',
        });

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return 400 for invalid refresh token', async () => {
      const response = await request(app)
        .post(`${TOKEN_ENDPOINT}/refresh`)
        .send({
          refreshToken: 'invalid-token',
          tenantSlug: 'test.com',
        });

      validateErrorResponse(response, 400, 'Invalid refresh token');
    });

    it('should return 400 for expired refresh token', async () => {
      // Create an expired refresh token
      const expiredToken = await prisma.refreshToken.create({
        data: {
          token: 'expired-refresh-token',
          userId: testUser.id,
          tenantId: testTenant.id,
          expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          isRevoked: false,
        },
      });

      const response = await request(app)
        .post(`${TOKEN_ENDPOINT}/refresh`)
        .send({
          refreshToken: expiredToken.token,
          tenantSlug: 'test.com',
        });

      validateErrorResponse(response, 400, 'Refresh token expired');
    });

    it('should return 400 for revoked refresh token', async () => {
      // Create a revoked refresh token
      const revokedToken = await prisma.refreshToken.create({
        data: {
          token: 'revoked-refresh-token',
          userId: testUser.id,
          tenantId: testTenant.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isRevoked: true,
        },
      });

      const response = await request(app)
        .post(`${TOKEN_ENDPOINT}/refresh`)
        .send({
          refreshToken: revokedToken.token,
          tenantSlug: 'test.com',
        });

      validateErrorResponse(response, 400, 'Refresh token revoked');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post(`${TOKEN_ENDPOINT}/refresh`)
        .send({
          tenantSlug: 'test.com',
          // Missing refreshToken
        });

      validateErrorResponse(response, 400);
    });
  });

  describe('POST /tokens/revoke', () => {
    let refreshToken;

    beforeEach(async () => {
      // Create a refresh token for testing
      refreshToken = await prisma.refreshToken.create({
        data: {
          token: 'test-refresh-token-123',
          userId: testUser.id,
          tenantId: testTenant.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isRevoked: false,
        },
      });
    });

    it('should revoke refresh token successfully', async () => {
      const response = await request(app)
        .post(`${TOKEN_ENDPOINT}/revoke`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          refreshToken: refreshToken.token,
        });

      validateSuccessResponse(response);
      expect(response.body.message).toContain('Token revoked successfully');

      // Verify token is revoked
      const revokedToken = await prisma.refreshToken.findUnique({
        where: { id: refreshToken.id },
      });
      expect(revokedToken.isRevoked).toBe(true);
    });

    it('should return 400 for invalid refresh token', async () => {
      const response = await request(app)
        .post(`${TOKEN_ENDPOINT}/revoke`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          refreshToken: 'invalid-token',
        });

      validateErrorResponse(response, 400, 'Invalid refresh token');
    });

    it('should return 400 for already revoked token', async () => {
      // Revoke the token first
      await prisma.refreshToken.update({
        where: { id: refreshToken.id },
        data: { isRevoked: true },
      });

      const response = await request(app)
        .post(`${TOKEN_ENDPOINT}/revoke`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          refreshToken: refreshToken.token,
        });

      validateErrorResponse(response, 400, 'Token already revoked');
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .post(`${TOKEN_ENDPOINT}/revoke`)
        .send({
          refreshToken: refreshToken.token,
        });

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('GET /tokens/refresh', () => {
    beforeEach(async () => {
      // Create multiple refresh tokens
      await prisma.refreshToken.createMany({
        data: [
          {
            token: 'refresh-token-1',
            userId: testUser.id,
            tenantId: testTenant.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isRevoked: false,
          },
          {
            token: 'refresh-token-2',
            userId: testUser.id,
            tenantId: testTenant.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isRevoked: false,
          },
          {
            token: 'revoked-token',
            userId: testUser.id,
            tenantId: testTenant.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isRevoked: true,
          },
        ],
      });
    });

    it('should get all refresh tokens for the user', async () => {
      const response = await request(app)
        .get(`${TOKEN_ENDPOINT}/refresh`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('token');
      expect(response.body.data[0]).toHaveProperty('expiresAt');
      expect(response.body.data[0]).toHaveProperty('isRevoked');
    });

    it('should filter by revoked status', async () => {
      const response = await request(app)
        .get(`${TOKEN_ENDPOINT}/refresh?isRevoked=false`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.every(token => token.isRevoked === false)).toBe(
        true
      );
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app).get(`${TOKEN_ENDPOINT}/refresh`);

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('DELETE /tokens/refresh/:id', () => {
    let refreshToken;

    beforeEach(async () => {
      refreshToken = await prisma.refreshToken.create({
        data: {
          token: 'test-refresh-token-123',
          userId: testUser.id,
          tenantId: testTenant.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isRevoked: false,
        },
      });
    });

    it('should delete refresh token successfully', async () => {
      const response = await request(app)
        .delete(`${TOKEN_ENDPOINT}/refresh/${refreshToken.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.message).toContain('Token deleted successfully');

      // Verify token is deleted
      const deletedToken = await prisma.refreshToken.findUnique({
        where: { id: refreshToken.id },
      });
      expect(deletedToken).toBeNull();
    });

    it('should return 404 for non-existent token', async () => {
      const response = await request(app)
        .delete(`${TOKEN_ENDPOINT}/refresh/999999`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 404, 'Token not found');
    });

    it('should return 403 for deleting other user token', async () => {
      // Create another user and token
      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@test.com',
          password: await bcrypt.hash('Password123!', 10),
          name: 'Other User',
          tenantId: testTenant.id,
          isActive: true,
        },
      });

      const otherToken = await prisma.refreshToken.create({
        data: {
          token: 'other-refresh-token',
          userId: otherUser.id,
          tenantId: testTenant.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isRevoked: false,
        },
      });

      const response = await request(app)
        .delete(`${TOKEN_ENDPOINT}/refresh/${otherToken.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app).delete(
        `${TOKEN_ENDPOINT}/refresh/${refreshToken.id}`
      );

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('POST /tokens/revoke-all', () => {
    beforeEach(async () => {
      // Create multiple refresh tokens for the user
      await prisma.refreshToken.createMany({
        data: [
          {
            token: 'refresh-token-1',
            userId: testUser.id,
            tenantId: testTenant.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isRevoked: false,
          },
          {
            token: 'refresh-token-2',
            userId: testUser.id,
            tenantId: testTenant.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isRevoked: false,
          },
          {
            token: 'refresh-token-3',
            userId: testUser.id,
            tenantId: testTenant.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isRevoked: false,
          },
        ],
      });
    });

    it('should revoke all refresh tokens for the user', async () => {
      const response = await request(app)
        .post(`${TOKEN_ENDPOINT}/revoke-all`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.message).toContain(
        'All tokens revoked successfully'
      );

      // Verify all tokens are revoked
      const revokedTokens = await prisma.refreshToken.findMany({
        where: { userId: testUser.id, isRevoked: false },
      });
      expect(revokedTokens).toHaveLength(0);
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app).post(`${TOKEN_ENDPOINT}/revoke-all`);

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('GET /tokens/validate', () => {
    it('should validate access token successfully', async () => {
      const response = await request(app)
        .get(`${TOKEN_ENDPOINT}/validate`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('valid');
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('email');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get(`${TOKEN_ENDPOINT}/validate`)
        .set('Authorization', 'Bearer invalid-token');

      validateErrorResponse(response, 401, 'Invalid token');
    });

    it('should return 401 for missing token', async () => {
      const response = await request(app).get(`${TOKEN_ENDPOINT}/validate`);

      validateErrorResponse(response, 401, 'No token provided');
    });
  });

  describe('GET /tokens/analytics', () => {
    beforeEach(async () => {
      // Create tokens with different statuses
      await prisma.refreshToken.createMany({
        data: [
          {
            token: 'active-token-1',
            userId: testUser.id,
            tenantId: testTenant.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isRevoked: false,
          },
          {
            token: 'active-token-2',
            userId: testUser.id,
            tenantId: testTenant.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isRevoked: false,
          },
          {
            token: 'revoked-token-1',
            userId: testUser.id,
            tenantId: testTenant.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isRevoked: true,
          },
          {
            token: 'expired-token',
            userId: testUser.id,
            tenantId: testTenant.id,
            expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
            isRevoked: false,
          },
        ],
      });
    });

    it('should get token analytics successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${TOKEN_ENDPOINT}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('totalTokens');
      expect(response.body.data).toHaveProperty('activeTokens');
      expect(response.body.data).toHaveProperty('revokedTokens');
      expect(response.body.data).toHaveProperty('expiredTokens');
      expect(response.body.data).toHaveProperty('tokensByUser');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${TOKEN_ENDPOINT}/analytics`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });
  });
});
