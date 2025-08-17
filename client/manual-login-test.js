const { chromium } = require("@playwright/test");

async function manualLoginTest() {
  console.log("🔍 Manual Login Test - Step by Step Debugging\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate to login page
    console.log("📍 Step 1: Navigating to login page...");
    await page.goto("http://localhost:3000/login");
    await page.waitForLoadState("networkidle");

    console.log("Current URL:", page.url());
    console.log("Page title:", await page.title());

    // Step 2: Inspect the page structure
    console.log("\n📍 Step 2: Inspecting page structure...");

    // Look for form elements
    const forms = await page.locator("form").all();
    console.log("Number of forms found:", forms.length);

    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      const action = await form.getAttribute("action");
      const method = await form.getAttribute("method");
      console.log(`Form ${i + 1}: action="${action}", method="${method}"`);
    }

    // Look for input fields
    const inputs = await page.locator("input").all();
    console.log("Number of input fields found:", inputs.length);

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute("type");
      const name = await input.getAttribute("name");
      const id = await input.getAttribute("id");
      const placeholder = await input.getAttribute("placeholder");
      console.log(
        `Input ${i + 1}: type="${type}", name="${name}", id="${id}", placeholder="${placeholder}"`
      );
    }

    // Look for buttons
    const buttons = await page.locator("button").all();
    console.log("Number of buttons found:", buttons.length);

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const type = await button.getAttribute("type");
      const text = await button.textContent();
      console.log(`Button ${i + 1}: type="${type}", text="${text?.trim()}"`);
    }

    // Step 3: Try to fill the form
    console.log("\n📍 Step 3: Attempting to fill the form...");

    // Try different selectors for email field
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      "#email",
      'input[type="text"]',
    ];

    let emailField = null;
    for (const selector of emailSelectors) {
      emailField = await page.locator(selector).first();
      if (await emailField.isVisible()) {
        console.log(`✅ Found email field with selector: ${selector}`);
        break;
      }
    }

    if (!emailField || !(await emailField.isVisible())) {
      console.log("❌ Could not find email field");
      await page.screenshot({ path: "debug-no-email-field.png" });
      return;
    }

    // Try different selectors for password field
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      "#password",
    ];

    let passwordField = null;
    for (const selector of passwordSelectors) {
      passwordField = await page.locator(selector).first();
      if (await passwordField.isVisible()) {
        console.log(`✅ Found password field with selector: ${selector}`);
        break;
      }
    }

    if (!passwordField || !(await passwordField.isVisible())) {
      console.log("❌ Could not find password field");
      await page.screenshot({ path: "debug-no-password-field.png" });
      return;
    }

    // Step 4: Fill the form
    console.log("\n📍 Step 4: Filling the form...");
    await emailField.fill("superadmin@example.com");
    await passwordField.fill("password123");

    console.log("✅ Form filled");
    await page.screenshot({ path: "debug-form-filled.png" });

    // Step 5: Find and click submit button
    console.log("\n📍 Step 5: Looking for submit button...");

    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Login")',
      'button:has-text("Submit")',
      'input[type="submit"]',
    ];

    let submitButton = null;
    for (const selector of submitSelectors) {
      submitButton = await page.locator(selector).first();
      if (await submitButton.isVisible()) {
        console.log(`✅ Found submit button with selector: ${selector}`);
        break;
      }
    }

    if (!submitButton || !(await submitButton.isVisible())) {
      console.log("❌ Could not find submit button");
      await page.screenshot({ path: "debug-no-submit-button.png" });
      return;
    }

    // Step 6: Submit the form
    console.log("\n📍 Step 6: Submitting the form...");
    await submitButton.click();

    // Step 7: Monitor the response
    console.log("\n📍 Step 7: Monitoring response...");

    // Wait a bit and check for any changes
    await page.waitForTimeout(3000);

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
    ];

    for (const selector of errorSelectors) {
      const errorElement = await page.locator(selector).first();
      if (await errorElement.isVisible()) {
        console.log(
          `❌ Error found with selector ${selector}:`,
          await errorElement.textContent()
        );
      }
    }

    // Check for success indicators
    const successSelectors = [
      ".success",
      ".text-green-500",
      ".bg-green-50",
      ".border-green-200",
    ];

    for (const selector of successSelectors) {
      const successElement = await page.locator(selector).first();
      if (await successElement.isVisible()) {
        console.log(
          `✅ Success indicator found with selector ${selector}:`,
          await successElement.textContent()
        );
      }
    }

    await page.screenshot({ path: "debug-after-submit.png" });

    // Step 8: Check network requests
    console.log("\n📍 Step 8: Checking network activity...");

    // Listen for network requests
    page.on("request", request => {
      console.log(`🌐 Request: ${request.method()} ${request.url()}`);
    });

    page.on("response", response => {
      console.log(`📡 Response: ${response.status()} ${response.url()}`);
    });

    // Wait a bit more to see any network activity
    await page.waitForTimeout(2000);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    await page.screenshot({ path: "debug-error.png" });
  } finally {
    console.log(
      "\n🎯 Manual test completed. Check the debug screenshots for visual analysis."
    );
    await browser.close();
  }
}

// Run the manual test
manualLoginTest();
