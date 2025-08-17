const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const credentials = require('../credentials');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Import the Express app for testing
const app = require('./test-app-ts');

// Constants for API endpoints and test data
const API_BASE_URL = '/api';
const FILE_ENDPOINT = `${API_BASE_URL}/files`;

// Test data constants
const TEST_LOGIN_DATA = {
  email: credentials.users.user.email,
  password: credentials.users.user.password,
  tenantSlug: credentials.tenants.primary.domain,
};

describe('File Management API - Comprehensive E2E Tests', () => {
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
    await prisma.file.deleteMany();
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
        name: 'File Admin',
        description: 'File administrator role',
        tenantId: testTenant.id,
        permissions: ['file:read', 'file:write', 'file:delete', 'file:admin'],
      },
    });

    // Create regular role
    testRole = await prisma.role.create({
      data: {
        name: 'User',
        description: 'Regular user role',
        tenantId: testTenant.id,
        permissions: ['file:read', 'file:write'],
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

  describe('POST /files/upload', () => {
    it('should upload file successfully', async () => {
      // Create a test file buffer
      const testFileBuffer = Buffer.from('This is a test file content');

      const response = await request(app)
        .post(`${FILE_ENDPOINT}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFileBuffer, 'test-file.txt')
        .field('category', 'document')
        .field('description', 'Test file upload');

      validateSuccessResponse(response, 201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('filename');
      expect(response.body.data).toHaveProperty('originalName');
      expect(response.body.data).toHaveProperty('mimeType');
      expect(response.body.data).toHaveProperty('size');
      expect(response.body.data).toHaveProperty('path');
      expect(response.body.data.originalName).toBe('test-file.txt');
      expect(response.body.data.category).toBe('document');
    });

    it('should return 400 for missing file', async () => {
      const response = await request(app)
        .post(`${FILE_ENDPOINT}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .field('category', 'document');

      validateErrorResponse(response, 400, 'No file uploaded');
    });

    it('should return 400 for unsupported file type', async () => {
      const testFileBuffer = Buffer.from('Test content');

      const response = await request(app)
        .post(`${FILE_ENDPOINT}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFileBuffer, 'test-file.exe')
        .field('category', 'document');

      validateErrorResponse(response, 400, 'File type not allowed');
    });

    it('should return 400 for file too large', async () => {
      // Create a large file buffer (exceeds limit)
      const largeFileBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      const response = await request(app)
        .post(`${FILE_ENDPOINT}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeFileBuffer, 'large-file.txt')
        .field('category', 'document');

      validateErrorResponse(response, 400, 'File too large');
    });

    it('should return 401 for unauthorized access', async () => {
      const testFileBuffer = Buffer.from('Test content');

      const response = await request(app)
        .post(`${FILE_ENDPOINT}/upload`)
        .attach('file', testFileBuffer, 'test-file.txt')
        .field('category', 'document');

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('GET /files', () => {
    beforeEach(async () => {
      // Create test files
      await prisma.file.createMany({
        data: [
          {
            filename: 'test-file-1.txt',
            originalName: 'test-file-1.txt',
            mimeType: 'text/plain',
            size: 1024,
            path: '/uploads/test-file-1.txt',
            category: 'document',
            userId: testUser.id,
            tenantId: testTenant.id,
            isPublic: false,
          },
          {
            filename: 'test-file-2.pdf',
            originalName: 'test-file-2.pdf',
            mimeType: 'application/pdf',
            size: 2048,
            path: '/uploads/test-file-2.pdf',
            category: 'document',
            userId: testUser.id,
            tenantId: testTenant.id,
            isPublic: false,
          },
          {
            filename: 'public-file.jpg',
            originalName: 'public-file.jpg',
            mimeType: 'image/jpeg',
            size: 3072,
            path: '/uploads/public-file.jpg',
            category: 'image',
            userId: testUser.id,
            tenantId: testTenant.id,
            isPublic: true,
          },
        ],
      });
    });

    it('should get all files for the authenticated user', async () => {
      const response = await request(app)
        .get(`${FILE_ENDPOINT}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('filename');
      expect(response.body.data[0]).toHaveProperty('originalName');
      expect(response.body.data[0]).toHaveProperty('mimeType');
      expect(response.body.data[0]).toHaveProperty('size');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`${FILE_ENDPOINT}?page=1&limit=2`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get(`${FILE_ENDPOINT}?category=document`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(
        response.body.data.every(file => file.category === 'document')
      ).toBe(true);
    });

    it('should filter by mime type', async () => {
      const response = await request(app)
        .get(`${FILE_ENDPOINT}?mimeType=text/plain`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(
        response.body.data.every(file => file.mimeType === 'text/plain')
      ).toBe(true);
    });

    it('should support search by filename', async () => {
      const response = await request(app)
        .get(`${FILE_ENDPOINT}?search=test-file`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(
        response.body.data.every(
          file =>
            file.filename.toLowerCase().includes('test-file') ||
            file.originalName.toLowerCase().includes('test-file')
        )
      ).toBe(true);
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app).get(`${FILE_ENDPOINT}`);

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('GET /files/:id', () => {
    let testFile;

    beforeEach(async () => {
      testFile = await prisma.file.create({
        data: {
          filename: 'test-file.txt',
          originalName: 'test-file.txt',
          mimeType: 'text/plain',
          size: 1024,
          path: '/uploads/test-file.txt',
          category: 'document',
          userId: testUser.id,
          tenantId: testTenant.id,
          isPublic: false,
        },
      });
    });

    it('should get file by ID successfully', async () => {
      const response = await request(app)
        .get(`${FILE_ENDPOINT}/${testFile.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.id).toBe(testFile.id);
      expect(response.body.data.filename).toBe(testFile.filename);
      expect(response.body.data.originalName).toBe(testFile.originalName);
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get(`${FILE_ENDPOINT}/999999`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 404, 'File not found');
    });

    it('should return 403 for accessing other user file (non-public)', async () => {
      // Create another user and file
      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@test.com',
          password: await bcrypt.hash('Password123!', 10),
          name: 'Other User',
          tenantId: testTenant.id,
          isActive: true,
        },
      });

      const otherFile = await prisma.file.create({
        data: {
          filename: 'other-file.txt',
          originalName: 'other-file.txt',
          mimeType: 'text/plain',
          size: 1024,
          path: '/uploads/other-file.txt',
          category: 'document',
          userId: otherUser.id,
          tenantId: testTenant.id,
          isPublic: false,
        },
      });

      const response = await request(app)
        .get(`${FILE_ENDPOINT}/${otherFile.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should allow access to public files', async () => {
      const publicFile = await prisma.file.create({
        data: {
          filename: 'public-file.txt',
          originalName: 'public-file.txt',
          mimeType: 'text/plain',
          size: 1024,
          path: '/uploads/public-file.txt',
          category: 'document',
          userId: testUser.id,
          tenantId: testTenant.id,
          isPublic: true,
        },
      });

      const response = await request(app)
        .get(`${FILE_ENDPOINT}/${publicFile.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.id).toBe(publicFile.id);
    });
  });

  describe('GET /files/:id/download', () => {
    let testFile;

    beforeEach(async () => {
      testFile = await prisma.file.create({
        data: {
          filename: 'test-file.txt',
          originalName: 'test-file.txt',
          mimeType: 'text/plain',
          size: 1024,
          path: '/uploads/test-file.txt',
          category: 'document',
          userId: testUser.id,
          tenantId: testTenant.id,
          isPublic: false,
        },
      });
    });

    it('should download file successfully', async () => {
      const response = await request(app)
        .get(`${FILE_ENDPOINT}/${testFile.id}/download`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-type']).toBe('text/plain');
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get(`${FILE_ENDPOINT}/999999/download`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 404, 'File not found');
    });

    it('should return 403 for accessing other user file', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@test.com',
          password: await bcrypt.hash('Password123!', 10),
          name: 'Other User',
          tenantId: testTenant.id,
          isActive: true,
        },
      });

      const otherFile = await prisma.file.create({
        data: {
          filename: 'other-file.txt',
          originalName: 'other-file.txt',
          mimeType: 'text/plain',
          size: 1024,
          path: '/uploads/other-file.txt',
          category: 'document',
          userId: otherUser.id,
          tenantId: testTenant.id,
          isPublic: false,
        },
      });

      const response = await request(app)
        .get(`${FILE_ENDPOINT}/${otherFile.id}/download`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });
  });

  describe('PUT /files/:id', () => {
    let testFile;

    beforeEach(async () => {
      testFile = await prisma.file.create({
        data: {
          filename: 'test-file.txt',
          originalName: 'test-file.txt',
          mimeType: 'text/plain',
          size: 1024,
          path: '/uploads/test-file.txt',
          category: 'document',
          userId: testUser.id,
          tenantId: testTenant.id,
          isPublic: false,
        },
      });
    });

    it('should update file metadata successfully', async () => {
      const updateData = {
        description: 'Updated file description',
        category: 'image',
        isPublic: true,
        tags: ['updated', 'file'],
      };

      const response = await request(app)
        .put(`${FILE_ENDPOINT}/${testFile.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      validateSuccessResponse(response);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.category).toBe(updateData.category);
      expect(response.body.data.isPublic).toBe(updateData.isPublic);
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .put(`${FILE_ENDPOINT}/999999`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Updated description' });

      validateErrorResponse(response, 404, 'File not found');
    });

    it('should return 403 for updating other user file', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@test.com',
          password: await bcrypt.hash('Password123!', 10),
          name: 'Other User',
          tenantId: testTenant.id,
          isActive: true,
        },
      });

      const otherFile = await prisma.file.create({
        data: {
          filename: 'other-file.txt',
          originalName: 'other-file.txt',
          mimeType: 'text/plain',
          size: 1024,
          path: '/uploads/other-file.txt',
          category: 'document',
          userId: otherUser.id,
          tenantId: testTenant.id,
          isPublic: false,
        },
      });

      const response = await request(app)
        .put(`${FILE_ENDPOINT}/${otherFile.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Updated description' });

      validateErrorResponse(response, 403, 'Access denied');
    });
  });

  describe('DELETE /files/:id', () => {
    let testFile;

    beforeEach(async () => {
      testFile = await prisma.file.create({
        data: {
          filename: 'test-file.txt',
          originalName: 'test-file.txt',
          mimeType: 'text/plain',
          size: 1024,
          path: '/uploads/test-file.txt',
          category: 'document',
          userId: testUser.id,
          tenantId: testTenant.id,
          isPublic: false,
        },
      });
    });

    it('should delete file successfully', async () => {
      const response = await request(app)
        .delete(`${FILE_ENDPOINT}/${testFile.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.message).toContain('File deleted successfully');

      // Verify file is deleted
      const deletedFile = await prisma.file.findUnique({
        where: { id: testFile.id },
      });
      expect(deletedFile).toBeNull();
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .delete(`${FILE_ENDPOINT}/999999`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 404, 'File not found');
    });

    it('should return 403 for deleting other user file', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@test.com',
          password: await bcrypt.hash('Password123!', 10),
          name: 'Other User',
          tenantId: testTenant.id,
          isActive: true,
        },
      });

      const otherFile = await prisma.file.create({
        data: {
          filename: 'other-file.txt',
          originalName: 'other-file.txt',
          mimeType: 'text/plain',
          size: 1024,
          path: '/uploads/other-file.txt',
          category: 'document',
          userId: otherUser.id,
          tenantId: testTenant.id,
          isPublic: false,
        },
      });

      const response = await request(app)
        .delete(`${FILE_ENDPOINT}/${otherFile.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });
  });

  describe('GET /files/analytics', () => {
    beforeEach(async () => {
      // Create test files with different categories and sizes
      await prisma.file.createMany({
        data: [
          {
            filename: 'doc1.txt',
            originalName: 'doc1.txt',
            mimeType: 'text/plain',
            size: 1024,
            path: '/uploads/doc1.txt',
            category: 'document',
            userId: testUser.id,
            tenantId: testTenant.id,
            isPublic: false,
          },
          {
            filename: 'doc2.pdf',
            originalName: 'doc2.pdf',
            mimeType: 'application/pdf',
            size: 2048,
            path: '/uploads/doc2.pdf',
            category: 'document',
            userId: testUser.id,
            tenantId: testTenant.id,
            isPublic: false,
          },
          {
            filename: 'img1.jpg',
            originalName: 'img1.jpg',
            mimeType: 'image/jpeg',
            size: 3072,
            path: '/uploads/img1.jpg',
            category: 'image',
            userId: testUser.id,
            tenantId: testTenant.id,
            isPublic: true,
          },
          {
            filename: 'img2.png',
            originalName: 'img2.png',
            mimeType: 'image/png',
            size: 4096,
            path: '/uploads/img2.png',
            category: 'image',
            userId: testUser.id,
            tenantId: testTenant.id,
            isPublic: false,
          },
        ],
      });
    });

    it('should get file analytics successfully', async () => {
      const response = await request(app)
        .get(`${FILE_ENDPOINT}/analytics`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('totalFiles');
      expect(response.body.data).toHaveProperty('totalSize');
      expect(response.body.data).toHaveProperty('filesByCategory');
      expect(response.body.data).toHaveProperty('filesByMimeType');
      expect(response.body.data).toHaveProperty('publicFiles');
      expect(response.body.data).toHaveProperty('privateFiles');
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app).get(`${FILE_ENDPOINT}/analytics`);

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });
});
