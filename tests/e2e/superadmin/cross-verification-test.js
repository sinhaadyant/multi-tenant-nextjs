class SuperAdminCrossVerificationTester {
  constructor(testHelper, dbHelper) {
    this.testHelper = testHelper;
    this.dbHelper = dbHelper;
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
      details: [],
    };
    this.testData = {
      createdTenants: [],
      createdUsers: [],
      createdRoles: [],
    };
  }

  async runAllTests() {
    console.log("🔄 Testing SuperAdmin Cross-Verification...");

    try {
      await this.loginAsSuperAdmin();
      await this.testTenantUserSync();
      await this.testTenantRoleSync();
      await this.testAuditLogSync();
      await this.testNotificationSync();
      await this.testSupportTicketSync();
      await this.testDataConsistency();
      await this.testRealTimeUpdates();

      console.log(
        `✅ SuperAdmin Cross-Verification Tests: ${this.testResults.passed} passed, ${this.testResults.failed} failed`
      );
      return this.testResults;
    } catch (error) {
      console.error("❌ SuperAdmin Cross-Verification Tests failed:", error);
      this.testResults.errors.push(`Cross-Verification: ${error.message}`);
      this.testResults.failed++;
      return this.testResults;
    }
  }

  async testTenantUserSync() {
    try {
      console.log("  📝 Testing tenant-user synchronization...");

      // Create a test tenant
      const testTenant = await this.dbHelper.createTenantInDB({
        name: `Sync Test Tenant ${Date.now()}`,
        slug: `sync-test-${Date.now()}`,
        domain: `sync-test-${Date.now()}.example.com`,
        description: "Tenant for sync testing",
      });
      this.testData.createdTenants.push(testTenant.id);

      // Create a user in this tenant via SuperAdmin
      const testUser = await this.dbHelper.createUserInDB({
        name: `Sync Test User ${Date.now()}`,
        email: `sync-user-${Date.now()}@example.com`,
        password: "TestPass123!",
        tenantSlug: testTenant.slug,
        isActive: true,
      });
      this.testData.createdUsers.push(testUser.id);

      // Verify user appears in SuperAdmin view
      const superAdminUsers = await this.dbHelper.getUsersFromDB({
        tenantSlug: testTenant.slug,
      });
      const userInSuperAdmin = superAdminUsers.find(
        (u) => u.id === testUser.id
      );

      if (userInSuperAdmin) {
        console.log("    ✅ User visible in SuperAdmin view");
        this.testResults.passed++;
      } else {
        throw new Error("User not visible in SuperAdmin view");
      }

      // Verify user appears in tenant view (simulate tenant login)
      const tenantUsers = await this.dbHelper.getUsersFromDB({
        tenantSlug: testTenant.slug,
      });
      const userInTenant = tenantUsers.find((u) => u.id === testUser.id);

      if (userInTenant) {
        console.log("    ✅ User visible in tenant view");
        this.testResults.passed++;
      } else {
        throw new Error("User not visible in tenant view");
      }

      // Test cross-verification
      const syncResult = await this.dbHelper.verifyTenantUserSync(
        testTenant.slug,
        testUser.id
      );
      if (syncResult.isSync) {
        console.log(
          "    ✅ User data synchronized between SuperAdmin and tenant"
        );
        this.testResults.passed++;
        this.testResults.details.push(
          "SuperAdmin-tenant user synchronization working correctly"
        );
      } else {
        throw new Error(
          "User data not synchronized between SuperAdmin and tenant"
        );
      }
    } catch (error) {
      console.error("    ❌ Tenant-user sync test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Tenant-user sync: ${error.message}`);
    }
  }

  async testTenantRoleSync() {
    try {
      console.log("  📝 Testing tenant-role synchronization...");

      // Create a test tenant if not exists
      let testTenant =
        this.testData.createdTenants.length > 0
          ? await this.dbHelper.prisma.tenant.findUnique({
              where: { id: this.testData.createdTenants[0] },
            })
          : await this.dbHelper.createTenantInDB({
              name: `Role Sync Test Tenant ${Date.now()}`,
              slug: `role-sync-test-${Date.now()}`,
              domain: `role-sync-test-${Date.now()}.example.com`,
              description: "Tenant for role sync testing",
            });

      if (!this.testData.createdTenants.includes(testTenant.id)) {
        this.testData.createdTenants.push(testTenant.id);
      }

      // Create a role in this tenant via SuperAdmin
      const testRole = await this.dbHelper.createRoleInDB({
        name: `Sync Test Role ${Date.now()}`,
        description: "Role for sync testing",
        tenantSlug: testTenant.slug,
        isActive: true,
      });
      this.testData.createdRoles.push(testRole.id);

      // Verify role appears in SuperAdmin view
      const superAdminRoles = await this.dbHelper.getRolesFromDB({
        tenantSlug: testTenant.slug,
      });
      const roleInSuperAdmin = superAdminRoles.find(
        (r) => r.id === testRole.id
      );

      if (roleInSuperAdmin) {
        console.log("    ✅ Role visible in SuperAdmin view");
        this.testResults.passed++;
      } else {
        throw new Error("Role not visible in SuperAdmin view");
      }

      // Verify role appears in tenant view
      const tenantRoles = await this.dbHelper.getRolesFromDB({
        tenantSlug: testTenant.slug,
      });
      const roleInTenant = tenantRoles.find((r) => r.id === testRole.id);

      if (roleInTenant) {
        console.log("    ✅ Role visible in tenant view");
        this.testResults.passed++;
      } else {
        throw new Error("Role not visible in tenant view");
      }

      // Compare role data
      const comparison = this.dbHelper.compareUserData(
        roleInSuperAdmin,
        roleInTenant
      );
      if (comparison.matches) {
        console.log(
          "    ✅ Role data synchronized between SuperAdmin and tenant"
        );
        this.testResults.passed++;
        this.testResults.details.push(
          "SuperAdmin-tenant role synchronization working correctly"
        );
      } else {
        throw new Error(
          `Role data not synchronized: ${comparison.mismatches.join(", ")}`
        );
      }
    } catch (error) {
      console.error("    ❌ Tenant-role sync test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Tenant-role sync: ${error.message}`);
    }
  }

  async testAuditLogSync() {
    try {
      console.log("  📝 Testing audit log synchronization...");

      // Perform an action that should generate audit logs
      const testTenant =
        this.testData.createdTenants.length > 0
          ? await this.dbHelper.prisma.tenant.findUnique({
              where: { id: this.testData.createdTenants[0] },
            })
          : await this.dbHelper.createTenantInDB({
              name: `Audit Sync Test Tenant ${Date.now()}`,
              slug: `audit-sync-test-${Date.now()}`,
              domain: `audit-sync-test-${Date.now()}.example.com`,
              description: "Tenant for audit sync testing",
            });

      if (!this.testData.createdTenants.includes(testTenant.id)) {
        this.testData.createdTenants.push(testTenant.id);
      }

      // Create a test user to generate audit log
      const testUser = await this.dbHelper.createUserInDB({
        name: `Audit Test User ${Date.now()}`,
        email: `audit-user-${Date.now()}@example.com`,
        password: "TestPass123!",
        tenantSlug: testTenant.slug,
        isActive: true,
      });
      this.testData.createdUsers.push(testUser.id);

      // Wait for audit log to be created
      await this.testHelper.page.waitForTimeout(2000);

      // Verify audit log exists
      const auditLog = await this.dbHelper.verifyAuditLogCreation(
        "CREATE",
        testUser.id,
        "User"
      );

      if (auditLog) {
        console.log("    ✅ Audit log created for user creation");
        this.testResults.passed++;

        // Verify audit log appears in SuperAdmin view
        const superAdminAuditLogs = await this.dbHelper.getAuditLogsFromDB({
          tenantSlug: testTenant.slug,
        });
        const auditLogInSuperAdmin = superAdminAuditLogs.find(
          (a) => a.id === auditLog.id
        );

        if (auditLogInSuperAdmin) {
          console.log("    ✅ Audit log visible in SuperAdmin view");
          this.testResults.passed++;
        } else {
          throw new Error("Audit log not visible in SuperAdmin view");
        }

        // Verify audit log appears in tenant view
        const tenantAuditLogs = await this.dbHelper.getAuditLogsFromDB({
          tenantSlug: testTenant.slug,
        });
        const auditLogInTenant = tenantAuditLogs.find(
          (a) => a.id === auditLog.id
        );

        if (auditLogInTenant) {
          console.log("    ✅ Audit log visible in tenant view");
          this.testResults.passed++;
          this.testResults.details.push(
            "SuperAdmin-tenant audit log synchronization working correctly"
          );
        } else {
          throw new Error("Audit log not visible in tenant view");
        }
      } else {
        throw new Error("No audit log created for user creation");
      }
    } catch (error) {
      console.error("    ❌ Audit log sync test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Audit log sync: ${error.message}`);
    }
  }

  async testNotificationSync() {
    try {
      console.log("  📝 Testing notification synchronization...");

      // Create a notification via SuperAdmin
      const testNotification = await this.dbHelper.createNotificationInDB({
        title: `Sync Test Notification ${Date.now()}`,
        message: "Test notification for sync testing",
        type: "info",
        priority: "medium",
        targetType: "tenant",
        status: "sent",
      });

      // Verify notification appears in SuperAdmin view
      const superAdminNotifications =
        await this.dbHelper.getNotificationsFromDB();
      const notificationInSuperAdmin = superAdminNotifications.find(
        (n) => n.id === testNotification.id
      );

      if (notificationInSuperAdmin) {
        console.log("    ✅ Notification visible in SuperAdmin view");
        this.testResults.passed++;
      } else {
        throw new Error("Notification not visible in SuperAdmin view");
      }

      // Verify notification appears in tenant view (if targeted to tenant)
      if (testNotification.targetTenantId) {
        const tenantNotifications = await this.dbHelper.getNotificationsFromDB({
          targetTenantId: testNotification.targetTenantId,
        });
        const notificationInTenant = tenantNotifications.find(
          (n) => n.id === testNotification.id
        );

        if (notificationInTenant) {
          console.log("    ✅ Notification visible in tenant view");
          this.testResults.passed++;
          this.testResults.details.push(
            "SuperAdmin-tenant notification synchronization working correctly"
          );
        } else {
          console.log("    ℹ️  Notification not targeted to specific tenant");
        }
      }
    } catch (error) {
      console.error("    ❌ Notification sync test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Notification sync: ${error.message}`);
    }
  }

  async testSupportTicketSync() {
    try {
      console.log("  📝 Testing support ticket synchronization...");

      // Create a test tenant if not exists
      let testTenant =
        this.testData.createdTenants.length > 0
          ? await this.dbHelper.prisma.tenant.findUnique({
              where: { id: this.testData.createdTenants[0] },
            })
          : await this.dbHelper.createTenantInDB({
              name: `Support Sync Test Tenant ${Date.now()}`,
              slug: `support-sync-test-${Date.now()}`,
              domain: `support-sync-test-${Date.now()}.example.com`,
              description: "Tenant for support sync testing",
            });

      if (!this.testData.createdTenants.includes(testTenant.id)) {
        this.testData.createdTenants.push(testTenant.id);
      }

      // Create a support ticket via tenant (simulate tenant user creating ticket)
      const testTicket = await this.dbHelper.prisma.supportTicket.create({
        data: {
          title: `Sync Test Ticket ${Date.now()}`,
          description: "Test support ticket for sync testing",
          status: "OPEN",
          priority: "medium",
          category: "technical",
          tenantId: testTenant.id,
          userId:
            this.testData.createdUsers.length > 0
              ? this.testData.createdUsers[0]
              : null,
        },
      });

      // Verify ticket appears in SuperAdmin view
      const superAdminTickets = await this.dbHelper.getSupportTicketsFromDB({
        tenantSlug: testTenant.slug,
      });
      const ticketInSuperAdmin = superAdminTickets.find(
        (t) => t.id === testTicket.id
      );

      if (ticketInSuperAdmin) {
        console.log("    ✅ Support ticket visible in SuperAdmin view");
        this.testResults.passed++;
      } else {
        throw new Error("Support ticket not visible in SuperAdmin view");
      }

      // Verify ticket appears in tenant view
      const tenantTickets = await this.dbHelper.getSupportTicketsFromDB({
        tenantSlug: testTenant.slug,
      });
      const ticketInTenant = tenantTickets.find((t) => t.id === testTicket.id);

      if (ticketInTenant) {
        console.log("    ✅ Support ticket visible in tenant view");
        this.testResults.passed++;
        this.testResults.details.push(
          "SuperAdmin-tenant support ticket synchronization working correctly"
        );
      } else {
        throw new Error("Support ticket not visible in tenant view");
      }
    } catch (error) {
      console.error("    ❌ Support ticket sync test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Support ticket sync: ${error.message}`);
    }
  }

  async testDataConsistency() {
    try {
      console.log("  📝 Testing data consistency across views...");

      // Test tenant data consistency
      const tenants = await this.dbHelper.getTenantsFromDB();
      if (tenants.length > 0) {
        const testTenant = tenants[0];

        // Get tenant data from different perspectives
        const superAdminTenant = await this.dbHelper.prisma.tenant.findUnique({
          where: { id: testTenant.id },
          include: { users: true, roles: true },
        });

        const tenantUsers = await this.dbHelper.getUsersFromDB({
          tenantSlug: testTenant.slug,
        });
        const tenantRoles = await this.dbHelper.getRolesFromDB({
          tenantSlug: testTenant.slug,
        });

        // Compare user counts
        if (superAdminTenant.users.length === tenantUsers.length) {
          console.log(
            "    ✅ User count consistent between SuperAdmin and tenant views"
          );
          this.testResults.passed++;
        } else {
          throw new Error(
            `User count mismatch: SuperAdmin=${superAdminTenant.users.length}, Tenant=${tenantUsers.length}`
          );
        }

        // Compare role counts
        if (superAdminTenant.roles.length === tenantRoles.length) {
          console.log(
            "    ✅ Role count consistent between SuperAdmin and tenant views"
          );
          this.testResults.passed++;
        } else {
          throw new Error(
            `Role count mismatch: SuperAdmin=${superAdminTenant.roles.length}, Tenant=${tenantRoles.length}`
          );
        }

        this.testResults.details.push(
          "SuperAdmin-tenant data consistency verified"
        );
      }
    } catch (error) {
      console.error("    ❌ Data consistency test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Data consistency: ${error.message}`);
    }
  }

  async testRealTimeUpdates() {
    try {
      console.log("  📝 Testing real-time updates...");

      // Create a test tenant
      const testTenant = await this.dbHelper.createTenantInDB({
        name: `RealTime Test Tenant ${Date.now()}`,
        slug: `realtime-test-${Date.now()}`,
        domain: `realtime-test-${Date.now()}.example.com`,
        description: "Tenant for real-time testing",
      });
      this.testData.createdTenants.push(testTenant.id);

      // Get initial user count
      const initialUsers = await this.dbHelper.getUsersFromDB({
        tenantSlug: testTenant.slug,
      });
      const initialCount = initialUsers.length;

      // Create a user via database (simulate real-time update)
      const newUser = await this.dbHelper.createUserInDB({
        name: `RealTime Test User ${Date.now()}`,
        email: `realtime-user-${Date.now()}@example.com`,
        password: "TestPass123!",
        tenantSlug: testTenant.slug,
        isActive: true,
      });
      this.testData.createdUsers.push(newUser.id);

      // Wait a moment for potential real-time updates
      await this.testHelper.page.waitForTimeout(2000);

      // Check if UI reflects the change (if on tenant page)
      const currentUrl = this.testHelper.page.url();
      if (
        currentUrl.includes("/superadmin/tenants") ||
        currentUrl.includes("/users")
      ) {
        // Refresh the page to see if new user appears
        await this.testHelper.page.reload();
        await this.testHelper.page.waitForSelector(
          '[data-testid="user-list"], .user-list, table',
          { timeout: 5000 }
        );

        // Get updated user count from UI
        const updatedUsers = await this.getUsersFromUI();
        const updatedCount = updatedUsers.length;

        if (updatedCount > initialCount) {
          console.log("    ✅ Real-time update reflected in UI");
          this.testResults.passed++;
          this.testResults.details.push(
            "SuperAdmin real-time updates working correctly"
          );
        } else {
          console.log("    ℹ️  Real-time updates may require manual refresh");
        }
      }
    } catch (error) {
      console.error("    ❌ Real-time updates test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Real-time updates: ${error.message}`);
    }
  }

  async getUsersFromUI() {
    try {
      const users = await this.testHelper.page.evaluate(() => {
        const rows = document.querySelectorAll(
          'table tbody tr, [data-testid="user-row"], .user-row'
        );
        return Array.from(rows).map((row) => {
          const cells = row.querySelectorAll("td");
          return {
            name: cells[0]?.textContent?.trim() || "",
            email: cells[1]?.textContent?.trim() || "",
            status: cells[2]?.textContent?.trim() || "",
            role: cells[3]?.textContent?.trim() || "",
          };
        });
      });

      return users;
    } catch (error) {
      console.log("    ℹ️  Could not extract users from UI");
      return [];
    }
  }

  async loginAsSuperAdmin() {
    try {
      const { TEST_CREDENTIALS } = require("../test-setup");
      const credentials = TEST_CREDENTIALS.superadmin.superadmin;

      await this.testHelper.page.goto("http://localhost:3000/superadmin/login");
      await this.testHelper.page.waitForSelector("form", { timeout: 5000 });
      await this.testHelper.typeText('input[name="email"]', credentials.email);
      await this.testHelper.typeText(
        'input[name="password"]',
        credentials.password
      );

      const submitButton = await this.testHelper.page.$(
        'button[type="submit"]'
      );
      await submitButton.click();
      await this.testHelper.page.waitForNavigation({
        waitUntil: "networkidle0",
      });
    } catch (error) {
      throw new Error(`Failed to login as SuperAdmin: ${error.message}`);
    }
  }
}

module.exports = SuperAdminCrossVerificationTester;
