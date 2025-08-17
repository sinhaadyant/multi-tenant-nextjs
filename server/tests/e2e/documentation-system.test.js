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
const DOCS_ENDPOINT = `${API_BASE_URL}/docs`;

// Test data constants
const TEST_LOGIN_DATA = {
  email: credentials.users.user.email,
  password: credentials.users.user.password,
  tenantSlug: credentials.tenants.primary.domain,
};

describe('Documentation System API - Comprehensive E2E Tests', () => {
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
        name: 'Docs Admin',
        description: 'Documentation administrator role',
        tenantId: testTenant.id,
        permissions: ['docs:read', 'docs:write', 'docs:delete', 'docs:admin'],
      },
    });

    // Create regular role
    testRole = await prisma.role.create({
      data: {
        name: 'User',
        description: 'Regular user role',
        tenantId: testTenant.id,
        permissions: ['docs:read'],
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

  describe('GET /docs', () => {
    it('should get API documentation successfully', async () => {
      const response = await request(app).get(`${DOCS_ENDPOINT}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('info');
      expect(response.body.data).toHaveProperty('paths');
      expect(response.body.data).toHaveProperty('components');
      expect(response.body.data).toHaveProperty('tags');
    });
  });

  describe('GET /docs/swagger', () => {
    it('should get Swagger documentation successfully', async () => {
      const response = await request(app).get(`${DOCS_ENDPOINT}/swagger`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body).toHaveProperty('openapi');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
    });
  });

  describe('GET /docs/swagger-ui', () => {
    it('should get Swagger UI successfully', async () => {
      const response = await request(app).get(`${DOCS_ENDPOINT}/swagger-ui`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('Swagger UI');
    });
  });

  describe('GET /docs/redoc', () => {
    it('should get ReDoc documentation successfully', async () => {
      const response = await request(app).get(`${DOCS_ENDPOINT}/redoc`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('ReDoc');
    });
  });

  describe('GET /docs/endpoints', () => {
    it('should get all API endpoints successfully', async () => {
      const response = await request(app).get(`${DOCS_ENDPOINT}/endpoints`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('path');
      expect(response.body.data[0]).toHaveProperty('method');
      expect(response.body.data[0]).toHaveProperty('summary');
      expect(response.body.data[0]).toHaveProperty('tags');
    });

    it('should filter by tag', async () => {
      const response = await request(app).get(
        `${DOCS_ENDPOINT}/endpoints?tag=auth`
      );

      validateSuccessResponse(response);
      if (response.body.data.length > 0) {
        expect(
          response.body.data.every(endpoint => endpoint.tags.includes('auth'))
        ).toBe(true);
      }
    });

    it('should filter by method', async () => {
      const response = await request(app).get(
        `${DOCS_ENDPOINT}/endpoints?method=GET`
      );

      validateSuccessResponse(response);
      if (response.body.data.length > 0) {
        expect(
          response.body.data.every(endpoint => endpoint.method === 'GET')
        ).toBe(true);
      }
    });
  });

  describe('GET /docs/endpoints/:path', () => {
    it('should get specific endpoint documentation successfully', async () => {
      const response = await request(app).get(
        `${DOCS_ENDPOINT}/endpoints/auth/login`
      );

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('path');
      expect(response.body.data).toHaveProperty('method');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('parameters');
      expect(response.body.data).toHaveProperty('responses');
    });

    it('should return 404 for non-existent endpoint', async () => {
      const response = await request(app).get(
        `${DOCS_ENDPOINT}/endpoints/non-existent`
      );

      validateErrorResponse(response, 404, 'Endpoint not found');
    });
  });

  describe('GET /docs/schemas', () => {
    it('should get all API schemas successfully', async () => {
      const response = await request(app).get(`${DOCS_ENDPOINT}/schemas`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('schemas');
      expect(response.body.data.schemas).toBeInstanceOf(Object);
    });
  });

  describe('GET /docs/schemas/:name', () => {
    it('should get specific schema documentation successfully', async () => {
      const response = await request(app).get(`${DOCS_ENDPOINT}/schemas/User`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('type');
      expect(response.body.data).toHaveProperty('properties');
      expect(response.body.data).toHaveProperty('required');
    });

    it('should return 404 for non-existent schema', async () => {
      const response = await request(app).get(
        `${DOCS_ENDPOINT}/schemas/NonExistentSchema`
      );

      validateErrorResponse(response, 404, 'Schema not found');
    });
  });

  describe('GET /docs/tags', () => {
    it('should get all API tags successfully', async () => {
      const response = await request(app).get(`${DOCS_ENDPOINT}/tags`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('description');
      expect(response.body.data[0]).toHaveProperty('endpoints');
    });
  });

  describe('GET /docs/tags/:name', () => {
    it('should get specific tag documentation successfully', async () => {
      const response = await request(app).get(`${DOCS_ENDPOINT}/tags/auth`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('endpoints');
      expect(response.body.data.endpoints).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent tag', async () => {
      const response = await request(app).get(
        `${DOCS_ENDPOINT}/tags/non-existent`
      );

      validateErrorResponse(response, 404, 'Tag not found');
    });
  });

  describe('POST /docs/generate', () => {
    it('should generate documentation successfully (admin only)', async () => {
      const response = await request(app)
        .post(`${DOCS_ENDPOINT}/generate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'json',
          includeExamples: true,
          includeSchemas: true,
        });

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('generatedAt');
      expect(response.body.data).toHaveProperty('format');
      expect(response.body.data).toHaveProperty('size');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`${DOCS_ENDPOINT}/generate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
        });

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should validate format parameter', async () => {
      const response = await request(app)
        .post(`${DOCS_ENDPOINT}/generate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'invalid-format',
        });

      validateErrorResponse(response, 400, 'Invalid format');
    });
  });

  describe('GET /docs/export', () => {
    it('should export documentation as JSON successfully', async () => {
      const response = await request(app).get(
        `${DOCS_ENDPOINT}/export?format=json`
      );

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should export documentation as YAML successfully', async () => {
      const response = await request(app).get(
        `${DOCS_ENDPOINT}/export?format=yaml`
      );

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/yaml');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should return 400 for invalid format', async () => {
      const response = await request(app).get(
        `${DOCS_ENDPOINT}/export?format=invalid`
      );

      validateErrorResponse(response, 400, 'Invalid format');
    });
  });

  describe('GET /docs/version', () => {
    it('should get API version information successfully', async () => {
      const response = await request(app).get(`${DOCS_ENDPOINT}/version`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('lastUpdated');
      expect(response.body.data).toHaveProperty('endpoints');
      expect(response.body.data).toHaveProperty('schemas');
    });
  });

  describe('GET /docs/changelog', () => {
    it('should get API changelog successfully', async () => {
      const response = await request(app).get(`${DOCS_ENDPOINT}/changelog`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('version');
        expect(response.body.data[0]).toHaveProperty('date');
        expect(response.body.data[0]).toHaveProperty('changes');
        expect(response.body.data[0]).toHaveProperty('type');
      }
    });

    it('should filter by version', async () => {
      const response = await request(app).get(
        `${DOCS_ENDPOINT}/changelog?version=1.0.0`
      );

      validateSuccessResponse(response);
      if (response.body.data.length > 0) {
        expect(
          response.body.data.every(change => change.version === '1.0.0')
        ).toBe(true);
      }
    });

    it('should filter by change type', async () => {
      const response = await request(app).get(
        `${DOCS_ENDPOINT}/changelog?type=added`
      );

      validateSuccessResponse(response);
      if (response.body.data.length > 0) {
        expect(
          response.body.data.every(change => change.type === 'added')
        ).toBe(true);
      }
    });
  });

  describe('GET /docs/search', () => {
    it('should search documentation successfully', async () => {
      const response = await request(app).get(
        `${DOCS_ENDPOINT}/search?q=authentication`
      );

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('query');
      expect(response.body.data.results).toBeInstanceOf(Array);
    });

    it('should return empty results for non-matching query', async () => {
      const response = await request(app).get(
        `${DOCS_ENDPOINT}/search?q=nonexistentterm`
      );

      validateSuccessResponse(response);
      expect(response.body.data.results).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });

    it('should support filtering by type', async () => {
      const response = await request(app).get(
        `${DOCS_ENDPOINT}/search?q=user&type=endpoint`
      );

      validateSuccessResponse(response);
      if (response.body.data.results.length > 0) {
        expect(
          response.body.data.results.every(result => result.type === 'endpoint')
        ).toBe(true);
      }
    });
  });

  describe('GET /docs/statistics', () => {
    it('should get documentation statistics successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${DOCS_ENDPOINT}/statistics`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('totalEndpoints');
      expect(response.body.data).toHaveProperty('totalSchemas');
      expect(response.body.data).toHaveProperty('totalTags');
      expect(response.body.data).toHaveProperty('coverage');
      expect(response.body.data).toHaveProperty('lastUpdated');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${DOCS_ENDPOINT}/statistics`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });
  });

  describe('GET /docs/health', () => {
    it('should get documentation health status successfully', async () => {
      const response = await request(app).get(`${DOCS_ENDPOINT}/health`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('lastGenerated');
      expect(response.body.data).toHaveProperty('isUpToDate');
      expect(response.body.data).toHaveProperty('errors');
    });
  });
});
