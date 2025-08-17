import { test, expect } from "@playwright/test";
import { AuthHelper } from "../helpers/auth";
import { TestUtils } from "../helpers/test-utils";

test.describe("GET /api/users", () => {
  let authHelper: AuthHelper;
  let testUtils: TestUtils;
  let accessToken: string;

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

  test("should successfully list users with default pagination", async ({
    request,
  }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("Users retrieved successfully");
    expect(Array.isArray(data.data)).toBe(true);

    // Validate pagination metadata
    testUtils.validatePaginationSchema(data);

    // Validate user object structure
    if (data.data.length > 0) {
      const user = data.data[0];
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("firstName");
      expect(user).toHaveProperty("lastName");
      expect(user).toHaveProperty("status");
      expect(user).toHaveProperty("tenantId");
      expect(user).toHaveProperty("createdAt");
      expect(user).toHaveProperty("updatedAt");
    }
  });

  test("should list users with custom pagination", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          page: "2",
          limit: "5",
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.meta.page).toBe(2);
    expect(data.meta.limit).toBe(5);
  });

  test("should filter users by email", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          email: "admin",
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // All returned users should contain 'admin' in their email
    data.data.forEach((user: any) => {
      expect(user.email.toLowerCase()).toContain("admin");
    });
  });

  test("should filter users by status", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          status: "active",
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // All returned users should be active
    data.data.forEach((user: any) => {
      expect(user.status).toBe("active");
    });
  });

  test("should filter users by role", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          role: "admin",
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
  });

  test("should search users by name", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          search: "admin",
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
  });

  test("should sort users by creation date", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          sortBy: "createdAt",
          sortOrder: "desc",
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // Verify sorting (if multiple users exist)
    if (data.data.length > 1) {
      for (let i = 0; i < data.data.length - 1; i++) {
        const currentDate = new Date(data.data[i].createdAt);
        const nextDate = new Date(data.data[i + 1].createdAt);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(
          nextDate.getTime()
        );
      }
    }
  });

  test("should filter users by tenant", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          tenantId: "test-tenant-id",
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // All returned users should belong to the specified tenant
    data.data.forEach((user: any) => {
      expect(user.tenantId).toBe("test-tenant-id");
    });
  });

  test("should fail without authentication", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/users");

    expect(response.status()).toBe(401);
    testUtils.validateErrorResponse(data, 401, "Authentication required");
  });

  test("should fail with invalid token", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      }
    );

    expect(response.status()).toBe(401);
    testUtils.validateErrorResponse(data, 401, "Invalid token");
  });

  test("should fail with expired token", async ({ request }) => {
    // This test would require a way to create an expired token
    // For now, we'll test the structure
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: "Bearer expired.token.here",
        },
      }
    );

    expect(response.status()).toBe(401);
    testUtils.validateErrorResponse(data, 401);
  });

  test("should handle invalid page parameter", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          page: "invalid",
        },
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Invalid page parameter");
  });

  test("should handle invalid limit parameter", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          limit: "invalid",
        },
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Invalid limit parameter");
  });

  test("should handle negative page parameter", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          page: "-1",
        },
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Page must be positive");
  });

  test("should handle zero limit parameter", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          limit: "0",
        },
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Limit must be positive");
  });

  test("should handle very large limit parameter", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          limit: "10000",
        },
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Limit too large");
  });

  test("should handle invalid sort order", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          sortOrder: "invalid",
        },
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Invalid sort order");
  });

  test("should handle invalid status filter", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          status: "invalid-status",
        },
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Invalid status");
  });

  test("should handle SQL injection in search parameter", async ({
    request,
  }) => {
    const sqlInjectionAttempts = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --",
    ];

    for (const attempt of sqlInjectionAttempts) {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/users",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            search: attempt,
          },
        }
      );

      // Should not crash and should return a proper error or empty results
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    }
  });

  test("should handle very long search parameter", async ({ request }) => {
    const longSearch = "a".repeat(1000);
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          search: longSearch,
        },
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Search parameter too long");
  });

  test("should respect user permissions - canViewAll", async ({ request }) => {
    // Test with a user that has canViewAll permission
    // This would require creating a test user with specific permissions
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // Users with canViewAll should see all users in their tenant
    // This test would need to be customized based on the actual user's permissions
  });

  test("should respect user permissions - canRead only", async ({
    request,
  }) => {
    // Test with a user that only has canRead permission
    // This would require creating a test user with limited permissions
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // Users with only canRead should see only their own profile
    // This test would need to be customized based on the actual user's permissions
  });

  test("should handle empty results gracefully", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          email: "nonexistent@example.com",
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
    expect(data.meta.total).toBe(0);
  });

  test("should include user roles in response when requested", async ({
    request,
  }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          include: "roles",
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    if (data.data.length > 0) {
      const user = data.data[0];
      expect(user).toHaveProperty("roles");
      expect(Array.isArray(user.roles)).toBe(true);
    }
  });

  test("should include user permissions in response when requested", async ({
    request,
  }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          include: "permissions",
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    if (data.data.length > 0) {
      const user = data.data[0];
      expect(user).toHaveProperty("permissions");
      expect(Array.isArray(user.permissions)).toBe(true);
    }
  });
});
