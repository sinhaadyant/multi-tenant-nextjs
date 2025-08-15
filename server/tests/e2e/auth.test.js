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

describe('Authentication API - E2E Tests', () => {
  let testUser;
  let testTenant;
  let testRole;
  let authToken;
  let refreshToken;

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
    await prisma.refreshToken.deleteMany();
    await prisma.loginDevice.deleteMany();
    await prisma.resetToken.deleteMany();
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
        description: 'Test role for authentication',
        tenantId: testTenant.id,
        isGlobal: false,
      },
    });

    // Create test user
    const hashedPassword = await bcrypt.hash(
      credentials.users.user.password,
      12
    );
    testUser = await prisma.user.create({
      data: {
        email: credentials.users.user.email,
        passwordHash: hashedPassword,
        name: credentials.users.user.name,
        tenantId: testTenant.id,
        isActive: credentials.users.user.isActive,
        isSuperadmin: credentials.users.user.isSuperadmin,
      },
    });

    // Assign role to user
    await prisma.userRole.create({
      data: {
        userId: testUser.id,
        roleId: testRole.id,
      },
    });

    console.log('✅ Test data prepared');
  });

  describe('POST /api/auth/login', () => {
    test('should successfully login with valid credentials', async () => {
      const loginData = {
        email: credentials.users.user.email,
        password: credentials.users.user.password,
        tenantSlug: credentials.tenants.primary.domain,
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(credentials.users.user.email);
      expect(response.body.data.user.tenantId).toBe(testTenant.id);

      // Verify JWT token
      const decoded = jwt.verify(
        response.body.data.accessToken,
        credentials.jwt.secret
      );
      expect(decoded.userId).toBe(testUser.id);
      expect(decoded.email).toBe(credentials.users.user.email);

      // Store tokens for other tests
      authToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;

      console.log('✅ Login successful with valid credentials');
    });

    test('should fail login with invalid email', async () => {
      const loginData = {
        email: credentials.scenarios.authentication.nonExistentUser.email,
        password: credentials.users.user.password,
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');

      console.log('✅ Login failed with invalid email');
    });

    test('should fail login with invalid password', async () => {
      const loginData = {
        email: credentials.users.user.email,
        password: credentials.scenarios.authentication.invalidPassword.password,
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        credentials.errors.authentication.invalidCredentials
      );

      console.log('✅ Login failed with invalid password');
    });

    test('should fail login with inactive user', async () => {
      // Deactivate user
      await prisma.user.update({
        where: { id: testUser.id },
        data: { isActive: false },
      });

      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Account is inactive');

      console.log('✅ Login failed with inactive user');
    });

    test('should fail login with missing email', async () => {
      const loginData = {
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email is required');

      console.log('✅ Login failed with missing email');
    });

    test('should fail login with missing password', async () => {
      const loginData = {
        email: 'test@example.com',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Password is required');

      console.log('✅ Login failed with missing password');
    });

    test('should fail login with invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email format');

      console.log('✅ Login failed with invalid email format');
    });

    test('should handle rate limiting for multiple failed attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      // Make multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app).post('/api/auth/login').send(loginData).expect(401);
      }

      // Next attempt should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Too many requests');

      console.log('✅ Rate limiting works for failed login attempts');
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      // Login to get tokens
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

      authToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    test('should successfully logout with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');

      // Verify refresh token is invalidated in database
      const invalidatedToken = await prisma.refreshToken.findFirst({
        where: { token: refreshToken },
      });
      expect(invalidatedToken.isActive).toBe(false);

      console.log('✅ Logout successful with valid token');
    });

    test('should fail logout without token', async () => {
      const response = await request(app).post('/api/auth/logout').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Logout failed without token');
    });

    test('should fail logout with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');

      console.log('✅ Logout failed with invalid token');
    });
  });

  describe('POST /api/auth/refresh', () => {
    beforeEach(async () => {
      // Login to get tokens
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

      authToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    test('should successfully refresh access token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.accessToken).not.toBe(authToken);

      // Verify new token is valid
      const decoded = jwt.verify(
        response.body.data.accessToken,
        process.env.JWT_SECRET || 'test-secret'
      );
      expect(decoded.userId).toBe(testUser.id);

      console.log('✅ Token refresh successful');
    });

    test('should fail refresh with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid refresh token');

      console.log('✅ Token refresh failed with invalid token');
    });

    test('should fail refresh with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Refresh token is required');

      console.log('✅ Token refresh failed with missing token');
    });

    test('should fail refresh with expired refresh token', async () => {
      // Create an expired refresh token
      const expiredToken = jwt.sign(
        { userId: testUser.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || 'test-refresh-secret',
        { expiresIn: '0s' }
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Refresh token expired');

      console.log('✅ Token refresh failed with expired token');
    });
  });

  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      // Login to get tokens
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

      authToken = loginResponse.body.data.accessToken;
    });

    test('should get current user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.name).toBe('Test User');
      expect(response.body.data.user.tenantId).toBe(testTenant.id);
      expect(response.body.data.user.isActive).toBe(true);

      console.log('✅ Get current user profile successful');
    });

    test('should fail to get profile without token', async () => {
      const response = await request(app).get('/api/auth/me').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get profile failed without token');
    });

    test('should fail to get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');

      console.log('✅ Get profile failed with invalid token');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    test('should send password reset email for valid user', async () => {
      const response = await request(app)
        .post('/api/auth/request-reset')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password reset email sent');

      // Verify reset token was created in database
      const resetToken = await prisma.resetToken.findFirst({
        where: { userId: testUser.id },
      });
      expect(resetToken).toBeDefined();
      expect(resetToken.isUsed).toBe(false);

      console.log('✅ Password reset email sent successfully');
    });

    test('should fail for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');

      console.log('✅ Password reset failed for non-existent user');
    });

    test('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email is required');

      console.log('✅ Password reset failed with missing email');
    });

    test('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email format');

      console.log('✅ Password reset failed with invalid email format');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken;

    beforeEach(async () => {
      // Create a reset token
      resetToken = await prisma.resetToken.create({
        data: {
          userId: testUser.id,
          token: 'test-reset-token',
          expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
          isUsed: false,
        },
      });
    });

    test('should successfully reset password with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/confirm-reset')
        .send({
          token: 'test-reset-token',
          newPassword: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password reset successfully');

      // Verify token is marked as used
      const updatedToken = await prisma.resetToken.findFirst({
        where: { id: resetToken.id },
      });
      expect(updatedToken.isUsed).toBe(true);

      // Verify password was changed
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      const isNewPasswordValid = await bcrypt.compare(
        'NewPassword123!',
        updatedUser.passwordHash
      );
      expect(isNewPasswordValid).toBe(true);

      console.log('✅ Password reset successful');
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/confirm-reset')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid reset token');

      console.log('✅ Password reset failed with invalid token');
    });

    test('should fail with expired token', async () => {
      // Create an expired token
      await prisma.resetToken.update({
        where: { id: resetToken.id },
        data: { expiresAt: new Date(Date.now() - 3600000) }, // 1 hour ago
      });

      const response = await request(app)
        .post('/api/auth/confirm-reset')
        .send({
          token: 'test-reset-token',
          newPassword: 'NewPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Reset token expired');

      console.log('✅ Password reset failed with expired token');
    });

    test('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/confirm-reset')
        .send({
          token: 'test-reset-token',
          newPassword: 'weak',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        'Password must be at least 8 characters'
      );

      console.log('✅ Password reset failed with weak password');
    });
  });

  describe('GET /api/sessions', () => {
    beforeEach(async () => {
      // Login to get tokens
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

      authToken = loginResponse.body.data.accessToken;
    });

    test('should get user sessions with valid token', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessions');
      expect(Array.isArray(response.body.data.sessions)).toBe(true);

      console.log('✅ Get user sessions successful');
    });

    test('should fail to get sessions without token', async () => {
      const response = await request(app).get('/api/sessions').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get sessions failed without token');
    });
  });

  describe('DELETE /api/sessions/:id', () => {
    let sessionId;

    beforeEach(async () => {
      // Login to get tokens
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

      authToken = loginResponse.body.data.accessToken;

      // Create a test login device (session)
      const session = await prisma.loginDevice.create({
        data: {
          userId: testUser.id,
          deviceId: `test-device-${Date.now()}`,
          ipAddress: '127.0.0.1',
          userAgent: 'Test User Agent',
          isActive: true,
          browser: 'Test Browser',
          os: 'Test OS',
          platform: 'Test Platform',
          deviceType: 'desktop',
        },
      });
      sessionId = session.id;
    });

    test('should revoke specific session with valid token', async () => {
      const response = await request(app)
        .delete(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Session revoked successfully');

      // Verify session is deactivated in database
      const revokedSession = await prisma.loginDevice.findUnique({
        where: { id: sessionId },
      });
      expect(revokedSession.isActive).toBe(false);

      console.log('✅ Session revocation successful');
    });

    test('should fail to revoke non-existent session', async () => {
      const response = await request(app)
        .delete('/api/sessions/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Session not found');

      console.log('✅ Session revocation failed for non-existent session');
    });

    test('should fail to revoke session without token', async () => {
      const response = await request(app)
        .delete(`/api/sessions/${sessionId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Session revocation failed without token');
    });
  });

  // Edge Cases and Error Handling
  describe('Edge Cases and Error Handling', () => {
    test('should handle concurrent login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };

      // Make concurrent login requests
      const promises = Array(3)
        .fill()
        .map(() => request(app).post('/api/auth/login').send(loginData));

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      console.log('✅ Concurrent login attempts handled successfully');
    });

    test('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@example.com';

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: longEmail,
          password: 'TestPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email format');

      console.log('✅ Long email addresses handled correctly');
    });

    test('should handle special characters in password', async () => {
      const specialPassword = 'Test@#$%^&*()_+-=[]{}|;:,.<>?';

      // Update user password
      const hashedPassword = await bcrypt.hash(specialPassword, 12);
      await prisma.user.update({
        where: { id: testUser.id },
        data: { passwordHash: hashedPassword },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: specialPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      console.log('✅ Special characters in password handled correctly');
    });

    test('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email is required');

      console.log('✅ Empty request body handled correctly');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "test@example.com", "password": "TestPassword123!"') // Missing closing brace
        .expect(400);

      expect(response.body.success).toBe(false);

      console.log('✅ Malformed JSON handled correctly');
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    test('should handle rapid login requests', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };

      const startTime = Date.now();

      // Make 10 rapid requests
      const promises = Array(10)
        .fill()
        .map(() => request(app).post('/api/auth/login').send(loginData));

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      const totalTime = endTime - startTime;
      console.log(`✅ 10 rapid login requests completed in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle large payload gracefully', async () => {
      const largePayload = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        extraData: 'x'.repeat(10000), // 10KB of extra data
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(largePayload)
        .expect(200); // Should still work, ignoring extra data

      expect(response.body.success).toBe(true);

      console.log('✅ Large payload handled gracefully');
    });
  });
});
