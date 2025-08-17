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
const MODULE_ENDPOINT = `${API_BASE_URL}/modules`;

// Test data constants
const TEST_LOGIN_DATA = {
  email: credentials.users.user.email,
  password: credentials.users.user.password,
  tenantSlug: credentials.tenants.primary.domain,
};

const TEST_MODULE_DATA = {
  name: 'Test Module',
  description: 'A test module for testing purposes',
  slug: 'test-module',
  version: '1.0.0',
  isActive: true,
  permissions: ['read', 'write', 'delete'],
  settings: {
    allowPublicAccess: false,
    maxUsers: 100,
    features: ['feature1', 'feature2'],
  },
};

describe('Module Management API - Comprehensive E2E Tests', () => {
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
    await prisma.module.deleteMany();
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
        name: 'Admin',
        description: 'Administrator role',
        tenantId: testTenant.id,
        permissions: ['module:read', 'module:write', 'module:delete', 'module:admin'],
      },
    });

    // Create regular role
    testRole = await prisma.role.create({
      data: {
        name: 'User',
        description: 'Regular user role',
        tenantId: testTenant.id,
        permissions: ['module:read'],
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

  describe('POST /modules', () => {
    it('should create a new module successfully (admin only)', async () => {
      const response = await request(app)
        .post(`${MODULE_ENDPOINT}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(TEST_MODULE_DATA);

      validateSuccessResponse(response, 201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(TEST_MODULE_DATA.name);
      expect(response.body.data.slug).toBe(TEST_MODULE_DATA.slug);
      expect(response.body.data.tenantId).toBe(testTenant.id);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`${MODULE_ENDPOINT}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(TEST_MODULE_DATA);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 400 for duplicate module slug', async () => {
      // Create first module
      await request(app)
        .post(`${MODULE_ENDPOINT}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(TEST_MODULE_DATA);

      // Try to create module with same slug
      const response = await request(app)
        .post(`${MODULE_ENDPOINT}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(TEST_MODULE_DATA);

      validateErrorResponse(response, 400, 'Module with this slug already exists');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        description: 'Missing required fields',
        // Missing name and slug
      };

      const response = await request(app)
        .post(`${MODULE_ENDPOINT}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      validateErrorResponse(response, 400);
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .post(`${MODULE_ENDPOINT}`)
        .send(TEST_MODULE_DATA);

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('GET /modules', () => {
    beforeEach(async () => {
      // Create test modules
      await prisma.module.createMany({
        data: [
          {
            ...TEST_MODULE_DATA,
            tenantId: testTenant.id,
          },
          {
            ...TEST_MODULE_DATA,
            name: 'Test Module 2',
            slug: 'test-module-2',
            tenantId: testTenant.id,
          },
          {
            ...TEST_MODULE_DATA,
            name: 'Inactive Module',
            slug: 'inactive-module',
            isActive: false,
            tenantId: testTenant.id,
          },
        ],
      });
    });

    it('should get all modules for the tenant', async () => {
      const response = await request(app)
        .get(`${MODULE_ENDPOINT}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('slug');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`${MODULE_ENDPOINT}?page=1&limit=1`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by active status', async () => {
      const response = await request(app)
        .get(`${MODULE_ENDPOINT}?isActive=true`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.every(module => module.isActive === true)).toBe(true);
    });

    it('should support search by name', async () => {
      const response = await request(app)
        .get(`${MODULE_ENDPOINT}?search=Test Module`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.every(module => 
        module.name.toLowerCase().includes('test module')
      )).toBe(true);
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .get(`${MODULE_ENDPOINT}`);

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('GET /modules/:id', () => {
    let testModule;

    beforeEach(async () => {
      testModule = await prisma.module.create({
        data: {
          ...TEST_MODULE_DATA,
          tenantId: testTenant.id,
        },
      });
    });

    it('should get module by ID successfully', async () => {
      const response = await request(app)
        .get(`${MODULE_ENDPOINT}/${testModule.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.id).toBe(testModule.id);
      expect(response.body.data.name).toBe(TEST_MODULE_DATA.name);
      expect(response.body.data.slug).toBe(TEST_MODULE_DATA.slug);
    });

    it('should return 404 for non-existent module', async () => {
      const response = await request(app)
        .get(`${MODULE_ENDPOINT}/999999`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 404, 'Module not found');
    });

    it('should return 403 for accessing module from different tenant', async () => {
      // Create another tenant and module
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          domain: 'other.com',
          isActive: true,
        },
      });

      const otherModule = await prisma.module.create({
        data: {
          ...TEST_MODULE_DATA,
          slug: 'other-module',
          tenantId: otherTenant.id,
        },
      });

      const response = await request(app)
        .get(`${MODULE_ENDPOINT}/${otherModule.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });
  });

  describe('PUT /modules/:id', () => {
    let testModule;

    beforeEach(async () => {
      testModule = await prisma.module.create({
        data: {
          ...TEST_MODULE_DATA,
          tenantId: testTenant.id,
        },
      });
    });

    it('should update module successfully (admin only)', async () => {
      const updateData = {
        name: 'Updated Module Name',
        description: 'Updated description',
        version: '2.0.0',
        isActive: false,
      };

      const response = await request(app)
        .put(`${MODULE_ENDPOINT}/${testModule.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      validateSuccessResponse(response);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.version).toBe(updateData.version);
      expect(response.body.data.isActive).toBe(updateData.isActive);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .put(`${MODULE_ENDPOINT}/${testModule.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent module', async () => {
      const response = await request(app)
        .put(`${MODULE_ENDPOINT}/999999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });

      validateErrorResponse(response, 404, 'Module not found');
    });

    it('should prevent duplicate slug updates', async () => {
      // Create another module
      const otherModule = await prisma.module.create({
        data: {
          ...TEST_MODULE_DATA,
          name: 'Other Module',
          slug: 'other-module',
          tenantId: testTenant.id,
        },
      });

      // Try to update first module with second module's slug
      const response = await request(app)
        .put(`${MODULE_ENDPOINT}/${testModule.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slug: 'other-module' });

      validateErrorResponse(response, 400, 'Module with this slug already exists');
    });
  });

  describe('DELETE /modules/:id', () => {
    let testModule;

    beforeEach(async () => {
      testModule = await prisma.module.create({
        data: {
          ...TEST_MODULE_DATA,
          tenantId: testTenant.id,
        },
      });
    });

    it('should delete module successfully (admin only)', async () => {
      const response = await request(app)
        .delete(`${MODULE_ENDPOINT}/${testModule.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.message).toContain('Module deleted successfully');

      // Verify module is deleted
      const deletedModule = await prisma.module.findUnique({
        where: { id: testModule.id },
      });
      expect(deletedModule).toBeNull();
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .delete(`${MODULE_ENDPOINT}/${testModule.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent module', async () => {
      const response = await request(app)
        .delete(`${MODULE_ENDPOINT}/999999`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateErrorResponse(response, 404, 'Module not found');
    });
  });

  describe('POST /modules/:id/activate', () => {
    let testModule;

    beforeEach(async () => {
      testModule = await prisma.module.create({
        data: {
          ...TEST_MODULE_DATA,
          isActive: false,
          tenantId: testTenant.id,
        },
      });
    });

    it('should activate module successfully (admin only)', async () => {
      const response = await request(app)
        .post(`${MODULE_ENDPOINT}/${testModule.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.isActive).toBe(true);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`${MODULE_ENDPOINT}/${testModule.id}/activate`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent module', async () => {
      const response = await request(app)
        .post(`${MODULE_ENDPOINT}/999999/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateErrorResponse(response, 404, 'Module not found');
    });
  });

  describe('POST /modules/:id/deactivate', () => {
    let testModule;

    beforeEach(async () => {
      testModule = await prisma.module.create({
        data: {
          ...TEST_MODULE_DATA,
          isActive: true,
          tenantId: testTenant.id,
        },
      });
    });

    it('should deactivate module successfully (admin only)', async () => {
      const response = await request(app)
        .post(`${MODULE_ENDPOINT}/${testModule.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.isActive).toBe(false);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`${MODULE_ENDPOINT}/${testModule.id}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent module', async () => {
      const response = await request(app)
        .post(`${MODULE_ENDPOINT}/999999/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateErrorResponse(response, 404, 'Module not found');
    });
  });

  describe('GET /modules/:id/permissions', () => {
    let testModule;

    beforeEach(async () => {
      testModule = await prisma.module.create({
        data: {
          ...TEST_MODULE_DATA,
          tenantId: testTenant.id,
        },
      });
    });

    it('should get module permissions successfully', async () => {
      const response = await request(app)
        .get(`${MODULE_ENDPOINT}/${testModule.id}/permissions`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('permissions');
      expect(response.body.data.permissions).toEqual(TEST_MODULE_DATA.permissions);
    });

    it('should return 404 for non-existent module', async () => {
      const response = await request(app)
        .get(`${MODULE_ENDPOINT}/999999/permissions`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 404, 'Module not found');
    });
  });

  describe('PUT /modules/:id/permissions', () => {
    let testModule;

    beforeEach(async () => {
      testModule = await prisma.module.create({
        data: {
          ...TEST_MODULE_DATA,
          tenantId: testTenant.id,
        },
      });
    });

    it('should update module permissions successfully (admin only)', async () => {
      const newPermissions = ['read', 'write', 'delete', 'admin'];

      const response = await request(app)
        .put(`${MODULE_ENDPOINT}/${testModule.id}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: newPermissions });

      validateSuccessResponse(response);
      expect(response.body.data.permissions).toEqual(newPermissions);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .put(`${MODULE_ENDPOINT}/${testModule.id}/permissions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ permissions: ['read', 'write'] });

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent module', async () => {
      const response = await request(app)
        .put(`${MODULE_ENDPOINT}/999999/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['read', 'write'] });

      validateErrorResponse(response, 404, 'Module not found');
    });
  });

  describe('GET /modules/analytics', () => {
    beforeEach(async () => {
      // Create multiple modules with different statuses
      await prisma.module.createMany({
        data: [
          {
            ...TEST_MODULE_DATA,
            tenantId: testTenant.id,
          },
          {
            ...TEST_MODULE_DATA,
            name: 'Active Module 2',
            slug: 'active-module-2',
            tenantId: testTenant.id,
          },
          {
            ...TEST_MODULE_DATA,
            name: 'Inactive Module',
            slug: 'inactive-module',
            isActive: false,
            tenantId: testTenant.id,
          },
        ],
      });
    });

    it('should get module analytics successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${MODULE_ENDPOINT}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('totalModules');
      expect(response.body.data).toHaveProperty('activeModules');
      expect(response.body.data).toHaveProperty('inactiveModules');
      expect(response.body.data).toHaveProperty('moduleUsage');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${MODULE_ENDPOINT}/analytics`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });
  });
});
