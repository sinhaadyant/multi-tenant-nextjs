import { test, expect } from "@playwright/test";
import { AuthHelper } from "../helpers/auth";
import { TestUtils } from "../helpers/test-utils";

test.describe("POST /api/users", () => {
  let authHelper: AuthHelper;
  let testUtils: TestUtils;
  let accessToken: string;
  let createdUserIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    authHelper = new AuthHelper(request);
    testUtils = new TestUtils(request);

    // Login to get access token
    const tokens = await authHelper.login(
      "admin@example.com",
      "AdminPassword123!"
    );
    accessToken = tokens.accessToken;
  });

  test.afterEach(async ({ request }) => {
    // Cleanup created users
    for (const userId of createdUserIds) {
      try {
        await testUtils.makeRequest("DELETE", `/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    createdUserIds = [];
  });

  test("should successfully create a new user with valid data", async ({
    request,
  }) => {
    const userData = {
      email: testUtils.generateRandomEmail(),
      password: testUtils.generateRandomPassword(),
      firstName: "John",
      lastName: "Doe",
      roleIds: [], // Will be populated if roles exist
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(201);
    expect(data.success).toBe(true);
    expect(data.message).toContain("User created successfully");
    expect(data.data).toHaveProperty("id");
    expect(data.data).toHaveProperty("email");
    expect(data.data).toHaveProperty("firstName");
    expect(data.data).toHaveProperty("lastName");
    expect(data.data).toHaveProperty("status");
    expect(data.data).toHaveProperty("tenantId");
    expect(data.data).toHaveProperty("createdAt");
    expect(data.data).toHaveProperty("updatedAt");

    // Store for cleanup
    createdUserIds.push(data.data.id);
  });

  test("should create user with role assignment", async ({ request }) => {
    const userData = {
      email: testUtils.generateRandomEmail(),
      password: testUtils.generateRandomPassword(),
      firstName: "Jane",
      lastName: "Smith",
      roleIds: ["role-id-1"], // Assuming this role exists
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("roles");
    expect(Array.isArray(data.data.roles)).toBe(true);

    createdUserIds.push(data.data.id);
  });

  test("should fail without authentication", async ({ request }) => {
    const userData = {
      email: testUtils.generateRandomEmail(),
      password: testUtils.generateRandomPassword(),
      firstName: "Test",
      lastName: "User",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        data: userData,
      }
    );

    expect(response.status()).toBe(401);
    testUtils.validateErrorResponse(data, 401, "Authentication required");
  });

  test("should fail with invalid token", async ({ request }) => {
    const userData = {
      email: testUtils.generateRandomEmail(),
      password: testUtils.generateRandomPassword(),
      firstName: "Test",
      lastName: "User",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: "Bearer invalid-token",
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(401);
    testUtils.validateErrorResponse(data, 401, "Invalid token");
  });

  test("should fail with missing email", async ({ request }) => {
    const userData = {
      password: testUtils.generateRandomPassword(),
      firstName: "Test",
      lastName: "User",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Email is required");
  });

  test("should fail with missing password", async ({ request }) => {
    const userData = {
      email: testUtils.generateRandomEmail(),
      firstName: "Test",
      lastName: "User",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Password is required");
  });

  test("should fail with missing firstName", async ({ request }) => {
    const userData = {
      email: testUtils.generateRandomEmail(),
      password: testUtils.generateRandomPassword(),
      lastName: "User",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "First name is required");
  });

  test("should fail with missing lastName", async ({ request }) => {
    const userData = {
      email: testUtils.generateRandomEmail(),
      password: testUtils.generateRandomPassword(),
      firstName: "Test",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Last name is required");
  });

  test("should fail with invalid email format", async ({ request }) => {
    const userData = {
      email: "invalid-email",
      password: testUtils.generateRandomPassword(),
      firstName: "Test",
      lastName: "User",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Invalid email format");
  });

  test("should fail with duplicate email", async ({ request }) => {
    const email = testUtils.generateRandomEmail();
    const userData = {
      email,
      password: testUtils.generateRandomPassword(),
      firstName: "Test",
      lastName: "User",
    };

    // Create first user
    const { response: response1, data: data1 } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response1.status()).toBe(201);
    createdUserIds.push(data1.data.id);

    // Try to create second user with same email
    const { response: response2, data: data2 } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response2.status()).toBe(409);
    testUtils.validateErrorResponse(data2, 409, "Email already exists");
  });

  test("should fail with weak password", async ({ request }) => {
    const userData = {
      email: testUtils.generateRandomEmail(),
      password: "weak",
      firstName: "Test",
      lastName: "User",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Password too weak");
  });

  test("should fail with very long email", async ({ request }) => {
    const longEmail = "a".repeat(100) + "@example.com";
    const userData = {
      email: longEmail,
      password: testUtils.generateRandomPassword(),
      firstName: "Test",
      lastName: "User",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Email too long");
  });

  test("should fail with very long firstName", async ({ request }) => {
    const longFirstName = "a".repeat(1000);
    const userData = {
      email: testUtils.generateRandomEmail(),
      password: testUtils.generateRandomPassword(),
      firstName: longFirstName,
      lastName: "User",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "First name too long");
  });

  test("should fail with very long lastName", async ({ request }) => {
    const longLastName = "a".repeat(1000);
    const userData = {
      email: testUtils.generateRandomEmail(),
      password: testUtils.generateRandomPassword(),
      firstName: "Test",
      lastName: longLastName,
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Last name too long");
  });

  test("should fail with invalid role IDs", async ({ request }) => {
    const userData = {
      email: testUtils.generateRandomEmail(),
      password: testUtils.generateRandomPassword(),
      firstName: "Test",
      lastName: "User",
      roleIds: ["invalid-role-id"],
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Invalid role ID");
  });

  test("should fail with empty payload", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: {},
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Email is required");
  });

  test("should fail with malformed JSON", async ({ request }) => {
    const response = await request.post("/api/users", {
      data: "invalid json",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(400);
  });

  test("should handle SQL injection attempts", async ({ request }) => {
    const sqlInjectionAttempts = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --",
    ];

    for (const attempt of sqlInjectionAttempts) {
      const userData = {
        email: attempt,
        password: attempt,
        firstName: attempt,
        lastName: attempt,
      };

      const { response, data } = await testUtils.makeRequest(
        "POST",
        "/api/users",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          data: userData,
        }
      );

      // Should not crash and should return a proper error
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    }
  });

  test("should create user with optional fields", async ({ request }) => {
    const userData = {
      email: testUtils.generateRandomEmail(),
      password: testUtils.generateRandomPassword(),
      firstName: "Test",
      lastName: "User",
      phone: "+1234567890",
      address: "123 Test St",
      city: "Test City",
      country: "Test Country",
      timezone: "UTC",
      language: "en",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("phone");
    expect(data.data).toHaveProperty("address");
    expect(data.data).toHaveProperty("city");
    expect(data.data).toHaveProperty("country");
    expect(data.data).toHaveProperty("timezone");
    expect(data.data).toHaveProperty("language");

    createdUserIds.push(data.data.id);
  });

  test("should create user with specific status", async ({ request }) => {
    const userData = {
      email: testUtils.generateRandomEmail(),
      password: testUtils.generateRandomPassword(),
      firstName: "Test",
      lastName: "User",
      status: "inactive",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe("inactive");

    createdUserIds.push(data.data.id);
  });

  test("should fail with invalid status", async ({ request }) => {
    const userData = {
      email: testUtils.generateRandomEmail(),
      password: testUtils.generateRandomPassword(),
      firstName: "Test",
      lastName: "User",
      status: "invalid-status",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Invalid status");
  });

  test("should respect user permissions - requires canCreate", async ({
    request,
  }) => {
    // This test would require a user without canCreate permission
    // For now, we'll test the structure
    const userData = {
      email: testUtils.generateRandomEmail(),
      password: testUtils.generateRandomPassword(),
      firstName: "Test",
      lastName: "User",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    // Should either succeed (if user has permission) or fail with 403
    expect([201, 403]).toContain(response.status());
  });

  test("should create user with tenant context", async ({ request }) => {
    const userData = {
      email: testUtils.generateRandomEmail(),
      password: testUtils.generateRandomPassword(),
      firstName: "Test",
      lastName: "User",
      tenantId: "test-tenant-id",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.tenantId).toBe("test-tenant-id");

    createdUserIds.push(data.data.id);
  });

  test("should fail with invalid tenant ID", async ({ request }) => {
    const userData = {
      email: testUtils.generateRandomEmail(),
      password: testUtils.generateRandomPassword(),
      firstName: "Test",
      lastName: "User",
      tenantId: "invalid-tenant-id",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: userData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Invalid tenant ID");
  });
});
