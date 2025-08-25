import request from 'supertest';
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { POST as loginHandler } from '@/app/api/superadmin/auth/login/route';
import { POST as logoutHandler } from '@/app/api/superadmin/auth/logout/route';
import { POST as refreshHandler } from '@/app/api/superadmin/auth/refresh/route';
import { POST as forgotPasswordHandler } from '@/app/api/superadmin/auth/forgot-password/route';
import testUsers from '../../fixtures/users.json';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
  verifyToken: jest.fn().mockReturnValue({ id: 'sa-1', email: 'admin@superadmin.com' }),
  hashPassword: jest.fn().mockResolvedValue('$2b$10$mock-hash'),
  comparePassword: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/database', () => ({
  findSuperAdminByEmail: jest.fn(),
  updateSuperAdminLastLogin: jest.fn(),
  createPasswordResetToken: jest.fn(),
}));

jest.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
}));

const mockDatabase = require('@/lib/database');
const mockAuth = require('@/lib/auth');
const mockRateLimit = require('@/lib/rate-limiter');

describe('SuperAdmin Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/superadmin/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const validUser = testUsers.superAdmins[0];
      mockDatabase.findSuperAdminByEmail.mockResolvedValue({
        id: validUser.id,
        email: validUser.email,
        password: '$2b$10$mock-hash',
        status: 'active',
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: validUser.email,
          password: validUser.password,
          rememberMe: false,
        },
      });

      const response = await loginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe(validUser.email);
      expect(mockDatabase.updateSuperAdminLastLogin).toHaveBeenCalledWith(validUser.id);
    });

    it('should reject login with invalid email', async () => {
      mockDatabase.findSuperAdminByEmail.mockResolvedValue(null);

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'nonexistent@example.com',
          password: 'Test123!@#',
        },
      });

      const response = await loginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
    });

    it('should reject login with wrong password', async () => {
      const validUser = testUsers.superAdmins[0];
      mockDatabase.findSuperAdminByEmail.mockResolvedValue({
        id: validUser.id,
        email: validUser.email,
        password: '$2b$10$mock-hash',
        status: 'active',
      });
      mockAuth.comparePassword.mockResolvedValue(false);

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: validUser.email,
          password: 'wrongpassword',
        },
      });

      const response = await loginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
    });

    it('should reject login for inactive user', async () => {
      const inactiveUser = testUsers.superAdmins[1];
      mockDatabase.findSuperAdminByEmail.mockResolvedValue({
        id: inactiveUser.id,
        email: inactiveUser.email,
        password: '$2b$10$mock-hash',
        status: 'inactive',
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: inactiveUser.email,
          password: inactiveUser.password,
        },
      });

      const response = await loginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Account is disabled');
    });

    it('should handle rate limiting', async () => {
      mockRateLimit.checkRateLimit.mockResolvedValue({
        success: false,
        message: 'Too many login attempts',
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'admin@superadmin.com',
          password: 'Test123!@#',
        },
      });

      const response = await loginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(429);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Too many login attempts');
    });

    it('should validate email format', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'invalid-email',
          password: 'Test123!@#',
        },
      });

      const response = await loginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid email format');
    });

    it('should validate password strength', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'admin@superadmin.com',
          password: 'weak',
        },
      });

      const response = await loginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Password must be at least 8 characters');
    });

    it('should handle SQL injection attempts', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          email: "admin@test.com'; DROP TABLE users; --",
          password: 'Test123!@#',
        },
      });

      const response = await loginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(mockDatabase.findSuperAdminByEmail).not.toHaveBeenCalled();
    });

    it('should handle XSS attempts in input fields', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          email: '<script>alert("xss")</script>@test.com',
          password: 'Test123!@#',
        },
      });

      const response = await loginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid email format');
    });

    it('should handle malformed request bodies', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: 'invalid json',
      });

      const response = await loginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid request body');
    });

    it('should handle missing required fields', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'admin@superadmin.com',
          // password missing
        },
      });

      const response = await loginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Password is required');
    });
  });

  describe('POST /api/superadmin/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      mockAuth.verifyToken.mockReturnValue({
        id: 'sa-1',
        email: 'admin@superadmin.com',
        type: 'refresh',
      });
      mockAuth.generateToken.mockReturnValue('new-access-token');

      const { req } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-refresh-token',
        },
      });

      const response = await refreshHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.token).toBe('new-access-token');
    });

    it('should reject invalid refresh token', async () => {
      mockAuth.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const { req } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      const response = await refreshHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid refresh token');
    });

    it('should reject expired refresh token', async () => {
      mockAuth.verifyToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      const { req } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer expired-token',
        },
      });

      const response = await refreshHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Refresh token expired');
    });
  });

  describe('POST /api/superadmin/auth/forgot-password', () => {
    it('should send password reset email for valid user', async () => {
      const validUser = testUsers.superAdmins[0];
      mockDatabase.findSuperAdminByEmail.mockResolvedValue({
        id: validUser.id,
        email: validUser.email,
        status: 'active',
      });
      mockDatabase.createPasswordResetToken.mockResolvedValue('reset-token');

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: validUser.email,
        },
      });

      const response = await forgotPasswordHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset email sent');
      expect(mockDatabase.createPasswordResetToken).toHaveBeenCalledWith(validUser.id);
    });

    it('should not reveal if email does not exist', async () => {
      mockDatabase.findSuperAdminByEmail.mockResolvedValue(null);

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'nonexistent@example.com',
        },
      });

      const response = await forgotPasswordHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset email sent');
      expect(mockDatabase.createPasswordResetToken).not.toHaveBeenCalled();
    });

    it('should handle rate limiting for password reset', async () => {
      mockRateLimit.checkRateLimit.mockResolvedValue({
        success: false,
        message: 'Too many password reset attempts',
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'admin@superadmin.com',
        },
      });

      const response = await forgotPasswordHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(429);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Too many password reset attempts');
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle concurrent login sessions', async () => {
      const validUser = testUsers.superAdmins[0];
      mockDatabase.findSuperAdminByEmail.mockResolvedValue({
        id: validUser.id,
        email: validUser.email,
        password: '$2b$10$mock-hash',
        status: 'active',
      });

      const loginPromises = Array(5).fill(null).map(() => {
        const { req } = createMocks({
          method: 'POST',
          body: {
            email: validUser.email,
            password: validUser.password,
          },
        });
        return loginHandler(req as NextRequest);
      });

      const responses = await Promise.all(loginPromises);
      
      // All requests should succeed
      responses.forEach(async (response) => {
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.success).toBe(true);
      });
    });

    it('should handle network timeouts gracefully', async () => {
      mockDatabase.findSuperAdminByEmail.mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
      );

      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'admin@superadmin.com',
          password: 'Test123!@#',
        },
      });

      const response = await loginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Internal server error');
    });

    it('should validate CSRF token when present', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': 'invalid-csrf-token',
        },
        body: {
          email: 'admin@superadmin.com',
          password: 'Test123!@#',
        },
      });

      const response = await loginHandler(req as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid CSRF token');
    });
  });
});
