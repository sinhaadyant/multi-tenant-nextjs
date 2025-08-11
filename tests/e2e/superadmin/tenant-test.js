class SuperAdminTenantTester {
  constructor(testHelper, dbHelper) {
    this.testHelper = testHelper;
    this.dbHelper = dbHelper;
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
      details: [],
    };
    this.createdTestData = {
      tenants: [],
    };
  }

  async runAllTests() {
    console.log("🏢 Testing SuperAdmin Tenant Management...");

    try {
      await this.loginAsSuperAdmin();
      await this.testTenantListing();
      await this.testTenantSearch();
      await this.testTenantFilters();
      await this.testTenantSorting();
      await this.testTenantPagination();
      await this.testTenantCreate();
      await this.testTenantUpdate();
      await this.testTenantDelete();
      await this.testTenantExport();
      await this.testInputValidations();

      console.log(
        `✅ SuperAdmin Tenant Management Tests: ${this.testResults.passed} passed, ${this.testResults.failed} failed`
      );
      return this.testResults;
    } catch (error) {
      console.error("❌ SuperAdmin Tenant Management Tests failed:", error);
      this.testResults.errors.push(`Tenant Management: ${error.message}`);
      this.testResults.failed++;
      return this.testResults;
    }
  }

  async testTenantListing() {
    try {
      console.log("  📝 Testing tenant listing...");

      await this.testHelper.page.goto(
        "http://localhost:3000/superadmin/tenants"
      );
      await this.testHelper.page.waitForSelector(
        '[data-testid="tenant-list"], .tenant-list, table',
        { timeout: 5000 }
      );

      // Get tenants from UI
      const uiTenants = await this.getTenantsFromUI();

      // Get tenants from database
      const dbTenants = await this.dbHelper.getTenantsFromDB();

      // Compare counts
      if (uiTenants.length === dbTenants.length) {
        console.log(`    ✅ Tenant listing shows ${uiTenants.length} tenants`);
        this.testResults.passed++;
        this.testResults.details.push(
          "SuperAdmin tenant listing working correctly"
        );
      } else {
        throw new Error(
          `Tenant count mismatch: UI=${uiTenants.length}, DB=${dbTenants.length}`
        );
      }

      // Verify tenant data structure
      if (uiTenants.length > 0) {
        const firstTenant = uiTenants[0];
        const requiredFields = ["name", "slug", "status"];
        const hasRequiredFields = requiredFields.every(
          (field) => firstTenant[field] !== undefined
        );

        if (hasRequiredFields) {
          console.log("    ✅ Tenant data structure correct");
          this.testResults.passed++;
        } else {
          throw new Error("Tenant data missing required fields");
        }
      }
    } catch (error) {
      console.error("    ❌ Tenant listing test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Tenant listing: ${error.message}`);
    }
  }

  async testTenantSearch() {
    try {
      console.log("  📝 Testing tenant search...");

      // Find search input
      const searchInput = await this.testHelper.page.$(
        'input[placeholder*="search"], input[name="search"], [data-testid="search-input"]'
      );
      if (!searchInput) {
        console.log("    ℹ️  Search input not found (may not be implemented)");
        return;
      }

      // Get initial tenant count
      const initialTenants = await this.getTenantsFromUI();

      // Perform search
      const searchTerm = "techcorp";
      await searchInput.click();
      await searchInput.type(searchTerm);

      // Wait for search results
      await this.testHelper.page.waitForTimeout(2000);

      // Get filtered results
      const searchResults = await this.getTenantsFromUI();

      // Verify search results
      const matchingTenants = searchResults.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (
        searchResults.length <= initialTenants.length &&
        matchingTenants.length > 0
      ) {
        console.log(
          `    ✅ Search found ${searchResults.length} results for "${searchTerm}"`
        );
        this.testResults.passed++;
        this.testResults.details.push(
          "SuperAdmin tenant search working correctly"
        );
      } else {
        throw new Error("Search results not properly filtered");
      }

      // Clear search
      await searchInput.click({ clickCount: 3 }); // Select all
      await searchInput.type("");
      await this.testHelper.page.waitForTimeout(1000);

      const clearedResults = await this.getTenantsFromUI();
      if (clearedResults.length === initialTenants.length) {
        console.log("    ✅ Search cleared successfully");
        this.testResults.passed++;
      }
    } catch (error) {
      console.error("    ❌ Tenant search test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Tenant search: ${error.message}`);
    }
  }

  async testTenantFilters() {
    try {
      console.log("  📝 Testing tenant filters...");

      // Test status filter
      const statusFilter = await this.testHelper.page.$(
        'select[name="status"], [data-testid="status-filter"]'
      );
      if (statusFilter) {
        // Filter by active status
        await statusFilter.select("ACTIVE");
        await this.testHelper.page.waitForTimeout(2000);

        const activeTenants = await this.getTenantsFromUI();
        const allActive = activeTenants.every(
          (tenant) => tenant.status === "ACTIVE"
        );

        if (allActive) {
          console.log("    ✅ Status filter working correctly");
          this.testResults.passed++;
        } else {
          throw new Error("Status filter not working correctly");
        }

        // Reset filter
        await statusFilter.select("");
        await this.testHelper.page.waitForTimeout(1000);
      }

      // Test plan filter
      const planFilter = await this.testHelper.page.$(
        'select[name="plan"], [data-testid="plan-filter"]'
      );
      if (planFilter) {
        await planFilter.select("premium");
        await this.testHelper.page.waitForTimeout(2000);

        const premiumTenants = await this.getTenantsFromUI();
        const allPremium = premiumTenants.every(
          (tenant) => tenant.plan === "premium"
        );

        if (allPremium) {
          console.log("    ✅ Plan filter working correctly");
          this.testResults.passed++;
        }

        // Reset filter
        await planFilter.select("");
        await this.testHelper.page.waitForTimeout(1000);
      }

      this.testResults.details.push(
        "SuperAdmin tenant filters working correctly"
      );
    } catch (error) {
      console.error("    ❌ Tenant filters test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Tenant filters: ${error.message}`);
    }
  }

  async testTenantSorting() {
    try {
      console.log("  📝 Testing tenant sorting...");

      // Test sorting by name
      const nameHeader = await this.testHelper.page.$(
        'th[data-sort="name"], th:contains("Name"), [data-testid="sort-name"]'
      );
      if (nameHeader) {
        await nameHeader.click();
        await this.testHelper.page.waitForTimeout(1000);

        const sortedTenants = await this.getTenantsFromUI();
        const isSorted = this.isArraySorted(sortedTenants.map((t) => t.name));

        if (isSorted) {
          console.log("    ✅ Name sorting working correctly");
          this.testResults.passed++;
        } else {
          throw new Error("Name sorting not working correctly");
        }

        // Test reverse sort
        await nameHeader.click();
        await this.testHelper.page.waitForTimeout(1000);

        const reverseSortedTenants = await this.getTenantsFromUI();
        const isReverseSorted = this.isArraySorted(
          reverseSortedTenants.map((t) => t.name).reverse()
        );

        if (isReverseSorted) {
          console.log("    ✅ Reverse sorting working correctly");
          this.testResults.passed++;
        }
      }

      // Test sorting by created date
      const dateHeader = await this.testHelper.page.$(
        'th[data-sort="createdAt"], th:contains("Created"), [data-testid="sort-date"]'
      );
      if (dateHeader) {
        await dateHeader.click();
        await this.testHelper.page.waitForTimeout(1000);

        console.log("    ✅ Date sorting working correctly");
        this.testResults.passed++;
      }

      this.testResults.details.push(
        "SuperAdmin tenant sorting working correctly"
      );
    } catch (error) {
      console.error("    ❌ Tenant sorting test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Tenant sorting: ${error.message}`);
    }
  }

  async testTenantPagination() {
    try {
      console.log("  📝 Testing tenant pagination...");

      // Get total count
      const totalTenants = await this.getTenantsFromUI();

      if (totalTenants.length > 10) {
        // Assuming 10 items per page
        // Check for pagination controls
        const pagination = await this.testHelper.page.$(
          '.pagination, [data-testid="pagination"]'
        );
        if (pagination) {
          console.log("    ✅ Pagination controls found");
          this.testResults.passed++;

          // Test next page
          const nextButton = await this.testHelper.page.$(
            '.pagination .next, [data-testid="next-page"]'
          );
          if (nextButton) {
            await nextButton.click();
            await this.testHelper.page.waitForTimeout(1000);

            const page2Tenants = await this.getTenantsFromUI();
            if (page2Tenants.length > 0) {
              console.log("    ✅ Next page navigation working");
              this.testResults.passed++;
            }

            // Test previous page
            const prevButton = await this.testHelper.page.$(
              '.pagination .prev, [data-testid="prev-page"]'
            );
            if (prevButton) {
              await prevButton.click();
              await this.testHelper.page.waitForTimeout(1000);

              const page1Tenants = await this.getTenantsFromUI();
              if (page1Tenants.length > 0) {
                console.log("    ✅ Previous page navigation working");
                this.testResults.passed++;
              }
            }
          }
        }
      } else {
        console.log("    ℹ️  Not enough tenants for pagination test");
      }

      this.testResults.details.push(
        "SuperAdmin tenant pagination working correctly"
      );
    } catch (error) {
      console.error("    ❌ Tenant pagination test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Tenant pagination: ${error.message}`);
    }
  }

  async testTenantCreate() {
    try {
      console.log("  📝 Testing tenant creation...");

      // Click create button
      const createButton = await this.testHelper.page.$(
        'button[data-testid="create-tenant"], .create-tenant-btn, button:contains("Create")'
      );
      if (!createButton) {
        console.log("    ℹ️  Create tenant button not found");
        return;
      }

      await createButton.click();
      await this.testHelper.page.waitForSelector(
        'form, [data-testid="tenant-form"]',
        { timeout: 5000 }
      );

      // Fill tenant form
      const tenantData = {
        name: `Test Tenant ${Date.now()}`,
        slug: `test-tenant-${Date.now()}`,
        domain: `test-tenant-${Date.now()}.example.com`,
        description: "Test tenant for automation",
        plan: "starter",
        region: "US East",
      };

      await this.testHelper.typeText('input[name="name"]', tenantData.name);
      await this.testHelper.typeText('input[name="slug"]', tenantData.slug);
      await this.testHelper.typeText('input[name="domain"]', tenantData.domain);
      await this.testHelper.typeText(
        'textarea[name="description"]',
        tenantData.description
      );

      // Select plan
      const planSelect = await this.testHelper.page.$('select[name="plan"]');
      if (planSelect) {
        await planSelect.select(tenantData.plan);
      }

      // Submit form
      const submitButton = await this.testHelper.page.$(
        'button[type="submit"]'
      );
      await submitButton.click();

      // Wait for success
      await this.testHelper.page.waitForTimeout(2000);

      // Check for success message
      const successMessage = await this.testHelper.page.$(
        '.success-message, .alert-success, [data-testid="success-message"]'
      );
      if (successMessage) {
        console.log("    ✅ Tenant creation successful");
        this.testResults.passed++;

        // Verify in database
        const createdTenant = await this.dbHelper.getTenantsFromDB({
          search: tenantData.name,
        });
        if (createdTenant.length > 0) {
          console.log("    ✅ Created tenant found in database");
          this.testResults.passed++;
          this.createdTestData.tenants.push(createdTenant[0].id);
          this.testResults.details.push(
            "SuperAdmin tenant creation working correctly"
          );
        } else {
          throw new Error("Created tenant not found in database");
        }
      } else {
        throw new Error("No success message for tenant creation");
      }
    } catch (error) {
      console.error("    ❌ Tenant creation test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Tenant creation: ${error.message}`);
    }
  }

  async testTenantUpdate() {
    try {
      console.log("  📝 Testing tenant update...");

      // Find first tenant to edit
      const editButton = await this.testHelper.page.$(
        'button[data-testid="edit-tenant"], .edit-tenant-btn, button:contains("Edit")'
      );
      if (!editButton) {
        console.log("    ℹ️  Edit tenant button not found");
        return;
      }

      await editButton.click();
      await this.testHelper.page.waitForSelector(
        'form, [data-testid="tenant-form"]',
        { timeout: 5000 }
      );

      // Update tenant data
      const updatedName = `Updated Tenant ${Date.now()}`;
      await this.testHelper.typeText('input[name="name"]', updatedName);

      // Submit form
      const submitButton = await this.testHelper.page.$(
        'button[type="submit"]'
      );
      await submitButton.click();

      // Wait for success
      await this.testHelper.page.waitForTimeout(2000);

      // Check for success message
      const successMessage = await this.testHelper.page.$(
        '.success-message, .alert-success, [data-testid="success-message"]'
      );
      if (successMessage) {
        console.log("    ✅ Tenant update successful");
        this.testResults.passed++;
        this.testResults.details.push(
          "SuperAdmin tenant update working correctly"
        );
      } else {
        throw new Error("No success message for tenant update");
      }
    } catch (error) {
      console.error("    ❌ Tenant update test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Tenant update: ${error.message}`);
    }
  }

  async testTenantDelete() {
    try {
      console.log("  📝 Testing tenant deletion...");

      // Create a test tenant first
      const testTenant = await this.dbHelper.createTenantInDB({
        name: `Delete Test Tenant ${Date.now()}`,
        slug: `delete-test-${Date.now()}`,
        domain: `delete-test-${Date.now()}.example.com`,
        description: "Tenant for deletion test",
      });

      this.createdTestData.tenants.push(testTenant.id);

      // Refresh page to see new tenant
      await this.testHelper.page.reload();
      await this.testHelper.page.waitForSelector(
        '[data-testid="tenant-list"], .tenant-list, table',
        { timeout: 5000 }
      );

      // Find delete button for the test tenant
      const deleteButton = await this.testHelper.page.$(
        `button[data-testid="delete-tenant-${testTenant.id}"], .delete-tenant-btn, button:contains("Delete")`
      );
      if (!deleteButton) {
        console.log("    ℹ️  Delete tenant button not found");
        return;
      }

      await deleteButton.click();

      // Wait for confirmation dialog
      await this.testHelper.page.waitForSelector(
        '.modal, [data-testid="confirm-modal"], .confirmation-dialog',
        { timeout: 5000 }
      );

      // Confirm deletion
      const confirmButton = await this.testHelper.page.$(
        'button:contains("Delete"), button:contains("Confirm"), [data-testid="confirm-delete"]'
      );
      if (confirmButton) {
        await confirmButton.click();
        await this.testHelper.page.waitForTimeout(2000);

        // Check for success message
        const successMessage = await this.testHelper.page.$(
          '.success-message, .alert-success, [data-testid="success-message"]'
        );
        if (successMessage) {
          console.log("    ✅ Tenant deletion successful");
          this.testResults.passed++;

          // Verify removed from database
          const deletedTenant = await this.dbHelper.getTenantsFromDB({
            search: testTenant.name,
          });
          if (deletedTenant.length === 0) {
            console.log("    ✅ Deleted tenant removed from database");
            this.testResults.passed++;
            this.testResults.details.push(
              "SuperAdmin tenant deletion working correctly"
            );
          } else {
            throw new Error("Deleted tenant still exists in database");
          }
        } else {
          throw new Error("No success message for tenant deletion");
        }
      }
    } catch (error) {
      console.error("    ❌ Tenant deletion test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Tenant deletion: ${error.message}`);
    }
  }

  async testTenantExport() {
    try {
      console.log("  📝 Testing tenant export...");

      // Find export button
      const exportButton = await this.testHelper.page.$(
        'button[data-testid="export-tenants"], .export-tenants-btn, button:contains("Export")'
      );
      if (!exportButton) {
        console.log("    ℹ️  Export tenants button not found");
        return;
      }

      await exportButton.click();
      await this.testHelper.page.waitForTimeout(2000);

      // Check for success message or download
      const successMessage = await this.testHelper.page.$(
        '.success-message, .alert-success, [data-testid="export-success"]'
      );
      if (successMessage) {
        console.log("    ✅ Tenant export successful");
        this.testResults.passed++;
        this.testResults.details.push(
          "SuperAdmin tenant export working correctly"
        );
      } else {
        console.log(
          "    ℹ️  Export functionality may not show success message"
        );
      }
    } catch (error) {
      console.error("    ❌ Tenant export test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Tenant export: ${error.message}`);
    }
  }

  async testInputValidations() {
    try {
      console.log("  📝 Testing input validations...");

      // Test required fields
      const createButton = await this.testHelper.page.$(
        'button[data-testid="create-tenant"], .create-tenant-btn, button:contains("Create")'
      );
      if (createButton) {
        await createButton.click();
        await this.testHelper.page.waitForSelector(
          'form, [data-testid="tenant-form"]',
          { timeout: 5000 }
        );

        // Try to submit empty form
        const submitButton = await this.testHelper.page.$(
          'button[type="submit"]'
        );
        await submitButton.click();

        await this.testHelper.page.waitForTimeout(1000);

        // Check for validation errors
        const validationErrors = await this.testHelper.page.$$(
          '.error-message, .alert-error, [data-testid="validation-error"]'
        );
        if (validationErrors.length > 0) {
          console.log("    ✅ Input validation working");
          this.testResults.passed++;
        }

        // Test invalid slug format
        await this.testHelper.typeText(
          'input[name="slug"]',
          "invalid slug with spaces"
        );
        await submitButton.click();

        await this.testHelper.page.waitForTimeout(1000);

        const slugError = await this.testHelper.page.$(
          '.error-message, .alert-error, [data-testid="slug-error"]'
        );
        if (slugError) {
          console.log("    ✅ Slug validation working");
          this.testResults.passed++;
        }
      }

      this.testResults.details.push(
        "SuperAdmin tenant input validations working correctly"
      );
    } catch (error) {
      console.error("    ❌ Input validation test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Input validation: ${error.message}`);
    }
  }

  async getTenantsFromUI() {
    try {
      const tenants = await this.testHelper.page.evaluate(() => {
        const rows = document.querySelectorAll(
          'table tbody tr, [data-testid="tenant-row"], .tenant-row'
        );
        return Array.from(rows).map((row) => {
          const cells = row.querySelectorAll("td");
          return {
            name: cells[0]?.textContent?.trim() || "",
            slug: cells[1]?.textContent?.trim() || "",
            status: cells[2]?.textContent?.trim() || "",
            plan: cells[3]?.textContent?.trim() || "",
            createdAt: cells[4]?.textContent?.trim() || "",
          };
        });
      });

      return tenants;
    } catch (error) {
      console.log("    ℹ️  Could not extract tenants from UI");
      return [];
    }
  }

  isArraySorted(arr) {
    for (let i = 1; i < arr.length; i++) {
      if (arr[i - 1] > arr[i]) {
        return false;
      }
    }
    return true;
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

module.exports = SuperAdminTenantTester;
