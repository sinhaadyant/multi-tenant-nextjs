import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

describe("Tenants E2E Tests", () => {
  let superAdminUser: any;
  let superAdminToken: string;
  let testTenant: any;

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
  });

  afterAll(async () => {
    // Cleanup is handled by afterEach in setup
  });

  describe("GET /tenants", () => {
    it("should list tenants successfully for super admin", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/tenants",
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data).toBeInstanceOf(Array);
      expect(response.data.meta).toHaveProperty("total");
      expect(response.data.meta).toHaveProperty("page");
      expect(response.data.meta).toHaveProperty("limit");
    });

    it("should list tenants with pagination", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/tenants?page=1&limit=5",
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.meta.page).toBe(1);
      expect(response.data.meta.limit).toBe(5);
    });

    it("should list tenants with search", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/tenants?search=Super",
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data.length).toBeGreaterThan(0);
    });

    it("should list tenants with filters", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/tenants?is_active=true",
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data.every((tenant: any) => tenant.is_active)).toBe(
        true
      );
    });

    it("should fail to list tenants without authentication", async () => {
      const response = await global.e2eUtils.makeRequest("GET", "/tenants");

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });

    it("should fail to list tenants with insufficient permissions", async () => {
      // Create regular user
      const regularTenant = await global.e2eUtils.createTestTenant();
      const regularUser = await global.e2eUtils.createTestUser(
        regularTenant.id,
        {
          is_superadmin: false,
        }
      );
      const regularToken = await global.e2eUtils.createAuthToken(regularUser);

      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/tenants",
        {},
        regularToken
      );

      global.e2eUtils.expectErrorResponse(response, 403);
      expect(response.data.message).toContain("Access forbidden");
    });
  });

  describe("POST /tenants", () => {
    it("should create tenant successfully", async () => {
      const tenantData = {
        name: "New Test Tenant",
        domain: "newtest.example.com",
        contact_email: "admin@newtest.example.com",
        contact_phone: "+1234567890",
        address: "456 New St, New City",
        is_active: true,
        login_restrictions: {
          max_devices: 3,
          allow_multiple_sessions: true,
          password_expiry_days: 90,
          ip_whitelist: ["192.168.1.1"],
          default_for_tenants: false,
        },
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/tenants",
        tenantData,
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 201);
      expect(response.data.data.name).toBe(tenantData.name);
      expect(response.data.data.domain).toBe(tenantData.domain);
      expect(response.data.data.contact_email).toBe(tenantData.contact_email);
      expect(response.data.data.is_active).toBe(true);

      testTenant = response.data.data;
    });

    it("should fail to create tenant with duplicate domain", async () => {
      const tenantData = {
        name: "Duplicate Tenant",
        domain: "newtest.example.com", // Same as above
        contact_email: "admin@duplicate.example.com",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/tenants",
        tenantData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Domain already exists");
    });

    it("should fail to create tenant with invalid email", async () => {
      const tenantData = {
        name: "Invalid Email Tenant",
        domain: "invalid.example.com",
        contact_email: "invalid-email",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/tenants",
        tenantData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Validation error");
    });

    it("should fail to create tenant with missing required fields", async () => {
      const tenantData = {
        name: "Missing Fields Tenant",
        // Missing domain and contact_email
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/tenants",
        tenantData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Validation error");
    });

    it("should fail to create tenant without authentication", async () => {
      const tenantData = {
        name: "Unauthorized Tenant",
        domain: "unauthorized.example.com",
        contact_email: "admin@unauthorized.example.com",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/tenants",
        tenantData
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });

  describe("GET /tenants/:id", () => {
    it("should get tenant by ID successfully", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        `/tenants/${testTenant.id}`,
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data.id).toBe(testTenant.id);
      expect(response.data.data.name).toBe(testTenant.name);
    });

    it("should fail to get non-existent tenant", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/tenants/999999",
        {},
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("Tenant not found");
    });

    it("should fail to get tenant without authentication", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        `/tenants/${testTenant.id}`
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });

  describe("PUT /tenants/:id", () => {
    it("should update tenant successfully", async () => {
      const updateData = {
        name: "Updated Test Tenant",
        contact_phone: "+9876543210",
        address: "789 Updated St, Updated City",
        is_active: false,
      };

      const response = await global.e2eUtils.makeRequest(
        "PUT",
        `/tenants/${testTenant.id}`,
        updateData,
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data.name).toBe(updateData.name);
      expect(response.data.data.contact_phone).toBe(updateData.contact_phone);
      expect(response.data.data.address).toBe(updateData.address);
      expect(response.data.data.is_active).toBe(updateData.is_active);
    });

    it("should fail to update tenant with invalid data", async () => {
      const updateData = {
        contact_email: "invalid-email",
      };

      const response = await global.e2eUtils.makeRequest(
        "PUT",
        `/tenants/${testTenant.id}`,
        updateData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Validation error");
    });

    it("should fail to update non-existent tenant", async () => {
      const updateData = {
        name: "Non-existent Tenant",
      };

      const response = await global.e2eUtils.makeRequest(
        "PUT",
        "/tenants/999999",
        updateData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("Tenant not found");
    });

    it("should fail to update tenant without authentication", async () => {
      const updateData = {
        name: "Unauthorized Update",
      };

      const response = await global.e2eUtils.makeRequest(
        "PUT",
        `/tenants/${testTenant.id}`,
        updateData
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });

  describe("DELETE /tenants/:id", () => {
    it("should delete tenant successfully", async () => {
      // Create a tenant to delete
      const deleteTenant = await global.e2eUtils.createTestTenant({
        name: "Delete Test Tenant",
        domain: "delete.example.com",
      });

      const response = await global.e2eUtils.makeRequest(
        "DELETE",
        `/tenants/${deleteTenant.id}`,
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.message).toContain("Tenant deleted successfully");
    });

    it("should fail to delete non-existent tenant", async () => {
      const response = await global.e2eUtils.makeRequest(
        "DELETE",
        "/tenants/999999",
        {},
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("Tenant not found");
    });

    it("should fail to delete tenant without authentication", async () => {
      const response = await global.e2eUtils.makeRequest(
        "DELETE",
        `/tenants/${testTenant.id}`
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });

    it("should fail to delete tenant with insufficient permissions", async () => {
      // Create regular user
      const regularTenant = await global.e2eUtils.createTestTenant();
      const regularUser = await global.e2eUtils.createTestUser(
        regularTenant.id,
        {
          is_superadmin: false,
        }
      );
      const regularToken = await global.e2eUtils.createAuthToken(regularUser);

      const response = await global.e2eUtils.makeRequest(
        "DELETE",
        `/tenants/${testTenant.id}`,
        {},
        regularToken
      );

      global.e2eUtils.expectErrorResponse(response, 403);
      expect(response.data.message).toContain("Access forbidden");
    });
  });

  describe("GET /tenants/:id/users", () => {
    it("should get tenant users successfully", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        `/tenants/${testTenant.id}/users`,
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data).toBeInstanceOf(Array);
      expect(response.data.meta).toHaveProperty("total");
    });

    it("should fail to get users for non-existent tenant", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/tenants/999999/users",
        {},
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("Tenant not found");
    });
  });

  describe("GET /tenants/:id/settings", () => {
    it("should get tenant settings successfully", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        `/tenants/${testTenant.id}/settings`,
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data).toHaveProperty("login_restrictions");
    });

    it("should fail to get settings for non-existent tenant", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/tenants/999999/settings",
        {},
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("Tenant not found");
    });
  });
});
