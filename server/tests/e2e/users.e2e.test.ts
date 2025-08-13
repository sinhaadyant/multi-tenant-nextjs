import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

describe("Users E2E Tests", () => {
  let superAdminUser: any;
  let superAdminToken: string;
  let testTenant: any;
  let testUser: any;

  beforeAll(async () => {
    // Create super admin user
    const superAdminTenant = await global.e2eUtils.createTestTenant({
      name: "Super Admin Tenant",
      domain: "superadmin.example.com",
    });

    superAdminUser = await global.e2eUtils.createTestUser(superAdminTenant.id, {
      email: "superadmin@example.com",
      is_superadmin: true,
    });

    superAdminToken = await global.e2eUtils.createAuthToken(superAdminUser);

    // Create test tenant
    testTenant = await global.e2eUtils.createTestTenant({
      name: "Test Tenant",
      domain: "test.example.com",
    });
  });

  afterAll(async () => {
    // Cleanup is handled by afterEach in setup
  });

  describe("GET /users", () => {
    it("should list users successfully for super admin", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/users",
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data).toBeInstanceOf(Array);
      expect(response.data.meta).toHaveProperty("total");
      expect(response.data.meta).toHaveProperty("page");
      expect(response.data.meta).toHaveProperty("limit");
    });

    it("should list users with pagination", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/users?page=1&limit=5",
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.meta.page).toBe(1);
      expect(response.data.meta.limit).toBe(5);
    });

    it("should list users with search", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/users?search=superadmin",
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data.length).toBeGreaterThan(0);
    });

    it("should list users with filters", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/users?is_active=true",
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data.every((user: any) => user.is_active)).toBe(
        true
      );
    });

    it("should list users by tenant", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        `/users?tenant_id=${testTenant.id}`,
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(
        response.data.data.every(
          (user: any) => user.tenant_id === testTenant.id
        )
      ).toBe(true);
    });

    it("should fail to list users without authentication", async () => {
      const response = await global.e2eUtils.makeRequest("GET", "/users");

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });

  describe("POST /users", () => {
    it("should create user successfully", async () => {
      const userData = {
        tenant_id: testTenant.id,
        role_id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        password: "password123",
        is_active: true,
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/users",
        userData,
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 201);
      expect(response.data.data.first_name).toBe(userData.first_name);
      expect(response.data.data.last_name).toBe(userData.last_name);
      expect(response.data.data.email).toBe(userData.email);
      expect(response.data.data.tenant_id).toBe(userData.tenant_id);
      expect(response.data.data.is_active).toBe(userData.is_active);
      expect(response.data.data).not.toHaveProperty("password"); // Password should not be returned

      testUser = response.data.data;
    });

    it("should fail to create user with duplicate email", async () => {
      const userData = {
        tenant_id: testTenant.id,
        role_id: 1,
        first_name: "Jane",
        last_name: "Doe",
        email: "john.doe@example.com", // Same as above
        password: "password123",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/users",
        userData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Email already exists");
    });

    it("should fail to create user with invalid email", async () => {
      const userData = {
        tenant_id: testTenant.id,
        role_id: 1,
        first_name: "Invalid",
        last_name: "Email",
        email: "invalid-email",
        password: "password123",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/users",
        userData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Validation error");
    });

    it("should fail to create user with weak password", async () => {
      const userData = {
        tenant_id: testTenant.id,
        role_id: 1,
        first_name: "Weak",
        last_name: "Password",
        email: "weak@example.com",
        password: "123", // Too short
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/users",
        userData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Validation error");
    });

    it("should fail to create user with missing required fields", async () => {
      const userData = {
        tenant_id: testTenant.id,
        first_name: "Missing",
        last_name: "Fields",
        // Missing email and password
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/users",
        userData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Validation error");
    });

    it("should fail to create user without authentication", async () => {
      const userData = {
        tenant_id: testTenant.id,
        role_id: 1,
        first_name: "Unauthorized",
        last_name: "User",
        email: "unauthorized@example.com",
        password: "password123",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/users",
        userData
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });

  describe("GET /users/:id", () => {
    it("should get user by ID successfully", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        `/users/${testUser.id}`,
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data.id).toBe(testUser.id);
      expect(response.data.data.email).toBe(testUser.email);
      expect(response.data.data).not.toHaveProperty("password_hash"); // Password hash should not be returned
    });

    it("should fail to get non-existent user", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/users/999999",
        {},
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("User not found");
    });

    it("should fail to get user without authentication", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        `/users/${testUser.id}`
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });

  describe("PUT /users/:id", () => {
    it("should update user successfully", async () => {
      const updateData = {
        first_name: "Updated",
        last_name: "Name",
        is_active: false,
      };

      const response = await global.e2eUtils.makeRequest(
        "PUT",
        `/users/${testUser.id}`,
        updateData,
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data.first_name).toBe(updateData.first_name);
      expect(response.data.data.last_name).toBe(updateData.last_name);
      expect(response.data.data.is_active).toBe(updateData.is_active);
    });

    it("should update user password successfully", async () => {
      const updateData = {
        password: "newpassword123",
      };

      const response = await global.e2eUtils.makeRequest(
        "PUT",
        `/users/${testUser.id}`,
        updateData,
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data).not.toHaveProperty("password"); // Password should not be returned
    });

    it("should fail to update user with invalid email", async () => {
      const updateData = {
        email: "invalid-email",
      };

      const response = await global.e2eUtils.makeRequest(
        "PUT",
        `/users/${testUser.id}`,
        updateData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Validation error");
    });

    it("should fail to update non-existent user", async () => {
      const updateData = {
        first_name: "Non-existent",
      };

      const response = await global.e2eUtils.makeRequest(
        "PUT",
        "/users/999999",
        updateData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("User not found");
    });

    it("should fail to update user without authentication", async () => {
      const updateData = {
        first_name: "Unauthorized",
      };

      const response = await global.e2eUtils.makeRequest(
        "PUT",
        `/users/${testUser.id}`,
        updateData
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });

  describe("DELETE /users/:id", () => {
    it("should soft delete user successfully", async () => {
      // Create a user to delete
      const deleteUser = await global.e2eUtils.createTestUser(testTenant.id, {
        email: "delete@example.com",
      });

      const response = await global.e2eUtils.makeRequest(
        "DELETE",
        `/users/${deleteUser.id}`,
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.message).toContain("User deleted successfully");
    });

    it("should fail to delete non-existent user", async () => {
      const response = await global.e2eUtils.makeRequest(
        "DELETE",
        "/users/999999",
        {},
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("User not found");
    });

    it("should fail to delete user without authentication", async () => {
      const response = await global.e2eUtils.makeRequest(
        "DELETE",
        `/users/${testUser.id}`
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });

  describe("GET /users/:id/devices", () => {
    it("should get user devices successfully", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        `/users/${testUser.id}/devices`,
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data).toBeInstanceOf(Array);
      expect(response.data.meta).toHaveProperty("total");
    });

    it("should fail to get devices for non-existent user", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/users/999999/devices",
        {},
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("User not found");
    });
  });

  describe("GET /users/:id/audit-logs", () => {
    it("should get user audit logs successfully", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        `/users/${testUser.id}/audit-logs`,
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data).toBeInstanceOf(Array);
      expect(response.data.meta).toHaveProperty("total");
    });

    it("should fail to get audit logs for non-existent user", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/users/999999/audit-logs",
        {},
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("User not found");
    });
  });

  describe("POST /users/:id/reset-password", () => {
    it("should reset user password successfully", async () => {
      const resetData = {
        new_password: "resetpassword123",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        `/users/${testUser.id}/reset-password`,
        resetData,
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.message).toContain("Password reset successfully");
    });

    it("should fail to reset password for non-existent user", async () => {
      const resetData = {
        new_password: "resetpassword123",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/users/999999/reset-password",
        resetData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("User not found");
    });

    it("should fail to reset password with weak password", async () => {
      const resetData = {
        new_password: "123", // Too short
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        `/users/${testUser.id}/reset-password`,
        resetData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Validation error");
    });
  });
});
