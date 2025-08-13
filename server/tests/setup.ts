import { config } from "dotenv";
import path from "path";

// Load test environment variables
config({ path: path.resolve(__dirname, "../.env.test") });

// Set test environment
process.env.NODE_ENV = "test";

// Mock logger for tests
jest.mock("@/libraries/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    logRequest: jest.fn(),
    logDatabase: jest.fn(),
    logAuth: jest.fn(),
    logAudit: jest.fn(),
    logError: jest.fn(),
    child: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
    })),
  },
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarning: jest.fn(),
  logDebug: jest.fn(),
}));

// Global test utilities
global.testUtils = {
  // Helper to create test data
  createTestUser: (overrides = {}) => ({
    id: 1,
    tenant_id: 1,
    role_id: 1,
    first_name: "Test",
    last_name: "User",
    email: "test@example.com",
    password_hash: "hashed_password",
    is_superadmin: false,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }),

  createTestTenant: (overrides = {}) => ({
    id: 1,
    name: "Test Tenant",
    domain: "test.example.com",
    contact_email: "admin@test.example.com",
    contact_phone: "+1234567890",
    address: "123 Test St, Test City",
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }),

  createTestRole: (overrides = {}) => ({
    id: 1,
    tenant_id: 1,
    name: "Test Role",
    description: "Test role description",
    is_system: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }),

  // Helper to create API response
  createApiResponse: (data: any, message = "Success", meta?: any) => ({
    success: true,
    message,
    data,
    meta,
  }),

  // Helper to create error response
  createErrorResponse: (
    message: string,
    statusCode = 400,
    errors?: string[]
  ) => ({
    success: false,
    message,
    errors,
  }),

  // Helper to create pagination meta
  createPaginationMeta: (total: number, page: number, limit: number) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }),

  // Helper to generate random strings
  randomString: (length = 10) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Helper to generate random emails
  randomEmail: () =>
    `test.${Date.now()}.${Math.random().toString(36).substr(2, 9)}@example.com`,

  // Helper to wait for async operations
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Helper to create JWT payload
  createJwtPayload: (overrides = {}) => ({
    user_id: 1,
    tenant_id: 1,
    email: "test@example.com",
    is_superadmin: false,
    role_id: 1,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  }),
};

// Extend global types
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        createTestUser: (overrides?: any) => any;
        createTestTenant: (overrides?: any) => any;
        createTestRole: (overrides?: any) => any;
        createApiResponse: (data: any, message?: string, meta?: any) => any;
        createErrorResponse: (
          message: string,
          statusCode?: number,
          errors?: string[]
        ) => any;
        createPaginationMeta: (
          total: number,
          page: number,
          limit: number
        ) => any;
        randomString: (length?: number) => string;
        randomEmail: () => string;
        wait: (ms: number) => Promise<void>;
        createJwtPayload: (overrides?: any) => any;
      };
    }
  }
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(10000);
