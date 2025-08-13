import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

describe("Support System E2E Tests", () => {
  let superAdminUser: any;
  let superAdminToken: string;
  let testTenant: any;
  let testUser: any;
  let testTicket: any;

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

    // Create test tenant and user
    testTenant = await global.e2eUtils.createTestTenant({
      name: "Test Tenant",
      domain: "test.example.com",
    });

    testUser = await global.e2eUtils.createTestUser(testTenant.id, {
      email: "testuser@example.com",
    });
  });

  afterAll(async () => {
    // Cleanup is handled by afterEach in setup
  });

  describe("GET /support/tickets", () => {
    it("should list support tickets successfully", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/support/tickets",
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data).toBeInstanceOf(Array);
      expect(response.data.meta).toHaveProperty("total");
      expect(response.data.meta).toHaveProperty("page");
      expect(response.data.meta).toHaveProperty("limit");
    });

    it("should list tickets with pagination", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/support/tickets?page=1&limit=5",
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.meta.page).toBe(1);
      expect(response.data.meta.limit).toBe(5);
    });

    it("should list tickets with search", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/support/tickets?search=test",
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data.length).toBeGreaterThanOrEqual(0);
    });

    it("should list tickets with status filter", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/support/tickets?status=open",
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(
        response.data.data.every((ticket: any) => ticket.status === "open")
      ).toBe(true);
    });

    it("should list tickets with priority filter", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/support/tickets?priority=high",
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(
        response.data.data.every((ticket: any) => ticket.priority === "high")
      ).toBe(true);
    });

    it("should list tickets by tenant", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        `/support/tickets?tenant_id=${testTenant.id}`,
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(
        response.data.data.every(
          (ticket: any) => ticket.tenant_id === testTenant.id
        )
      ).toBe(true);
    });

    it("should fail to list tickets without authentication", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/support/tickets"
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });

  describe("POST /support/tickets", () => {
    it("should create support ticket successfully", async () => {
      const ticketData = {
        tenant_id: testTenant.id,
        user_id: testUser.id,
        subject: "Test Support Ticket",
        description: "This is a test support ticket description",
        priority: "medium",
        category: "technical",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/support/tickets",
        ticketData,
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 201);
      expect(response.data.data.subject).toBe(ticketData.subject);
      expect(response.data.data.priority).toBe(ticketData.priority);
      expect(response.data.data.status).toBe("open");
      expect(response.data.data.tenant_id).toBe(ticketData.tenant_id);
      expect(response.data.data.user_id).toBe(ticketData.user_id);

      testTicket = response.data.data;
    });

    it("should fail to create ticket with missing required fields", async () => {
      const ticketData = {
        tenant_id: testTenant.id,
        user_id: testUser.id,
        // Missing subject
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/support/tickets",
        ticketData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Validation error");
    });

    it("should fail to create ticket with invalid priority", async () => {
      const ticketData = {
        tenant_id: testTenant.id,
        user_id: testUser.id,
        subject: "Invalid Priority Ticket",
        priority: "invalid-priority",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/support/tickets",
        ticketData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Validation error");
    });

    it("should fail to create ticket without authentication", async () => {
      const ticketData = {
        tenant_id: testTenant.id,
        user_id: testUser.id,
        subject: "Unauthorized Ticket",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/support/tickets",
        ticketData
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });

  describe("GET /support/tickets/:id", () => {
    it("should get ticket by ID successfully", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        `/support/tickets/${testTicket.id}`,
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data.id).toBe(testTicket.id);
      expect(response.data.data.subject).toBe(testTicket.subject);
    });

    it("should fail to get non-existent ticket", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/support/tickets/999999",
        {},
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("Ticket not found");
    });

    it("should fail to get ticket without authentication", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        `/support/tickets/${testTicket.id}`
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });

  describe("PUT /support/tickets/:id", () => {
    it("should update ticket successfully", async () => {
      const updateData = {
        subject: "Updated Test Ticket",
        status: "in_progress",
        priority: "high",
      };

      const response = await global.e2eUtils.makeRequest(
        "PUT",
        `/support/tickets/${testTicket.id}`,
        updateData,
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data.subject).toBe(updateData.subject);
      expect(response.data.data.status).toBe(updateData.status);
      expect(response.data.data.priority).toBe(updateData.priority);
    });

    it("should fail to update ticket with invalid status", async () => {
      const updateData = {
        status: "invalid-status",
      };

      const response = await global.e2eUtils.makeRequest(
        "PUT",
        `/support/tickets/${testTicket.id}`,
        updateData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Validation error");
    });

    it("should fail to update non-existent ticket", async () => {
      const updateData = {
        subject: "Non-existent Ticket",
      };

      const response = await global.e2eUtils.makeRequest(
        "PUT",
        "/support/tickets/999999",
        updateData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("Ticket not found");
    });

    it("should fail to update ticket without authentication", async () => {
      const updateData = {
        subject: "Unauthorized Update",
      };

      const response = await global.e2eUtils.makeRequest(
        "PUT",
        `/support/tickets/${testTicket.id}`,
        updateData
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });

  describe("POST /support/tickets/:id/replies", () => {
    it("should add reply to ticket successfully", async () => {
      const replyData = {
        user_id: testUser.id,
        message: "This is a test reply to the support ticket",
        is_internal: false,
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        `/support/tickets/${testTicket.id}/replies`,
        replyData,
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 201);
      expect(response.data.data.message).toBe(replyData.message);
      expect(response.data.data.user_id).toBe(replyData.user_id);
      expect(response.data.data.ticket_id).toBe(testTicket.id);
    });

    it("should fail to add reply with missing message", async () => {
      const replyData = {
        user_id: testUser.id,
        // Missing message
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        `/support/tickets/${testTicket.id}/replies`,
        replyData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Validation error");
    });

    it("should fail to add reply to non-existent ticket", async () => {
      const replyData = {
        user_id: testUser.id,
        message: "Reply to non-existent ticket",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/support/tickets/999999/replies",
        replyData,
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("Ticket not found");
    });

    it("should fail to add reply without authentication", async () => {
      const replyData = {
        user_id: testUser.id,
        message: "Unauthorized reply",
      };

      const response = await global.e2eUtils.makeRequest(
        "POST",
        `/support/tickets/${testTicket.id}/replies`,
        replyData
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });

  describe("GET /support/tickets/:id/replies", () => {
    it("should get ticket replies successfully", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        `/support/tickets/${testTicket.id}/replies`,
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data).toBeInstanceOf(Array);
      expect(response.data.meta).toHaveProperty("total");
    });

    it("should fail to get replies for non-existent ticket", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/support/tickets/999999/replies",
        {},
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("Ticket not found");
    });

    it("should fail to get replies without authentication", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        `/support/tickets/${testTicket.id}/replies`
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });

  describe("POST /support/attachments", () => {
    it("should upload attachment successfully", async () => {
      // Create a mock file buffer
      const fileBuffer = Buffer.from("test file content");
      const fileName = "test-file.txt";

      const formData = new FormData();
      formData.append("file", new Blob([fileBuffer]), fileName);
      formData.append("ticket_id", testTicket.id.toString());
      formData.append("reply_id", "1"); // Optional

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/support/attachments",
        formData,
        superAdminToken,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      global.e2eUtils.expectSuccessResponse(response, 201);
      expect(response.data.data.file_name).toBe(fileName);
      expect(response.data.data.ticket_id).toBe(testTicket.id);
    });

    it("should fail to upload attachment without file", async () => {
      const formData = new FormData();
      formData.append("ticket_id", testTicket.id.toString());

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/support/attachments",
        formData,
        superAdminToken,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("No file uploaded");
    });

    it("should fail to upload attachment with invalid file type", async () => {
      const fileBuffer = Buffer.from("test file content");
      const fileName = "test-file.exe"; // Invalid file type

      const formData = new FormData();
      formData.append("file", new Blob([fileBuffer]), fileName);
      formData.append("ticket_id", testTicket.id.toString());

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/support/attachments",
        formData,
        superAdminToken,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      global.e2eUtils.expectErrorResponse(response, 400);
      expect(response.data.message).toContain("Invalid file type");
    });

    it("should fail to upload attachment without authentication", async () => {
      const fileBuffer = Buffer.from("test file content");
      const fileName = "test-file.txt";

      const formData = new FormData();
      formData.append("file", new Blob([fileBuffer]), fileName);
      formData.append("ticket_id", testTicket.id.toString());

      const response = await global.e2eUtils.makeRequest(
        "POST",
        "/support/attachments",
        formData,
        undefined,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });

  describe("DELETE /support/tickets/:id", () => {
    it("should delete ticket successfully", async () => {
      // Create a ticket to delete
      const deleteTicket = await global.e2eUtils.createTestTicket(
        testTenant.id,
        testUser.id,
        {
          subject: "Delete Test Ticket",
        }
      );

      const response = await global.e2eUtils.makeRequest(
        "DELETE",
        `/support/tickets/${deleteTicket.id}`,
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.message).toContain("Ticket deleted successfully");
    });

    it("should fail to delete non-existent ticket", async () => {
      const response = await global.e2eUtils.makeRequest(
        "DELETE",
        "/support/tickets/999999",
        {},
        superAdminToken
      );

      global.e2eUtils.expectErrorResponse(response, 404);
      expect(response.data.message).toContain("Ticket not found");
    });

    it("should fail to delete ticket without authentication", async () => {
      const response = await global.e2eUtils.makeRequest(
        "DELETE",
        `/support/tickets/${testTicket.id}`
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });

  describe("GET /support/statistics", () => {
    it("should get support statistics successfully", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/support/statistics",
        {},
        superAdminToken
      );

      global.e2eUtils.expectSuccessResponse(response, 200);
      expect(response.data.data).toHaveProperty("total_tickets");
      expect(response.data.data).toHaveProperty("open_tickets");
      expect(response.data.data).toHaveProperty("closed_tickets");
      expect(response.data.data).toHaveProperty("average_response_time");
    });

    it("should fail to get statistics without authentication", async () => {
      const response = await global.e2eUtils.makeRequest(
        "GET",
        "/support/statistics"
      );

      global.e2eUtils.expectErrorResponse(response, 401);
      expect(response.data.message).toContain("Unauthorized");
    });
  });
});
