import request from 'supertest';
import { app } from '../../index';
import { testDatabase } from '../../test/helpers/database';
import { PrismaClient } from '@prisma/client';

describe('Users API Integration Tests', () => {
  let prisma: PrismaClient;
  let testData: any;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    prisma = testDatabase.getClient();

    // Setup test data
    await testDatabase.runMigrations();
    testData = await testDatabase.seedDatabase();
  });

  afterAll(async () => {
    await testDatabase.disconnect();
  });

  beforeEach(async () => {
    await testDatabase.cleanDatabase();
    testData = await testDatabase.seedDatabase();

    // Get authentication tokens
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
        deviceInfo: { deviceId: 'admin-device' },
        rememberMe: false,
      });

    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'password123',
        deviceInfo: { deviceId: 'user-device' },
        rememberMe: false,
      });

    adminToken = adminLoginResponse.body.data.accessToken;
    userToken = userLoginResponse.body.data.accessToken;
  });

  describe('GET /api/users', () => {
    it('should return paginated users for admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.total).toBeGreaterThan(0);
    });

    it('should filter users by search term', async () => {
      const response = await request(app)
        .get('/api/users?search=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].firstName.toLowerCase()).toContain('admin');
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get(`/api/users?roleId=${testData.roles.adminRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(
        response.body.data.every(
          user => user.roleId === testData.roles.adminRole.id
        )
      ).toBe(true);
    });

    it('should filter users by active status', async () => {
      const response = await request(app)
        .get('/api/users?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every(user => user.isActive === true)).toBe(
        true
      );
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/users').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication required');
    });
  });

  describe('POST /api/users', () => {
    it('should create user successfully for admin', async () => {
      const userData = {
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        roleId: testData.roles.userRole.id,
        phoneNumber: '+1234567890',
        isActive: true,
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.firstName).toBe(userData.firstName);
      expect(response.body.data.lastName).toBe(userData.lastName);
      expect(response.body.data.roleId).toBe(userData.roleId);
      expect(response.body.data.phoneNumber).toBe(userData.phoneNumber);
      expect(response.body.data.isActive).toBe(userData.isActive);
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        email: 'admin@test.com', // Already exists
        firstName: 'Duplicate',
        lastName: 'User',
        password: 'password123',
        roleId: testData.roles.userRole.id,
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User already exists');
    });

    it('should return 400 for invalid data', async () => {
      const userData = {
        email: 'invalid-email',
        firstName: '',
        password: '123', // Too short
        roleId: testData.roles.userRole.id,
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should return 403 for non-admin user', async () => {
      const userData = {
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        roleId: testData.roles.userRole.id,
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send(userData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by ID for admin', async () => {
      const response = await request(app)
        .get(`/api/users/${testData.users.adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testData.users.adminUser.id);
      expect(response.body.data.email).toBe(testData.users.adminUser.email);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get(`/api/users/${testData.users.adminUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user successfully for admin', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '+9876543210',
        isActive: false,
      };

      const response = await request(app)
        .put(`/api/users/${testData.users.regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.lastName).toBe(updateData.lastName);
      expect(response.body.data.phoneNumber).toBe(updateData.phoneNumber);
      expect(response.body.data.isActive).toBe(updateData.isActive);
    });

    it('should not update email if provided', async () => {
      const updateData = {
        email: 'newemail@test.com',
        firstName: 'Updated',
      };

      const response = await request(app)
        .put(`/api/users/${testData.users.regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.email).toBe(testData.users.regularUser.email); // Should remain unchanged
      expect(response.body.data.firstName).toBe(updateData.firstName);
    });

    it('should return 404 for non-existent user', async () => {
      const updateData = { firstName: 'Updated' };

      const response = await request(app)
        .put('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    it('should return 403 for non-admin user', async () => {
      const updateData = { firstName: 'Updated' };

      const response = await request(app)
        .put(`/api/users/${testData.users.regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully for admin', async () => {
      const response = await request(app)
        .delete(`/api/users/${testData.users.regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('User deleted successfully');
    });

    it('should not allow deleting admin users', async () => {
      const response = await request(app)
        .delete(`/api/users/${testData.users.adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot delete admin users');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .delete(`/api/users/${testData.users.regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('POST /api/users/bulk', () => {
    it('should perform bulk operations for admin', async () => {
      const bulkData = {
        userIds: [testData.users.regularUser.id],
        operation: 'activate',
      };

      const response = await request(app)
        .post('/api/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.updatedCount).toBe(1);
    });

    it('should return 400 for invalid operation', async () => {
      const bulkData = {
        userIds: [testData.users.regularUser.id],
        operation: 'invalid-operation',
      };

      const response = await request(app)
        .post('/api/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid operation');
    });

    it('should return 403 for non-admin user', async () => {
      const bulkData = {
        userIds: [testData.users.regularUser.id],
        operation: 'activate',
      };

      const response = await request(app)
        .post('/api/users/bulk')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bulkData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('GET /api/users/:id/activity', () => {
    it('should return user activity logs for admin', async () => {
      const response = await request(app)
        .get(`/api/users/${testData.users.adminUser.id}/activity`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id/activity')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get(`/api/users/${testData.users.adminUser.id}/activity`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('GET /api/users/stats', () => {
    it('should return user statistics for admin', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalUsers).toBeGreaterThan(0);
      expect(response.body.data.activeUsers).toBeGreaterThan(0);
      expect(response.body.data.inactiveUsers).toBeGreaterThanOrEqual(0);
      expect(response.body.data.verifiedUsers).toBeGreaterThan(0);
      expect(response.body.data.unverifiedUsers).toBeGreaterThanOrEqual(0);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('GET /api/users/search', () => {
    it('should search users for admin', async () => {
      const response = await request(app)
        .get('/api/users/search?q=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return 400 for missing search query', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Search query is required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/users/search?q=admin')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('PUT /api/users/:id/profile', () => {
    it('should update user profile for self', async () => {
      const profileData = {
        firstName: 'Updated',
        lastName: 'Profile',
        phoneNumber: '+1234567890',
      };

      const response = await request(app)
        .put(`/api/users/${testData.users.regularUser.id}/profile`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.firstName).toBe(profileData.firstName);
      expect(response.body.data.lastName).toBe(profileData.lastName);
      expect(response.body.data.phoneNumber).toBe(profileData.phoneNumber);
    });

    it('should not allow updating other user profiles', async () => {
      const profileData = {
        firstName: 'Updated',
        lastName: 'Profile',
      };

      const response = await request(app)
        .put(`/api/users/${testData.users.adminUser.id}/profile`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Can only update own profile');
    });

    it('should return 404 for non-existent user', async () => {
      const profileData = {
        firstName: 'Updated',
        lastName: 'Profile',
      };

      const response = await request(app)
        .put('/api/users/non-existent-id/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });
  });
});
