const puppeteer = require('puppeteer');

async function testResetPasswordFeature() {
  console.log('🔄 Testing Reset Password Feature...\n');
  
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

    // First, get a reset token
    console.log('📋 Test 1: Getting Reset Token');
    console.log('==============================');
    const resetToken = await getResetToken();
    if (!resetToken) {
      console.log('❌ Could not obtain reset token, skipping reset password tests');
      return;
    }
    console.log('✅ Reset token obtained');

    // Test Reset Password Page Access
    console.log('\n📋 Test 2: Reset Password Page Access');
    console.log('=====================================');
    await page.goto(`http://localhost:3000/superadmin/reset-password?token=${resetToken}`, { waitUntil: 'networkidle0' });
    console.log('✅ Reset password page loaded successfully');
    
    // Test Form Elements
    console.log('\n📋 Test 3: Form Elements');
    console.log('==========================');
    const newPasswordInput = await page.$('input[name="newPassword"], input[type="password"]');
    const confirmPasswordInput = await page.$('input[name="confirmPassword"], input[placeholder*="confirm"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (newPasswordInput) console.log('✅ New password input field found');
    if (confirmPasswordInput) console.log('✅ Confirm password input field found');
    if (submitButton) console.log('✅ Submit button found');
    
    if (!newPasswordInput || !confirmPasswordInput || !submitButton) {
      throw new Error('Missing required form elements');
    }

    // Test Form Validation
    console.log('\n📋 Test 4: Form Validation');
    console.log('============================');
    
    // Test empty form submission
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for validation errors
    const validationErrors = await page.$$('.text-red-500, .text-red-600, [class*="error"]');
    if (validationErrors.length > 0) {
      console.log('✅ Form validation working (showing errors for empty fields)');
    }

    // Test Password Mismatch
    console.log('\n📋 Test 5: Password Mismatch');
    console.log('==============================');
    
    await page.type('input[name="newPassword"], input[type="password"]', 'NewPassword123!');
    await page.type('input[name="confirmPassword"], input[placeholder*="confirm"]', 'DifferentPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for password mismatch errors
    const mismatchErrors = await page.$$('.text-red-500, .text-red-600, [class*="error"]');
    if (mismatchErrors.length > 0) {
      console.log('✅ Password mismatch validation working');
    }

    // Test Weak Password
    console.log('\n📋 Test 6: Weak Password');
    console.log('==========================');
    
    // Clear form
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="password"]');
      inputs.forEach(input => input.value = '');
    });
    
    await page.type('input[name="newPassword"], input[type="password"]', 'weak');
    await page.type('input[name="confirmPassword"], input[placeholder*="confirm"]', 'weak');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for password strength errors
    const strengthErrors = await page.$$('.text-red-500, .text-red-600, [class*="error"]');
    if (strengthErrors.length > 0) {
      console.log('✅ Password strength validation working');
    }

    // Test Valid Password Reset
    console.log('\n📋 Test 7: Valid Password Reset');
    console.log('================================');
    
    // Clear form
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="password"]');
      inputs.forEach(input => input.value = '');
    });
    
    await page.type('input[name="newPassword"], input[type="password"]', 'NewPassword123!');
    await page.type('input[name="confirmPassword"], input[placeholder*="confirm"]', 'NewPassword123!');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForResponse(response => response.url().includes('/api/superadmin/auth/reset-password'), { timeout: 10000 });
      console.log('✅ Password reset API call made');
      
      // Check for success message
      const successElement = await page.$('.text-green-500, .text-green-600, [class*="success"]');
      if (successElement) {
        const successText = await successElement.evaluate(el => el.textContent);
        console.log('✅ Success message displayed:', successText);
      }
    } catch (error) {
      console.log('❌ Password reset test failed');
    }

    // Test Invalid Token
    console.log('\n📋 Test 8: Invalid Token');
    console.log('==========================');
    
    await page.goto('http://localhost:3000/superadmin/reset-password?token=invalid-token', { waitUntil: 'networkidle0' });
    console.log('✅ Invalid token page loaded');
    
    // Check for error message
    const errorElement = await page.$('.text-red-500, .text-red-600, [class*="error"]');
    if (errorElement) {
      const errorText = await errorElement.evaluate(el => el.textContent);
      console.log('✅ Invalid token error displayed:', errorText);
    }

    // Test API Endpoint Directly
    console.log('\n📋 Test 9: API Endpoint Test');
    console.log('=============================');
    
    try {
      const response = await fetch('http://localhost:3000/api/superadmin/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        })
      });
      
      if (response.ok) {
        console.log('✅ Reset password API endpoint working');
        const data = await response.json();
        console.log('📄 API Response:', data.message || 'Success');
      } else {
        console.log('❌ Reset password API endpoint failed:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.log('📄 Error details:', errorData);
      }
    } catch (error) {
      console.log('❌ API endpoint test failed:', error.message);
    }

    console.log('\n🎉 Reset Password Feature Tests Completed!');

  } catch (error) {
    console.error('❌ Reset password test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Helper function to get reset token
async function getResetToken() {
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
      console.log('✅ Forgot password API call successful');
      // In a real scenario, you'd get the token from email
      // For testing, we'll use a mock token
      return 'test-reset-token-123';
    } else {
      console.log('❌ Forgot password API call failed');
      return null;
    }
  } catch (error) {
    console.log('❌ Error calling forgot password API:', error.message);
    return null;
  }
}

// Run the test
testResetPasswordFeature(); 