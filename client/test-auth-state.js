const { chromium } = require("@playwright/test");

async function testAuthState() {
  console.log("🔍 Testing Authentication State Management\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on("console", msg => {
    console.log(`📱 Console [${msg.type()}]: ${msg.text()}`);
  });

  try {
    // Step 1: Navigate to login page
    console.log("📍 Step 1: Navigating to login page...");
    await page.goto("http://localhost:3000/login");
    await page.waitForLoadState("networkidle");

    // Step 2: Check initial auth state
    console.log("\n📍 Step 2: Checking initial auth state...");
    const initialAuthState = await page.evaluate(() => {
      const persistData = localStorage.getItem("persist:root");
      if (persistData) {
        const data = JSON.parse(persistData);
        const auth = JSON.parse(data.auth);
        return auth;
      }
      return null;
    });
    console.log("Initial auth state:", initialAuthState);

    // Step 3: Fill and submit form
    console.log("\n📍 Step 3: Filling and submitting form...");
    const emailField = await page.locator('input[type="email"]').first();
    const passwordField = await page.locator('input[type="password"]').first();

    await emailField.fill("superadmin@example.com");
    await passwordField.fill("password123");
    await passwordField.press("Enter");

    // Step 4: Wait for API response and check auth state
    console.log("\n📍 Step 4: Waiting for API response...");
    await page.waitForTimeout(3000);

    // Check auth state after login
    const afterLoginAuthState = await page.evaluate(() => {
      const persistData = localStorage.getItem("persist:root");
      if (persistData) {
        const data = JSON.parse(persistData);
        const auth = JSON.parse(data.auth);
        return auth;
      }
      return null;
    });
    console.log("Auth state after login:", afterLoginAuthState);

    // Step 5: Check if we're redirected
    console.log("\n📍 Step 5: Checking redirect...");
    const currentURL = page.url();
    console.log("Current URL:", currentURL);

    if (currentURL.includes("/login")) {
      console.log("❌ Still on login page - redirect failed");
    } else {
      console.log("✅ Successfully redirected away from login page");
    }

    // Step 6: Check for any error messages
    console.log("\n📍 Step 6: Checking for error messages...");
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

    // Step 7: Check Redux DevTools if available
    console.log("\n📍 Step 7: Checking Redux DevTools...");
    const reduxDevTools = await page.evaluate(() => {
      return window.__REDUX_DEVTOOLS_EXTENSION__
        ? "Available"
        : "Not available";
    });
    console.log("Redux DevTools:", reduxDevTools);

    // Step 8: Check if there are any React errors
    console.log("\n📍 Step 8: Checking for React errors...");
    const reactErrors = await page
      .locator('[data-testid="error-boundary"], .error-boundary')
      .all();
    for (let i = 0; i < reactErrors.length; i++) {
      if (await reactErrors[i].isVisible()) {
        console.log(
          `React error ${i + 1}:`,
          await reactErrors[i].textContent()
        );
      }
    }

    // Take screenshot
    await page.screenshot({ path: "auth-state-test.png" });
    console.log("📸 Screenshot saved: auth-state-test.png");

    console.log("\n🎯 Auth state test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    await page.screenshot({ path: "auth-state-error.png" });
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthState();

