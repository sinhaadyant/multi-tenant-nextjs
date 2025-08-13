import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { initializeDatabase, closeDatabase } from "@/models";
import { ENV } from "@/environment";

// Load test environment variables
config({ path: path.resolve(__dirname, "../../.env.test") });

// Set test environment
process.env.NODE_ENV = "test";

// Initialize Supabase client for E2E tests
const supabaseUrl =
  process.env.SUPABASE_URL || "https://your-project.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test database setup
let testDbInitialized = false;

export const setupTestDatabase = async () => {
  if (!testDbInitialized) {
    try {
      // Initialize database connection
      await initializeDatabase();
      testDbInitialized = true;
      console.log("✅ Test database initialized");
    } catch (error) {
      console.error("❌ Failed to initialize test database:", error);
      throw error;
    }
  }
};

export const teardownTestDatabase = async () => {
  if (testDbInitialized) {
    try {
      await closeDatabase();
      testDbInitialized = false;
      console.log("✅ Test database closed");
    } catch (error) {
      console.error("❌ Failed to close test database:", error);
    }
  }
};

// Global test utilities for E2E tests
global.e2eUtils = {
  // Supabase client
  supabase,

  // Database helpers
  setupTestDatabase,
  teardownTestDatabase,

  // Test data creation helpers
  createTestTenant: async (overrides = {}) => {
    const tenantData = {
      name: `Test Tenant ${Date.now()}`,
      domain: `test-${Date.now()}.example.com`,
      contact_email: `admin-${Date.now()}@test.example.com`,
      contact_phone: "+1234567890",
      address: "123 Test St, Test City",
      is_active: true,
      ...overrides,
    };

    // Create tenant in Supabase
    const { data, error } = await supabase
      .from("tenants")
      .insert(tenantData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  createTestUser: async (tenantId: number, overrides = {}) => {
    const userData = {
      tenant_id: tenantId,
      role_id: 1, // Default role
      first_name: "Test",
      last_name: "User",
      email: `test-${Date.now()}@example.com`,
      password_hash: "hashed_password",
      is_superadmin: false,
      is_active: true,
      ...overrides,
    };

    const { data, error } = await supabase
      .from("users")
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  createTestRole: async (tenantId: number, overrides = {}) => {
    const roleData = {
      tenant_id: tenantId,
      name: `Test Role ${Date.now()}`,
      description: "Test role description",
      is_system: false,
      ...overrides,
    };

    const { data, error } = await supabase
      .from("roles")
      .insert(roleData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Cleanup helpers
  cleanupTestData: async () => {
    // Clean up test data in reverse order of dependencies
    await supabase.from("audit_logs").delete().neq("id", 0);
    await supabase.from("support_attachments").delete().neq("id", 0);
    await supabase.from("support_replies").delete().neq("id", 0);
    await supabase.from("support_tickets").delete().neq("id", 0);
    await supabase.from("login_devices").delete().neq("id", 0);
    await supabase.from("reset_tokens").delete().neq("id", 0);
    await supabase.from("refresh_tokens").delete().neq("id", 0);
    await supabase.from("permissions").delete().neq("id", 0);
    await supabase.from("menus").delete().neq("id", 0);
    await supabase.from("modules").delete().neq("id", 0);
    await supabase.from("users").delete().neq("id", 0);
    await supabase.from("roles").delete().neq("id", 0);
    await supabase.from("tenants").delete().neq("id", 0);
    await supabase.from("tenant_login_restrictions").delete().neq("id", 0);
  },

  // API testing helpers
  createTestServer: async () => {
    // This would initialize your Express server for testing
    // For now, we'll return a mock server
    return {
      close: () => Promise.resolve(),
      address: () => ({ port: 3001 }),
    };
  },

  // Authentication helpers
  createAuthToken: async (user: any) => {
    // Create JWT token for testing
    const jwt = require("jsonwebtoken");
    const payload = {
      user_id: user.id,
      tenant_id: user.tenant_id,
      email: user.email,
      is_superadmin: user.is_superadmin,
      role_id: user.role_id,
    };

    return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: "1h" });
  },

  // Request helpers
  makeRequest: async (
    method: string,
    url: string,
    data?: any,
    token?: string
  ) => {
    const axios = require("axios");
    const baseURL = process.env.TEST_API_URL || "http://localhost:3001";

    const config = {
      method,
      url: `${baseURL}${url}`,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(data && { data }),
    };

    try {
      const response = await axios(config);
      return response;
    } catch (error) {
      return error.response;
    }
  },

  // Assertion helpers
  expectApiResponse: (response: any, expectedStatus = 200) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.data).toHaveProperty("success");
    expect(response.data).toHaveProperty("message");
  },

  expectSuccessResponse: (response: any, expectedStatus = 200) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.data.success).toBe(true);
    expect(response.data).toHaveProperty("data");
  },

  expectErrorResponse: (response: any, expectedStatus = 400) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.data.success).toBe(false);
    expect(response.data).toHaveProperty("message");
  },

  // Utility functions
  randomString: (length = 10) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  randomEmail: () =>
    `test.${Date.now()}.${Math.random().toString(36).substr(2, 9)}@example.com`,

  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
};

// Extend global types for E2E tests
declare global {
  namespace NodeJS {
    interface Global {
      e2eUtils: {
        supabase: any;
        setupTestDatabase: () => Promise<void>;
        teardownTestDatabase: () => Promise<void>;
        createTestTenant: (overrides?: any) => Promise<any>;
        createTestUser: (tenantId: number, overrides?: any) => Promise<any>;
        createTestRole: (tenantId: number, overrides?: any) => Promise<any>;
        cleanupTestData: () => Promise<void>;
        createTestServer: () => Promise<any>;
        createAuthToken: (user: any) => Promise<string>;
        makeRequest: (
          method: string,
          url: string,
          data?: any,
          token?: string
        ) => Promise<any>;
        expectApiResponse: (response: any, expectedStatus?: number) => void;
        expectSuccessResponse: (response: any, expectedStatus?: number) => void;
        expectErrorResponse: (response: any, expectedStatus?: number) => void;
        randomString: (length?: number) => string;
        randomEmail: () => string;
        wait: (ms: number) => Promise<void>;
      };
    }
  }
}

// Global setup and teardown
beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

// Clean up after each test
afterEach(async () => {
  await global.e2eUtils.cleanupTestData();
});

// Global test timeout for E2E tests
jest.setTimeout(30000);
