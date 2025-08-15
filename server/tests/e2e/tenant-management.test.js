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

describe('Tenant Management API - E2E Tests', () => {
  let superadminUser;
  let regularUser;
  let testTenant;
  let superadminToken;
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

    // Create superadmin user
    const superadminPassword = await bcrypt.hash(
      credentials.users.superadmin.password,
      12
    );
    superadminUser = await prisma.user.create({
      data: {
        email: credentials.users.superadmin.email,
        passwordHash: superadminPassword,
        name: credentials.users.superadmin.name,
        tenantId: testTenant.id,
        isActive: credentials.users.superadmin.isActive,
        isSuperadmin: credentials.users.superadmin.isSuperadmin,
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
    const superadminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'superadmin@test.com',
        password: 'SuperadminPassword123!',
      });

    const userLoginResponse = await request(app).post('/api/auth/login').send({
      email: 'user@test.com',
      password: 'UserPassword123!',
    });

    superadminToken = superadminLoginResponse.body.data.accessToken;
    userToken = userLoginResponse.body.data.accessToken;

    console.log('✅ Test data prepared');
  });

  describe('GET /api/tenants', () => {
    test('should get all tenants with superadmin permissions', async () => {
      const response = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tenants');
      expect(Array.isArray(response.body.data.tenants)).toBe(true);
      expect(response.body.data.tenants.length).toBeGreaterThan(0);

      // Verify tenant data structure
      const tenant = response.body.data.tenants[0];
      expect(tenant).toHaveProperty('id');
      expect(tenant).toHaveProperty('name');
      expect(tenant).toHaveProperty('domain');
      expect(tenant).toHaveProperty('isActive');

      console.log('✅ Get all tenants successful with superadmin permissions');
    });

    test('should get tenants with pagination', async () => {
      const response = await request(app)
        .get('/api/tenants?page=1&limit=5')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tenants');
      expect(response.body.data).toHaveProperty('meta');
      expect(response.body.data.meta).toHaveProperty('page');
      expect(response.body.data.meta).toHaveProperty('limit');
      expect(response.body.data.meta).toHaveProperty('total');
      expect(response.body.data.meta).toHaveProperty('totalPages');

      console.log('✅ Get tenants with pagination successful');
    });

    test('should get tenants with search filter', async () => {
      const response = await request(app)
        .get('/api/tenants?search=test')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tenants.length).toBeGreaterThan(0);

      // Verify search results contain 'test'
      const hasTestTenant = response.body.data.tenants.some(
        tenant =>
          tenant.name.toLowerCase().includes('test') ||
          tenant.domain.toLowerCase().includes('test')
      );
      expect(hasTestTenant).toBe(true);

      console.log('✅ Get tenants with search filter successful');
    });

    test('should get tenants with status filter', async () => {
      const response = await request(app)
        .get('/api/tenants?isActive=true')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify all returned tenants are active
      const allActive = response.body.data.tenants.every(
        tenant => tenant.isActive === true
      );
      expect(allActive).toBe(true);

      console.log('✅ Get tenants with status filter successful');
    });

    test('should fail to get tenants without authentication', async () => {
      const response = await request(app).get('/api/tenants').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get tenants failed without authentication');
    });

    test('should fail to get tenants with insufficient permissions', async () => {
      const response = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');

      console.log('✅ Get tenants failed with insufficient permissions');
    });
  });

  describe('POST /api/tenants', () => {
    test('should create new tenant with valid data', async () => {
      const newTenantData = {
        name: 'New Tenant',
        domain: 'newtenant.com',
        isActive: true,
        settings: {
          maxUsers: 100,
          features: ['user-management', 'role-management'],
        },
      };

      const response = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(newTenantData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tenant');
      expect(response.body.data.tenant.name).toBe(newTenantData.name);
      expect(response.body.data.tenant.domain).toBe(newTenantData.domain);
      expect(response.body.data.tenant.isActive).toBe(newTenantData.isActive);

      // Verify tenant was created in database
      const createdTenant = await prisma.tenant.findUnique({
        where: { domain: newTenantData.domain },
      });
      expect(createdTenant).toBeDefined();
      expect(createdTenant.name).toBe(newTenantData.name);

      console.log('✅ Create new tenant successful');
    });

    test('should fail to create tenant with duplicate domain', async () => {
      const newTenantData = {
        name: 'Duplicate Tenant',
        domain: 'test.com', // Already exists
        isActive: true,
      };

      const response = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(newTenantData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        'Tenant with this domain already exists'
      );

      console.log('✅ Create tenant failed with duplicate domain');
    });

    test('should fail to create tenant with invalid domain format', async () => {
      const newTenantData = {
        name: 'Invalid Tenant',
        domain: 'invalid-domain', // Invalid format
        isActive: true,
      };

      const response = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(newTenantData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid domain format');

      console.log('✅ Create tenant failed with invalid domain format');
    });

    test('should fail to create tenant without required fields', async () => {
      const newTenantData = {
        isActive: true,
        // Missing name and domain
      };

      const response = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(newTenantData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');

      console.log('✅ Create tenant failed without required fields');
    });

    test('should fail to create tenant without authentication', async () => {
      const newTenantData = {
        name: 'New Tenant',
        domain: 'newtenant.com',
        isActive: true,
      };

      const response = await request(app)
        .post('/api/tenants')
        .send(newTenantData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Create tenant failed without authentication');
    });

    test('should fail to create tenant with insufficient permissions', async () => {
      const newTenantData = {
        name: 'New Tenant',
        domain: 'newtenant.com',
        isActive: true,
      };

      const response = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newTenantData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');

      console.log('✅ Create tenant failed with insufficient permissions');
    });
  });

  describe('GET /api/tenants/:id', () => {
    test('should get tenant by ID with superadmin permissions', async () => {
      const response = await request(app)
        .get(`/api/tenants/${testTenant.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tenant');
      expect(response.body.data.tenant.id).toBe(testTenant.id);
      expect(response.body.data.tenant.name).toBe(testTenant.name);
      expect(response.body.data.tenant.domain).toBe(testTenant.domain);

      console.log('✅ Get tenant by ID successful');
    });

    test('should fail to get non-existent tenant', async () => {
      const response = await request(app)
        .get('/api/tenants/non-existent-id')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Tenant not found');

      console.log('✅ Get non-existent tenant failed');
    });

    test('should fail to get tenant without authentication', async () => {
      const response = await request(app)
        .get(`/api/tenants/${testTenant.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get tenant failed without authentication');
    });

    test('should fail to get tenant with insufficient permissions', async () => {
      const response = await request(app)
        .get(`/api/tenants/${testTenant.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');

      console.log('✅ Get tenant failed with insufficient permissions');
    });
  });

  describe('PUT /api/tenants/:id', () => {
    test('should update tenant with valid data', async () => {
      const updateData = {
        name: 'Updated Tenant Name',
        domain: 'updated.com',
        isActive: false,
        settings: {
          maxUsers: 200,
          features: ['user-management', 'role-management', 'analytics'],
        },
      };

      const response = await request(app)
        .put(`/api/tenants/${testTenant.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tenant');
      expect(response.body.data.tenant.name).toBe(updateData.name);
      expect(response.body.data.tenant.domain).toBe(updateData.domain);
      expect(response.body.data.tenant.isActive).toBe(updateData.isActive);

      // Verify tenant was updated in database
      const updatedTenant = await prisma.tenant.findUnique({
        where: { id: testTenant.id },
      });
      expect(updatedTenant.name).toBe(updateData.name);
      expect(updatedTenant.domain).toBe(updateData.domain);

      console.log('✅ Update tenant successful');
    });

    test('should fail to update tenant with duplicate domain', async () => {
      // Create another tenant first
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          domain: 'other.com',
          isActive: true,
        },
      });

      const updateData = {
        domain: 'other.com', // Already exists
      };

      const response = await request(app)
        .put(`/api/tenants/${testTenant.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Domain already exists');

      console.log('✅ Update tenant failed with duplicate domain');
    });

    test('should fail to update non-existent tenant', async () => {
      const updateData = {
        name: 'Updated Tenant',
        domain: 'updated.com',
      };

      const response = await request(app)
        .put('/api/tenants/non-existent-id')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Tenant not found');

      console.log('✅ Update non-existent tenant failed');
    });

    test('should fail to update tenant without authentication', async () => {
      const updateData = {
        name: 'Updated Tenant',
        domain: 'updated.com',
      };

      const response = await request(app)
        .put(`/api/tenants/${testTenant.id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Update tenant failed without authentication');
    });

    test('should fail to update tenant with insufficient permissions', async () => {
      const updateData = {
        name: 'Updated Tenant',
        domain: 'updated.com',
      };

      const response = await request(app)
        .put(`/api/tenants/${testTenant.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');

      console.log('✅ Update tenant failed with insufficient permissions');
    });
  });

  describe('DELETE /api/tenants/:id', () => {
    test('should delete tenant with superadmin permissions', async () => {
      // Create a tenant to delete
      const tenantToDelete = await prisma.tenant.create({
        data: {
          name: 'Tenant to Delete',
          domain: 'deleteme.com',
          isActive: true,
        },
      });

      const response = await request(app)
        .delete(`/api/tenants/${tenantToDelete.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Tenant deleted successfully');

      // Verify tenant was deleted from database
      const deletedTenant = await prisma.tenant.findUnique({
        where: { id: tenantToDelete.id },
      });
      expect(deletedTenant).toBeNull();

      console.log('✅ Delete tenant successful');
    });

    test('should fail to delete tenant with associated users', async () => {
      const response = await request(app)
        .delete(`/api/tenants/${testTenant.id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        'Cannot delete tenant with associated users'
      );

      console.log('✅ Delete tenant failed when it has associated users');
    });

    test('should fail to delete non-existent tenant', async () => {
      const response = await request(app)
        .delete('/api/tenants/non-existent-id')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Tenant not found');

      console.log('✅ Delete non-existent tenant failed');
    });

    test('should fail to delete tenant without authentication', async () => {
      const response = await request(app)
        .delete(`/api/tenants/${testTenant.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Delete tenant failed without authentication');
    });

    test('should fail to delete tenant with insufficient permissions', async () => {
      const response = await request(app)
        .delete(`/api/tenants/${testTenant.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');

      console.log('✅ Delete tenant failed with insufficient permissions');
    });
  });

  describe('GET /api/tenants/:id/users', () => {
    test('should get tenant users with superadmin permissions', async () => {
      const response = await request(app)
        .get(`/api/tenants/${testTenant.id}/users`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);

      // Verify all users belong to the tenant
      const allBelongToTenant = response.body.data.users.every(
        user => user.tenantId === testTenant.id
      );
      expect(allBelongToTenant).toBe(true);

      console.log('✅ Get tenant users successful');
    });

    test('should fail to get users for non-existent tenant', async () => {
      const response = await request(app)
        .get('/api/tenants/non-existent-id/users')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Tenant not found');

      console.log('✅ Get users for non-existent tenant failed');
    });

    test('should fail to get tenant users without authentication', async () => {
      const response = await request(app)
        .get(`/api/tenants/${testTenant.id}/users`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get tenant users failed without authentication');
    });

    test('should fail to get tenant users with insufficient permissions', async () => {
      const response = await request(app)
        .get(`/api/tenants/${testTenant.id}/users`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');

      console.log('✅ Get tenant users failed with insufficient permissions');
    });
  });

  describe('GET /api/tenants/stats', () => {
    test('should get tenant statistics with superadmin permissions', async () => {
      const response = await request(app)
        .get('/api/tenants/stats')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats).toHaveProperty('totalTenants');
      expect(response.body.data.stats).toHaveProperty('activeTenants');
      expect(response.body.data.stats).toHaveProperty('inactiveTenants');

      console.log('✅ Get tenant statistics successful');
    });

    test('should fail to get tenant statistics without authentication', async () => {
      const response = await request(app).get('/api/tenants/stats').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get tenant statistics failed without authentication');
    });

    test('should fail to get tenant statistics with insufficient permissions', async () => {
      const response = await request(app)
        .get('/api/tenants/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');

      console.log(
        '✅ Get tenant statistics failed with insufficient permissions'
      );
    });
  });

  describe('POST /api/tenants/bulk', () => {
    test('should perform bulk activate operation', async () => {
      // Create inactive tenants
      const inactiveTenant1 = await prisma.tenant.create({
        data: {
          name: 'Inactive Tenant 1',
          domain: 'inactive1.com',
          isActive: false,
        },
      });

      const inactiveTenant2 = await prisma.tenant.create({
        data: {
          name: 'Inactive Tenant 2',
          domain: 'inactive2.com',
          isActive: false,
        },
      });

      const bulkData = {
        tenantIds: [inactiveTenant1.id, inactiveTenant2.id],
        action: 'activate',
        reason: 'Bulk activation test',
      };

      const response = await request(app)
        .post('/api/tenants/bulk')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(
        '2 tenants activated successfully'
      );

      // Verify tenants were activated in database
      const activatedTenant1 = await prisma.tenant.findUnique({
        where: { id: inactiveTenant1.id },
      });
      const activatedTenant2 = await prisma.tenant.findUnique({
        where: { id: inactiveTenant2.id },
      });
      expect(activatedTenant1.isActive).toBe(true);
      expect(activatedTenant2.isActive).toBe(true);

      console.log('✅ Bulk activate operation successful');
    });

    test('should perform bulk deactivate operation', async () => {
      const bulkData = {
        tenantIds: [testTenant.id],
        action: 'deactivate',
        reason: 'Bulk deactivation test',
      };

      const response = await request(app)
        .post('/api/tenants/bulk')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(
        '1 tenants deactivated successfully'
      );

      // Verify tenant was deactivated in database
      const deactivatedTenant = await prisma.tenant.findUnique({
        where: { id: testTenant.id },
      });
      expect(deactivatedTenant.isActive).toBe(false);

      console.log('✅ Bulk deactivate operation successful');
    });

    test('should fail bulk operation with invalid action', async () => {
      const bulkData = {
        tenantIds: [testTenant.id],
        action: 'invalid-action',
        reason: 'Test',
      };

      const response = await request(app)
        .post('/api/tenants/bulk')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(bulkData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');

      console.log('✅ Bulk operation failed with invalid action');
    });

    test('should fail bulk operation without authentication', async () => {
      const bulkData = {
        tenantIds: [testTenant.id],
        action: 'activate',
        reason: 'Test',
      };

      const response = await request(app)
        .post('/api/tenants/bulk')
        .send(bulkData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Bulk operation failed without authentication');
    });

    test('should fail bulk operation with insufficient permissions', async () => {
      const bulkData = {
        tenantIds: [testTenant.id],
        action: 'activate',
        reason: 'Test',
      };

      const response = await request(app)
        .post('/api/tenants/bulk')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bulkData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');

      console.log('✅ Bulk operation failed with insufficient permissions');
    });
  });

  // Edge Cases and Error Handling
  describe('Edge Cases and Error Handling', () => {
    test('should handle very long tenant names', async () => {
      const longName = 'a'.repeat(1000);
      const newTenantData = {
        name: longName,
        domain: 'longname.com',
        isActive: true,
      };

      const response = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(newTenantData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');

      console.log('✅ Long tenant names handled correctly');
    });

    test('should handle special characters in tenant data', async () => {
      const specialData = {
        name: 'Special@#$%^&*()_+-=[]{}|;:,.<>?',
        domain: 'special-tenant.com',
        isActive: true,
      };

      const response = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(specialData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tenant.name).toBe(specialData.name);

      console.log('✅ Special characters in tenant data handled correctly');
    });

    test('should handle concurrent tenant creation', async () => {
      const tenantData = {
        name: 'Concurrent Tenant',
        domain: 'concurrent.com',
        isActive: true,
      };

      // Make concurrent requests
      const promises = Array(3)
        .fill()
        .map((_, index) =>
          request(app)
            .post('/api/tenants')
            .set('Authorization', `Bearer ${superadminToken}`)
            .send({
              ...tenantData,
              name: `Concurrent Tenant ${index}`,
              domain: `concurrent${index}.com`,
            })
        );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      console.log('✅ Concurrent tenant creation handled successfully');
    });

    test('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');

      console.log('✅ Empty request body handled correctly');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('Content-Type', 'application/json')
        .send('{"name": "Test Tenant", "domain": "test.com"') // Missing closing brace
        .expect(400);

      expect(response.body.success).toBe(false);

      console.log('✅ Malformed JSON handled correctly');
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    test('should handle rapid tenant creation requests', async () => {
      const startTime = Date.now();

      // Create 10 tenants rapidly
      const promises = Array(10)
        .fill()
        .map((_, index) =>
          request(app)
            .post('/api/tenants')
            .set('Authorization', `Bearer ${superadminToken}`)
            .send({
              name: `Rapid Tenant ${index}`,
              domain: `rapid${index}.com`,
              isActive: true,
            })
        );

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      const totalTime = endTime - startTime;
      console.log(
        `✅ 10 rapid tenant creation requests completed in ${totalTime}ms`
      );
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle large tenant list with pagination', async () => {
      // Create 50 tenants for testing pagination
      const createPromises = Array(50)
        .fill()
        .map((_, index) =>
          prisma.tenant.create({
            data: {
              name: `Pagination Tenant ${index}`,
              domain: `pagination${index}.com`,
              isActive: true,
            },
          })
        );

      await Promise.all(createPromises);

      const startTime = Date.now();

      // Test pagination performance
      const response = await request(app)
        .get('/api/tenants?page=1&limit=10')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(response.body.data.tenants.length).toBe(10);
      expect(response.body.data.meta.total).toBeGreaterThan(50);

      const totalTime = endTime - startTime;
      console.log(
        `✅ Large tenant list pagination completed in ${totalTime}ms`
      );
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should handle large payload gracefully', async () => {
      const largePayload = {
        name: 'Large Tenant',
        domain: 'large.com',
        isActive: true,
        extraData: 'x'.repeat(10000), // 10KB of extra data
      };

      const response = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(largePayload)
        .expect(201); // Should still work, ignoring extra data

      expect(response.body.success).toBe(true);

      console.log('✅ Large payload handled gracefully');
    });
  });
});
