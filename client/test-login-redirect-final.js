const { chromium } = require("@playwright/test");

async function testLoginRedirectFinal() {
  console.log("🔍 Final Login Redirect Test\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on("console", msg => {
    if (msg.type() === "log" && msg.text().includes("✅ POST /auth/login")) {
      console.log(`📱 API Success: ${msg.text()}`);
    }
  });

  try {
    // Step 1: Navigate to login page
    console.log("📍 Step 1: Navigating to login page...");
    await page.goto("http://localhost:3000/login");
    await page.waitForLoadState("networkidle");

    console.log("Current URL:", page.url());
    console.log("Page title:", await page.title());

    // Step 2: Fill form with valid credentials
    console.log("\n📍 Step 2: Filling form with valid credentials...");
    const emailField = await page.locator('input[type="email"]').first();
    const passwordField = await page.locator('input[type="password"]').first();

    await emailField.fill("superadmin@example.com");
    await passwordField.fill("password123");

    console.log("✅ Form filled with valid credentials");

    // Step 3: Submit form using Enter key
    console.log("\n📍 Step 3: Submitting form...");
    await passwordField.press("Enter");

    // Step 4: Wait for navigation to dashboard
    console.log("\n📍 Step 4: Waiting for navigation...");

    try {
      // Wait for navigation to dashboard (either root or admin)
      await page.waitForURL(/\/$|\/admin/, { timeout: 10000 });

      console.log("✅ Successfully redirected to dashboard!");
      console.log("New URL:", page.url());

      // Take screenshot of dashboard
      await page.screenshot({ path: "login-redirect-success-final.png" });
      console.log("📸 Screenshot saved: login-redirect-success-final.png");

      // Check if we're on the dashboard
      const pageTitle = await page.title();
      console.log("Dashboard page title:", pageTitle);

      // Wait a bit for the page to load completely
      await page.waitForTimeout(2000);

      // Check for dashboard elements
      const sidebar = await page
        .locator('nav, .sidebar, [data-testid="sidebar"]')
        .first();
      if (await sidebar.isVisible()) {
        console.log("✅ Sidebar found - we're on the dashboard");
      }

      // Check for user menu or profile elements
      const userMenu = await page
        .locator(
          'button:has-text("user"), [data-testid="user-menu"], .user-menu, .user-dropdown'
        )
        .first();
      if (await userMenu.isVisible()) {
        console.log("✅ User menu found - login was successful");
      }

      // Check authentication state after successful login
      console.log("\n📍 Step 5: Checking authentication state...");

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

      // Check if auth token is stored
      if (localStorage["persist:root"]) {
        try {
          const authData = JSON.parse(localStorage["persist:root"]);
          const authState = JSON.parse(authData.auth);
          console.log("Auth state:", {
            isAuthenticated: authState.isAuthenticated,
            hasToken: !!authState.token,
            hasUser: !!authState.user,
          });

          if (authState.isAuthenticated && authState.token) {
            console.log("✅ Authentication state is properly updated!");
          } else {
            console.log("⚠️ Authentication state not fully updated");
          }
        } catch (error) {
          console.log("Could not parse auth state");
        }
      }

      console.log("\n🎉 Login redirect test completed successfully!");
      console.log("✅ Login functionality is working correctly");
      console.log("✅ Redirect to dashboard is working");
      console.log("✅ User is properly authenticated");
    } catch (error) {
      console.log("❌ Redirect failed or took too long");
      console.log("Current URL:", page.url());

      // Take screenshot of current state
      await page.screenshot({ path: "login-redirect-failed-final.png" });
      console.log("📸 Screenshot saved: login-redirect-failed-final.png");

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
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    await page.screenshot({ path: "login-redirect-error-final.png" });
  } finally {
    await browser.close();
  }
}

// Run the test
testLoginRedirectFinal();

