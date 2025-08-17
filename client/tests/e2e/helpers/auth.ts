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
  tenantId?: string;
  role: string;
  isSuperAdmin?: boolean;
}

export class E2EAuthHelper {
  private page: Page;
  private request: APIRequestContext;
  private baseURL: string;

  constructor(
    page: Page,
    request: APIRequestContext,
    baseURL: string = "http://localhost:3000"
  ) {
    this.page = page;
    this.request = request;
    this.baseURL = baseURL;
  }

  async login(
    email: string,
    password: string,
    tenantSlug?: string,
    rememberMe: boolean = false
  ): Promise<void> {
    await this.page.goto("/login");
    
    // Fill in the login form
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByLabel("Password").fill(password);
    
    if (tenantSlug) {
      await this.page.getByLabel("Tenant (Optional)").fill(tenantSlug);
    }
    
    if (rememberMe) {
      await this.page.getByLabel("Keep me logged in").check();
    }
    
    // Submit the form
    await this.page.getByRole("button", { name: "Sign in" }).click();
    
    // Wait for successful login (redirect to dashboard)
    await this.page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });
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

    const response = await this.request.post("http://localhost:3001/api/auth/login", {
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

  async logout(): Promise<void> {
    // Click on user dropdown
    await this.page.getByRole("button", { name: /user/i }).click();
    
    // Click logout option
    await this.page.getByRole("menuitem", { name: /logout/i }).click();
    
    // Wait for redirect to login page
    await this.page.waitForURL("/login");
  }

  async logoutViaAPI(accessToken: string): Promise<void> {
    await this.request.post("http://localhost:3001/api/auth/logout", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async saveStorageState(
    email: string,
    password: string,
    tenantSlug?: string,
    filename: string = "auth-user.json"
  ): Promise<void> {
    // Login via API to get tokens
    const tokens = await this.loginViaAPI(email, password, tenantSlug);
    
    // Set up storage state with tokens
    await this.page.context().addInitScript((tokens) => {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          user: null, // Will be populated by the app
          token: tokens.accessToken,
          isAuthenticated: true,
          tenant: null,
          permissions: [],
          loading: false,
        })
      );
    }, tokens);
    
    // Save storage state
    await this.page.context().storageState({ path: filename });
  }

  async createTestUser(userData: Partial<TestUser>): Promise<TestUser> {
    const defaultUser: TestUser = {
      id: "",
      email: `test-${Date.now()}@example.com`,
      password: "TestPassword123!",
      role: "user",
      isSuperAdmin: false,
      ...userData,
    };

    // This would typically create a user through the API
    // For now, return the user data structure
    return defaultUser;
  }

  async cleanupTestUser(userId: string, accessToken: string): Promise<void> {
    try {
      await this.request.delete(`http://localhost:3001/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      // Ignore cleanup errors
      console.warn("Failed to cleanup test user:", error);
    }
  }

  async expectToBeLoggedIn(): Promise<void> {
    // Check if we're on a protected page (not login)
    await expect(this.page).not.toHaveURL(/\/login/);
    
    // Check if user dropdown is visible (indicates logged in state)
    await expect(
      this.page.getByRole("button", { name: /user/i })
    ).toBeVisible();
  }

  async expectToBeLoggedOut(): Promise<void> {
    // Check if we're on login page
    await expect(this.page).toHaveURL(/\/login/);
    
    // Check if login form is visible
    await expect(
      this.page.getByRole("button", { name: "Sign in" })
    ).toBeVisible();
  }

  async expectPermissionDenied(): Promise<void> {
    // Check for permission denied message or redirect
    await expect(
      this.page.getByText(/permission denied|unauthorized|access denied/i)
    ).toBeVisible();
  }
}

// Custom test fixture for authentication
export const test = base.extend<{ authHelper: E2EAuthHelper }>({
  authHelper: async ({ page, request }, use) => {
    const authHelper = new E2EAuthHelper(page, request);
    await use(authHelper);
  },
});

export { expect } from "@playwright/test";
