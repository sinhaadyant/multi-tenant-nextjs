import { test, expect } from "@playwright/test";
import { AuthHelper } from "../helpers/auth";
import { TestUtils, ApiResponse } from "../helpers/test-utils";

test.describe("POST /api/auth/login", () => {
  let authHelper: AuthHelper;
  let testUtils: TestUtils;

  test.beforeEach(async ({ request }) => {
    authHelper = new AuthHelper(request);
    testUtils = new TestUtils(request);
  });

  test("should successfully login with valid credentials", async ({
    request,
  }) => {
    const email = testUtils.generateRandomEmail();
    const password = testUtils.generateRandomPassword();

    // First create a user (this would typically be done through registration or seeding)
    // For now, we'll test with a known test user
    const loginData = {
      email: "admin@example.com", // Assuming this user exists
      password: "AdminPassword123!",
    };

    const { response, data } = await testUtils.makeRequest<{
      accessToken: string;
      refreshToken: string;
      user: any;
    }>("POST", "/api/auth/login", {
      data: loginData,
    });

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("Login successful");
    expect(data.data).toHaveProperty("accessToken");
    expect(data.data).toHaveProperty("refreshToken");
    expect(data.data).toHaveProperty("user");

    // Validate token format
    expect(data.data.accessToken).toMatch(
      /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
    );
    expect(data.data.refreshToken).toMatch(
      /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
    );

    // Validate user data
    expect(data.data.user).toHaveProperty("id");
    expect(data.data.user).toHaveProperty("email");
    expect(data.data.user.email).toBe(loginData.email);
  });

  test("should successfully login with tenant slug", async ({ request }) => {
    const loginData = {
      email: "admin@example.com",
      password: "AdminPassword123!",
      tenantSlug: "test-tenant",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/auth/login",
      {
        data: loginData,
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("accessToken");
    expect(data.data).toHaveProperty("refreshToken");
    expect(data.data).toHaveProperty("user");
  });

  test("should fail with invalid email", async ({ request }) => {
    const loginData = {
      email: "invalid-email",
      password: "TestPassword123!",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/auth/login",
      {
        data: loginData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Invalid email format");
  });

  test("should fail with empty email", async ({ request }) => {
    const loginData = {
      email: "",
      password: "TestPassword123!",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/auth/login",
      {
        data: loginData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Email is required");
  });

  test("should fail with empty password", async ({ request }) => {
    const loginData = {
      email: "test@example.com",
      password: "",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/auth/login",
      {
        data: loginData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Password is required");
  });

  test("should fail with non-existent user", async ({ request }) => {
    const loginData = {
      email: "nonexistent@example.com",
      password: "TestPassword123!",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/auth/login",
      {
        data: loginData,
      }
    );

    expect(response.status()).toBe(401);
    testUtils.validateErrorResponse(data, 401, "Invalid credentials");
  });

  test("should fail with wrong password", async ({ request }) => {
    const loginData = {
      email: "admin@example.com",
      password: "WrongPassword123!",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/auth/login",
      {
        data: loginData,
      }
    );

    expect(response.status()).toBe(401);
    testUtils.validateErrorResponse(data, 401, "Invalid credentials");
  });

  test("should fail with invalid tenant slug", async ({ request }) => {
    const loginData = {
      email: "admin@example.com",
      password: "AdminPassword123!",
      tenantSlug: "invalid-tenant",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/auth/login",
      {
        data: loginData,
      }
    );

    expect(response.status()).toBe(404);
    testUtils.validateErrorResponse(data, 404, "Tenant not found");
  });

  test("should fail with missing email", async ({ request }) => {
    const loginData = {
      password: "TestPassword123!",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/auth/login",
      {
        data: loginData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Email is required");
  });

  test("should fail with missing password", async ({ request }) => {
    const loginData = {
      email: "test@example.com",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/auth/login",
      {
        data: loginData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Password is required");
  });

  test("should fail with empty payload", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/auth/login",
      {
        data: {},
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Email is required");
  });

  test("should fail with malformed JSON", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      data: "invalid json",
      headers: {
        "Content-Type": "application/json",
      },
    });

    expect(response.status()).toBe(400);
  });

  test("should handle rate limiting", async ({ request }) => {
    const loginData = {
      email: "test@example.com",
      password: "TestPassword123!",
    };

    // Make multiple requests to trigger rate limiting
    const promises = Array.from({ length: 10 }, () =>
      testUtils.makeRequest("POST", "/api/auth/login", { data: loginData })
    );

    const results = await Promise.all(promises);

    // At least one should be rate limited
    const rateLimited = results.some(
      ({ response }) => response.status() === 429
    );
    expect(rateLimited).toBe(true);
  });

  test("should validate email format", async ({ request }) => {
    const invalidEmails = [
      "test",
      "test@",
      "@example.com",
      "test..test@example.com",
      "test@example..com",
    ];

    for (const email of invalidEmails) {
      const loginData = {
        email,
        password: "TestPassword123!",
      };

      const { response, data } = await testUtils.makeRequest(
        "POST",
        "/api/auth/login",
        {
          data: loginData,
        }
      );

      expect(response.status()).toBe(400);
      testUtils.validateErrorResponse(data, 400, "Invalid email format");
    }
  });

  test("should handle very long email", async ({ request }) => {
    const longEmail = "a".repeat(100) + "@example.com";
    const loginData = {
      email: longEmail,
      password: "TestPassword123!",
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/auth/login",
      {
        data: loginData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Email too long");
  });

  test("should handle very long password", async ({ request }) => {
    const longPassword = "a".repeat(1000);
    const loginData = {
      email: "test@example.com",
      password: longPassword,
    };

    const { response, data } = await testUtils.makeRequest(
      "POST",
      "/api/auth/login",
      {
        data: loginData,
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Password too long");
  });

  test("should handle SQL injection attempts", async ({ request }) => {
    const sqlInjectionAttempts = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --",
    ];

    for (const attempt of sqlInjectionAttempts) {
      const loginData = {
        email: attempt,
        password: attempt,
      };

      const { response, data } = await testUtils.makeRequest(
        "POST",
        "/api/auth/login",
        {
          data: loginData,
        }
      );

      // Should not crash and should return a proper error
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    }
  });
});
