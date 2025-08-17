const { chromium } = require("@playwright/test");

async function testLoginInBrowser() {
  console.log("Opening browser to test login functionality...\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000, // Slow down actions to see what's happening
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the login page
    console.log("1. Navigating to login page...");
    await page.goto("http://localhost:3000/login");
    await page.waitForLoadState("networkidle");

    console.log("✅ Login page loaded successfully");

    // Check if login form is visible
    const emailField = await page
      .locator(
        'input[type="email"], input[name="email"], input[placeholder*="email" i]'
      )
      .first();
    const passwordField = await page
      .locator('input[type="password"], input[name="password"]')
      .first();
    const submitButton = await page
      .locator(
        'button[type="submit"], button:has-text("Sign in"), button:has-text("Login")'
      )
      .first();

    console.log("2. Checking form elements...");
    console.log("Email field found:", await emailField.isVisible());
    console.log("Password field found:", await passwordField.isVisible());
    console.log("Submit button found:", await submitButton.isVisible());

    // Fill in test credentials
    console.log("3. Filling in test credentials...");
    await emailField.fill("superadmin@example.com");
    await passwordField.fill("password123");

    console.log("✅ Credentials filled");

    // Take a screenshot before submitting
    await page.screenshot({ path: "login-form-filled.png" });
    console.log("📸 Screenshot saved: login-form-filled.png");

    // Submit the form
    console.log("4. Submitting login form...");
    await submitButton.click();

    // Wait for navigation or error
    try {
      await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });
      console.log("✅ Login successful! Redirected to dashboard");

      // Take screenshot of dashboard
      await page.screenshot({ path: "dashboard-after-login.png" });
      console.log("📸 Screenshot saved: dashboard-after-login.png");

      // Check for user info or logout button
      const userMenu = await page
        .locator(
          'button:has-text("user"), [data-testid="user-menu"], .user-menu'
        )
        .first();
      if (await userMenu.isVisible()) {
        console.log("✅ User menu found - login was successful");
      }
    } catch (error) {
      console.log("❌ Login failed or took too long");

      // Check for error messages
      const errorMessage = await page
        .locator('.error, .alert, [role="alert"], .text-red-500, .text-error')
        .first();
      if (await errorMessage.isVisible()) {
        console.log("Error message:", await errorMessage.textContent());
      }

      // Take screenshot of error state
      await page.screenshot({ path: "login-error.png" });
      console.log("📸 Screenshot saved: login-error.png");
    }

    // Wait a bit to see the result
    await page.waitForTimeout(3000);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    await page.screenshot({ path: "test-error.png" });
    console.log("📸 Screenshot saved: test-error.png");
  } finally {
    await browser.close();
    console.log("\n🎉 Browser test completed!");
  }
}

// Run the test
testLoginInBrowser();
