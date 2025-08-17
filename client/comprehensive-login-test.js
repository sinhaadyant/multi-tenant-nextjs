const { chromium } = require("@playwright/test");

async function comprehensiveLoginTest() {
  console.log("🚀 Starting comprehensive login test in browser...\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test 1: Navigate to login page
    console.log("📋 Test 1: Navigating to login page...");
    await page.goto("http://localhost:3000/login");
    await page.waitForLoadState("networkidle");

    console.log("✅ Login page loaded");

    // Take initial screenshot
    await page.screenshot({ path: "01-login-page.png" });
    console.log("📸 Screenshot: 01-login-page.png");

    // Test 2: Check form elements
    console.log("\n📋 Test 2: Checking form elements...");

    const emailField = await page
      .locator(
        'input[type="email"], input[name="email"], input[placeholder*="email" i], #email'
      )
      .first();
    const passwordField = await page
      .locator('input[type="password"], input[name="password"], #password')
      .first();
    const submitButton = await page
      .locator(
        'button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Submit")'
      )
      .first();

    console.log("Email field found:", await emailField.isVisible());
    console.log("Password field found:", await passwordField.isVisible());
    console.log("Submit button found:", await submitButton.isVisible());

    // Test 3: Test with invalid credentials first
    console.log("\n📋 Test 3: Testing with invalid credentials...");
    await emailField.fill("invalid@example.com");
    await passwordField.fill("wrongpassword");
    await submitButton.click();

    await page.waitForTimeout(2000);
    await page.screenshot({ path: "02-invalid-login.png" });
    console.log("📸 Screenshot: 02-invalid-login.png");

    // Check for error message
    const errorMessage = await page
      .locator(
        '.error, .alert, [role="alert"], .text-red-500, .text-error, .text-destructive'
      )
      .first();
    if (await errorMessage.isVisible()) {
      console.log(
        "✅ Error message displayed:",
        await errorMessage.textContent()
      );
    } else {
      console.log("⚠️ No error message found");
    }

    // Test 4: Test with valid credentials
    console.log("\n📋 Test 4: Testing with valid credentials...");
    await emailField.clear();
    await passwordField.clear();
    await emailField.fill("superadmin@example.com");
    await passwordField.fill("password123");

    await page.screenshot({ path: "03-valid-credentials.png" });
    console.log("📸 Screenshot: 03-valid-credentials.png");

    await submitButton.click();

    // Wait for navigation or success
    try {
      await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });
      console.log("✅ Login successful! Redirected to dashboard");

      await page.screenshot({ path: "04-dashboard-success.png" });
      console.log("📸 Screenshot: 04-dashboard-success.png");

      // Check for user elements
      const userMenu = await page
        .locator(
          'button:has-text("user"), [data-testid="user-menu"], .user-menu, .user-dropdown'
        )
        .first();
      if (await userMenu.isVisible()) {
        console.log("✅ User menu found");
      }

      // Test 5: Test logout
      console.log("\n📋 Test 5: Testing logout...");
      await userMenu.click();

      const logoutButton = await page
        .locator(
          'button:has-text("Logout"), button:has-text("Sign out"), [data-testid="logout"]'
        )
        .first();
      if (await logoutButton.isVisible()) {
        console.log("✅ Logout button found");
        await logoutButton.click();

        await page.waitForURL(/\/login/, { timeout: 5000 });
        console.log("✅ Logout successful, redirected to login");

        await page.screenshot({ path: "05-after-logout.png" });
        console.log("📸 Screenshot: 05-after-logout.png");
      }
    } catch (error) {
      console.log("❌ Login failed or took too long");
      console.log("Current URL:", page.url());

      await page.screenshot({ path: "04-login-failed.png" });
      console.log("📸 Screenshot: 04-login-failed.png");

      // Check for any error messages
      const errorMessages = await page
        .locator(
          '.error, .alert, [role="alert"], .text-red-500, .text-error, .text-destructive'
        )
        .all();
      for (let i = 0; i < errorMessages.length; i++) {
        if (await errorMessages[i].isVisible()) {
          console.log(
            `Error message ${i + 1}:`,
            await errorMessages[i].textContent()
          );
        }
      }
    }

    // Test 6: Test form validation
    console.log("\n📋 Test 6: Testing form validation...");
    await page.goto("http://localhost:3000/login");
    await page.waitForLoadState("networkidle");

    const emailField2 = await page
      .locator(
        'input[type="email"], input[name="email"], input[placeholder*="email" i], #email'
      )
      .first();
    const passwordField2 = await page
      .locator('input[type="password"], input[name="password"], #password')
      .first();
    const submitButton2 = await page
      .locator(
        'button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Submit")'
      )
      .first();

    // Test empty form submission
    await submitButton2.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: "06-empty-form.png" });
    console.log("📸 Screenshot: 06-empty-form.png");

    // Test invalid email format
    await emailField2.fill("invalid-email");
    await passwordField2.fill("password123");
    await submitButton2.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: "07-invalid-email.png" });
    console.log("📸 Screenshot: 07-invalid-email.png");

    // Wait to see final state
    await page.waitForTimeout(2000);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    await page.screenshot({ path: "error-state.png" });
    console.log("📸 Screenshot: error-state.png");
  } finally {
    await browser.close();
    console.log("\n🎉 Comprehensive login test completed!");
    console.log(
      "📁 Check the screenshots in the current directory for visual results."
    );
  }
}

// Run the comprehensive test
comprehensiveLoginTest();
