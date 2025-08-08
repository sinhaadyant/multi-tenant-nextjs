const puppeteer = require('puppeteer');

async function testSignupFeature() {
  console.log('📝 Testing Signup Feature...\n');
  
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

    // Test Signup Page Access
    console.log('📋 Test 1: Signup Page Access');
    console.log('============================');
    
    try {
      await page.goto('http://localhost:3000/superadmin/signup', { waitUntil: 'networkidle0', timeout: 5000 });
      console.log('✅ Signup page loaded successfully');
    } catch (error) {
      console.log('❌ Signup page not found (404)');
      console.log('⚠️ Signup functionality may not be implemented yet');
      
      // Test if there's a signup link on login page
      console.log('\n📋 Test 1.1: Checking for Signup Link on Login Page');
      console.log('==================================================');
      
      await page.goto('http://localhost:3000/superadmin/login', { waitUntil: 'networkidle0' });
      
      // Look for signup link
      const signupLink = await page.$('a[href*="signup"], a:has-text("Sign up"), a:has-text("Register")');
      if (signupLink) {
        console.log('✅ Signup link found on login page');
        await signupLink.click();
        
        try {
          await page.waitForNavigation({ timeout: 5000 });
          const currentUrl = page.url();
          if (currentUrl.includes('/signup')) {
            console.log('✅ Successfully navigated to signup page');
          } else {
            console.log('❌ Navigation to signup page failed');
          }
        } catch (error) {
          console.log('❌ Navigation to signup page failed');
        }
      } else {
        console.log('❌ No signup link found on login page');
      }
      
      return; // Exit early if signup page doesn't exist
    }
    
    // Test Form Elements
    console.log('\n📋 Test 2: Form Elements');
    console.log('==========================');
    const nameInput = await page.$('input[name="name"], input[placeholder*="name"]');
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    const confirmPasswordInput = await page.$('input[name="confirmPassword"], input[placeholder*="confirm"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (nameInput) console.log('✅ Name input field found');
    if (emailInput) console.log('✅ Email input field found');
    if (passwordInput) console.log('✅ Password input field found');
    if (confirmPasswordInput) console.log('✅ Confirm password input field found');
    if (submitButton) console.log('✅ Submit button found');
    
    if (!emailInput || !passwordInput || !submitButton) {
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
    
    await page.type('input[type="email"], input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for email validation errors
    const emailValidationErrors = await page.$$('.text-red-500, .text-red-600, [class*="error"]');
    if (emailValidationErrors.length > 0) {
      console.log('✅ Email format validation working');
    }

    // Test Weak Password
    console.log('\n📋 Test 5: Weak Password');
    console.log('==========================');
    
    // Clear form
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => input.value = '');
    });
    
    await page.type('input[type="email"], input[name="email"]', 'test@example.com');
    await page.type('input[type="password"], input[name="password"]', 'weak');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for password strength errors
    const strengthErrors = await page.$$('.text-red-500, .text-red-600, [class*="error"]');
    if (strengthErrors.length > 0) {
      console.log('✅ Password strength validation working');
    }

    // Test Password Mismatch
    console.log('\n📋 Test 6: Password Mismatch');
    console.log('==============================');
    
    // Clear form
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => input.value = '');
    });
    
    await page.type('input[type="email"], input[name="email"]', 'test@example.com');
    await page.type('input[type="password"], input[name="password"]', 'StrongPassword123!');
    if (confirmPasswordInput) {
      await page.type('input[name="confirmPassword"], input[placeholder*="confirm"]', 'DifferentPassword123!');
    }
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for password mismatch errors
    const mismatchErrors = await page.$$('.text-red-500, .text-red-600, [class*="error"]');
    if (mismatchErrors.length > 0) {
      console.log('✅ Password mismatch validation working');
    }

    // Test Valid Signup
    console.log('\n📋 Test 7: Valid Signup');
    console.log('========================');
    
    // Clear form
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => input.value = '');
    });
    
    if (nameInput) {
      await page.type('input[name="name"], input[placeholder*="name"]', 'Test User');
    }
    await page.type('input[type="email"], input[name="email"]', 'test@example.com');
    await page.type('input[type="password"], input[name="password"]', 'StrongPassword123!');
    if (confirmPasswordInput) {
      await page.type('input[name="confirmPassword"], input[placeholder*="confirm"]', 'StrongPassword123!');
    }
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForResponse(response => response.url().includes('/api/superadmin/auth/signup'), { timeout: 10000 });
      console.log('✅ Signup API call made');
      
      // Check for success message
      const successElement = await page.$('.text-green-500, .text-green-600, [class*="success"]');
      if (successElement) {
        const successText = await successElement.evaluate(el => el.textContent);
        console.log('✅ Success message displayed:', successText);
      }
    } catch (error) {
      console.log('❌ Signup test failed');
    }

    // Test Back to Login Link
    console.log('\n📋 Test 8: Back to Login Link');
    console.log('===============================');
    
    const backToLoginLink = await page.$('a[href*="login"], a:has-text("Login"), a:has-text("Sign in")');
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
    console.log('\n📋 Test 9: API Endpoint Test');
    console.log('=============================');
    
    try {
      const response = await fetch('http://localhost:3000/api/superadmin/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'StrongPassword123!',
          confirmPassword: 'StrongPassword123!'
        })
      });
      
      if (response.ok) {
        console.log('✅ Signup API endpoint working');
        const data = await response.json();
        console.log('📄 API Response:', data.message || 'Success');
      } else {
        console.log('❌ Signup API endpoint failed:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.log('📄 Error details:', errorData);
      }
    } catch (error) {
      console.log('❌ API endpoint test failed:', error.message);
    }

    console.log('\n🎉 Signup Feature Tests Completed!');

  } catch (error) {
    console.error('❌ Signup test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testSignupFeature(); 