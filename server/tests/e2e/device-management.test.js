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
const DEVICE_ENDPOINT = `${API_BASE_URL}/devices`;

// Test data constants
const TEST_LOGIN_DATA = {
  email: credentials.users.user.email,
  password: credentials.users.user.password,
  tenantSlug: credentials.tenants.primary.domain,
};

const TEST_DEVICE_DATA = {
  deviceId: 'test-device-123',
  deviceName: 'Test Device',
  deviceType: 'mobile',
  os: 'iOS',
  osVersion: '15.0',
  browser: 'Safari',
  browserVersion: '15.0',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
  location: 'New York, NY',
  isTrusted: false,
};

describe('Device Management API - Comprehensive E2E Tests', () => {
  let testUser, testTenant, testRole;
  let authToken, refreshToken;

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
    await prisma.loginDevice.deleteMany();
    await prisma.refreshToken.deleteMany();
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

    // Create test role
    testRole = await prisma.role.create({
      data: {
        name: 'Test Role',
        description: 'Test role for device management',
        tenantId: testTenant.id,
        permissions: ['device:read', 'device:write', 'device:delete'],
      },
    });

    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'testuser@test.com',
        password: hashedPassword,
        name: 'Test User',
        tenantId: testTenant.id,
        isActive: true,
      },
    });

    // Assign role to user
    await prisma.userRole.create({
      data: {
        userId: testUser.id,
        roleId: testRole.id,
      },
    });

    // Login to get auth token
    const loginResponse = await request(app)
      .post(`${API_BASE_URL}/auth/login`)
      .send(TEST_LOGIN_DATA);

    authToken = loginResponse.body.data.accessToken;
    refreshToken = loginResponse.body.data.refreshToken;
  });

  describe('POST /devices/register', () => {
    it('should register a new device successfully', async () => {
      const response = await request(app)
        .post(`${DEVICE_ENDPOINT}/register`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(TEST_DEVICE_DATA);

      validateSuccessResponse(response, 201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.deviceId).toBe(TEST_DEVICE_DATA.deviceId);
      expect(response.body.data.deviceName).toBe(TEST_DEVICE_DATA.deviceName);
      expect(response.body.data.userId).toBe(testUser.id);
    });

    it('should return 400 for duplicate device registration', async () => {
      // Register device first time
      await request(app)
        .post(`${DEVICE_ENDPOINT}/register`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(TEST_DEVICE_DATA);

      // Try to register same device again
      const response = await request(app)
        .post(`${DEVICE_ENDPOINT}/register`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(TEST_DEVICE_DATA);

      validateErrorResponse(response, 400, 'Device already registered');
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .post(`${DEVICE_ENDPOINT}/register`)
        .send(TEST_DEVICE_DATA);

      validateErrorResponse(response, 401, 'Unauthorized');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        deviceName: 'Test Device',
        // Missing required fields
      };

      const response = await request(app)
        .post(`${DEVICE_ENDPOINT}/register`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      validateErrorResponse(response, 400);
    });
  });

  describe('GET /devices', () => {
    beforeEach(async () => {
      // Create test devices
      await prisma.loginDevice.createMany({
        data: [
          {
            ...TEST_DEVICE_DATA,
            userId: testUser.id,
            tenantId: testTenant.id,
          },
          {
            ...TEST_DEVICE_DATA,
            deviceId: 'test-device-456',
            deviceName: 'Test Device 2',
            userId: testUser.id,
            tenantId: testTenant.id,
          },
        ],
      });
    });

    it('should get all devices for the authenticated user', async () => {
      const response = await request(app)
        .get(`${DEVICE_ENDPOINT}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('deviceName');
      expect(response.body.data[0]).toHaveProperty('deviceType');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`${DEVICE_ENDPOINT}?page=1&limit=1`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
    });

    it('should support filtering by device type', async () => {
      const response = await request(app)
        .get(`${DEVICE_ENDPOINT}?deviceType=mobile`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.every(device => device.deviceType === 'mobile')).toBe(true);
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .get(`${DEVICE_ENDPOINT}`);

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('GET /devices/:id', () => {
    let testDevice;

    beforeEach(async () => {
      testDevice = await prisma.loginDevice.create({
        data: {
          ...TEST_DEVICE_DATA,
          userId: testUser.id,
          tenantId: testTenant.id,
        },
      });
    });

    it('should get device by ID successfully', async () => {
      const response = await request(app)
        .get(`${DEVICE_ENDPOINT}/${testDevice.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.id).toBe(testDevice.id);
      expect(response.body.data.deviceName).toBe(TEST_DEVICE_DATA.deviceName);
    });

    it('should return 404 for non-existent device', async () => {
      const response = await request(app)
        .get(`${DEVICE_ENDPOINT}/999999`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 404, 'Device not found');
    });

    it('should return 403 for accessing other user device', async () => {
      // Create another user and device
      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@test.com',
          password: await bcrypt.hash('Password123!', 10),
          name: 'Other User',
          tenantId: testTenant.id,
          isActive: true,
        },
      });

      const otherDevice = await prisma.loginDevice.create({
        data: {
          ...TEST_DEVICE_DATA,
          deviceId: 'other-device-123',
          userId: otherUser.id,
          tenantId: testTenant.id,
        },
      });

      const response = await request(app)
        .get(`${DEVICE_ENDPOINT}/${otherDevice.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });
  });

  describe('PUT /devices/:id', () => {
    let testDevice;

    beforeEach(async () => {
      testDevice = await prisma.loginDevice.create({
        data: {
          ...TEST_DEVICE_DATA,
          userId: testUser.id,
          tenantId: testTenant.id,
        },
      });
    });

    it('should update device successfully', async () => {
      const updateData = {
        deviceName: 'Updated Device Name',
        isTrusted: true,
        location: 'San Francisco, CA',
      };

      const response = await request(app)
        .put(`${DEVICE_ENDPOINT}/${testDevice.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      validateSuccessResponse(response);
      expect(response.body.data.deviceName).toBe(updateData.deviceName);
      expect(response.body.data.isTrusted).toBe(updateData.isTrusted);
      expect(response.body.data.location).toBe(updateData.location);
    });

    it('should return 404 for non-existent device', async () => {
      const response = await request(app)
        .put(`${DEVICE_ENDPOINT}/999999`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deviceName: 'Updated Name' });

      validateErrorResponse(response, 404, 'Device not found');
    });

    it('should return 403 for updating other user device', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@test.com',
          password: await bcrypt.hash('Password123!', 10),
          name: 'Other User',
          tenantId: testTenant.id,
          isActive: true,
        },
      });

      const otherDevice = await prisma.loginDevice.create({
        data: {
          ...TEST_DEVICE_DATA,
          deviceId: 'other-device-123',
          userId: otherUser.id,
          tenantId: testTenant.id,
        },
      });

      const response = await request(app)
        .put(`${DEVICE_ENDPOINT}/${otherDevice.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deviceName: 'Updated Name' });

      validateErrorResponse(response, 403, 'Access denied');
    });
  });

  describe('DELETE /devices/:id', () => {
    let testDevice;

    beforeEach(async () => {
      testDevice = await prisma.loginDevice.create({
        data: {
          ...TEST_DEVICE_DATA,
          userId: testUser.id,
          tenantId: testTenant.id,
        },
      });
    });

    it('should delete device successfully', async () => {
      const response = await request(app)
        .delete(`${DEVICE_ENDPOINT}/${testDevice.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response, 200);
      expect(response.body.message).toContain('Device deleted successfully');

      // Verify device is deleted
      const deletedDevice = await prisma.loginDevice.findUnique({
        where: { id: testDevice.id },
      });
      expect(deletedDevice).toBeNull();
    });

    it('should return 404 for non-existent device', async () => {
      const response = await request(app)
        .delete(`${DEVICE_ENDPOINT}/999999`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 404, 'Device not found');
    });

    it('should return 403 for deleting other user device', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@test.com',
          password: await bcrypt.hash('Password123!', 10),
          name: 'Other User',
          tenantId: testTenant.id,
          isActive: true,
        },
      });

      const otherDevice = await prisma.loginDevice.create({
        data: {
          ...TEST_DEVICE_DATA,
          deviceId: 'other-device-123',
          userId: otherUser.id,
          tenantId: testTenant.id,
        },
      });

      const response = await request(app)
        .delete(`${DEVICE_ENDPOINT}/${otherDevice.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });
  });

  describe('POST /devices/:id/trust', () => {
    let testDevice;

    beforeEach(async () => {
      testDevice = await prisma.loginDevice.create({
        data: {
          ...TEST_DEVICE_DATA,
          userId: testUser.id,
          tenantId: testTenant.id,
          isTrusted: false,
        },
      });
    });

    it('should trust device successfully', async () => {
      const response = await request(app)
        .post(`${DEVICE_ENDPOINT}/${testDevice.id}/trust`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.isTrusted).toBe(true);
    });

    it('should return 404 for non-existent device', async () => {
      const response = await request(app)
        .post(`${DEVICE_ENDPOINT}/999999/trust`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 404, 'Device not found');
    });
  });

  describe('POST /devices/:id/revoke', () => {
    let testDevice;

    beforeEach(async () => {
      testDevice = await prisma.loginDevice.create({
        data: {
          ...TEST_DEVICE_DATA,
          userId: testUser.id,
          tenantId: testTenant.id,
          isTrusted: true,
        },
      });
    });

    it('should revoke device trust successfully', async () => {
      const response = await request(app)
        .post(`${DEVICE_ENDPOINT}/${testDevice.id}/revoke`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.isTrusted).toBe(false);
    });

    it('should return 404 for non-existent device', async () => {
      const response = await request(app)
        .post(`${DEVICE_ENDPOINT}/999999/revoke`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 404, 'Device not found');
    });
  });

  describe('GET /devices/analytics', () => {
    beforeEach(async () => {
      // Create multiple devices with different types
      await prisma.loginDevice.createMany({
        data: [
          {
            ...TEST_DEVICE_DATA,
            deviceType: 'mobile',
            userId: testUser.id,
            tenantId: testTenant.id,
          },
          {
            ...TEST_DEVICE_DATA,
            deviceId: 'test-device-456',
            deviceType: 'desktop',
            userId: testUser.id,
            tenantId: testTenant.id,
          },
          {
            ...TEST_DEVICE_DATA,
            deviceId: 'test-device-789',
            deviceType: 'tablet',
            userId: testUser.id,
            tenantId: testTenant.id,
          },
        ],
      });
    });

    it('should get device analytics successfully', async () => {
      const response = await request(app)
        .get(`${DEVICE_ENDPOINT}/analytics`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('totalDevices');
      expect(response.body.data).toHaveProperty('deviceTypes');
      expect(response.body.data).toHaveProperty('trustedDevices');
      expect(response.body.data).toHaveProperty('recentActivity');
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .get(`${DEVICE_ENDPOINT}/analytics`);

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });
});
