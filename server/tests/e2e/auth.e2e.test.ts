import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

describe("Authentication E2E Tests", () => {
  let testTenant: any;
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    // Create test data
    testTenant = await global.e2eUtils.createTestTenant();
    testUser = await global.e2eUtils.createTestUser(testTenant.id, {
      email: "auth-test@example.com",
      password_hash:
        "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i8mG", // "password123"
    });
  });

  afterAll(async () => {
    // Cleanup is handled by afterEach in setup
  });

  describe("POST /auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      const loginData = {
        email: "auth-test@example.com",
        password: "password123",
        device_info: {
          os: "Windows",
          browser: "Chrome",
          device_name: "Test Device",
        },
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/login",
        loginData
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data).toHaveProperty("access_token");
      expect(response.data.data).toHaveProperty("refresh_token");
      expect(response.data.data).toHaveProperty("user");
      expect(response.data.data.user.email).toBe(loginData.email);

      authToken = response.data.data.access_token;
    });

    it("should fail login with invalid email", async () => {
      const loginData = {
        email: "invalid@example.com",
        password: "password123",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/login",
        loginData
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Invalid credentials");
    });

    it("should fail login with invalid password", async () => {
      const loginData = {
        email: "auth-test@example.com",
        password: "wrongpassword",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/login",
        loginData
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Invalid credentials");
    });

    it("should fail login with missing email", async () => {
      const loginData = {
        password: "password123",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/login",
        loginData
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Validation error");
    });

    it("should fail login with missing password", async () => {
      const loginData = {
        email: "auth-test@example.com",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/login",
        loginData
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Validation error");
    });
  });

  describe("POST /auth/refresh-token", () => {
    it("should refresh token successfully with valid refresh token", async () => {
      // First login to get refresh token
      const loginData = {
        email: "auth-test@example.com",
        password: "password123",
      };

      const loginResponse = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/login",
        loginData
      );
      const refreshToken = loginResponse.data.data.refresh_token;

      // Refresh the token
      const refreshData = {
        refresh_token: refreshToken,
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/refresh-token",
        refreshData
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data).toHaveProperty("access_token");
      expect(response.data.data).toHaveProperty("refresh_token");
      expect(response.data.data.access_token).not.toBe(authToken); // Should be different
    });

    it("should fail refresh with invalid refresh token", async () => {
      const refreshData = {
        refresh_token: "invalid-refresh-token",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/refresh-token",
        refreshData
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Invalid token");
    });

    it("should fail refresh with expired refresh token", async () => {
      // Create an expired token
      const jwt = require("jsonwebtoken");
      const expiredToken = jwt.sign(
        { user_id: testUser.id, type: "refresh" },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "-1h" }
      );

      const refreshData = {
        refresh_token: expiredToken,
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/refresh-token",
        refreshData
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Token expired");
    });
  });

  describe("POST /auth/logout", () => {
    it("should logout successfully with valid token", async () => {
      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/logout",
        {},
        authToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.message).toContain("Logout successful");
    });

    it("should fail logout without token", async () => {
      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/logout",
        {}
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });

    it("should fail logout with invalid token", async () => {
      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/logout",
        {},
        "invalid-token"
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Invalid token");
    });
  });

  describe("POST /auth/reset-password", () => {
    it("should send reset password email successfully", async () => {
      const resetData = {
        email: "auth-test@example.com",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/reset-password",
        resetData
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.message).toContain("Password reset email sent");
    });

    it("should fail reset password with non-existent email", async () => {
      const resetData = {
        email: "nonexistent@example.com",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/reset-password",
        resetData
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("User not found");
    });

    it("should fail reset password with invalid email format", async () => {
      const resetData = {
        email: "invalid-email",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/reset-password",
        resetData
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Validation error");
    });
  });

  describe("POST /auth/reset-password/confirm", () => {
    it("should reset password successfully with valid token", async () => {
      // First create a reset token
      const resetToken = await global.e2eUtils.createAuthToken(testUser);

      const confirmData = {
        token: resetToken,
        new_password: "newpassword123",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/reset-password/confirm",
        confirmData
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.message).toContain("Password reset successful");
    });

    it("should fail reset password with invalid token", async () => {
      const confirmData = {
        token: "invalid-token",
        new_password: "newpassword123",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/reset-password/confirm",
        confirmData
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Invalid token");
    });

    it("should fail reset password with weak password", async () => {
      const resetToken = await global.e2eUtils.createAuthToken(testUser);

      const confirmData = {
        token: resetToken,
        new_password: "123", // Too short
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/reset-password/confirm",
        confirmData
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Validation error");
    });
  });

  describe("POST /auth/revoke-device", () => {
    it("should revoke device successfully", async () => {
      const deviceData = {
        device_id: 1,
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/revoke-device",
        deviceData,
        authToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.message).toContain("Device access revoked");
    });

    it("should fail revoke device without authentication", async () => {
      const deviceData = {
        device_id: 1,
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/revoke-device",
        deviceData
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });

    it("should fail revoke device with invalid device ID", async () => {
      const deviceData = {
        device_id: 999999,
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/auth/revoke-device",
        deviceData,
        authToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("Device not found");
    });
  });
});
