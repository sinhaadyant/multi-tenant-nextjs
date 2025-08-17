const { chromium } = require("@playwright/test");

async function debugFormSubmission() {
  console.log("🔍 Debug Form Submission - Checking for JavaScript Errors\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable detailed console logging
  page.on("console", msg => {
    console.log(`📱 Console [${msg.type()}]: ${msg.text()}`);
  });

  // Enable error logging
  page.on("pageerror", error => {
    console.log(`❌ Page Error: ${error.message}`);
  });

  // Enable request logging
  page.on("request", request => {
    if (request.url().includes("/api/")) {
      console.log(`🌐 API Request: ${request.method()} ${request.url()}`);
    }
  });

  try {
    // Step 1: Navigate to login page
    console.log("📍 Step 1: Navigating to login page...");
    await page.goto("http://localhost:3000/login");
    await page.waitForLoadState("networkidle");

    // Step 2: Check form validation manually
    console.log("\n📍 Step 2: Testing form validation manually...");

    // Fill form with valid data
    const emailField = await page.locator('input[type="email"]').first();
    const passwordField = await page.locator('input[type="password"]').first();
    const submitButton = await page
      .locator('button:has-text("Sign in")')
      .first();

    await emailField.fill("superadmin@example.com");
    await passwordField.fill("password123");

    console.log("✅ Form filled with valid data");

    // Step 3: Check form state before submission
    console.log("\n📍 Step 3: Checking form state...");

    const form = await page.locator("form").first();
    const formAction = await form.getAttribute("action");
    const formMethod = await form.getAttribute("method");

    console.log("Form attributes:", {
      action: formAction,
      method: formMethod,
    });

    // Step 4: Try to trigger form submission manually
    console.log("\n📍 Step 4: Testing form submission manually...");

    // Method 1: Click the submit button
    console.log("Method 1: Clicking submit button...");
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Check if any API calls were made
    console.log("Current URL after button click:", page.url());

    // Method 2: Submit form directly
    console.log("\nMethod 2: Submitting form directly...");
    await form.evaluate(form => form.submit());
    await page.waitForTimeout(2000);

    console.log("Current URL after form submit:", page.url());

    // Method 3: Trigger form submission via JavaScript
    console.log("\nMethod 3: Triggering form submission via JavaScript...");
    await page.evaluate(() => {
      const form = document.querySelector("form");
      if (form) {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        form.dispatchEvent(submitEvent);
      }
    });
    await page.waitForTimeout(2000);

    console.log("Current URL after JavaScript submit:", page.url());

    // Step 5: Check for any validation errors
    console.log("\n📍 Step 5: Checking for validation errors...");

    const validationErrors = await page
      .locator(".text-red-500, .text-error, .text-destructive")
      .all();
    console.log(`Found ${validationErrors.length} validation errors`);

    for (let i = 0; i < validationErrors.length; i++) {
      const error = validationErrors[i];
      if (await error.isVisible()) {
        console.log(`Validation error ${i + 1}:`, await error.textContent());
      }
    }

    // Step 6: Check form data
    console.log("\n📍 Step 6: Checking form data...");

    const formData = await page.evaluate(() => {
      const form = document.querySelector("form");
      if (form) {
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
          data[key] = value;
        }
        return data;
      }
      return null;
    });

    console.log("Form data:", formData);

    // Step 7: Check if there are any event listeners
    console.log("\n📍 Step 7: Checking event listeners...");

    const hasSubmitListener = await page.evaluate(() => {
      const form = document.querySelector("form");
      if (form) {
        // This is a simplified check - we can't directly access event listeners
        // but we can check if the form has any React event handlers
        return (
          form.hasAttribute("data-reactroot") ||
          form.hasAttribute("data-reactid")
        );
      }
      return false;
    });

    console.log("Form has React event handlers:", hasSubmitListener);

    // Step 8: Try to access React form state
    console.log("\n📍 Step 8: Checking React form state...");

    const reactFormState = await page.evaluate(() => {
      // Try to access React form state if possible
      const form = document.querySelector("form");
      if (form) {
        // Check for any React-specific attributes or data
        const reactProps = {};
        for (let attr of form.attributes) {
          if (attr.name.startsWith("data-") || attr.name.startsWith("aria-")) {
            reactProps[attr.name] = attr.value;
          }
        }
        return reactProps;
      }
      return null;
    });

    console.log("React form props:", reactFormState);

    // Take final screenshot
    await page.screenshot({ path: "debug-form-submission.png" });

    console.log("\n🎯 Form submission debug completed!");
    console.log("📁 Check the screenshot for visual analysis.");
  } catch (error) {
    console.error("❌ Form submission debug failed:", error.message);
    await page.screenshot({ path: "debug-form-submission-error.png" });
  } finally {
    await browser.close();
  }
}

// Run the debug
debugFormSubmission();
