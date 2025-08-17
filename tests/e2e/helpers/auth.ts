import { test as base, Page, expect } from "@playwright/test";
import { APIRequestContext } from "@playwright/test";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  name?: string;
  tenantId?: string;
  role: string;
  isSuperAdmin?: boolean;
}

export class BackendE2EAuthHelper {
  private page: Page;
  private request: APIRequestContext;
  private baseURL: string;

  constructor(
    page: Page,
    request: APIRequestContext,
    baseURL: string = "http://localhost:3001"
  ) {
    this.page = page;
    this.request = request;
    this.baseURL = baseURL;
  }

  async loginViaAPI(
    email: string,
    password: string,
    tenantSlug?: string
  ): Promise<AuthTokens> {
    const payload: any = { email, password };
    if (tenantSlug) {
      payload.tenantSlug = tenantSlug;
    }

    const response = await this.request.post(`${this.baseURL}/api/auth/login`, {
      data: payload,
    });

    if (!response.ok()) {
      throw new Error(
        `Login failed: ${response.status()} ${response.statusText()}`
      );
    }

    const data = await response.json();
    return {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    };
  }

  async logoutViaAPI(accessToken: string): Promise<void> {
    await this.request.post(`${this.baseURL}/api/auth/logout`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await this.request.post(
      `${this.baseURL}/api/auth/refresh`,
      {
        data: { refreshToken },
      }
    );

    if (!response.ok()) {
      throw new Error(
        `Token refresh failed: ${response.status()} ${response.statusText()}`
      );
    }

    const data = await response.json();
    return {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    };
  }

  async createTestUser(
    userData: Partial<TestUser>,
    accessToken: string
  ): Promise<TestUser> {
    const defaultUser: TestUser = {
      id: "",
      email: `test-${Date.now()}@example.com`,
      password: "TestPassword123!",
      role: "user",
      isSuperAdmin: false,
      ...userData,
    };

    const response = await this.request.post(`${this.baseURL}/api/users`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      data: {
        name: defaultUser.name || "Test User",
        email: defaultUser.email,
        password: defaultUser.password,
        role: defaultUser.role,
        tenantId: defaultUser.tenantId,
      },
    });

    if (!response.ok()) {
      throw new Error(
        `User creation failed: ${response.status()} ${response.statusText()}`
      );
    }

    const data = await response.json();
    return {
      ...defaultUser,
      id: data.data.id,
    };
  }

  async cleanupTestUser(userId: string, accessToken: string): Promise<void> {
    try {
      await this.request.delete(`${this.baseURL}/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      // Ignore cleanup errors
      console.warn("Failed to cleanup test user:", error);
    }
  }

  async createTestTenant(tenantData: any, accessToken: string): Promise<any> {
    const defaultTenant = {
      name: `Test Tenant ${Date.now()}`,
      domain: `test-tenant-${Date.now()}.example.com`,
      slug: `test-tenant-${Date.now()}`,
      loginRestrictions: {
        allowedDomains: [`test-tenant-${Date.now()}.com`],
        maxUsers: 50,
      },
      status: "active",
      ...tenantData,
    };

    const response = await this.request.post(`${this.baseURL}/api/tenants`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      data: defaultTenant,
    });

    if (!response.ok()) {
      throw new Error(
        `Tenant creation failed: ${response.status()} ${response.statusText()}`
      );
    }

    return await response.json();
  }

  async cleanupTestTenant(
    tenantId: string,
    accessToken: string
  ): Promise<void> {
    try {
      await this.request.delete(`${this.baseURL}/api/tenants/${tenantId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      // Ignore cleanup errors
      console.warn("Failed to cleanup test tenant:", error);
    }
  }

  async makeAuthenticatedRequest(
    method: string,
    endpoint: string,
    accessToken: string,
    data?: any
  ): Promise<any> {
    const response = await this.request[method.toLowerCase()](
      `${this.baseURL}${endpoint}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        data,
      }
    );

    if (!response.ok()) {
      throw new Error(
        `Request failed: ${response.status()} ${response.statusText()}`
      );
    }

    return await response.json();
  }

  async expectSuccessfulResponse(response: any): Promise<void> {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  async expectErrorResponse(
    response: any,
    expectedStatus: number
  ): Promise<void> {
    expect(response.status).toBe(expectedStatus);
    expect(response.error).toBeDefined();
  }

  async expectPermissionDenied(response: any): Promise<void> {
    expect(response.status).toBe(403);
    expect(response.error).toContain("permission");
  }

  async expectUnauthorized(response: any): Promise<void> {
    expect(response.status).toBe(401);
    expect(response.error).toContain("unauthorized");
  }

  async expectValidationError(response: any): Promise<void> {
    expect(response.status).toBe(400);
    expect(response.error).toBeDefined();
  }

  async expectNotFound(response: any): Promise<void> {
    expect(response.status).toBe(404);
    expect(response.error).toContain("not found");
  }
}

// Custom test fixture for authentication
export const test = base.extend<{ authHelper: BackendE2EAuthHelper }>({
  authHelper: async ({ page, request }, use) => {
    const authHelper = new BackendE2EAuthHelper(page, request);
    await use(authHelper);
  },
});

export { expect } from "@playwright/test";
