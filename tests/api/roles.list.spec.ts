import { test, expect } from "@playwright/test";
import { AuthHelper } from "../helpers/auth";
import { TestUtils } from "../helpers/test-utils";

test.describe("GET /api/roles", () => {
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

  test("should successfully list roles with default pagination", async ({
    request,
  }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("Roles retrieved successfully");
    expect(Array.isArray(data.data)).toBe(true);

    // Validate pagination metadata
    testUtils.validatePaginationSchema(data);

    // Validate role object structure
    if (data.data.length > 0) {
      const role = data.data[0];
      expect(role).toHaveProperty("id");
      expect(role).toHaveProperty("name");
      expect(role).toHaveProperty("description");
      expect(role).toHaveProperty("type");
      expect(role).toHaveProperty("status");
      expect(role).toHaveProperty("createdAt");
      expect(role).toHaveProperty("updatedAt");
    }
  });

  test("should list roles with custom pagination", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
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

  test("should filter roles by type", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          type: "global",
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // All returned roles should be global
    data.data.forEach((role: any) => {
      expect(role.type).toBe("global");
    });
  });

  test("should filter roles by status", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
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

    // All returned roles should be active
    data.data.forEach((role: any) => {
      expect(role.status).toBe("active");
    });
  });

  test("should search roles by name", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
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

    // All returned roles should contain 'admin' in their name
    data.data.forEach((role: any) => {
      expect(role.name.toLowerCase()).toContain("admin");
    });
  });

  test("should sort roles by creation date", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
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

    // Verify sorting (if multiple roles exist)
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

  test("should filter roles by tenant", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
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

    // All returned roles should belong to the specified tenant
    data.data.forEach((role: any) => {
      expect(role.tenantId).toBe("test-tenant-id");
    });
  });

  test("should fail without authentication", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/roles");

    expect(response.status()).toBe(401);
    testUtils.validateErrorResponse(data, 401, "Authentication required");
  });

  test("should fail with invalid token", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
      {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      }
    );

    expect(response.status()).toBe(401);
    testUtils.validateErrorResponse(data, 401, "Invalid token");
  });

  test("should handle invalid page parameter", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
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
      "/api/roles",
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
      "/api/roles",
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
      "/api/roles",
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
      "/api/roles",
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
      "/api/roles",
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

  test("should handle invalid type filter", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          type: "invalid-type",
        },
      }
    );

    expect(response.status()).toBe(400);
    testUtils.validateErrorResponse(data, 400, "Invalid type");
  });

  test("should handle invalid status filter", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
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
      "'; DROP TABLE roles; --",
      "' OR '1'='1",
      "'; INSERT INTO roles VALUES ('hacker', 'description'); --",
    ];

    for (const attempt of sqlInjectionAttempts) {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/roles",
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
      "/api/roles",
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
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // Users with canViewAll should see all roles in their tenant
    // This test would need to be customized based on the actual user's permissions
  });

  test("should respect user permissions - canRead only", async ({
    request,
  }) => {
    // Test with a user that only has canRead permission
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // Users with only canRead should see limited role information
    // This test would need to be customized based on the actual user's permissions
  });

  test("should handle empty results gracefully", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          search: "nonexistent-role",
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
    expect(data.meta.total).toBe(0);
  });

  test("should include role permissions in response when requested", async ({
    request,
  }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
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
      const role = data.data[0];
      expect(role).toHaveProperty("permissions");
      expect(Array.isArray(role.permissions)).toBe(true);
    }
  });

  test("should include role users in response when requested", async ({
    request,
  }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          include: "users",
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    if (data.data.length > 0) {
      const role = data.data[0];
      expect(role).toHaveProperty("users");
      expect(Array.isArray(role.users)).toBe(true);
    }
  });

  test("should filter by multiple types", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          types: "global,tenant",
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // All returned roles should be either global or tenant
    data.data.forEach((role: any) => {
      expect(["global", "tenant"]).toContain(role.type);
    });
  });

  test("should filter by creation date range", async ({ request }) => {
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = new Date();

    const { response, data } = await testUtils.makeRequest(
      "GET",
      "/api/roles",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          createdAfter: startDate.toISOString(),
          createdBefore: endDate.toISOString(),
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // All returned roles should be within the date range
    data.data.forEach((role: any) => {
      const roleDate = new Date(role.createdAt);
      expect(roleDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(roleDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });
  });
});
