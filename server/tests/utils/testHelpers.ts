import { Response } from 'supertest';

/**
 * Common test data for authentication tests
 */
export const TEST_DATA = {
  // Valid test users
  VALID_USERS: {
    SUPERADMIN: {
      email: 'superadmin@example.com',
      password: 'password123',
      tenantSlug: null,
    },
    TENANT_ADMIN: {
      email: 'admin@tenant-a.com',
      password: 'password123',
      tenantSlug: 'tenant-a.example.com',
    },
    TENANT_USER: {
      email: 'john@tenant-a.com',
      password: 'password123',
      tenantSlug: 'tenant-a.example.com',
    },
  },

  // Invalid test data
  INVALID_DATA: {
    MISSING_EMAIL: {
      password: 'password123',
    },
    MISSING_PASSWORD: {
      email: 'test@example.com',
    },
    INVALID_EMAIL: {
      email: 'invalid-email',
      password: 'password123',
    },
    WEAK_PASSWORD: {
      email: 'test@example.com',
      password: '123',
    },
    LONG_EMAIL: {
      email: 'a'.repeat(300) + '@example.com',
      password: 'password123',
    },
    LONG_PASSWORD: {
      email: 'test@example.com',
      password: 'a'.repeat(1000),
    },
    SPECIAL_CHARS_EMAIL: {
      email: 'test+special@example.com',
      password: 'password123',
    },
    UNICODE_EMAIL: {
      email: 'tëst@example.com',
      password: 'password123',
    },
    EMPTY_EMAIL: {
      email: '',
      password: 'password123',
    },
    EMPTY_PASSWORD: {
      email: 'test@example.com',
      password: '',
    },
  },

  // Registration test data
  REGISTRATION: {
    VALID: {
      name: 'Test User',
      email: 'newuser@example.com',
      password: 'password123',
      tenantSlug: 'tenant-a.example.com',
    },
    MISSING_FIELDS: {
      email: 'test@example.com',
    },
    WEAK_PASSWORD: {
      name: 'Test User',
      email: 'test@example.com',
      password: '123',
    },
    INVALID_EMAIL: {
      name: 'Test User',
      email: 'invalid-email',
      password: 'password123',
    },
  },

  // Password reset test data
  PASSWORD_RESET: {
    VALID_EMAIL: 'admin@tenant-a.com',
    INVALID_EMAIL: 'nonexistent@example.com',
    VALID_TOKEN: 'valid-reset-token-123',
    INVALID_TOKEN: 'invalid-token',
    EXPIRED_TOKEN: 'expired-token-123',
    WEAK_PASSWORD: '123',
    STRONG_PASSWORD: 'newPassword123',
  },

  // Change password test data
  CHANGE_PASSWORD: {
    VALID: {
      currentPassword: 'password123',
      newPassword: 'newPassword123',
    },
    INCORRECT_CURRENT: {
      currentPassword: 'wrongpassword',
      newPassword: 'newPassword123',
    },
    WEAK_NEW: {
      currentPassword: 'password123',
      newPassword: '123',
    },
  },
};

/**
 * Common validation error messages expected in tests
 */
export const EXPECTED_ERROR_MESSAGES = {
  VALIDATION: {
    EMAIL_REQUIRED: 'Email is required',
    PASSWORD_REQUIRED: 'Password is required',
    NAME_REQUIRED: 'Name is required',
    INVALID_EMAIL_FORMAT: 'Invalid email format',
    WEAK_PASSWORD: 'Password must be at least 8 characters',
    TOKEN_REQUIRED: 'Token is required',
    CURRENT_PASSWORD_REQUIRED: 'Current password is required',
    NEW_PASSWORD_REQUIRED: 'New password is required',
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid credentials',
    USER_NOT_FOUND: 'User not found',
    ACCOUNT_INACTIVE: 'User account is inactive',
    TENANT_NOT_FOUND: 'Tenant not found',
    TOKEN_EXPIRED: 'Token expired',
    INVALID_TOKEN: 'Invalid token',
    ACCESS_TOKEN_REQUIRED: 'Access token required',
  },
  SUCCESS: {
    LOGIN: 'Login successful',
    REGISTER: 'User registered successfully',
    LOGOUT: 'Logged out successfully',
    PASSWORD_RESET_REQUEST: 'Password reset email sent successfully',
    PASSWORD_RESET_COMPLETE: 'Password reset successfully',
    PASSWORD_CHANGED: 'Password changed successfully',
    USER_INFO: 'User information retrieved successfully',
    TOKEN_REFRESHED: 'Token refreshed successfully',
  },
};

/**
 * Helper function to validate error response structure
 */
export const validateErrorResponse = (
  response: Response,
  expectedStatus: number = 400,
  expectedMessage?: string
): void => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toBeDefined();

  if (expectedMessage) {
    expect(response.body.message).toContain(expectedMessage);
  }
};

/**
 * Helper function to validate success response structure
 */
export const validateSuccessResponse = (
  response: Response,
  expectedStatus: number = 200
): void => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(true);
  expect(response.body.message).toBeDefined();
};

/**
 * Helper function to validate auth response structure
 */
export const validateAuthResponse = (response: Response): void => {
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data).toBeDefined();
  expect(response.body.data.user).toBeDefined();
  expect(response.body.data.accessToken).toBeDefined();
  expect(response.body.data.refreshToken).toBeDefined();
  expect(response.body.data.user.email).toBeDefined();
  expect(response.body.data.user.id).toBeDefined();
};

/**
 * Helper function to create test device info
 */
export const createTestDeviceInfo = (overrides: any = {}) => ({
  userAgent: 'Mozilla/5.0 (Test Browser)',
  ipAddress: '127.0.0.1',
  ...overrides,
});

/**
 * Helper function to generate test data with overrides
 */
export const createTestData = (baseData: any, overrides: any = {}) => ({
  ...baseData,
  ...overrides,
});
