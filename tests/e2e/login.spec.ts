import { test, expect } from "@playwright/test";
import { E2EAuthHelper } from "./helpers/auth";
import { E2ETestUtils } from "./helpers/test-utils";

test.describe("Login Page", () => {
  let authHelper: E2EAuthHelper;
  let testUtils: E2ETestUtils;

  test.beforeEach(async ({ page, request }) => {
    authHelper = new E2EAuthHelper(page, request);
    testUtils = new E2ETestUtils(page);
  });

  test.describe("Successful Login Scenarios", () => {
    test("should successfully login with valid credentials", async ({
      page,
    }) => {
      await page.goto("/login");

      // Fill in valid credentials
      await page.getByLabel("Email").fill("admin@example.com");
      await page.getByLabel("Password").fill("AdminPassword123!");

      // Submit form
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should redirect to dashboard
      await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });

      // Verify we're logged in
      await authHelper.expectToBeLoggedIn();
    });

    test("should successfully login with tenant slug", async ({ page }) => {
      await page.goto("/login");

      // Fill in credentials with tenant slug
      await page.getByLabel("Email").fill("admin@example.com");
      await page.getByLabel("Password").fill("AdminPassword123!");
      await page.getByLabel("Tenant (Optional)").fill("test-tenant");

      // Submit form
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should redirect to dashboard
      await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });

      // Verify we're logged in
      await authHelper.expectToBeLoggedIn();
    });

    test("should successfully login with remember me checked", async ({
      page,
    }) => {
      await page.goto("/login");

      // Fill in credentials
      await page.getByLabel("Email").fill("admin@example.com");
      await page.getByLabel("Password").fill("AdminPassword123!");

      // Check remember me
      await page.getByLabel("Keep me logged in").check();

      // Submit form
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should redirect to dashboard
      await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });

      // Verify we're logged in
      await authHelper.expectToBeLoggedIn();

      // Verify remember me is persisted (check localStorage)
      const rememberMe = await page.evaluate(() => {
        return localStorage.getItem("rememberMe") === "true";
      });
      expect(rememberMe).toBe(true);
    });

    test("should successfully login as superadmin", async ({ page }) => {
      await page.goto("/login");

      // Fill in superadmin credentials
      await page.getByLabel("Email").fill("superadmin@example.com");
      await page.getByLabel("Password").fill("SuperAdminPassword123!");

      // Submit form
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should redirect to global dashboard
      await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });

      // Verify we're logged in as superadmin
      await authHelper.expectToBeLoggedIn();

      // Verify superadmin indicators are visible
      await expect(page.getByText(/superadmin|global/i)).toBeVisible();
    });
  });

  test.describe("Form Validation Errors", () => {
    test("should show error for invalid email format", async ({ page }) => {
      await page.goto("/login");

      // Fill in invalid email
      await page.getByLabel("Email").fill("invalid-email");
      await page.getByLabel("Password").fill("TestPassword123!");

      // Submit form
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should show validation error
      await testUtils.expectFormValidationError(
        "Email",
        "Invalid email format"
      );
    });

    test("should show error for empty email", async ({ page }) => {
      await page.goto("/login");

      // Leave email empty
      await page.getByLabel("Password").fill("TestPassword123!");

      // Submit form
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should show validation error
      await testUtils.expectFormValidationError("Email", "Email is required");
    });

    test("should show error for empty password", async ({ page }) => {
      await page.goto("/login");

      // Fill in email but leave password empty
      await page.getByLabel("Email").fill("test@example.com");

      // Submit form
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should show validation error
      await testUtils.expectFormValidationError(
        "Password",
        "Password is required"
      );
    });

    test("should show error for very long email", async ({ page }) => {
      await page.goto("/login");

      const longEmail = "a".repeat(100) + "@example.com";
      await page.getByLabel("Email").fill(longEmail);
      await page.getByLabel("Password").fill("TestPassword123!");

      // Submit form
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should show validation error
      await testUtils.expectFormValidationError("Email", "Email too long");
    });

    test("should show error for very long password", async ({ page }) => {
      await page.goto("/login");

      const longPassword = "a".repeat(1000);
      await page.getByLabel("Email").fill("test@example.com");
      await page.getByLabel("Password").fill(longPassword);

      // Submit form
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should show validation error
      await testUtils.expectFormValidationError(
        "Password",
        "Password too long"
      );
    });

    test("should show error for SQL injection attempts", async ({ page }) => {
      await page.goto("/login");

      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
      ];

      for (const attempt of sqlInjectionAttempts) {
        await page.getByLabel("Email").fill(attempt);
        await page.getByLabel("Password").fill(attempt);

        // Submit form
        await page.getByRole("button", { name: "Sign in" }).click();

        // Should show validation error or generic error
        await expect(page.getByText(/invalid|error/i)).toBeVisible();

        // Clear form for next attempt
        await page.reload();
      }
    });
  });

  test.describe("Authentication Errors", () => {
    test("should show error for non-existent user", async ({ page }) => {
      await page.goto("/login");

      // Fill in non-existent user credentials
      await page.getByLabel("Email").fill("nonexistent@example.com");
      await page.getByLabel("Password").fill("TestPassword123!");

      // Submit form
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should show authentication error
      await testUtils.expectErrorMessage("Invalid credentials");

      // Should stay on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test("should show error for wrong password", async ({ page }) => {
      await page.goto("/login");

      // Fill in correct email but wrong password
      await page.getByLabel("Email").fill("admin@example.com");
      await page.getByLabel("Password").fill("WrongPassword123!");

      // Submit form
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should show authentication error
      await testUtils.expectErrorMessage("Invalid credentials");

      // Should stay on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test("should show error for invalid tenant slug", async ({ page }) => {
      await page.goto("/login");

      // Fill in credentials with invalid tenant
      await page.getByLabel("Email").fill("admin@example.com");
      await page.getByLabel("Password").fill("AdminPassword123!");
      await page.getByLabel("Tenant (Optional)").fill("invalid-tenant");

      // Submit form
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should show tenant error
      await testUtils.expectErrorMessage("Tenant not found");

      // Should stay on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test("should show error for inactive tenant", async ({ page }) => {
      await page.goto("/login");

      // Fill in credentials for inactive tenant
      await page.getByLabel("Email").fill("admin@inactive-tenant.com");
      await page.getByLabel("Password").fill("AdminPassword123!");
      await page.getByLabel("Tenant (Optional)").fill("inactive-tenant");

      // Submit form
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should show tenant inactive error
      await testUtils.expectErrorMessage("Tenant is inactive");

      // Should stay on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test("should show error for expired password", async ({ page }) => {
      await page.goto("/login");

      // Fill in credentials for user with expired password
      await page.getByLabel("Email").fill("expired@example.com");
      await page.getByLabel("Password").fill("ExpiredPassword123!");

      // Submit form
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should show password expired error
      await testUtils.expectErrorMessage("Password expired");

      // Should stay on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test("should show error for locked account", async ({ page }) => {
      await page.goto("/login");

      // Fill in credentials for locked account
      await page.getByLabel("Email").fill("locked@example.com");
      await page.getByLabel("Password").fill("LockedPassword123!");

      // Submit form
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should show account locked error
      await testUtils.expectErrorMessage("Account locked");

      // Should stay on login page
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("UI/UX Features", () => {
    test("should toggle password visibility", async ({ page }) => {
      await page.goto("/login");

      // Fill in password
      await page.getByLabel("Password").fill("TestPassword123!");

      // Password should be hidden by default
      await expect(page.getByLabel("Password")).toHaveAttribute(
        "type",
        "password"
      );

      // Click eye icon to show password
      await page
        .locator("button[aria-label='Toggle password visibility']")
        .click();

      // Password should be visible
      await expect(page.getByLabel("Password")).toHaveAttribute("type", "text");

      // Click eye icon again to hide password
      await page
        .locator("button[aria-label='Toggle password visibility']")
        .click();

      // Password should be hidden again
      await expect(page.getByLabel("Password")).toHaveAttribute(
        "type",
        "password"
      );
    });

    test("should show loading state during login", async ({ page }) => {
      await page.goto("/login");

      // Fill in credentials
      await page.getByLabel("Email").fill("admin@example.com");
      await page.getByLabel("Password").fill("AdminPassword123!");

      // Submit form
      await page.getByRole("button", { name: "Sign in" }).click();

      // Button should show loading state
      await expect(
        page.getByRole("button", { name: "Signing in..." })
      ).toBeVisible();

      // Button should be disabled during loading
      await expect(
        page.getByRole("button", { name: "Signing in..." })
      ).toBeDisabled();
    });

    test("should clear error messages when form is modified", async ({
      page,
    }) => {
      await page.goto("/login");

      // Submit empty form to trigger error
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should show error
      await testUtils.expectFormValidationError("Email", "Email is required");

      // Start typing in email field
      await page.getByLabel("Email").fill("test");

      // Error should be cleared
      await expect(page.getByText("Email is required")).not.toBeVisible();
    });

    test("should handle keyboard navigation", async ({ page }) => {
      await page.goto("/login");

      // Tab through form fields
      await page.keyboard.press("Tab");
      await expect(page.getByLabel("Email")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.getByLabel("Password")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.getByLabel("Tenant (Optional)")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.getByLabel("Keep me logged in")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Sign in" })).toBeFocused();
    });

    test("should handle Enter key submission", async ({ page }) => {
      await page.goto("/login");

      // Fill in credentials
      await page.getByLabel("Email").fill("admin@example.com");
      await page.getByLabel("Password").fill("AdminPassword123!");

      // Press Enter to submit
      await page.keyboard.press("Enter");

      // Should redirect to dashboard
      await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });
    });
  });

  test.describe("Navigation and Links", () => {
    test("should navigate to forgot password page", async ({ page }) => {
      await page.goto("/login");

      // Click forgot password link
      await page.getByRole("link", { name: "Forgot password?" }).click();

      // Should navigate to forgot password page
      await expect(page).toHaveURL(/\/forgot-password/);
    });

    test("should navigate to signup page", async ({ page }) => {
      await page.goto("/login");

      // Click signup link
      await page.getByRole("link", { name: "Sign Up" }).click();

      // Should navigate to signup page
      await expect(page).toHaveURL(/\/signup/);
    });

    test("should navigate back to dashboard", async ({ page }) => {
      await page.goto("/login");

      // Click back to dashboard link
      await page.getByRole("link", { name: "Back to dashboard" }).click();

      // Should navigate to home/dashboard
      await expect(page).toHaveURL("/");
    });

    test("should redirect authenticated users away from login", async ({
      page,
    }) => {
      // First login
      await authHelper.login("admin@example.com", "AdminPassword123!");

      // Try to access login page
      await page.goto("/login");

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/admin|\/dashboard/);
    });
  });

  test.describe("Social Login", () => {
    test("should show Google login button", async ({ page }) => {
      await page.goto("/login");

      // Google login button should be visible
      await expect(
        page.getByRole("button", { name: "Sign in with Google" })
      ).toBeVisible();
    });

    test("should show X (Twitter) login button", async ({ page }) => {
      await page.goto("/login");

      // X login button should be visible
      await expect(
        page.getByRole("button", { name: "Sign in with X" })
      ).toBeVisible();
    });

    test("should handle Google login click", async ({ page }) => {
      await page.goto("/login");

      // Click Google login button
      await page.getByRole("button", { name: "Sign in with Google" }).click();

      // Should open Google OAuth popup or redirect
      // Note: This would require mocking OAuth in tests
    });

    test("should handle X login click", async ({ page }) => {
      await page.goto("/login");

      // Click X login button
      await page.getByRole("button", { name: "Sign in with X" }).click();

      // Should open X OAuth popup or redirect
      // Note: This would require mocking OAuth in tests
    });
  });

  test.describe("Rate Limiting", () => {
    test("should handle rate limiting", async ({ page }) => {
      await page.goto("/login");

      // Make multiple login attempts to trigger rate limiting
      for (let i = 0; i < 10; i++) {
        await page.getByLabel("Email").fill("test@example.com");
        await page.getByLabel("Password").fill("TestPassword123!");
        await page.getByRole("button", { name: "Sign in" }).click();

        // Wait a bit between attempts
        await page.waitForTimeout(100);
      }

      // Should show rate limiting error
      await testUtils.expectErrorMessage("Too many attempts");
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper ARIA labels", async ({ page }) => {
      await page.goto("/login");

      // Check for proper labels
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Password")).toBeVisible();
      await expect(page.getByLabel("Tenant (Optional)")).toBeVisible();
      await expect(page.getByLabel("Keep me logged in")).toBeVisible();
    });

    test("should have proper form structure", async ({ page }) => {
      await page.goto("/login");

      // Check for form element
      await expect(page.locator("form")).toBeVisible();

      // Check for proper heading structure
      await expect(
        page.getByRole("heading", { name: "Sign In" })
      ).toBeVisible();
    });

    test("should be keyboard accessible", async ({ page }) => {
      await page.goto("/login");

      // All interactive elements should be focusable
      await page.keyboard.press("Tab");
      await expect(page.getByLabel("Email")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.getByLabel("Password")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.getByLabel("Tenant (Optional)")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.getByLabel("Keep me logged in")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Sign in" })).toBeFocused();
    });
  });

  test.describe("Mobile Responsiveness", () => {
    test("should be responsive on mobile devices", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto("/login");

      // Form should be properly sized for mobile
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Password")).toBeVisible();

      // Buttons should be properly sized
      await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

      // Social login buttons should be stacked on mobile
      await expect(
        page.getByRole("button", { name: "Sign in with Google" })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Sign in with X" })
      ).toBeVisible();
    });
  });
});
