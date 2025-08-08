const puppeteer = require('puppeteer');

async function testForgotPasswordFeature() {
  console.log('🔑 Testing Forgot Password Feature...\n');
  
  let browser;
  try {
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({ 
      headless: false, 
      slowMo: 200,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable console log capture
    page.on('console', msg => {
      console.log(`📱 Browser Console: ${msg.text()}`);
    });

    // Test Forgot Password Page Access
    console.log('📋 Test 1: Forgot Password Page Access');
    console.log('======================================');
    await page.goto('http://localhost:3000/superadmin/forgot-password', { waitUntil: 'networkidle0' });
    console.log('✅ Forgot password page loaded successfully');
    
    // Test Form Elements
    console.log('\n📋 Test 2: Form Elements');
    console.log('==========================');
    const emailInput = await page.$('input[type="email"]');
    const submitButton = await page.$('button[type="submit"]');
    const backToLoginLink = await page.$('a[href*="login"]');
    
    if (emailInput) console.log('✅ Email input field found');
    if (submitButton) console.log('✅ Submit button found');
    if (backToLoginLink) console.log('✅ Back to login link found');
    
    if (!emailInput || !submitButton) {
      throw new Error('Missing required form elements');
    }

    // Test Form Validation
    console.log('\n📋 Test 3: Form Validation');
    console.log('============================');
    
    // Test empty form submission
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for validation errors
    const validationErrors = await page.$$('.text-red-500, .text-red-600, [class*="error"]');
    if (validationErrors.length > 0) {
      console.log('✅ Form validation working (showing errors for empty fields)');
    }

    // Test Invalid Email Format
    console.log('\n📋 Test 4: Invalid Email Format');
    console.log('==================================');
    
    await page.type('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for email validation errors
    const emailValidationErrors = await page.$$('.text-red-500, .text-red-600, [class*="error"]');
    if (emailValidationErrors.length > 0) {
      console.log('✅ Email format validation working');
    }

    // Test Non-Existent Email
    console.log('\n📋 Test 5: Non-Existent Email');
    console.log('===============================');
    
    // Clear form
    await page.evaluate(() => {
      document.querySelector('input[type="email"]').value = '';
    });
    
    await page.type('input[type="email"]', 'nonexistent@example.com');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForResponse(response => response.url().includes('/api/superadmin/auth/forgot-password'), { timeout: 10000 });
      console.log('✅ Non-existent email API call made');
      
      // Check for success message (should show same message for security)
      const successElement = await page.$('.text-green-500, .text-green-600, [class*="success"]');
      if (successElement) {
        const successText = await successElement.evaluate(el => el.textContent);
        console.log('✅ Success message displayed:', successText);
      }
    } catch (error) {
      console.log('❌ Non-existent email test failed');
    }

    // Test Valid Email
    console.log('\n📋 Test 6: Valid Email');
    console.log('=======================');
    
    // Clear form
    await page.evaluate(() => {
      document.querySelector('input[type="email"]').value = '';
    });
    
    await page.type('input[type="email"]', 'admin@superadmin.com');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForResponse(response => response.url().includes('/api/superadmin/auth/forgot-password'), { timeout: 10000 });
      console.log('✅ Valid email API call made');
      
      // Check for success message
      const successElement = await page.$('.text-green-500, .text-green-600, [class*="success"]');
      if (successElement) {
        const successText = await successElement.evaluate(el => el.textContent);
        console.log('✅ Success message displayed:', successText);
      }
    } catch (error) {
      console.log('❌ Valid email test failed');
    }

    // Test Back to Login Link
    console.log('\n📋 Test 7: Back to Login Link');
    console.log('===============================');
    
    if (backToLoginLink) {
      await backToLoginLink.click();
      try {
        await page.waitForNavigation({ timeout: 5000 });
        const currentUrl = page.url();
        if (currentUrl.includes('/superadmin/login')) {
          console.log('✅ Successfully navigated back to login page');
        } else {
          console.log('❌ Back to login navigation failed');
        }
      } catch (error) {
        console.log('❌ Back to login navigation failed');
      }
    } else {
      console.log('⚠️ Back to login link not found');
    }

    // Test API Endpoint Directly
    console.log('\n📋 Test 8: API Endpoint Test');
    console.log('=============================');
    
    try {
      const response = await fetch('http://localhost:3000/api/superadmin/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@superadmin.com'
        })
      });
      
      if (response.ok) {
        console.log('✅ Forgot password API endpoint working');
        const data = await response.json();
        console.log('📄 API Response:', data.message || 'Success');
      } else {
        console.log('❌ Forgot password API endpoint failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ API endpoint test failed:', error.message);
    }

    console.log('\n🎉 Forgot Password Feature Tests Completed!');

  } catch (error) {
    console.error('❌ Forgot password test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testForgotPasswordFeature(); 