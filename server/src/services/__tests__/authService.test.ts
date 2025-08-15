import { AuthService } from '../authService';
import { testDatabase } from '../../test/helpers/database';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: PrismaClient;
  let testData: any;

  beforeAll(async () => {
    prisma = testDatabase.getClient();
    authService = new AuthService(prisma);

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

  describe('login', () => {
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

      const result = await authService.login(loginData);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(loginData.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.device).toBeDefined();
      expect(result.device.deviceId).toBe(loginData.deviceInfo.deviceId);
    });

    it('should throw error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password123',
        deviceInfo: { deviceId: 'test-device' },
        rememberMe: false,
      };

      await expect(authService.login(loginData)).rejects.toThrow();
    });

    it('should throw error for invalid password', async () => {
      const loginData = {
        email: 'admin@test.com',
        password: 'wrongpassword',
        deviceInfo: { deviceId: 'test-device' },
        rememberMe: false,
      };

      await expect(authService.login(loginData)).rejects.toThrow();
    });

    it('should throw error for inactive user', async () => {
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

      await expect(authService.login(loginData)).rejects.toThrow();
    });

    it('should create device record for new device', async () => {
      const loginData = {
        email: 'admin@test.com',
        password: 'password123',
        deviceInfo: {
          deviceId: 'new-device-id',
          deviceType: 'mobile',
          browser: 'Safari',
          os: 'iOS',
          ipAddress: '192.168.1.1',
          userAgent: 'Mobile Safari...',
        },
        rememberMe: true,
      };

      const result = await authService.login(loginData);

      expect(result.device).toBeDefined();
      expect(result.device.deviceId).toBe(loginData.deviceInfo.deviceId);
      expect(result.device.deviceType).toBe(loginData.deviceInfo.deviceType);
      expect(result.device.isTrusted).toBe(false);
    });

    it('should mark device as trusted for remembered login', async () => {
      const loginData = {
        email: 'admin@test.com',
        password: 'password123',
        deviceInfo: {
          deviceId: 'trusted-device',
          deviceType: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
          ipAddress: '127.0.0.1',
          userAgent: 'Chrome...',
        },
        rememberMe: true,
      };

      const result = await authService.login(loginData);

      expect(result.device.isTrusted).toBe(true);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // First login to get refresh token
      const loginResult = await authService.login({
        email: 'admin@test.com',
        password: 'password123',
        deviceInfo: { deviceId: 'test-device' },
        rememberMe: false,
      });

      const refreshData = {
        refreshToken: loginResult.refreshToken,
        deviceId: 'test-device',
      };

      const result = await authService.refreshToken(refreshData);

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.accessToken).not.toBe(loginResult.accessToken);
      expect(result.refreshToken).not.toBe(loginResult.refreshToken);
    });

    it('should throw error for invalid refresh token', async () => {
      const refreshData = {
        refreshToken: 'invalid-token',
        deviceId: 'test-device',
      };

      await expect(authService.refreshToken(refreshData)).rejects.toThrow();
    });

    it('should throw error for expired refresh token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: testData.users.adminUser.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || 'test-secret',
        { expiresIn: '0s' }
      );

      const refreshData = {
        refreshToken: expiredToken,
        deviceId: 'test-device',
      };

      await expect(authService.refreshToken(refreshData)).rejects.toThrow();
    });

    it('should throw error for non-existent device', async () => {
      const loginResult = await authService.login({
        email: 'admin@test.com',
        password: 'password123',
        deviceInfo: { deviceId: 'test-device' },
        rememberMe: false,
      });

      const refreshData = {
        refreshToken: loginResult.refreshToken,
        deviceId: 'non-existent-device',
      };

      await expect(authService.refreshToken(refreshData)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // First login to get tokens
      const loginResult = await authService.login({
        email: 'admin@test.com',
        password: 'password123',
        deviceInfo: { deviceId: 'test-device' },
        rememberMe: false,
      });

      const logoutData = {
        refreshToken: loginResult.refreshToken,
        deviceId: 'test-device',
      };

      const result = await authService.logout(logoutData);

      expect(result).toBe(true);

      // Verify token is invalidated
      await expect(authService.refreshToken(logoutData)).rejects.toThrow();
    });

    it('should throw error for invalid refresh token', async () => {
      const logoutData = {
        refreshToken: 'invalid-token',
        deviceId: 'test-device',
      };

      await expect(authService.logout(logoutData)).rejects.toThrow();
    });
  });

  describe('validateToken', () => {
    it('should validate valid access token', async () => {
      const loginResult = await authService.login({
        email: 'admin@test.com',
        password: 'password123',
        deviceInfo: { deviceId: 'test-device' },
        rememberMe: false,
      });

      const result = await authService.validateToken(loginResult.accessToken);

      expect(result).toBeDefined();
      expect(result.userId).toBe(testData.users.adminUser.id);
      expect(result.tenantId).toBe(testData.tenant.id);
      expect(result.deviceId).toBe('test-device');
    });

    it('should throw error for invalid token', async () => {
      await expect(
        authService.validateToken('invalid-token')
      ).rejects.toThrow();
    });

    it('should throw error for expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: testData.users.adminUser.id, type: 'access' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '0s' }
      );

      await expect(authService.validateToken(expiredToken)).rejects.toThrow();
    });
  });

  describe('getUserDevices', () => {
    it('should return user devices', async () => {
      // Login multiple times to create devices
      await authService.login({
        email: 'admin@test.com',
        password: 'password123',
        deviceInfo: { deviceId: 'device-1' },
        rememberMe: false,
      });

      await authService.login({
        email: 'admin@test.com',
        password: 'password123',
        deviceInfo: { deviceId: 'device-2' },
        rememberMe: true,
      });

      const devices = await authService.getUserDevices(
        testData.users.adminUser.id
      );

      expect(devices).toBeDefined();
      expect(devices).toBeInstanceOf(Array);
      expect(devices.length).toBeGreaterThan(0);
      expect(devices.some(d => d.deviceId === 'device-1')).toBe(true);
      expect(devices.some(d => d.deviceId === 'device-2')).toBe(true);
    });

    it('should return empty array for user without devices', async () => {
      const devices = await authService.getUserDevices('non-existent-user');
      expect(devices).toEqual([]);
    });
  });

  describe('revokeDevice', () => {
    it('should revoke device successfully', async () => {
      // First login to create device
      const loginResult = await authService.login({
        email: 'admin@test.com',
        password: 'password123',
        deviceInfo: { deviceId: 'device-to-revoke' },
        rememberMe: false,
      });

      const revokeData = {
        deviceId: 'device-to-revoke',
        userId: testData.users.adminUser.id,
      };

      const result = await authService.revokeDevice(revokeData);

      expect(result).toBe(true);

      // Verify device is revoked
      const devices = await authService.getUserDevices(
        testData.users.adminUser.id
      );
      expect(
        devices.find(d => d.deviceId === 'device-to-revoke')
      ).toBeUndefined();
    });

    it('should throw error for non-existent device', async () => {
      const revokeData = {
        deviceId: 'non-existent-device',
        userId: testData.users.adminUser.id,
      };

      await expect(authService.revokeDevice(revokeData)).rejects.toThrow();
    });
  });

  describe('getUserSessions', () => {
    it('should return user sessions', async () => {
      // Create multiple sessions
      await authService.login({
        email: 'admin@test.com',
        password: 'password123',
        deviceInfo: { deviceId: 'session-1' },
        rememberMe: false,
      });

      await authService.login({
        email: 'admin@test.com',
        password: 'password123',
        deviceInfo: { deviceId: 'session-2' },
        rememberMe: true,
      });

      const sessions = await authService.getUserSessions(
        testData.users.adminUser.id
      );

      expect(sessions).toBeDefined();
      expect(sessions).toBeInstanceOf(Array);
      expect(sessions.length).toBeGreaterThan(0);
    });
  });

  describe('revokeSession', () => {
    it('should revoke session successfully', async () => {
      // First login to create session
      const loginResult = await authService.login({
        email: 'admin@test.com',
        password: 'password123',
        deviceInfo: { deviceId: 'session-to-revoke' },
        rememberMe: false,
      });

      const revokeData = {
        sessionId: loginResult.device.id,
        userId: testData.users.adminUser.id,
      };

      const result = await authService.revokeSession(revokeData);

      expect(result).toBe(true);
    });
  });

  describe('requestPasswordReset', () => {
    it('should create password reset token', async () => {
      const resetData = {
        email: 'admin@test.com',
        tenantId: testData.tenant.id,
      };

      const result = await authService.requestPasswordReset(resetData);

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.expiresAt).toBeDefined();
      expect(result.userId).toBe(testData.users.adminUser.id);
    });

    it('should throw error for non-existent email', async () => {
      const resetData = {
        email: 'nonexistent@test.com',
        tenantId: testData.tenant.id,
      };

      await expect(
        authService.requestPasswordReset(resetData)
      ).rejects.toThrow();
    });

    it('should throw error for inactive user', async () => {
      // Deactivate user
      await prisma.user.update({
        where: { id: testData.users.adminUser.id },
        data: { isActive: false },
      });

      const resetData = {
        email: 'admin@test.com',
        tenantId: testData.tenant.id,
      };

      await expect(
        authService.requestPasswordReset(resetData)
      ).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      // First request password reset
      const resetRequest = await authService.requestPasswordReset({
        email: 'admin@test.com',
        tenantId: testData.tenant.id,
      });

      const resetData = {
        token: resetRequest.token,
        password: 'newpassword123',
      };

      const result = await authService.resetPassword(resetData);

      expect(result).toBe(true);

      // Verify new password works
      const loginResult = await authService.login({
        email: 'admin@test.com',
        password: 'newpassword123',
        deviceInfo: { deviceId: 'test-device' },
        rememberMe: false,
      });

      expect(loginResult).toBeDefined();
    });

    it('should throw error for invalid token', async () => {
      const resetData = {
        token: 'invalid-token',
        password: 'newpassword123',
      };

      await expect(authService.resetPassword(resetData)).rejects.toThrow();
    });

    it('should throw error for expired token', async () => {
      // Create expired token
      const expiredToken = 'expired-token-123';

      const resetData = {
        token: expiredToken,
        password: 'newpassword123',
      };

      await expect(authService.resetPassword(resetData)).rejects.toThrow();
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      // Create unverified user
      const unverifiedUser = await prisma.user.create({
        data: {
          email: 'unverified@test.com',
          firstName: 'Unverified',
          lastName: 'User',
          password: 'password123',
          emailVerified: false,
          tenantId: testData.tenant.id,
          roleId: testData.roles.userRole.id,
        },
      });

      const verifyData = {
        token: 'verification-token-123',
        userId: unverifiedUser.id,
      };

      const result = await authService.verifyEmail(verifyData);

      expect(result).toBe(true);

      // Verify user is now verified
      const updatedUser = await prisma.user.findUnique({
        where: { id: unverifiedUser.id },
      });
      expect(updatedUser?.emailVerified).toBe(true);
    });

    it('should throw error for invalid token', async () => {
      const verifyData = {
        token: 'invalid-token',
        userId: testData.users.adminUser.id,
      };

      await expect(authService.verifyEmail(verifyData)).rejects.toThrow();
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email', async () => {
      const resendData = {
        email: 'admin@test.com',
        tenantId: testData.tenant.id,
      };

      const result = await authService.resendVerification(resendData);

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.expiresAt).toBeDefined();
    });

    it('should throw error for already verified user', async () => {
      const resendData = {
        email: 'admin@test.com', // Already verified
        tenantId: testData.tenant.id,
      };

      await expect(
        authService.resendVerification(resendData)
      ).rejects.toThrow();
    });
  });
});
