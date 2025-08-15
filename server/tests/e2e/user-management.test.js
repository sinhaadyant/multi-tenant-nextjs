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

describe('User Management API - E2E Tests', () => {
  let adminUser;
  let regularUser;
  let testTenant;
  let testRole;
  let adminToken;
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

    // Create admin role
    const adminRole = await prisma.role.create({
      data: {
        name: 'Admin Role',
        description: 'Administrator role with full permissions',
        tenantId: testTenant.id,
        isGlobal: false,
      },
    });

    // Create regular role
    testRole = await prisma.role.create({
      data: {
        name: 'User Role',
        description: 'Regular user role',
        tenantId: testTenant.id,
        isGlobal: false,
      },
    });

    // Create admin user
    const adminPassword = await bcrypt.hash(
      credentials.users.admin.password,
      12
    );
    adminUser = await prisma.user.create({
      data: {
        email: credentials.users.admin.email,
        passwordHash: adminPassword,
        name: credentials.users.admin.name,
        tenantId: testTenant.id,
        isActive: credentials.users.admin.isActive,
        isSuperadmin: credentials.users.admin.isSuperadmin,
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

    // Assign roles
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: regularUser.id,
        roleId: testRole.id,
      },
    });

    // Get tokens for testing
    const adminLoginResponse = await request(app).post('/api/auth/login').send({
      email: credentials.users.admin.email,
      password: credentials.users.admin.password,
    });

    const userLoginResponse = await request(app).post('/api/auth/login').send({
      email: credentials.users.user.email,
      password: credentials.users.user.password,
    });

    adminToken = adminLoginResponse.body.data.accessToken;
    userToken = userLoginResponse.body.data.accessToken;

    console.log('✅ Test data prepared');
  });

  describe('GET /api/users', () => {
    test('should get all users with admin permissions', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);

      // Verify user data structure
      const user = response.body.data.users[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('isActive');
      expect(user).toHaveProperty('tenantId');

      console.log('✅ Get all users successful with admin permissions');
    });

    test('should get users with pagination', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('meta');
      expect(response.body.data.meta).toHaveProperty('page');
      expect(response.body.data.meta).toHaveProperty('limit');
      expect(response.body.data.meta).toHaveProperty('total');
      expect(response.body.data.meta).toHaveProperty('totalPages');

      console.log('✅ Get users with pagination successful');
    });

    test('should get users with search filter', async () => {
      const response = await request(app)
        .get('/api/users?search=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);

      // Verify search results contain 'admin'
      const hasAdminUser = response.body.data.users.some(
        user =>
          user.name.toLowerCase().includes('admin') ||
          user.email.toLowerCase().includes('admin')
      );
      expect(hasAdminUser).toBe(true);

      console.log('✅ Get users with search filter successful');
    });

    test('should get users with status filter', async () => {
      const response = await request(app)
        .get('/api/users?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify all returned users are active
      const allActive = response.body.data.users.every(
        user => user.isActive === true
      );
      expect(allActive).toBe(true);

      console.log('✅ Get users with status filter successful');
    });

    test('should fail to get users without authentication', async () => {
      const response = await request(app).get('/api/users').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get users failed without authentication');
    });

    test('should fail to get users with insufficient permissions', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');

      console.log('✅ Get users failed with insufficient permissions');
    });
  });

  describe('POST /api/users', () => {
    test('should create new user with valid data', async () => {
      const newUserData = {
        email: 'newuser@test.com',
        password: 'NewUserPassword123!',
        firstName: 'New',
        lastName: 'User',
        phone: '+1234567890',
        roleIds: [testRole.id],
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(newUserData.email);
      expect(response.body.data.user.name).toBe('New User');
      expect(response.body.data.user.isActive).toBe(true);

      // Verify user was created in database
      const createdUser = await prisma.user.findUnique({
        where: { email: newUserData.email },
        include: { userRoles: true },
      });
      expect(createdUser).toBeDefined();
      expect(createdUser.userRoles.length).toBe(1);
      expect(createdUser.userRoles[0].roleId).toBe(testRole.id);

      console.log('✅ Create new user successful');
    });

    test('should fail to create user with duplicate email', async () => {
      const newUserData = {
        email: 'admin@test.com', // Already exists
        password: 'NewUserPassword123!',
        firstName: 'New',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        'User with this email already exists'
      );

      console.log('✅ Create user failed with duplicate email');
    });

    test('should fail to create user with invalid email format', async () => {
      const newUserData = {
        email: 'invalid-email',
        password: 'NewUserPassword123!',
        firstName: 'New',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email format');

      console.log('✅ Create user failed with invalid email format');
    });

    test('should fail to create user with weak password', async () => {
      const newUserData = {
        email: 'newuser@test.com',
        password: 'weak',
        firstName: 'New',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        'Password must be at least 8 characters'
      );

      console.log('✅ Create user failed with weak password');
    });

    test('should fail to create user without required fields', async () => {
      const newUserData = {
        email: 'newuser@test.com',
        // Missing password, firstName, lastName
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');

      console.log('✅ Create user failed without required fields');
    });

    test('should fail to create user without authentication', async () => {
      const newUserData = {
        email: 'newuser@test.com',
        password: 'NewUserPassword123!',
        firstName: 'New',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUserData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Create user failed without authentication');
    });
  });

  describe('GET /api/users/:id', () => {
    test('should get user by ID with admin permissions', async () => {
      const response = await request(app)
        .get(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.id).toBe(regularUser.id);
      expect(response.body.data.user.email).toBe(regularUser.email);
      expect(response.body.data.user.name).toBe(regularUser.name);

      console.log('✅ Get user by ID successful');
    });

    test('should fail to get non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');

      console.log('✅ Get non-existent user failed');
    });

    test('should fail to get user without authentication', async () => {
      const response = await request(app)
        .get(`/api/users/${regularUser.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get user failed without authentication');
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should update user with valid data', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+9876543210',
        isActive: true,
      };

      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.name).toBe('Updated Name');

      // Verify user was updated in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: regularUser.id },
      });
      expect(updatedUser.name).toBe('Updated Name');

      console.log('✅ Update user successful');
    });

    test('should fail to update user with duplicate email', async () => {
      const updateData = {
        email: 'admin@test.com', // Already exists
      };

      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email already exists');

      console.log('✅ Update user failed with duplicate email');
    });

    test('should fail to update non-existent user', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const response = await request(app)
        .put('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');

      console.log('✅ Update non-existent user failed');
    });

    test('should fail to update user without authentication', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Update user failed without authentication');
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should delete user with admin permissions', async () => {
      const response = await request(app)
        .delete(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('User deleted successfully');

      // Verify user was deleted from database
      const deletedUser = await prisma.user.findUnique({
        where: { id: regularUser.id },
      });
      expect(deletedUser).toBeNull();

      console.log('✅ Delete user successful');
    });

    test('should fail to delete non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');

      console.log('✅ Delete non-existent user failed');
    });

    test('should fail to delete superadmin user', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot delete superadmin user');

      console.log('✅ Delete superadmin user failed');
    });

    test('should fail to delete user without authentication', async () => {
      const response = await request(app)
        .delete(`/api/users/${regularUser.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Delete user failed without authentication');
    });
  });

  describe('POST /api/users/bulk', () => {
    test('should perform bulk activate operation', async () => {
      // Create inactive users
      const inactiveUser1 = await prisma.user.create({
        data: {
          email: 'inactive1@test.com',
          passwordHash: await bcrypt.hash('Password123!', 12),
          name: 'Inactive User 1',
          tenantId: testTenant.id,
          isActive: false,
        },
      });

      const inactiveUser2 = await prisma.user.create({
        data: {
          email: 'inactive2@test.com',
          passwordHash: await bcrypt.hash('Password123!', 12),
          name: 'Inactive User 2',
          tenantId: testTenant.id,
          isActive: false,
        },
      });

      const bulkData = {
        userIds: [inactiveUser1.id, inactiveUser2.id],
        action: 'activate',
        reason: 'Bulk activation test',
      };

      const response = await request(app)
        .post('/api/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('2 users activated successfully');

      // Verify users were activated in database
      const activatedUser1 = await prisma.user.findUnique({
        where: { id: inactiveUser1.id },
      });
      const activatedUser2 = await prisma.user.findUnique({
        where: { id: inactiveUser2.id },
      });
      expect(activatedUser1.isActive).toBe(true);
      expect(activatedUser2.isActive).toBe(true);

      console.log('✅ Bulk activate operation successful');
    });

    test('should perform bulk deactivate operation', async () => {
      const bulkData = {
        userIds: [regularUser.id],
        action: 'deactivate',
        reason: 'Bulk deactivation test',
      };

      const response = await request(app)
        .post('/api/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(
        '1 users deactivated successfully'
      );

      // Verify user was deactivated in database
      const deactivatedUser = await prisma.user.findUnique({
        where: { id: regularUser.id },
      });
      expect(deactivatedUser.isActive).toBe(false);

      console.log('✅ Bulk deactivate operation successful');
    });

    test('should fail bulk operation with invalid action', async () => {
      const bulkData = {
        userIds: [regularUser.id],
        action: 'invalid-action',
        reason: 'Test',
      };

      const response = await request(app)
        .post('/api/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');

      console.log('✅ Bulk operation failed with invalid action');
    });

    test('should fail bulk operation without authentication', async () => {
      const bulkData = {
        userIds: [regularUser.id],
        action: 'activate',
        reason: 'Test',
      };

      const response = await request(app)
        .post('/api/users/bulk')
        .send(bulkData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Bulk operation failed without authentication');
    });
  });

  describe('GET /api/users/me', () => {
    test('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.id).toBe(regularUser.id);
      expect(response.body.data.user.email).toBe(regularUser.email);
      expect(response.body.data.user.name).toBe(regularUser.name);

      console.log('✅ Get current user profile successful');
    });

    test('should fail to get profile without authentication', async () => {
      const response = await request(app).get('/api/users/me').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get profile failed without authentication');
    });
  });

  describe('PUT /api/users/me', () => {
    test('should update current user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Profile',
        phone: '+1111111111',
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.name).toBe('Updated Profile');

      // Verify profile was updated in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: regularUser.id },
      });
      expect(updatedUser.name).toBe('Updated Profile');

      console.log('✅ Update current user profile successful');
    });

    test('should fail to update profile with invalid data', async () => {
      const updateData = {
        email: 'invalid-email',
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');

      console.log('✅ Update profile failed with invalid data');
    });

    test('should fail to update profile without authentication', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Profile',
      };

      const response = await request(app)
        .put('/api/users/me')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Update profile failed without authentication');
    });
  });

  // Edge Cases and Error Handling
  describe('Edge Cases and Error Handling', () => {
    test('should handle very long user names', async () => {
      const longName = 'a'.repeat(1000);
      const newUserData = {
        email: 'longname@test.com',
        password: 'Password123!',
        firstName: longName,
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');

      console.log('✅ Long user names handled correctly');
    });

    test('should handle special characters in user data', async () => {
      const specialData = {
        email: 'special@test.com',
        password: 'Password123!',
        firstName: 'Special@#$%^&*()',
        lastName: 'User+-=[]{}|;:,.<>?',
        phone: '+1-234-567-8900',
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(specialData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(
        'Special@#$%^&*() User+-=[]{}|;:,.<>?'
      );

      console.log('✅ Special characters in user data handled correctly');
    });

    test('should handle concurrent user creation', async () => {
      const userData = {
        email: 'concurrent@test.com',
        password: 'Password123!',
        firstName: 'Concurrent',
        lastName: 'User',
      };

      // Make concurrent requests
      const promises = Array(3)
        .fill()
        .map((_, index) =>
          request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              ...userData,
              email: `concurrent${index}@test.com`,
            })
        );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      console.log('✅ Concurrent user creation handled successfully');
    });

    test('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');

      console.log('✅ Empty request body handled correctly');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('{"email": "test@example.com", "password": "Password123!"') // Missing closing brace
        .expect(400);

      expect(response.body.success).toBe(false);

      console.log('✅ Malformed JSON handled correctly');
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    test('should handle rapid user creation requests', async () => {
      const startTime = Date.now();

      // Create 10 users rapidly
      const promises = Array(10)
        .fill()
        .map((_, index) =>
          request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              email: `rapid${index}@test.com`,
              password: 'Password123!',
              firstName: 'Rapid',
              lastName: `User${index}`,
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
        `✅ 10 rapid user creation requests completed in ${totalTime}ms`
      );
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle large user list with pagination', async () => {
      // Create 50 users for testing pagination
      const createPromises = Array(50)
        .fill()
        .map((_, index) =>
          prisma.user.create({
            data: {
              email: `pagination${index}@test.com`,
              passwordHash: bcrypt.hashSync('Password123!', 12),
              name: `Pagination User ${index}`,
              tenantId: testTenant.id,
              isActive: true,
            },
          })
        );

      await Promise.all(createPromises);

      const startTime = Date.now();

      // Test pagination performance
      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBe(10);
      expect(response.body.data.meta.total).toBeGreaterThan(50);

      const totalTime = endTime - startTime;
      console.log(`✅ Large user list pagination completed in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should handle large payload gracefully', async () => {
      const largePayload = {
        email: 'large@test.com',
        password: 'Password123!',
        firstName: 'Large',
        lastName: 'User',
        extraData: 'x'.repeat(10000), // 10KB of extra data
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(largePayload)
        .expect(201); // Should still work, ignoring extra data

      expect(response.body.success).toBe(true);

      console.log('✅ Large payload handled gracefully');
    });
  });

  // Data Scope Tests
  describe('Data Scope Tests', () => {
    test('should only return users from same tenant', async () => {
      // Create another tenant and user
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          domain: 'other.com',
          isActive: true,
        },
      });

      await prisma.user.create({
        data: {
          email: 'other@other.com',
          passwordHash: await bcrypt.hash('Password123!', 12),
          name: 'Other User',
          tenantId: otherTenant.id,
          isActive: true,
        },
      });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify all returned users belong to the same tenant
      const allSameTenant = response.body.data.users.every(
        user => user.tenantId === testTenant.id
      );
      expect(allSameTenant).toBe(true);

      console.log('✅ Data scope filtering works correctly');
    });

    test('should not allow access to users from other tenants', async () => {
      // Create another tenant and user
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          domain: 'other.com',
          isActive: true,
        },
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other@other.com',
          passwordHash: await bcrypt.hash('Password123!', 12),
          name: 'Other User',
          tenantId: otherTenant.id,
          isActive: true,
        },
      });

      const response = await request(app)
        .get(`/api/users/${otherUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');

      console.log('✅ Data scope prevents access to other tenant users');
    });
  });
});
