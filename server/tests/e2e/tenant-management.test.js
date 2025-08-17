const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const credentials = require('../credentials');

// Import the test app and helpers
const app = require('./test-app-ts');
const {
  validateErrorResponse,
  validateSuccessResponse,
  TEST_DATA,
} = require('../utils/testHelpers');

const prisma = new PrismaClient();

// API endpoint constants
const TENANT_ENDPOINT = '/api/tenants';

describe('Tenant Management API - Comprehensive E2E Tests', () => {
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
    superadminUser = await prisma.user.create({
      data: {
        email: 'superadmin@test.com',
        passwordHash:
          '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQJ3qKre', // SuperadminPassword123!
        name: 'Super Admin',
        tenantId: testTenant.id,
        isActive: true,
        isSuperadmin: true,
      },
    });

    // Create regular user
    regularUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        passwordHash:
          '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQJ3qKre', // UserPassword123!
        name: 'Regular User',
        tenantId: testTenant.id,
        isActive: true,
        isSuperadmin: false,
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

  describe('GET /tenants - Get All Tenants', () => {
    describe('Success Cases', () => {
      test('should get all tenants with superadmin permissions', async () => {
        const response = await request(app)
          .get(TENANT_ENDPOINT)
          .set('Authorization', `Bearer ${superadminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data).toHaveProperty('tenants');
        expect(Array.isArray(response.body.data.tenants)).toBe(true);
        expect(response.body.data.tenants.length).toBeGreaterThan(0);

        // Verify tenant data structure
        const tenant = response.body.data.tenants[0];
        expect(tenant).toHaveProperty('id');
        expect(tenant).toHaveProperty('name');
        expect(tenant).toHaveProperty('domain');
        expect(tenant).toHaveProperty('isActive');
        expect(tenant).toHaveProperty('createdAt');
      });

      test('should get tenants with pagination', async () => {
        const response = await request(app)
          .get(`${TENANT_ENDPOINT}?page=1&limit=5`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data).toHaveProperty('tenants');
        expect(response.body.data).toHaveProperty('meta');
        expect(response.body.data.meta).toHaveProperty('page');
        expect(response.body.data.meta).toHaveProperty('limit');
        expect(response.body.data.meta).toHaveProperty('total');
        expect(response.body.data.meta).toHaveProperty('totalPages');
      });
    });

    describe('Failure Cases', () => {
      test('should fail to get tenants without authentication', async () => {
        const response = await request(app).get(TENANT_ENDPOINT).expect(401);

        validateErrorResponse(response, 401, 'Access token required');
      });

      test('should fail to get tenants with insufficient permissions', async () => {
        const response = await request(app)
          .get(TENANT_ENDPOINT)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        validateErrorResponse(response, 403, 'Insufficient permissions');
      });
    });
  });

  describe('POST /tenants - Create Tenant', () => {
    describe('Success Cases', () => {
      test('should create new tenant with valid data', async () => {
        const newTenantData = {
          name: 'New Tenant',
          domain: 'newtenant.com',
          isActive: true,
          loginRestrictions: {
            maxUsers: 100,
            allowedDomains: ['newtenant.com'],
          },
        };

        const response = await request(app)
          .post(TENANT_ENDPOINT)
          .set('Authorization', `Bearer ${superadminToken}`)
          .send(newTenantData)
          .expect(201);

        validateSuccessResponse(response, 201);
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
      });
    });

    describe('Failure Cases', () => {
      test('should fail to create tenant with duplicate domain', async () => {
        const newTenantData = {
          name: 'Duplicate Tenant',
          domain: 'test.com', // Already exists
          isActive: true,
        };

        const response = await request(app)
          .post(TENANT_ENDPOINT)
          .set('Authorization', `Bearer ${superadminToken}`)
          .send(newTenantData)
          .expect(400);

        validateErrorResponse(
          response,
          400,
          'Tenant with this domain already exists'
        );
      });

      test('should fail to create tenant with invalid domain format', async () => {
        const newTenantData = {
          name: 'Invalid Tenant',
          domain: 'invalid-domain', // Invalid format
          isActive: true,
        };

        const response = await request(app)
          .post(TENANT_ENDPOINT)
          .set('Authorization', `Bearer ${superadminToken}`)
          .send(newTenantData)
          .expect(400);

        validateErrorResponse(response, 400, 'Invalid domain format');
      });

      test('should fail to create tenant without required fields', async () => {
        const newTenantData = {
          isActive: true,
          // Missing name
        };

        const response = await request(app)
          .post(TENANT_ENDPOINT)
          .set('Authorization', `Bearer ${superadminToken}`)
          .send(newTenantData)
          .expect(400);

        validateErrorResponse(response, 400, 'Tenant name is required');
      });

      test('should fail to create tenant without authentication', async () => {
        const newTenantData = {
          name: 'New Tenant',
          domain: 'newtenant.com',
          isActive: true,
        };

        const response = await request(app)
          .post(TENANT_ENDPOINT)
          .send(newTenantData)
          .expect(401);

        validateErrorResponse(response, 401, 'Access token required');
      });
    });
  });

  describe('GET /tenants/:id - Get Tenant by ID', () => {
    describe('Success Cases', () => {
      test('should get tenant by ID with superadmin permissions', async () => {
        const response = await request(app)
          .get(`${TENANT_ENDPOINT}/${testTenant.id}`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data).toHaveProperty('tenant');
        expect(response.body.data.tenant.id).toBe(testTenant.id);
        expect(response.body.data.tenant.name).toBe(testTenant.name);
        expect(response.body.data.tenant.domain).toBe(testTenant.domain);
      });
    });

    describe('Failure Cases', () => {
      test('should fail to get non-existent tenant', async () => {
        const response = await request(app)
          .get(`${TENANT_ENDPOINT}/non-existent-id`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .expect(404);

        validateErrorResponse(response, 404, 'Tenant not found');
      });

      test('should fail to get tenant without authentication', async () => {
        const response = await request(app)
          .get(`${TENANT_ENDPOINT}/${testTenant.id}`)
          .expect(401);

        validateErrorResponse(response, 401, 'Access token required');
      });
    });
  });

  describe('PUT /tenants/:id - Update Tenant', () => {
    describe('Success Cases', () => {
      test('should update tenant with valid data', async () => {
        const updateData = {
          name: 'Updated Tenant Name',
          domain: 'updated.com',
          isActive: false,
          loginRestrictions: {
            maxUsers: 200,
            allowedDomains: ['updated.com'],
          },
        };

        const response = await request(app)
          .put(`${TENANT_ENDPOINT}/${testTenant.id}`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .send(updateData)
          .expect(200);

        validateSuccessResponse(response);
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
      });
    });

    describe('Failure Cases', () => {
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
          .put(`${TENANT_ENDPOINT}/${testTenant.id}`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .send(updateData)
          .expect(400);

        validateErrorResponse(
          response,
          400,
          'Tenant with this domain already exists'
        );
      });

      test('should fail to update non-existent tenant', async () => {
        const updateData = {
          name: 'Updated Tenant',
          domain: 'updated.com',
        };

        const response = await request(app)
          .put(`${TENANT_ENDPOINT}/non-existent-id`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .send(updateData)
          .expect(404);

        validateErrorResponse(response, 404, 'Tenant not found');
      });
    });
  });

  describe('DELETE /tenants/:id - Delete Tenant', () => {
    describe('Success Cases', () => {
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
          .delete(`${TENANT_ENDPOINT}/${tenantToDelete.id}`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.message).toContain('Tenant deleted successfully');

        // Verify tenant was deleted from database
        const deletedTenant = await prisma.tenant.findUnique({
          where: { id: tenantToDelete.id },
        });
        expect(deletedTenant).toBeNull();
      });
    });

    describe('Failure Cases', () => {
      test('should fail to delete tenant with associated users', async () => {
        const response = await request(app)
          .delete(`${TENANT_ENDPOINT}/${testTenant.id}`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .expect(400);

        validateErrorResponse(
          response,
          400,
          'Cannot delete tenant with associated users'
        );
      });

      test('should fail to delete non-existent tenant', async () => {
        const response = await request(app)
          .delete(`${TENANT_ENDPOINT}/non-existent-id`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .expect(404);

        validateErrorResponse(response, 404, 'Tenant not found');
      });
    });
  });

  describe('GET /tenants/stats - Get Tenant Statistics', () => {
    describe('Success Cases', () => {
      test('should get tenant statistics with superadmin permissions', async () => {
        const response = await request(app)
          .get(`${TENANT_ENDPOINT}/stats`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data).toHaveProperty('stats');
        expect(response.body.data.stats).toHaveProperty('totalTenants');
        expect(response.body.data.stats).toHaveProperty('activeTenants');
        expect(response.body.data.stats).toHaveProperty('inactiveTenants');
      });
    });

    describe('Failure Cases', () => {
      test('should fail to get tenant statistics without authentication', async () => {
        const response = await request(app)
          .get(`${TENANT_ENDPOINT}/stats`)
          .expect(401);

        validateErrorResponse(response, 401, 'Access token required');
      });
    });
  });

  describe('POST /tenants/bulk - Bulk Operations', () => {
    describe('Success Cases', () => {
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
          .post(`${TENANT_ENDPOINT}/bulk`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .send(bulkData)
          .expect(200);

        validateSuccessResponse(response);
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
      });

      test('should perform bulk deactivate operation', async () => {
        const bulkData = {
          tenantIds: [testTenant.id],
          action: 'deactivate',
          reason: 'Bulk deactivation test',
        };

        const response = await request(app)
          .post(`${TENANT_ENDPOINT}/bulk`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .send(bulkData)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.message).toContain(
          '1 tenants deactivated successfully'
        );

        // Verify tenant was deactivated in database
        const deactivatedTenant = await prisma.tenant.findUnique({
          where: { id: testTenant.id },
        });
        expect(deactivatedTenant.isActive).toBe(false);
      });
    });

    describe('Failure Cases', () => {
      test('should fail bulk operation with invalid action', async () => {
        const bulkData = {
          tenantIds: [testTenant.id],
          action: 'invalid-action',
          reason: 'Test',
        };

        const response = await request(app)
          .post(`${TENANT_ENDPOINT}/bulk`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .send(bulkData)
          .expect(400);

        validateErrorResponse(response, 400, 'Validation failed');
      });

      test('should fail bulk operation without authentication', async () => {
        const bulkData = {
          tenantIds: [testTenant.id],
          action: 'activate',
          reason: 'Test',
        };

        const response = await request(app)
          .post(`${TENANT_ENDPOINT}/bulk`)
          .send(bulkData)
          .expect(401);

        validateErrorResponse(response, 401, 'Access token required');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle very long tenant names', async () => {
      const longName = 'a'.repeat(1000);
      const newTenantData = {
        name: longName,
        domain: 'longname.com',
        isActive: true,
      };

      const response = await request(app)
        .post(TENANT_ENDPOINT)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(newTenantData)
        .expect(400);

      validateErrorResponse(response, 400, 'Validation failed');
    });

    test('should handle special characters in tenant data', async () => {
      const specialData = {
        name: 'Special@#$%^&*()_+-=[]{}|;:,.<>?',
        domain: 'special-tenant.com',
        isActive: true,
      };

      const response = await request(app)
        .post(TENANT_ENDPOINT)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(specialData)
        .expect(201);

      validateSuccessResponse(response, 201);
      expect(response.body.data.tenant.name).toBe(specialData.name);
    });

    test('should handle empty request body', async () => {
      const response = await request(app)
        .post(TENANT_ENDPOINT)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({})
        .expect(400);

      validateErrorResponse(response, 400, 'Tenant name is required');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post(TENANT_ENDPOINT)
        .set('Authorization', `Bearer ${superadminToken}`)
        .set('Content-Type', 'application/json')
        .send('{"name": "Test Tenant", "domain": "test.com"') // Missing closing brace
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    test('should handle rapid tenant creation requests', async () => {
      const startTime = Date.now();

      // Create 10 tenants rapidly
      const promises = Array(10)
        .fill()
        .map((_, index) =>
          request(app)
            .post(TENANT_ENDPOINT)
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

    test('should handle large payload gracefully', async () => {
      const largePayload = {
        name: 'Large Tenant',
        domain: 'large.com',
        isActive: true,
        extraData: 'x'.repeat(10000), // 10KB of extra data
      };

      const response = await request(app)
        .post(TENANT_ENDPOINT)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(largePayload)
        .expect(201); // Should still work, ignoring extra data

      validateSuccessResponse(response, 201);
    });
  });
});
