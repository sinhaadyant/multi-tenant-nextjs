const { chromium } = require("@playwright/test");

async function finalLoginDebug() {
  console.log("🔍 Final Login Debug - Comprehensive Analysis\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on("console", msg => {
    console.log(`📱 Browser Console: ${msg.type()}: ${msg.text()}`);
  });

  // Enable network logging
  page.on("request", request => {
    console.log(`🌐 Request: ${request.method()} ${request.url()}`);
  });

  page.on("response", response => {
    console.log(`📡 Response: ${response.status()} ${response.url()}`);
    if (response.status() >= 400) {
      console.log(`❌ Error Response: ${response.status()} ${response.url()}`);
    }
  });

  try {
    // Step 1: Navigate to login page
    console.log("📍 Step 1: Navigating to login page...");
    await page.goto("http://localhost:3000/login");
    await page.waitForLoadState("networkidle");

    console.log("Current URL:", page.url());
    console.log("Page title:", await page.title());

    // Step 2: Check for any console errors
    console.log("\n📍 Step 2: Checking for console errors...");
    await page.waitForTimeout(2000);

    // Step 3: Fill the form with valid credentials
    console.log("\n📍 Step 3: Filling form with valid credentials...");

    const emailField = await page.locator('input[type="email"]').first();
    const passwordField = await page.locator('input[type="password"]').first();
    const submitButton = await page
      .locator('button:has-text("Sign in")')
      .first();

    await emailField.fill("superadmin@example.com");
    await passwordField.fill("password123");

    console.log("✅ Form filled");

    // Step 4: Submit the form and monitor everything
    console.log("\n📍 Step 4: Submitting form and monitoring...");

    // Take screenshot before submit
    await page.screenshot({ path: "debug-before-submit.png" });

    // Submit the form
    await submitButton.click();

    // Wait and monitor
    console.log("\n📍 Step 5: Monitoring response...");

    // Wait for any network activity
    await page.waitForTimeout(5000);

    console.log("Current URL after submit:", page.url());

    // Check for any error messages
    const errorSelectors = [
      ".error",
      ".alert",
      '[role="alert"]',
      ".text-red-500",
      ".text-error",
      ".text-destructive",
      ".bg-red-50",
      ".border-red-200",
      '[data-testid="error"]',
      ".error-message",
    ];

    for (const selector of errorSelectors) {
      const errorElement = await page.locator(selector).first();
      if (await errorElement.isVisible()) {
        const text = await errorElement.textContent();
        console.log(`❌ Error found with selector ${selector}:`, text);
      }
    }

    // Check for success indicators
    const successSelectors = [
      ".success",
      ".text-green-500",
      ".bg-green-50",
      ".border-green-200",
      '[data-testid="success"]',
    ];

    for (const selector of successSelectors) {
      const successElement = await page.locator(selector).first();
      if (await successElement.isVisible()) {
        const text = await successElement.textContent();
        console.log(
          `✅ Success indicator found with selector ${selector}:`,
          text
        );
      }
    }

    // Check if we're still on login page
    if (page.url().includes("/login")) {
      console.log("⚠️ Still on login page - login may have failed");

      // Check for loading states
      const loadingSelectors = [
        'button:has-text("Signing in")',
        '[data-testid="loading"]',
        ".loading",
        ".spinner",
      ];

      for (const selector of loadingSelectors) {
        const loadingElement = await page.locator(selector).first();
        if (await loadingElement.isVisible()) {
          console.log(`⏳ Loading state found with selector ${selector}`);
        }
      }
    } else {
      console.log("✅ Successfully navigated away from login page");
    }

    // Take final screenshot
    await page.screenshot({ path: "debug-after-submit.png" });

    // Step 6: Check localStorage and sessionStorage
    console.log("\n📍 Step 6: Checking browser storage...");

    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          items[key] = localStorage.getItem(key);
        }
      }
      return items;
    });

    console.log("LocalStorage contents:", localStorage);

    const sessionStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          items[key] = sessionStorage.getItem(key);
        }
      }
      return items;
    });

    console.log("SessionStorage contents:", sessionStorage);

    // Step 7: Check for any React errors
    console.log("\n📍 Step 7: Checking for React errors...");

    const reactError = await page
      .locator('[data-testid="error-boundary"], .error-boundary')
      .first();
    if (await reactError.isVisible()) {
      console.log("❌ React error boundary triggered");
      console.log("Error content:", await reactError.textContent());
    }

    // Wait a bit more to see if anything changes
    await page.waitForTimeout(3000);

    console.log("\n🎯 Final debug completed!");
    console.log("📁 Check the debug screenshots for visual analysis.");
    console.log(
      "📱 Check the console output above for any errors or network activity."
    );
  } catch (error) {
    console.error("❌ Debug test failed:", error.message);
    await page.screenshot({ path: "debug-error.png" });
  } finally {
    await browser.close();
  }
}

// Run the final debug
finalLoginDebug();
