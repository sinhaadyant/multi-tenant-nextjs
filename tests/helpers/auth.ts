import { APIRequestContext } from "@playwright/test";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  tenantId: string;
  role: string;
}

export class AuthHelper {
  private request: APIRequestContext;
  private baseURL: string;

  constructor(
    request: APIRequestContext,
    baseURL: string = "http://localhost:3001"
  ) {
    this.request = request;
    this.baseURL = baseURL;
  }

  async login(
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

  async logout(accessToken: string): Promise<void> {
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

  async getCurrentUser(accessToken: string): Promise<any> {
    const response = await this.request.get(`${this.baseURL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok()) {
      throw new Error(
        `Get current user failed: ${response.status()} ${response.statusText()}`
      );
    }

    const data = await response.json();
    return data.data;
  }

  async createTestUser(userData: Partial<TestUser>): Promise<TestUser> {
    const defaultUser: TestUser = {
      id: "",
      email: `test-${Date.now()}@example.com`,
      password: "TestPassword123!",
      tenantId: "",
      role: "user",
      ...userData,
    };

    // This would typically create a user through the API
    // For now, return the user data structure
    return defaultUser;
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
}
