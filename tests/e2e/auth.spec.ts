import { test, expect } from "@playwright/test";
import { BackendE2EAuthHelper } from "./helpers/auth";
import { BackendE2ETestUtils } from "./helpers/test-utils";
import { backendCredentialsHelper } from "./helpers/credentials";

test.describe("Authentication API", () => {
  let authHelper: BackendE2EAuthHelper;
  let testUtils: BackendE2ETestUtils;

  test.beforeEach(async ({ page, request }) => {
    authHelper = new BackendE2EAuthHelper(page, request);
    testUtils = new BackendE2ETestUtils(page);
  });

  test.describe("Login Endpoint", () => {
    test("should successfully login with valid credentials", async ({
      request,
    }) => {
      // Get superadmin credentials
      const superadmin = backendCredentialsHelper.getSuperadmin();

      // Make login request
      const response = await request.post(
        "http://localhost:3001/api/auth/login",
        {
          data: {
            email: superadmin.email,
            password: superadmin.password,
          },
        }
      );

      // Should return 200 OK
      expect(response.status()).toBe(200);

      const data = await response.json();

      // Should have success response structure
      await authHelper.expectSuccessfulResponse(data);

      // Should return access and refresh tokens
      expect(data.data.accessToken).toBeDefined();
      expect(data.data.refreshToken).toBeDefined();
      expect(data.data.user).toBeDefined();
      expect(data.data.user.email).toBe(superadmin.email);
    });

    test("should successfully login with tenant slug", async ({ request }) => {
      // Get tenant admin credentials
      const tenantAdmin = backendCredentialsHelper.getTenantAdmin("A");

      // Make login request with tenant slug
      const response = await request.post(
        "http://localhost:3001/api/auth/login",
        {
          data: {
            email: tenantAdmin.email,
            password: tenantAdmin.password,
            tenantSlug: "tenant-a",
          },
        }
      );

      // Should return 200 OK
      expect(response.status()).toBe(200);

      const data = await response.json();

      // Should have success response structure
      await authHelper.expectSuccessfulResponse(data);

      // Should return user with tenant information
      expect(data.data.user.tenantId).toBeDefined();
      expect(data.data.user.tenantName).toBeDefined();
    });

    test("should fail login with invalid email", async ({ request }) => {
      // Make login request with invalid email
      const response = await request.post(
        "http://localhost:3001/api/auth/login",
        {
          data: {
            email: "nonexistent@example.com",
            password: "TestPassword123!",
          },
        }
      );

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toContain("Invalid credentials");
    });

    test("should fail login with wrong password", async ({ request }) => {
      // Get superadmin credentials
      const superadmin = backendCredentialsHelper.getSuperadmin();

      // Make login request with wrong password
      const response = await request.post(
        "http://localhost:3001/api/auth/login",
        {
          data: {
            email: superadmin.email,
            password: "WrongPassword123!",
          },
        }
      );

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toContain("Invalid credentials");
    });

    test("should fail login with invalid tenant slug", async ({ request }) => {
      // Get superadmin credentials
      const superadmin = backendCredentialsHelper.getSuperadmin();

      // Make login request with invalid tenant
      const response = await request.post(
        "http://localhost:3001/api/auth/login",
        {
          data: {
            email: superadmin.email,
            password: superadmin.password,
            tenantSlug: "invalid-tenant",
          },
        }
      );

      // Should return 404 Not Found
      expect(response.status()).toBe(404);

      const data = await response.json();
      expect(data.error).toContain("Tenant not found");
    });

    test("should fail login with missing email", async ({ request }) => {
      // Make login request without email
      const response = await request.post(
        "http://localhost:3001/api/auth/login",
        {
          data: {
            password: "TestPassword123!",
          },
        }
      );

      // Should return 400 Bad Request
      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("email");
    });

    test("should fail login with missing password", async ({ request }) => {
      // Make login request without password
      const response = await request.post(
        "http://localhost:3001/api/auth/login",
        {
          data: {
            email: "test@example.com",
          },
        }
      );

      // Should return 400 Bad Request
      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("password");
    });

    test("should handle SQL injection attempts", async ({ request }) => {
      const sqlInjectionAttempts = testUtils.generateSQLInjectionAttempts();

      for (const attempt of sqlInjectionAttempts) {
        const response = await request.post(
          "http://localhost:3001/api/auth/login",
          {
            data: {
              email: attempt,
              password: attempt,
            },
          }
        );

        // Should return 400 or 401 (not 500)
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(response.status()).toBeLessThan(500);
      }
    });

    test("should handle XSS attempts", async ({ request }) => {
      const xssAttempts = testUtils.generateXSSAttempts();

      for (const attempt of xssAttempts) {
        const response = await request.post(
          "http://localhost:3001/api/auth/login",
          {
            data: {
              email: attempt,
              password: attempt,
            },
          }
        );

        // Should return 400 or 401 (not 500)
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(response.status()).toBeLessThan(500);
      }
    });

    test("should handle rate limiting", async ({ request }) => {
      const rateLimitData = testUtils.generateRateLimitTestData();

      // Make multiple login attempts
      for (let i = 0; i < 10; i++) {
        const response = await request.post(
          "http://localhost:3001/api/auth/login",
          {
            data: rateLimitData[i],
          }
        );

        if (i < 5) {
          // First few attempts should fail normally
          expect(response.status()).toBe(401);
        } else {
          // Later attempts should be rate limited
          expect(response.status()).toBe(429);
        }
      }
    });
  });

  test.describe("Logout Endpoint", () => {
    test("should successfully logout with valid token", async ({ request }) => {
      // First login to get token
      const superadmin = backendCredentialsHelper.getSuperadmin();
      const loginResponse = await request.post(
        "http://localhost:3001/api/auth/login",
        {
          data: {
            email: superadmin.email,
            password: superadmin.password,
          },
        }
      );

      const loginData = await loginResponse.json();
      const accessToken = loginData.data.accessToken;

      // Make logout request
      const response = await request.post(
        "http://localhost:3001/api/auth/logout",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Should return 200 OK
      expect(response.status()).toBe(200);

      const data = await response.json();
      await authHelper.expectSuccessfulResponse(data);
    });

    test("should fail logout without token", async ({ request }) => {
      // Make logout request without token
      const response = await request.post(
        "http://localhost:3001/api/auth/logout"
      );

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toContain("unauthorized");
    });

    test("should fail logout with invalid token", async ({ request }) => {
      // Make logout request with invalid token
      const response = await request.post(
        "http://localhost:3001/api/auth/logout",
        {
          headers: {
            Authorization: "Bearer invalid-token",
          },
        }
      );

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toContain("unauthorized");
    });
  });

  test.describe("Token Refresh Endpoint", () => {
    test("should successfully refresh token", async ({ request }) => {
      // First login to get tokens
      const superadmin = backendCredentialsHelper.getSuperadmin();
      const loginResponse = await request.post(
        "http://localhost:3001/api/auth/login",
        {
          data: {
            email: superadmin.email,
            password: superadmin.password,
          },
        }
      );

      const loginData = await loginResponse.json();
      const refreshToken = loginData.data.refreshToken;

      // Make refresh request
      const response = await request.post(
        "http://localhost:3001/api/auth/refresh",
        {
          data: {
            refreshToken,
          },
        }
      );

      // Should return 200 OK
      expect(response.status()).toBe(200);

      const data = await response.json();
      await authHelper.expectSuccessfulResponse(data);

      // Should return new access and refresh tokens
      expect(data.data.accessToken).toBeDefined();
      expect(data.data.refreshToken).toBeDefined();
      expect(data.data.accessToken).not.toBe(loginData.data.accessToken);
    });

    test("should fail refresh with invalid token", async ({ request }) => {
      // Make refresh request with invalid token
      const response = await request.post(
        "http://localhost:3001/api/auth/refresh",
        {
          data: {
            refreshToken: "invalid-refresh-token",
          },
        }
      );

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toContain("unauthorized");
    });

    test("should fail refresh without token", async ({ request }) => {
      // Make refresh request without token
      const response = await request.post(
        "http://localhost:3001/api/auth/refresh",
        {
          data: {},
        }
      );

      // Should return 400 Bad Request
      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("refreshToken");
    });
  });

  test.describe("Password Reset Endpoint", () => {
    test("should successfully request password reset", async ({ request }) => {
      // Get existing user
      const user = backendCredentialsHelper.getTenantUser("A");

      // Make password reset request
      const response = await request.post(
        "http://localhost:3001/api/auth/forgot-password",
        {
          data: {
            email: user.email,
          },
        }
      );

      // Should return 200 OK
      expect(response.status()).toBe(200);

      const data = await response.json();
      await authHelper.expectSuccessfulResponse(data);
    });

    test("should fail password reset with non-existent email", async ({
      request,
    }) => {
      // Make password reset request with non-existent email
      const response = await request.post(
        "http://localhost:3001/api/auth/forgot-password",
        {
          data: {
            email: "nonexistent@example.com",
          },
        }
      );

      // Should return 404 Not Found
      expect(response.status()).toBe(404);

      const data = await response.json();
      expect(data.error).toContain("User not found");
    });

    test("should fail password reset without email", async ({ request }) => {
      // Make password reset request without email
      const response = await request.post(
        "http://localhost:3001/api/auth/forgot-password",
        {
          data: {},
        }
      );

      // Should return 400 Bad Request
      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("email");
    });
  });

  test.describe("Password Reset Confirm Endpoint", () => {
    test("should successfully reset password with valid token", async ({
      request,
    }) => {
      // This would require a valid reset token from the database
      // For now, test the endpoint structure
      const response = await request.post(
        "http://localhost:3001/api/auth/reset-password",
        {
          data: {
            token: "valid-reset-token",
            password: "NewPassword123!",
          },
        }
      );

      // Should return 400 or 401 (since we don't have a valid token)
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test("should fail password reset with invalid token", async ({
      request,
    }) => {
      // Make password reset request with invalid token
      const response = await request.post(
        "http://localhost:3001/api/auth/reset-password",
        {
          data: {
            token: "invalid-reset-token",
            password: "NewPassword123!",
          },
        }
      );

      // Should return 400 Bad Request
      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("Invalid token");
    });

    test("should fail password reset with weak password", async ({
      request,
    }) => {
      // Make password reset request with weak password
      const response = await request.post(
        "http://localhost:3001/api/auth/reset-password",
        {
          data: {
            token: "valid-reset-token",
            password: "weak",
          },
        }
      );

      // Should return 400 Bad Request
      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("password");
    });
  });

  test.describe("Change Password Endpoint", () => {
    test("should successfully change password", async ({ request }) => {
      // First login to get token
      const superadmin = backendCredentialsHelper.getSuperadmin();
      const loginResponse = await request.post(
        "http://localhost:3001/api/auth/login",
        {
          data: {
            email: superadmin.email,
            password: superadmin.password,
          },
        }
      );

      const loginData = await loginResponse.json();
      const accessToken = loginData.data.accessToken;

      // Make change password request
      const response = await request.post(
        "http://localhost:3001/api/auth/change-password",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          data: {
            currentPassword: superadmin.password,
            newPassword: "NewPassword123!",
          },
        }
      );

      // Should return 200 OK
      expect(response.status()).toBe(200);

      const data = await response.json();
      await authHelper.expectSuccessfulResponse(data);
    });

    test("should fail change password with wrong current password", async ({
      request,
    }) => {
      // First login to get token
      const superadmin = backendCredentialsHelper.getSuperadmin();
      const loginResponse = await request.post(
        "http://localhost:3001/api/auth/login",
        {
          data: {
            email: superadmin.email,
            password: superadmin.password,
          },
        }
      );

      const loginData = await loginResponse.json();
      const accessToken = loginData.data.accessToken;

      // Make change password request with wrong current password
      const response = await request.post(
        "http://localhost:3001/api/auth/change-password",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          data: {
            currentPassword: "WrongPassword123!",
            newPassword: "NewPassword123!",
          },
        }
      );

      // Should return 400 Bad Request
      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("Current password is incorrect");
    });

    test("should fail change password without authentication", async ({
      request,
    }) => {
      // Make change password request without token
      const response = await request.post(
        "http://localhost:3001/api/auth/change-password",
        {
          data: {
            currentPassword: "OldPassword123!",
            newPassword: "NewPassword123!",
          },
        }
      );

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toContain("unauthorized");
    });
  });

  test.describe("Profile Endpoint", () => {
    test("should successfully get user profile", async ({ request }) => {
      // First login to get token
      const superadmin = backendCredentialsHelper.getSuperadmin();
      const loginResponse = await request.post(
        "http://localhost:3001/api/auth/login",
        {
          data: {
            email: superadmin.email,
            password: superadmin.password,
          },
        }
      );

      const loginData = await loginResponse.json();
      const accessToken = loginData.data.accessToken;

      // Make get profile request
      const response = await request.get(
        "http://localhost:3001/api/auth/profile",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Should return 200 OK
      expect(response.status()).toBe(200);

      const data = await response.json();
      await authHelper.expectSuccessfulResponse(data);

      // Should return user profile
      expect(data.data.email).toBe(superadmin.email);
      expect(data.data.name).toBe(superadmin.name);
    });

    test("should fail get profile without authentication", async ({
      request,
    }) => {
      // Make get profile request without token
      const response = await request.get(
        "http://localhost:3001/api/auth/profile"
      );

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toContain("unauthorized");
    });

    test("should successfully update user profile", async ({ request }) => {
      // First login to get token
      const superadmin = backendCredentialsHelper.getSuperadmin();
      const loginResponse = await request.post(
        "http://localhost:3001/api/auth/login",
        {
          data: {
            email: superadmin.email,
            password: superadmin.password,
          },
        }
      );

      const loginData = await loginResponse.json();
      const accessToken = loginData.data.accessToken;

      // Make update profile request
      const response = await request.put(
        "http://localhost:3001/api/auth/profile",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          data: {
            name: "Updated Name",
          },
        }
      );

      // Should return 200 OK
      expect(response.status()).toBe(200);

      const data = await response.json();
      await authHelper.expectSuccessfulResponse(data);

      // Should return updated profile
      expect(data.data.name).toBe("Updated Name");
    });
  });

  test.describe("Session Management", () => {
    test("should handle concurrent logins", async ({ request }) => {
      // Get user credentials
      const user = backendCredentialsHelper.getTenantUser("A");

      // Make multiple concurrent login requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request.post("http://localhost:3001/api/auth/login", {
            data: {
              email: user.email,
              password: user.password,
            },
          })
        );
      }

      const responses = await Promise.all(promises);

      // All should succeed
      for (const response of responses) {
        expect(response.status()).toBe(200);
      }
    });

    test("should handle token expiration", async ({ request }) => {
      // This would require a token that's close to expiration
      // For now, test with an expired token
      const response = await request.get(
        "http://localhost:3001/api/auth/profile",
        {
          headers: {
            Authorization: "Bearer expired-token",
          },
        }
      );

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);
    });
  });
});
