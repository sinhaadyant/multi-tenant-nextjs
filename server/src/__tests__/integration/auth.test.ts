import request from 'supertest';
import { app } from '../../index';
import { testDatabase } from '../../test/helpers/database';
import { PrismaClient } from '@prisma/client';

describe('Auth API Integration Tests', () => {
  let prisma: PrismaClient;
  let testData: any;

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
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'admin@test.com',
        password: 'password123',
        deviceInfo: {
          deviceId: 'test-device-1',
          deviceType: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0...',
        },
        rememberMe: false,
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password123',
        deviceInfo: { deviceId: 'test-device' },
        rememberMe: false,
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'admin@test.com',
        password: 'wrongpassword',
        deviceInfo: { deviceId: 'test-device' },
        rememberMe: false,
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 400 for missing required fields', async () => {
      const loginData = {
        email: 'admin@test.com',
        // Missing password
        deviceInfo: { deviceId: 'test-device' },
        rememberMe: false,
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should return 401 for inactive user', async () => {
      // Deactivate user
      await prisma.user.update({
        where: { id: testData.users.adminUser.id },
        data: { isActive: false },
      });

      const loginData = {
        email: 'admin@test.com',
        password: 'password123',
        deviceInfo: { deviceId: 'test-device' },
        rememberMe: false,
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Account is inactive');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // First login to get refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
          deviceInfo: { deviceId: 'test-device' },
          rememberMe: false,
        })
        .expect(200);

      const refreshData = {
        refreshToken: loginResponse.body.data.refreshToken,
        deviceId: 'test-device',
      };

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.accessToken).not.toBe(
        loginResponse.body.data.accessToken
      );
    });

    it('should return 401 for invalid refresh token', async () => {
      const refreshData = {
        refreshToken: 'invalid-token',
        deviceId: 'test-device',
      };

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid refresh token');
    });

    it('should return 400 for missing refresh token', async () => {
      const refreshData = {
        deviceId: 'test-device',
        // Missing refreshToken
      };

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // First login to get tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
          deviceInfo: { deviceId: 'test-device' },
          rememberMe: false,
        })
        .expect(200);

      const logoutData = {
        refreshToken: loginResponse.body.data.refreshToken,
        deviceId: 'test-device',
      };

      const response = await request(app)
        .post('/api/auth/logout')
        .send(logoutData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
    });

    it('should return 401 for invalid refresh token', async () => {
      const logoutData = {
        refreshToken: 'invalid-token',
        deviceId: 'test-device',
      };

      const response = await request(app)
        .post('/api/auth/logout')
        .send(logoutData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid refresh token');
    });
  });

  describe('POST /api/auth/request-password-reset', () => {
    it('should create password reset token', async () => {
      const resetData = {
        email: 'admin@test.com',
        tenantId: testData.tenant.id,
      };

      const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send(resetData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password reset email sent');
    });

    it('should return 404 for non-existent email', async () => {
      const resetData = {
        email: 'nonexistent@test.com',
        tenantId: testData.tenant.id,
      };

      const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send(resetData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    it('should return 400 for missing email', async () => {
      const resetData = {
        tenantId: testData.tenant.id,
        // Missing email
      };

      const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send(resetData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password successfully', async () => {
      // First request password reset
      const resetRequestResponse = await request(app)
        .post('/api/auth/request-password-reset')
        .send({
          email: 'admin@test.com',
          tenantId: testData.tenant.id,
        })
        .expect(200);

      // In a real scenario, the token would be sent via email
      // For testing, we'll use a mock token
      const resetData = {
        token: 'mock-reset-token-123',
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password reset successfully');
    });

    it('should return 400 for mismatched passwords', async () => {
      const resetData = {
        token: 'mock-reset-token-123',
        password: 'newpassword123',
        confirmPassword: 'differentpassword',
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should return 400 for weak password', async () => {
      const resetData = {
        token: 'mock-reset-token-123',
        password: '123',
        confirmPassword: '123',
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      // First login to get access token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
          deviceInfo: { deviceId: 'test-device' },
          rememberMe: false,
        })
        .expect(200);

      const changePasswordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
        .send(changePasswordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password changed successfully');
    });

    it('should return 401 for incorrect current password', async () => {
      // First login to get access token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
          deviceInfo: { deviceId: 'test-device' },
          rememberMe: false,
        })
        .expect(200);

      const changePasswordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
        .send(changePasswordData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Current password is incorrect');
    });

    it('should return 401 without authentication', async () => {
      const changePasswordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .send(changePasswordData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication required');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      // First login to get access token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
          deviceInfo: { deviceId: 'test-device' },
          rememberMe: false,
        })
        .expect(200);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe('admin@test.com');
      expect(response.body.data.firstName).toBe('Admin');
      expect(response.body.data.lastName).toBe('User');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/auth/me').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication required');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('GET /api/auth/devices', () => {
    it('should return user devices', async () => {
      // First login to get access token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
          deviceInfo: { deviceId: 'test-device' },
          rememberMe: false,
        })
        .expect(200);

      const response = await request(app)
        .get('/api/auth/devices')
        .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/auth/devices').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication required');
    });
  });

  describe('DELETE /api/auth/devices/:deviceId', () => {
    it('should revoke device successfully', async () => {
      // First login to get access token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
          deviceInfo: { deviceId: 'device-to-revoke' },
          rememberMe: false,
        })
        .expect(200);

      const response = await request(app)
        .delete('/api/auth/devices/device-to-revoke')
        .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Device revoked successfully');
    });

    it('should return 404 for non-existent device', async () => {
      // First login to get access token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
          deviceInfo: { deviceId: 'test-device' },
          rememberMe: false,
        })
        .expect(200);

      const response = await request(app)
        .delete('/api/auth/devices/non-existent-device')
        .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Device not found');
    });
  });
});
