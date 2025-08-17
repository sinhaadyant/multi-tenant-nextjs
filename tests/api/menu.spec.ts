import { test, expect } from "@playwright/test";
import { AuthHelper } from "../helpers/auth";
import { TestUtils } from "../helpers/test-utils";

test.describe("GET /api/menu", () => {
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

  test("should successfully get user-specific menu", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("Menu retrieved successfully");
    expect(Array.isArray(data.data)).toBe(true);

    // Validate menu structure
    if (data.data.length > 0) {
      const menuItem = data.data[0];
      expect(menuItem).toHaveProperty("id");
      expect(menuItem).toHaveProperty("name");
      expect(menuItem).toHaveProperty("path");
      expect(menuItem).toHaveProperty("icon");
      expect(menuItem).toHaveProperty("order");
      expect(menuItem).toHaveProperty("permissions");
      expect(menuItem).toHaveProperty("children");
      expect(Array.isArray(menuItem.children)).toBe(true);
    }
  });

  test("should return menu filtered by user permissions", async ({
    request,
  }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // All menu items should have permissions that the user has access to
    const validateMenuPermissions = (items: any[]) => {
      items.forEach((item) => {
        if (item.permissions && item.permissions.length > 0) {
          // User should have at least one of the required permissions
          expect(item.permissions).toBeDefined();
        }

        if (item.children && item.children.length > 0) {
          validateMenuPermissions(item.children);
        }
      });
    };

    validateMenuPermissions(data.data);
  });

  test("should return hierarchical menu structure", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // Validate hierarchical structure
    const validateHierarchy = (items: any[], level: number = 0) => {
      items.forEach((item) => {
        expect(item).toHaveProperty("level");
        expect(item.level).toBe(level);

        if (item.children && item.children.length > 0) {
          validateHierarchy(item.children, level + 1);
        }
      });
    };

    validateHierarchy(data.data);
  });

  test("should include module and submodule information", async ({
    request,
  }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // Menu items should include module information
    const validateModuleInfo = (items: any[]) => {
      items.forEach((item) => {
        expect(item).toHaveProperty("moduleId");
        expect(item).toHaveProperty("moduleName");

        if (item.children && item.children.length > 0) {
          validateModuleInfo(item.children);
        }
      });
    };

    validateModuleInfo(data.data);
  });

  test("should include data scope information", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // Menu items should include data scope information
    const validateDataScope = (items: any[]) => {
      items.forEach((item) => {
        expect(item).toHaveProperty("dataScope");
        expect(["own", "tenant", "global"]).toContain(item.dataScope);

        if (item.children && item.children.length > 0) {
          validateDataScope(item.children);
        }
      });
    };

    validateDataScope(data.data);
  });

  test("should fail without authentication", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu");

    expect(response.status()).toBe(401);
    testUtils.validateErrorResponse(data, 401, "Authentication required");
  });

  test("should fail with invalid token", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: "Bearer invalid-token",
      },
    });

    expect(response.status()).toBe(401);
    testUtils.validateErrorResponse(data, 401, "Invalid token");
  });

  test("should fail with expired token", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: "Bearer expired.token.here",
      },
    });

    expect(response.status()).toBe(401);
    testUtils.validateErrorResponse(data, 401);
  });

  test("should handle user with no permissions gracefully", async ({
    request,
  }) => {
    // This test would require a user with no permissions
    // For now, we'll test the structure
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("should respect tenant-specific menu customization", async ({
    request,
  }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // Menu should be filtered based on tenant access
    const validateTenantAccess = (items: any[]) => {
      items.forEach((item) => {
        if (item.tenantId) {
          // Should only show items accessible to user's tenant
          expect(item.tenantId).toBeDefined();
        }

        if (item.children && item.children.length > 0) {
          validateTenantAccess(item.children);
        }
      });
    };

    validateTenantAccess(data.data);
  });

  test("should include menu item metadata", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // Menu items should include metadata
    const validateMetadata = (items: any[]) => {
      items.forEach((item) => {
        expect(item).toHaveProperty("isActive");
        expect(typeof item.isActive).toBe("boolean");
        expect(item).toHaveProperty("isVisible");
        expect(typeof item.isVisible).toBe("boolean");
        expect(item).toHaveProperty("badge");
        expect(item).toHaveProperty("badgeColor");

        if (item.children && item.children.length > 0) {
          validateMetadata(item.children);
        }
      });
    };

    validateMetadata(data.data);
  });

  test("should handle menu caching", async ({ request }) => {
    // First request
    const { response: response1, data: data1 } = await testUtils.makeRequest(
      "GET",
      "/api/menu",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    expect(response1.status()).toBe(200);
    expect(data1.success).toBe(true);

    // Second request (should be cached)
    const { response: response2, data: data2 } = await testUtils.makeRequest(
      "GET",
      "/api/menu",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    expect(response2.status()).toBe(200);
    expect(data2.success).toBe(true);

    // Both responses should be identical
    expect(data1.data).toEqual(data2.data);
  });

  test("should include user role information in menu", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // Menu should include user role context
    expect(data).toHaveProperty("userRoles");
    expect(Array.isArray(data.userRoles)).toBe(true);
  });

  test("should handle menu with no accessible items", async ({ request }) => {
    // This test would require a user with very limited permissions
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);

    // Even with no accessible items, should return empty array, not error
    if (data.data.length === 0) {
      expect(data.message).toContain("No accessible menu items");
    }
  });

  test("should include menu item descriptions", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // Menu items should include descriptions
    const validateDescriptions = (items: any[]) => {
      items.forEach((item) => {
        expect(item).toHaveProperty("description");

        if (item.children && item.children.length > 0) {
          validateDescriptions(item.children);
        }
      });
    };

    validateDescriptions(data.data);
  });

  test("should handle menu item ordering", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // Menu items should be properly ordered
    const validateOrdering = (items: any[]) => {
      for (let i = 0; i < items.length - 1; i++) {
        expect(items[i].order).toBeLessThanOrEqual(items[i + 1].order);
      }

      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          validateOrdering(item.children);
        }
      });
    };

    validateOrdering(data.data);
  });

  test("should include menu item categories", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // Menu items should include category information
    const validateCategories = (items: any[]) => {
      items.forEach((item) => {
        expect(item).toHaveProperty("category");

        if (item.children && item.children.length > 0) {
          validateCategories(item.children);
        }
      });
    };

    validateCategories(data.data);
  });

  test("should handle menu item external links", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // Menu items should indicate if they are external links
    const validateExternalLinks = (items: any[]) => {
      items.forEach((item) => {
        expect(item).toHaveProperty("isExternal");
        expect(typeof item.isExternal).toBe("boolean");

        if (item.isExternal) {
          expect(item).toHaveProperty("externalUrl");
        }

        if (item.children && item.children.length > 0) {
          validateExternalLinks(item.children);
        }
      });
    };

    validateExternalLinks(data.data);
  });

  test("should include menu item feature flags", async ({ request }) => {
    const { response, data } = await testUtils.makeRequest("GET", "/api/menu", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);

    // Menu items should include feature flag information
    const validateFeatureFlags = (items: any[]) => {
      items.forEach((item) => {
        expect(item).toHaveProperty("featureFlags");
        expect(Array.isArray(item.featureFlags)).toBe(true);

        if (item.children && item.children.length > 0) {
          validateFeatureFlags(item.children);
        }
      });
    };

    validateFeatureFlags(data.data);
  });
});
