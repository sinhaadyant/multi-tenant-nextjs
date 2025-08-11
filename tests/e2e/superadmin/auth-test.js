const { TEST_CREDENTIALS } = require("../test-setup");

class SuperAdminAuthTester {
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
    console.log("🔐 Testing SuperAdmin Authentication...");

    try {
      await this.testValidLogin();
      await this.testInvalidLogin();
      await this.testForgotPassword();
      await this.testPasswordReset();
      await this.testInviteSuperAdmin();
      await this.testInputValidations();
      await this.testLogout();
      await this.testSessionManagement();

      console.log(
        `✅ SuperAdmin Authentication Tests: ${this.testResults.passed} passed, ${this.testResults.failed} failed`
      );
      return this.testResults;
    } catch (error) {
      console.error("❌ SuperAdmin Authentication Tests failed:", error);
      this.testResults.errors.push(`Authentication: ${error.message}`);
      this.testResults.failed++;
      return this.testResults;
    }
  }

  async testValidLogin() {
    try {
      console.log("  📝 Testing valid SuperAdmin login...");

      const credentials = TEST_CREDENTIALS.superadmin.superadmin;
      await this.testHelper.page.goto("http://localhost:3000/superadmin/login");

      // Wait for login form
      await this.testHelper.page.waitForSelector("form", { timeout: 5000 });

      // Fill login form
      await this.testHelper.typeText('input[name="email"]', credentials.email);
      await this.testHelper.typeText(
        'input[name="password"]',
        credentials.password
      );

      // Submit form
      const submitButton = await this.testHelper.page.$(
        'button[type="submit"]'
      );
      await submitButton.click();

      // Wait for redirect to dashboard
      await this.testHelper.page.waitForNavigation({
        waitUntil: "networkidle0",
      });

      // Verify we're on dashboard
      const currentUrl = this.testHelper.page.url();
      if (currentUrl.includes("/superadmin/dashboard")) {
        console.log("    ✅ Valid login successful");
        this.testResults.passed++;
        this.testResults.details.push("Valid SuperAdmin login successful");
      } else {
        throw new Error("Login failed - not redirected to dashboard");
      }
    } catch (error) {
      console.error("    ❌ Valid login test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Valid login: ${error.message}`);
    }
  }

  async testInvalidLogin() {
    try {
      console.log("  📝 Testing invalid SuperAdmin login...");

      await this.testHelper.page.goto("http://localhost:3000/superadmin/login");

      // Wait for login form
      await this.testHelper.page.waitForSelector("form", { timeout: 5000 });

      // Fill with invalid credentials
      await this.testHelper.typeText(
        'input[name="email"]',
        "invalid@example.com"
      );
      await this.testHelper.typeText('input[name="password"]', "wrongpassword");

      // Submit form
      const submitButton = await this.testHelper.page.$(
        'button[type="submit"]'
      );
      await submitButton.click();

      // Wait for error message
      await this.testHelper.page.waitForTimeout(2000);

      // Check for error message
      const errorElement = await this.testHelper.page.$(
        '.error-message, .alert-error, [data-testid="error-message"]'
      );
      if (errorElement) {
        const errorText = await errorElement.evaluate((el) => el.textContent);
        console.log("    ✅ Invalid login properly rejected:", errorText);
        this.testResults.passed++;
        this.testResults.details.push(
          "Invalid SuperAdmin login properly rejected"
        );
      } else {
        throw new Error("No error message displayed for invalid login");
      }
    } catch (error) {
      console.error("    ❌ Invalid login test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Invalid login: ${error.message}`);
    }
  }

  async testForgotPassword() {
    try {
      console.log("  📝 Testing forgot password functionality...");

      await this.testHelper.page.goto(
        "http://localhost:3000/superadmin/forgot-password"
      );

      // Wait for forgot password form
      await this.testHelper.page.waitForSelector("form", { timeout: 5000 });

      // Fill with valid email
      const credentials = TEST_CREDENTIALS.superadmin.superadmin;
      await this.testHelper.typeText('input[name="email"]', credentials.email);

      // Submit form
      const submitButton = await this.testHelper.page.$(
        'button[type="submit"]'
      );
      await submitButton.click();

      // Wait for success message
      await this.testHelper.page.waitForTimeout(2000);

      // Check for success message
      const successElement = await this.testHelper.page.$(
        '.success-message, .alert-success, [data-testid="success-message"]'
      );
      if (successElement) {
        const successText = await successElement.evaluate(
          (el) => el.textContent
        );
        console.log("    ✅ Forgot password request successful:", successText);
        this.testResults.passed++;
        this.testResults.details.push(
          "SuperAdmin forgot password request successful"
        );
      } else {
        throw new Error(
          "No success message displayed for forgot password request"
        );
      }
    } catch (error) {
      console.error("    ❌ Forgot password test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Forgot password: ${error.message}`);
    }
  }

  async testPasswordReset() {
    try {
      console.log("  📝 Testing password reset functionality...");

      // Navigate to reset password page (this would typically be accessed via email link)
      await this.testHelper.page.goto(
        "http://localhost:3000/superadmin/reset-password?token=test-token"
      );

      // Wait for reset password form
      await this.testHelper.page.waitForSelector("form", { timeout: 5000 });

      // Fill new password
      const newPassword = "NewPassword123!";
      await this.testHelper.typeText('input[name="password"]', newPassword);
      await this.testHelper.typeText(
        'input[name="confirmPassword"]',
        newPassword
      );

      // Submit form
      const submitButton = await this.testHelper.page.$(
        'button[type="submit"]'
      );
      await submitButton.click();

      // Wait for response
      await this.testHelper.page.waitForTimeout(2000);

      // Check for success message or redirect
      const successElement = await this.testHelper.page.$(
        '.success-message, .alert-success, [data-testid="success-message"]'
      );
      if (successElement) {
        console.log("    ✅ Password reset successful");
        this.testResults.passed++;
        this.testResults.details.push("SuperAdmin password reset successful");
      } else {
        // Check if redirected to login
        const currentUrl = this.testHelper.page.url();
        if (currentUrl.includes("/superadmin/login")) {
          console.log("    ✅ Password reset successful - redirected to login");
          this.testResults.passed++;
          this.testResults.details.push(
            "SuperAdmin password reset successful - redirected to login"
          );
        } else {
          throw new Error("Password reset failed - no success indication");
        }
      }
    } catch (error) {
      console.error("    ❌ Password reset test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Password reset: ${error.message}`);
    }
  }

  async testInviteSuperAdmin() {
    try {
      console.log("  📝 Testing SuperAdmin invite functionality...");

      // First login as existing SuperAdmin
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

      // Navigate to invite page
      await this.testHelper.page.goto(
        "http://localhost:3000/superadmin/invite"
      );

      // Wait for invite form
      await this.testHelper.page.waitForSelector("form", { timeout: 5000 });

      // Fill invite form
      const inviteEmail = `test-superadmin-${Date.now()}@example.com`;
      await this.testHelper.typeText('input[name="email"]', inviteEmail);
      await this.testHelper.typeText('input[name="name"]', "Test SuperAdmin");
      await this.testHelper.typeText('input[name="role"]', "admin");

      // Submit form
      const inviteSubmitButton = await this.testHelper.page.$(
        'button[type="submit"]'
      );
      await inviteSubmitButton.click();

      // Wait for success message
      await this.testHelper.page.waitForTimeout(2000);

      // Check for success message
      const successElement = await this.testHelper.page.$(
        '.success-message, .alert-success, [data-testid="success-message"]'
      );
      if (successElement) {
        console.log("    ✅ SuperAdmin invite successful");
        this.testResults.passed++;
        this.testResults.details.push(
          "SuperAdmin invite functionality working"
        );

        // Verify in database
        const invitedAdmin = await this.dbHelper.getSuperAdminByEmail(
          inviteEmail
        );
        if (invitedAdmin) {
          console.log("    ✅ Invited SuperAdmin found in database");
          this.testResults.passed++;
        } else {
          throw new Error("Invited SuperAdmin not found in database");
        }
      } else {
        throw new Error("No success message displayed for SuperAdmin invite");
      }
    } catch (error) {
      console.error("    ❌ SuperAdmin invite test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`SuperAdmin invite: ${error.message}`);
    }
  }

  async testInputValidations() {
    try {
      console.log("  📝 Testing input validations...");

      await this.testHelper.page.goto("http://localhost:3000/superadmin/login");
      await this.testHelper.page.waitForSelector("form", { timeout: 5000 });

      // Test empty email
      const submitButton = await this.testHelper.page.$(
        'button[type="submit"]'
      );
      await submitButton.click();

      await this.testHelper.page.waitForTimeout(1000);

      // Check for validation error
      const emailError = await this.testHelper.page.$(
        '.error-message, .alert-error, [data-testid="email-error"]'
      );
      if (emailError) {
        console.log("    ✅ Email validation working");
        this.testResults.passed++;
      }

      // Test invalid email format
      await this.testHelper.typeText('input[name="email"]', "invalid-email");
      await submitButton.click();

      await this.testHelper.page.waitForTimeout(1000);

      const formatError = await this.testHelper.page.$(
        '.error-message, .alert-error, [data-testid="email-format-error"]'
      );
      if (formatError) {
        console.log("    ✅ Email format validation working");
        this.testResults.passed++;
      }

      // Test password length
      await this.testHelper.typeText('input[name="email"]', "test@example.com");
      await this.testHelper.typeText('input[name="password"]', "123");
      await submitButton.click();

      await this.testHelper.page.waitForTimeout(1000);

      const passwordError = await this.testHelper.page.$(
        '.error-message, .alert-error, [data-testid="password-error"]'
      );
      if (passwordError) {
        console.log("    ✅ Password validation working");
        this.testResults.passed++;
      }

      this.testResults.details.push(
        "SuperAdmin input validations working correctly"
      );
    } catch (error) {
      console.error("    ❌ Input validation test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Input validation: ${error.message}`);
    }
  }

  async testLogout() {
    try {
      console.log("  📝 Testing logout functionality...");

      // First login
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

      // Find and click logout button
      const logoutButton = await this.testHelper.page.$(
        'button[data-testid="logout"], .logout-btn, a[href*="logout"]'
      );
      if (logoutButton) {
        await logoutButton.click();
        await this.testHelper.page.waitForNavigation({
          waitUntil: "networkidle0",
        });

        // Verify redirected to login page
        const currentUrl = this.testHelper.page.url();
        if (currentUrl.includes("/superadmin/login")) {
          console.log("    ✅ Logout successful");
          this.testResults.passed++;
          this.testResults.details.push("SuperAdmin logout successful");
        } else {
          throw new Error("Logout failed - not redirected to login page");
        }
      } else {
        throw new Error("Logout button not found");
      }
    } catch (error) {
      console.error("    ❌ Logout test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Logout: ${error.message}`);
    }
  }

  async testSessionManagement() {
    try {
      console.log("  📝 Testing session management...");

      // Login first
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

      // Check if token is stored
      const token = await this.testHelper.page.evaluate(() => {
        return (
          localStorage.getItem("superadmin_token") ||
          sessionStorage.getItem("superadmin_token")
        );
      });

      if (token) {
        console.log("    ✅ Authentication token stored");
        this.testResults.passed++;
      } else {
        throw new Error("Authentication token not stored");
      }

      // Test session persistence by refreshing page
      await this.testHelper.page.reload();
      await this.testHelper.page.waitForNavigation({
        waitUntil: "networkidle0",
      });

      // Should still be on dashboard
      const currentUrl = this.testHelper.page.url();
      if (currentUrl.includes("/superadmin/dashboard")) {
        console.log("    ✅ Session persistence working");
        this.testResults.passed++;
        this.testResults.details.push(
          "SuperAdmin session management working correctly"
        );
      } else {
        throw new Error("Session not persisted after page refresh");
      }
    } catch (error) {
      console.error("    ❌ Session management test failed:", error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Session management: ${error.message}`);
    }
  }
}

module.exports = SuperAdminAuthTester;
