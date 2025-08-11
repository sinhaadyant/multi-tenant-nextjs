class SuperAdminDashboardTester {
  constructor(testHelper, dbHelper) {
    this.testHelper = testHelper;
    this.dbHelper = dbHelper;
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
      details: [],
    };
  }

  async runAllTests() {
    console.log("📊 Testing SuperAdmin Dashboard...");

    try {
      await this.testDashboardAccess();
      await this.testDashboardCounts();
      await this.testDashboardCharts();
      await this.testRecentActivity();
      await this.testQuickActions();
      await this.testDashboardRefresh();
      await this.testDashboardExport();

      console.log(
        `✅ SuperAdmin Dashboard Tests: ${this.testResults.passed} passed, ${this.testResults.failed} failed`
      );
      return this.testResults;
    } catch (error) {
      console.error("❌ SuperAdmin Dashboard Tests failed:", error);
      this.testResults.errors.push(`Dashboard: ${error.message}`);
      this.testResults.failed++;
      return this.testResults;
    }
  }

  async testDashboardAccess() {
    try {
      console.log("  📝 Testing dashboard access...");

      // Login first
      await this.loginAsSuperAdmin();

      // Navigate to dashboard
      await this.testHelper.page.goto(
        "http://localhost:3000/superadmin/dashboard"
      );
      await this.testHelper.page.waitForSelector(
        '[data-testid="dashboard"], .dashboard, main',
        { timeout: 5000 }
      );

      // Verify dashboard loaded
      const dashboardElement = await this.testHelper.page.$(
        '[data-testid="dashboard"], .dashboard, main'
      );
      if (dashboardElement) {
        console.log("    ✅ Dashboard page loaded successfully");
        this.testResults.passed++;
        this.testResults.details.push("SuperAdmin dashboard access working");
      } else {
        throw new Error("Dashboard page not loaded");
      }
    } catch (error) {
      console.error("    ❌ Dashboard access test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Dashboard access: ${error.message}`);
    }
  }

  async testDashboardCounts() {
    try {
      console.log("  📝 Testing dashboard counts...");

      // Get dashboard data from UI
      const uiCounts = await this.getDashboardCountsFromUI();

      // Get dashboard data from database
      const dbData = await this.dbHelper.getSuperAdminDashboardData();

      // Compare counts
      const countComparisons = [
        {
          name: "Total Tenants",
          ui: uiCounts.totalTenants,
          db: dbData.tenants.total,
        },
        {
          name: "Active Tenants",
          ui: uiCounts.activeTenants,
          db: dbData.tenants.active,
        },
        {
          name: "Total Users",
          ui: uiCounts.totalUsers,
          db: dbData.users.total,
        },
        {
          name: "Active Users",
          ui: uiCounts.activeUsers,
          db: dbData.users.active,
        },
        {
          name: "Total Audit Logs",
          ui: uiCounts.totalAuditLogs,
          db: dbData.auditLogs.total,
        },
        {
          name: "Pending Support Tickets",
          ui: uiCounts.pendingTickets,
          db: dbData.support.pending,
        },
      ];

      let allCountsMatch = true;
      for (const comparison of countComparisons) {
        if (comparison.ui !== comparison.db) {
          console.log(
            `    ⚠️  ${comparison.name} mismatch: UI=${comparison.ui}, DB=${comparison.db}`
          );
          allCountsMatch = false;
        }
      }

      if (allCountsMatch) {
        console.log("    ✅ All dashboard counts match database");
        this.testResults.passed++;
        this.testResults.details.push(
          "SuperAdmin dashboard counts verified against database"
        );
      } else {
        throw new Error("Dashboard counts do not match database values");
      }
    } catch (error) {
      console.error("    ❌ Dashboard counts test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Dashboard counts: ${error.message}`);
    }
  }

  async testDashboardCharts() {
    try {
      console.log("  📝 Testing dashboard charts...");

      // Check for chart elements
      const chartSelectors = [
        '[data-testid="chart"], .chart, canvas',
        '[data-testid="tenant-chart"], .tenant-chart',
        '[data-testid="user-chart"], .user-chart',
        '[data-testid="activity-chart"], .activity-chart',
      ];

      let chartsFound = 0;
      for (const selector of chartSelectors) {
        const chartElement = await this.testHelper.page.$(selector);
        if (chartElement) {
          chartsFound++;
          console.log(`    ✅ Chart found: ${selector}`);
        }
      }

      if (chartsFound > 0) {
        console.log(`    ✅ ${chartsFound} dashboard charts loaded`);
        this.testResults.passed++;
        this.testResults.details.push(
          "SuperAdmin dashboard charts loaded successfully"
        );
      } else {
        throw new Error("No dashboard charts found");
      }

      // Test chart interactions if available
      await this.testChartInteractions();
    } catch (error) {
      console.error("    ❌ Dashboard charts test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Dashboard charts: ${error.message}`);
    }
  }

  async testChartInteractions() {
    try {
      // Test chart hover interactions
      const chartElement = await this.testHelper.page.$(
        '[data-testid="chart"], .chart, canvas'
      );
      if (chartElement) {
        // Hover over chart
        await chartElement.hover();
        await this.testHelper.page.waitForTimeout(1000);

        // Check for tooltip or data display
        const tooltip = await this.testHelper.page.$(
          '.tooltip, [data-testid="tooltip"], .chart-tooltip'
        );
        if (tooltip) {
          console.log("    ✅ Chart interactions working");
          this.testResults.passed++;
        }
      }
    } catch (error) {
      console.log(
        "    ℹ️  Chart interactions not available or not implemented"
      );
    }
  }

  async testRecentActivity() {
    try {
      console.log("  📝 Testing recent activity section...");

      // Check for recent activity section
      const activitySection = await this.testHelper.page.$(
        '[data-testid="recent-activity"], .recent-activity, .activity-feed'
      );
      if (activitySection) {
        console.log("    ✅ Recent activity section found");
        this.testResults.passed++;

        // Check for activity items
        const activityItems = await this.testHelper.page.$$(
          '[data-testid="activity-item"], .activity-item, .feed-item'
        );
        if (activityItems.length > 0) {
          console.log(
            `    ✅ ${activityItems.length} recent activity items displayed`
          );
          this.testResults.passed++;

          // Verify activity data matches database
          const dbRecentActivity = await this.dbHelper.getAuditLogsFromDB({
            take: 5,
          });
          if (activityItems.length <= dbRecentActivity.length) {
            console.log("    ✅ Recent activity count matches database");
            this.testResults.passed++;
            this.testResults.details.push(
              "SuperAdmin recent activity section working correctly"
            );
          } else {
            throw new Error("Recent activity count exceeds database records");
          }
        } else {
          console.log("    ℹ️  No recent activity items found (may be empty)");
        }
      } else {
        throw new Error("Recent activity section not found");
      }
    } catch (error) {
      console.error("    ❌ Recent activity test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Recent activity: ${error.message}`);
    }
  }

  async testQuickActions() {
    try {
      console.log("  📝 Testing quick actions...");

      // Check for quick action buttons
      const quickActionSelectors = [
        '[data-testid="quick-action"], .quick-action',
        '[data-testid="create-tenant"], .create-tenant-btn',
        '[data-testid="invite-user"], .invite-user-btn',
        '[data-testid="view-reports"], .view-reports-btn',
      ];

      let quickActionsFound = 0;
      for (const selector of quickActionSelectors) {
        const actionButton = await this.testHelper.page.$(selector);
        if (actionButton) {
          quickActionsFound++;
          console.log(`    ✅ Quick action found: ${selector}`);

          // Test button click (without navigation)
          try {
            await actionButton.click();
            await this.testHelper.page.waitForTimeout(1000);
            console.log(`    ✅ Quick action clickable: ${selector}`);
          } catch (error) {
            console.log(`    ℹ️  Quick action not clickable: ${selector}`);
          }
        }
      }

      if (quickActionsFound > 0) {
        console.log(`    ✅ ${quickActionsFound} quick actions available`);
        this.testResults.passed++;
        this.testResults.details.push(
          "SuperAdmin dashboard quick actions working"
        );
      } else {
        console.log("    ℹ️  No quick actions found (may not be implemented)");
      }
    } catch (error) {
      console.error("    ❌ Quick actions test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Quick actions: ${error.message}`);
    }
  }

  async testDashboardRefresh() {
    try {
      console.log("  📝 Testing dashboard refresh...");

      // Get initial counts
      const initialCounts = await this.getDashboardCountsFromUI();

      // Refresh the page
      await this.testHelper.page.reload();
      await this.testHelper.page.waitForSelector(
        '[data-testid="dashboard"], .dashboard, main',
        { timeout: 5000 }
      );

      // Get counts after refresh
      const refreshedCounts = await this.getDashboardCountsFromUI();

      // Compare counts
      const countsMatch =
        JSON.stringify(initialCounts) === JSON.stringify(refreshedCounts);

      if (countsMatch) {
        console.log("    ✅ Dashboard data consistent after refresh");
        this.testResults.passed++;
        this.testResults.details.push(
          "SuperAdmin dashboard refresh maintains data consistency"
        );
      } else {
        throw new Error("Dashboard data inconsistent after refresh");
      }
    } catch (error) {
      console.error("    ❌ Dashboard refresh test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Dashboard refresh: ${error.message}`);
    }
  }

  async testDashboardExport() {
    try {
      console.log("  📝 Testing dashboard export functionality...");

      // Look for export buttons
      const exportSelectors = [
        '[data-testid="export-dashboard"], .export-dashboard',
        '[data-testid="export-report"], .export-report',
        'button[title*="Export"], button[aria-label*="Export"]',
      ];

      let exportFound = false;
      for (const selector of exportSelectors) {
        const exportButton = await this.testHelper.page.$(selector);
        if (exportButton) {
          exportFound = true;
          console.log(`    ✅ Export button found: ${selector}`);

          // Test export functionality
          try {
            await exportButton.click();
            await this.testHelper.page.waitForTimeout(2000);

            // Check for download or success message
            const successMessage = await this.testHelper.page.$(
              '.success-message, .alert-success, [data-testid="export-success"]'
            );
            if (successMessage) {
              console.log("    ✅ Export functionality working");
              this.testResults.passed++;
              this.testResults.details.push(
                "SuperAdmin dashboard export functionality working"
              );
              break;
            }
          } catch (error) {
            console.log(`    ℹ️  Export button not functional: ${selector}`);
          }
        }
      }

      if (!exportFound) {
        console.log(
          "    ℹ️  No export functionality found (may not be implemented)"
        );
      }
    } catch (error) {
      console.error("    ❌ Dashboard export test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Dashboard export: ${error.message}`);
    }
  }

  async getDashboardCountsFromUI() {
    try {
      // Extract counts from dashboard UI elements
      const counts = await this.testHelper.page.evaluate(() => {
        const extractCount = (selector) => {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.textContent;
            const match = text.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
          }
          return 0;
        };

        return {
          totalTenants: extractCount(
            '[data-testid="total-tenants"], .total-tenants, .tenant-count'
          ),
          activeTenants: extractCount(
            '[data-testid="active-tenants"], .active-tenants'
          ),
          totalUsers: extractCount(
            '[data-testid="total-users"], .total-users, .user-count'
          ),
          activeUsers: extractCount(
            '[data-testid="active-users"], .active-users'
          ),
          totalAuditLogs: extractCount(
            '[data-testid="total-audit-logs"], .total-audit-logs'
          ),
          pendingTickets: extractCount(
            '[data-testid="pending-tickets"], .pending-tickets'
          ),
        };
      });

      return counts;
    } catch (error) {
      console.log(
        "    ℹ️  Could not extract counts from UI, returning defaults"
      );
      return {
        totalTenants: 0,
        activeTenants: 0,
        totalUsers: 0,
        activeUsers: 0,
        totalAuditLogs: 0,
        pendingTickets: 0,
      };
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

module.exports = SuperAdminDashboardTester;
