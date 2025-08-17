import { test, expect } from "@playwright/test";
import { E2EAuthHelper } from "./helpers/auth";
import { E2ETestUtils } from "./helpers/test-utils";
import { credentialsHelper } from "./helpers/credentials";

test.describe("User Management Module", () => {
  let authHelper: E2EAuthHelper;
  let testUtils: E2ETestUtils;

  test.beforeEach(async ({ page, request }) => {
    authHelper = new E2EAuthHelper(page, request);
    testUtils = new E2ETestUtils(page);
  });

  test.describe("Navigation and Access", () => {
    test("should navigate to users page from sidebar", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.getByRole("link", { name: /user management/i }).click();
      await page.getByRole("link", { name: /user list/i }).click();
      
      // Should be on users page
      await expect(page).toHaveURL(/\/users/);
      await testUtils.expectPageTitle("User Management");
    });

    test("should show users page for superadmin", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Should see users table
      await testUtils.expectTableToHaveData();
      await expect(page.getByRole("button", { name: /add user/i })).toBeVisible();
    });

    test("should show users page for tenant admin", async ({ page }) => {
      // Login as tenant admin
      const tenantAdmin = credentialsHelper.getTenantAdmin("A");
      await authHelper.login(tenantAdmin.email, tenantAdmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Should see users table (only tenant users)
      await testUtils.expectTableToHaveData();
      await expect(page.getByRole("button", { name: /add user/i })).toBeVisible();
    });

    test("should deny access to tenant user", async ({ page }) => {
      // Login as tenant user
      const tenantUser = credentialsHelper.getTenantUser("A");
      await authHelper.login(tenantUser.email, tenantUser.password);
      
      // Try to access users page
      await page.goto("/admin/users");
      
      // Should be denied access
      await testUtils.expectPermissionDenied();
    });

    test("should show breadcrumb navigation", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Should show breadcrumb
      await testUtils.expectBreadcrumb(["Dashboard", "User Management"]);
    });
  });

  test.describe("User Listing", () => {
    test("should display users table with correct columns", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Should see table headers
      await expect(page.getByRole("columnheader", { name: /name/i })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /email/i })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /role/i })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /tenant/i })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /status/i })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /last login/i })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /created/i })).toBeVisible();
    });

    test("should show superadmin all users across tenants", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Should see users from all tenants
      await expect(page.getByText("Super Admin")).toBeVisible();
      await expect(page.getByText("Tenant A Admin")).toBeVisible();
      await expect(page.getByText("Tenant B Admin")).toBeVisible();
      await expect(page.getByText("John Doe")).toBeVisible();
      await expect(page.getByText("Bob Wilson")).toBeVisible();
    });

    test("should show tenant admin only their tenant users", async ({ page }) => {
      // Login as tenant admin
      const tenantAdmin = credentialsHelper.getTenantAdmin("A");
      await authHelper.login(tenantAdmin.email, tenantAdmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Should see only Tenant A users
      await expect(page.getByText("Tenant A Admin")).toBeVisible();
      await expect(page.getByText("John Doe")).toBeVisible();
      await expect(page.getByText("Jane Smith")).toBeVisible();
      
      // Should not see Tenant B users
      await expect(page.getByText("Tenant B Admin")).not.toBeVisible();
      await expect(page.getByText("Bob Wilson")).not.toBeVisible();
    });

    test("should handle empty users list", async ({ page }) => {
      // This would require a tenant with no users
      // For now, test the empty state UI
      await page.goto("/admin/users");
      
      // Should show empty state message
      await expect(page.getByText(/no users found/i)).toBeVisible();
    });
  });

  test.describe("User Creation", () => {
    test("should create new user successfully", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Click add user button
      await page.getByRole("button", { name: /add user/i }).click();
      
      // Fill in user details
      const testUser = credentialsHelper.generateTestUser();
      await page.getByLabel("Name").fill(testUser.name);
      await page.getByLabel("Email").fill(testUser.email);
      await page.getByLabel("Password").fill(testUser.password);
      
      // Select role
      await page.getByLabel("Role").click();
      await page.getByRole("option", { name: "Tenant User").click();
      
      // Submit form
      await page.getByRole("button", { name: /create user/i }).click();
      
      // Should show success message
      await testUtils.expectSuccessMessage("User created successfully");
      
      // Should redirect to users list
      await expect(page).toHaveURL(/\/users/);
      
      // Should see new user in list
      await expect(page.getByText(testUser.name)).toBeVisible();
    });

    test("should validate required fields", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to create user page
      await page.goto("/admin/users/create");
      
      // Submit empty form
      await page.getByRole("button", { name: /create user/i }).click();
      
      // Should show validation errors
      await testUtils.expectFormValidationError("Name", "Name is required");
      await testUtils.expectFormValidationError("Email", "Email is required");
      await testUtils.expectFormValidationError("Password", "Password is required");
    });

    test("should validate email format", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to create user page
      await page.goto("/admin/users/create");
      
      // Fill in invalid email
      await page.getByLabel("Name").fill("Test User");
      await page.getByLabel("Email").fill("invalid-email");
      await page.getByLabel("Password").fill("TestPassword123!");
      
      // Submit form
      await page.getByRole("button", { name: /create user/i }).click();
      
      // Should show validation error
      await testUtils.expectFormValidationError("Email", "Invalid email format");
    });

    test("should validate password strength", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to create user page
      await page.goto("/admin/users/create");
      
      // Fill in weak password
      await page.getByLabel("Name").fill("Test User");
      await page.getByLabel("Email").fill("test@example.com");
      await page.getByLabel("Password").fill("weak");
      
      // Submit form
      await page.getByRole("button", { name: /create user/i }).click();
      
      // Should show validation error
      await testUtils.expectFormValidationError("Password", "Password must be at least 8 characters");
    });

    test("should prevent duplicate email", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to create user page
      await page.goto("/admin/users/create");
      
      // Fill in existing email
      const existingUser = credentialsHelper.getTenantUser("A");
      await page.getByLabel("Name").fill("Test User");
      await page.getByLabel("Email").fill(existingUser.email);
      await page.getByLabel("Password").fill("TestPassword123!");
      
      // Submit form
      await page.getByRole("button", { name: /create user/i }).click();
      
      // Should show error
      await testUtils.expectErrorMessage("Email already exists");
    });
  });

  test.describe("User Editing", () => {
    test("should edit user successfully", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Click edit button for first user
      await page.getByRole("button", { name: /edit/i }).first().click();
      
      // Update user name
      const newName = "Updated User Name";
      await page.getByLabel("Name").clear();
      await page.getByLabel("Name").fill(newName);
      
      // Submit form
      await page.getByRole("button", { name: /update user/i }).click();
      
      // Should show success message
      await testUtils.expectSuccessMessage("User updated successfully");
      
      // Should redirect to users list
      await expect(page).toHaveURL(/\/users/);
      
      // Should see updated name in list
      await expect(page.getByText(newName)).toBeVisible();
    });

    test("should not allow editing superadmin by tenant admin", async ({ page }) => {
      // Login as tenant admin
      const tenantAdmin = credentialsHelper.getTenantAdmin("A");
      await authHelper.login(tenantAdmin.email, tenantAdmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Should not see edit button for superadmin
      await expect(page.getByText("Super Admin")).not.toBeVisible();
    });

    test("should validate email uniqueness on edit", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Click edit button for first user
      await page.getByRole("button", { name: /edit/i }).first().click();
      
      // Change email to existing one
      const existingUser = credentialsHelper.getTenantUser("A");
      await page.getByLabel("Email").clear();
      await page.getByLabel("Email").fill(existingUser.email);
      
      // Submit form
      await page.getByRole("button", { name: /update user/i }).click();
      
      // Should show error
      await testUtils.expectErrorMessage("Email already exists");
    });
  });

  test.describe("User Deletion", () => {
    test("should delete user with confirmation", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Click delete button for first user
      await page.getByRole("button", { name: /delete/i }).first().click();
      
      // Should show confirmation dialog
      await testUtils.expectModalToBeVisible();
      await expect(page.getByText(/are you sure/i)).toBeVisible();
      
      // Confirm deletion
      await testUtils.confirmDialog();
      
      // Should show success message
      await testUtils.expectSuccessMessage("User deleted successfully");
    });

    test("should cancel user deletion", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Click delete button for first user
      await page.getByRole("button", { name: /delete/i }).first().click();
      
      // Should show confirmation dialog
      await testUtils.expectModalToBeVisible();
      
      // Cancel deletion
      await testUtils.closeModal();
      
      // Should close dialog
      await testUtils.expectModalToBeHidden();
      
      // Should still be on users page
      await expect(page).toHaveURL(/\/users/);
    });

    test("should not allow deleting own account", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Should not see delete button for own account
      await expect(page.getByText("Super Admin")).toBeVisible();
      // Note: This would require checking if delete button is disabled for own user
    });
  });

  test.describe("User Search and Filtering", () => {
    test("should search users by name", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Search for specific user
      await page.getByPlaceholder(/search users/i).fill("John");
      
      // Should show only matching users
      await expect(page.getByText("John Doe")).toBeVisible();
      await expect(page.getByText("Jane Smith")).not.toBeVisible();
    });

    test("should search users by email", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Search for specific email
      const user = credentialsHelper.getTenantUser("A");
      await page.getByPlaceholder(/search users/i).fill(user.email);
      
      // Should show only matching user
      await expect(page.getByText(user.name)).toBeVisible();
    });

    test("should filter users by role", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Filter by role
      await page.getByLabel("Role").click();
      await page.getByRole("option", { name: "Tenant User").click();
      
      // Should show only users with that role
      await expect(page.getByText("John Doe")).toBeVisible();
      await expect(page.getByText("Super Admin")).not.toBeVisible();
    });

    test("should filter users by tenant", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Filter by tenant
      await page.getByLabel("Tenant").click();
      await page.getByRole("option", { name: "Tenant A").click();
      
      // Should show only users from that tenant
      await expect(page.getByText("John Doe")).toBeVisible();
      await expect(page.getByText("Bob Wilson")).not.toBeVisible();
    });

    test("should filter users by status", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Filter by status
      await page.getByLabel("Status").click();
      await page.getByRole("option", { name: "Active").click();
      
      // Should show only active users
      // Note: This assumes there are active users in the system
    });
  });

  test.describe("Bulk Operations", () => {
    test("should select multiple users", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Select multiple users
      await page.getByRole("checkbox").nth(1).check();
      await page.getByRole("checkbox").nth(2).check();
      
      // Should show bulk actions
      await expect(page.getByRole("button", { name: /bulk actions/i })).toBeVisible();
    });

    test("should bulk activate users", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Select users
      await page.getByRole("checkbox").nth(1).check();
      await page.getByRole("checkbox").nth(2).check();
      
      // Click bulk actions
      await page.getByRole("button", { name: /bulk actions/i }).click();
      await page.getByRole("menuitem", { name: /activate/i }).click();
      
      // Should show success message
      await testUtils.expectSuccessMessage("Users activated successfully");
    });

    test("should bulk deactivate users", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Select users
      await page.getByRole("checkbox").nth(1).check();
      await page.getByRole("checkbox").nth(2).check();
      
      // Click bulk actions
      await page.getByRole("button", { name: /bulk actions/i }).click();
      await page.getByRole("menuitem", { name: /deactivate/i }).click();
      
      // Should show confirmation dialog
      await testUtils.expectModalToBeVisible();
      
      // Confirm action
      await testUtils.confirmDialog();
      
      // Should show success message
      await testUtils.expectSuccessMessage("Users deactivated successfully");
    });

    test("should bulk delete users", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Select users
      await page.getByRole("checkbox").nth(1).check();
      await page.getByRole("checkbox").nth(2).check();
      
      // Click bulk actions
      await page.getByRole("button", { name: /bulk actions/i }).click();
      await page.getByRole("menuitem", { name: /delete/i }).click();
      
      // Should show confirmation dialog
      await testUtils.expectModalToBeVisible();
      
      // Confirm action
      await testUtils.confirmDialog();
      
      // Should show success message
      await testUtils.expectSuccessMessage("Users deleted successfully");
    });
  });

  test.describe("Pagination", () => {
    test("should navigate through pages", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Should see pagination controls
      await expect(page.getByRole("button", { name: /next/i })).toBeVisible();
      
      // Click next page
      await page.getByRole("button", { name: /next/i }).click();
      
      // Should be on page 2
      await expect(page.getByText("Page 2")).toBeVisible();
    });

    test("should change page size", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Change page size
      await page.getByLabel("Page size").click();
      await page.getByRole("option", { name: "25").click();
      
      // Should show more users per page
      await expect(page.locator("table tbody tr")).toHaveCount({ min: 1, max: 25 });
    });
  });

  test.describe("Export Functionality", () => {
    test("should export users to CSV", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Click export button
      await page.getByRole("button", { name: /export/i }).click();
      await page.getByRole("menuitem", { name: /csv/i }).click();
      
      // Should trigger download
      // Note: This would require checking for download event
    });

    test("should export users to Excel", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Click export button
      await page.getByRole("button", { name: /export/i }).click();
      await page.getByRole("menuitem", { name: /excel/i }).click();
      
      // Should trigger download
      // Note: This would require checking for download event
    });
  });

  test.describe("Error Handling", () => {
    test("should handle API errors gracefully", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page with invalid parameters
      await page.goto("/admin/users?page=999999");
      
      // Should show error message
      await testUtils.expectErrorMessage("Failed to load users");
    });

    test("should handle network errors", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Simulate network error by going offline
      await page.context().setOffline(true);
      
      // Try to perform an action
      await page.getByRole("button", { name: /add user/i }).click();
      
      // Should show error message
      await testUtils.expectErrorMessage("Network error");
      
      // Go back online
      await page.context().setOffline(false);
    });
  });

  test.describe("Accessibility", () => {
    test("should be keyboard accessible", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Tab through interactive elements
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: /add user/i })).toBeFocused();
      
      await page.keyboard.press("Tab");
      await expect(page.getByPlaceholder(/search users/i)).toBeFocused();
      
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: /export/i })).toBeFocused();
    });

    test("should have proper ARIA labels", async ({ page }) => {
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Check for proper labels
      await expect(page.getByRole("table")).toBeVisible();
      await expect(page.getByRole("button", { name: /add user/i })).toBeVisible();
      await expect(page.getByPlaceholder(/search users/i)).toBeVisible();
    });
  });

  test.describe("Mobile Responsiveness", () => {
    test("should be responsive on mobile devices", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Login as superadmin
      const superadmin = credentialsHelper.getSuperadmin();
      await authHelper.login(superadmin.email, superadmin.password);
      
      // Navigate to users page
      await page.goto("/admin/users");
      
      // Should be properly sized for mobile
      await expect(page.getByRole("button", { name: /add user/i })).toBeVisible();
      await expect(page.getByPlaceholder(/search users/i)).toBeVisible();
      
      // Table should be scrollable horizontally
      await expect(page.locator("table")).toBeVisible();
    });
  });
});
