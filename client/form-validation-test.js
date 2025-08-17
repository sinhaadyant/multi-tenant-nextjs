const { chromium } = require("@playwright/test");

async function formValidationTest() {
  console.log("🔍 Form Validation Test - Checking for JavaScript Errors\n");

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

    // Step 2: Test form validation
    console.log("\n📍 Step 2: Testing form validation...");

    // Try submitting empty form
    console.log("Testing empty form submission...");
    const submitButton = await page
      .locator('button:has-text("Sign in")')
      .first();
    await submitButton.click();

    await page.waitForTimeout(2000);

    // Check for validation errors
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

    // Step 3: Test with invalid email format
    console.log("\n📍 Step 3: Testing invalid email format...");
    const emailField = await page.locator('input[type="email"]').first();
    await emailField.fill("invalid-email");
    await submitButton.click();

    await page.waitForTimeout(2000);

    // Check for validation errors
    const emailErrors = await page
      .locator(".text-red-500, .text-error, .text-destructive")
      .all();
    console.log(`Found ${emailErrors.length} email validation errors`);

    for (let i = 0; i < emailErrors.length; i++) {
      const error = emailErrors[i];
      if (await error.isVisible()) {
        console.log(
          `Email validation error ${i + 1}:`,
          await error.textContent()
        );
      }
    }

    // Step 4: Test with valid format but no API call
    console.log("\n📍 Step 4: Testing with valid format...");
    await emailField.clear();
    await emailField.fill("test@example.com");

    const passwordField = await page.locator('input[type="password"]').first();
    await passwordField.fill("password123");

    console.log("Form filled with valid data, submitting...");
    await submitButton.click();

    // Wait for any network activity
    await page.waitForTimeout(5000);

    // Check if any API calls were made
    console.log("\n📍 Step 5: Checking for API calls...");

    // Step 6: Check form state
    console.log("\n📍 Step 6: Checking form state...");

    // Check if form is still enabled
    const isEmailEnabled = await emailField.isEnabled();
    const isPasswordEnabled = await passwordField.isEnabled();
    const isSubmitEnabled = await submitButton.isEnabled();

    console.log("Form field states:", {
      emailEnabled: isEmailEnabled,
      passwordEnabled: isPasswordEnabled,
      submitEnabled: isSubmitEnabled,
    });

    // Check if button text changed (loading state)
    const buttonText = await submitButton.textContent();
    console.log("Submit button text:", buttonText);

    // Step 7: Check for any React errors or warnings
    console.log("\n📍 Step 7: Checking for React errors...");

    // Look for any error boundaries or error states
    const errorElements = await page
      .locator('[data-testid*="error"], .error-boundary, [role="alert"]')
      .all();
    console.log(`Found ${errorElements.length} error elements`);

    for (let i = 0; i < errorElements.length; i++) {
      const error = errorElements[i];
      if (await error.isVisible()) {
        console.log(`Error element ${i + 1}:`, await error.textContent());
      }
    }

    // Step 8: Test form submission with Enter key
    console.log("\n📍 Step 8: Testing form submission with Enter key...");

    // Clear and refill form
    await emailField.clear();
    await emailField.fill("superadmin@example.com");
    await passwordField.clear();
    await passwordField.fill("password123");

    // Press Enter on password field
    await passwordField.press("Enter");

    await page.waitForTimeout(3000);

    console.log("Current URL after Enter key:", page.url());

    // Take final screenshot
    await page.screenshot({ path: "form-validation-test.png" });

    console.log("\n🎯 Form validation test completed!");
    console.log("📁 Check the screenshot for visual analysis.");
  } catch (error) {
    console.error("❌ Form validation test failed:", error.message);
    await page.screenshot({ path: "form-validation-error.png" });
  } finally {
    await browser.close();
  }
}

// Run the form validation test
formValidationTest();
