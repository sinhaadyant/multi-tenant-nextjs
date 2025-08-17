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
const BACKUP_ENDPOINT = `${API_BASE_URL}/backup`;

// Test data constants
const TEST_LOGIN_DATA = {
  email: credentials.users.user.email,
  password: credentials.users.user.password,
  tenantSlug: credentials.tenants.primary.domain,
};

describe('Backup System API - Comprehensive E2E Tests', () => {
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
        name: 'Backup Admin',
        description: 'Backup administrator role',
        tenantId: testTenant.id,
        permissions: [
          'backup:read',
          'backup:write',
          'backup:delete',
          'backup:admin',
        ],
      },
    });

    // Create regular role
    testRole = await prisma.role.create({
      data: {
        name: 'User',
        description: 'Regular user role',
        tenantId: testTenant.id,
        permissions: ['backup:read'],
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

  describe('POST /backup/create', () => {
    it('should create backup successfully (admin only)', async () => {
      const backupData = {
        type: 'full',
        description: 'Test backup creation',
        includeFiles: true,
        includeDatabase: true,
        compression: 'gzip',
      };

      const response = await request(app)
        .post(`${BACKUP_ENDPOINT}/create`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(backupData);

      validateSuccessResponse(response, 201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('type');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data.type).toBe(backupData.type);
      expect(response.body.data.description).toBe(backupData.description);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`${BACKUP_ENDPOINT}/create`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'full',
          description: 'Test backup',
        });

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should validate backup type', async () => {
      const response = await request(app)
        .post(`${BACKUP_ENDPOINT}/create`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'invalid-type',
          description: 'Test backup',
        });

      validateErrorResponse(response, 400, 'Invalid backup type');
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .post(`${BACKUP_ENDPOINT}/create`)
        .send({
          type: 'full',
          description: 'Test backup',
        });

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('GET /backup', () => {
    it('should get all backups successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${BACKUP_ENDPOINT}`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('type');
      expect(response.body.data[0]).toHaveProperty('status');
      expect(response.body.data[0]).toHaveProperty('createdAt');
      expect(response.body.data[0]).toHaveProperty('size');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${BACKUP_ENDPOINT}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`${BACKUP_ENDPOINT}?page=1&limit=10`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get(`${BACKUP_ENDPOINT}?status=completed`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      if (response.body.data.length > 0) {
        expect(
          response.body.data.every(backup => backup.status === 'completed')
        ).toBe(true);
      }
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get(`${BACKUP_ENDPOINT}?type=full`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      if (response.body.data.length > 0) {
        expect(response.body.data.every(backup => backup.type === 'full')).toBe(
          true
        );
      }
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app).get(`${BACKUP_ENDPOINT}`);

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('GET /backup/:id', () => {
    it('should get backup by ID successfully (admin only)', async () => {
      // First create a backup
      const createResponse = await request(app)
        .post(`${BACKUP_ENDPOINT}/create`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'full',
          description: 'Test backup for retrieval',
        });

      const backupId = createResponse.body.data.id;

      const response = await request(app)
        .get(`${BACKUP_ENDPOINT}/${backupId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.id).toBe(backupId);
      expect(response.body.data).toHaveProperty('type');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${BACKUP_ENDPOINT}/1`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent backup', async () => {
      const response = await request(app)
        .get(`${BACKUP_ENDPOINT}/999999`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateErrorResponse(response, 404, 'Backup not found');
    });
  });

  describe('POST /backup/:id/restore', () => {
    it('should initiate backup restoration successfully (admin only)', async () => {
      // First create a backup
      const createResponse = await request(app)
        .post(`${BACKUP_ENDPOINT}/create`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'full',
          description: 'Test backup for restoration',
        });

      const backupId = createResponse.body.data.id;

      const restoreData = {
        type: 'full',
        options: {
          overwrite: false,
          validateOnly: true,
        },
      };

      const response = await request(app)
        .post(`${BACKUP_ENDPOINT}/${backupId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(restoreData);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('backupId');
      expect(response.body.data.backupId).toBe(backupId);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`${BACKUP_ENDPOINT}/1/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'full',
        });

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent backup', async () => {
      const response = await request(app)
        .post(`${BACKUP_ENDPOINT}/999999/restore`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'full',
        });

      validateErrorResponse(response, 404, 'Backup not found');
    });
  });

  describe('GET /backup/:id/download', () => {
    it('should download backup successfully (admin only)', async () => {
      // First create a backup
      const createResponse = await request(app)
        .post(`${BACKUP_ENDPOINT}/create`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'full',
          description: 'Test backup for download',
        });

      const backupId = createResponse.body.data.id;

      const response = await request(app)
        .get(`${BACKUP_ENDPOINT}/${backupId}/download`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-type']).toContain('application/zip');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${BACKUP_ENDPOINT}/1/download`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent backup', async () => {
      const response = await request(app)
        .get(`${BACKUP_ENDPOINT}/999999/download`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateErrorResponse(response, 404, 'Backup not found');
    });
  });

  describe('DELETE /backup/:id', () => {
    it('should delete backup successfully (admin only)', async () => {
      // First create a backup
      const createResponse = await request(app)
        .post(`${BACKUP_ENDPOINT}/create`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'full',
          description: 'Test backup for deletion',
        });

      const backupId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`${BACKUP_ENDPOINT}/${backupId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.message).toContain('Backup deleted successfully');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .delete(`${BACKUP_ENDPOINT}/1`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent backup', async () => {
      const response = await request(app)
        .delete(`${BACKUP_ENDPOINT}/999999`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateErrorResponse(response, 404, 'Backup not found');
    });
  });

  describe('GET /backup/schedule', () => {
    it('should get backup schedule successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${BACKUP_ENDPOINT}/schedule`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('enabled');
      expect(response.body.data).toHaveProperty('frequency');
      expect(response.body.data).toHaveProperty('retention');
      expect(response.body.data).toHaveProperty('nextBackup');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${BACKUP_ENDPOINT}/schedule`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });
  });

  describe('PUT /backup/schedule', () => {
    it('should update backup schedule successfully (admin only)', async () => {
      const scheduleData = {
        enabled: true,
        frequency: 'daily',
        time: '02:00',
        retention: {
          days: 30,
          weeks: 4,
          months: 12,
        },
        includeFiles: true,
        includeDatabase: true,
        compression: 'gzip',
      };

      const response = await request(app)
        .put(`${BACKUP_ENDPOINT}/schedule`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(scheduleData);

      validateSuccessResponse(response);
      expect(response.body.data.enabled).toBe(scheduleData.enabled);
      expect(response.body.data.frequency).toBe(scheduleData.frequency);
      expect(response.body.data.retention.days).toBe(
        scheduleData.retention.days
      );
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .put(`${BACKUP_ENDPOINT}/schedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          enabled: true,
          frequency: 'daily',
        });

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should validate schedule frequency', async () => {
      const response = await request(app)
        .put(`${BACKUP_ENDPOINT}/schedule`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          enabled: true,
          frequency: 'invalid-frequency',
        });

      validateErrorResponse(response, 400, 'Invalid frequency');
    });
  });

  describe('GET /backup/analytics', () => {
    it('should get backup analytics successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${BACKUP_ENDPOINT}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('totalBackups');
      expect(response.body.data).toHaveProperty('totalSize');
      expect(response.body.data).toHaveProperty('successRate');
      expect(response.body.data).toHaveProperty('averageDuration');
      expect(response.body.data).toHaveProperty('backupsByType');
      expect(response.body.data).toHaveProperty('backupsByStatus');
      expect(response.body.data).toHaveProperty('storageUsage');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${BACKUP_ENDPOINT}/analytics`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should support date range filtering', async () => {
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(
          `${BACKUP_ENDPOINT}/analytics?startDate=${startDate}&endDate=${endDate}`
        )
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
    });
  });

  describe('POST /backup/verify', () => {
    it('should verify backup integrity successfully (admin only)', async () => {
      // First create a backup
      const createResponse = await request(app)
        .post(`${BACKUP_ENDPOINT}/create`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'full',
          description: 'Test backup for verification',
        });

      const backupId = createResponse.body.data.id;

      const response = await request(app)
        .post(`${BACKUP_ENDPOINT}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          backupId: backupId,
        });

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('valid');
      expect(response.body.data).toHaveProperty('checksum');
      expect(response.body.data).toHaveProperty('verifiedAt');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`${BACKUP_ENDPOINT}/verify`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          backupId: 1,
        });

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent backup', async () => {
      const response = await request(app)
        .post(`${BACKUP_ENDPOINT}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          backupId: 999999,
        });

      validateErrorResponse(response, 404, 'Backup not found');
    });
  });
});
