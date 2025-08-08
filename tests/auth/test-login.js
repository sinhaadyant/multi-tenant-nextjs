const puppeteer = require('puppeteer');

async function testLoginFeature() {
  console.log('🔐 Testing Login Feature...\n');
  
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

    // Test Login Page Access
    console.log('📋 Test 1: Login Page Access');
    console.log('============================');
    await page.goto('http://localhost:3000/superadmin/login', { waitUntil: 'networkidle0' });
    console.log('✅ Login page loaded successfully');
    
    // Test Form Elements
    console.log('\n📋 Test 2: Form Elements');
    console.log('==========================');
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (emailInput) console.log('✅ Email input field found');
    if (passwordInput) console.log('✅ Password input field found');
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

    // Test Invalid Credentials
    console.log('\n📋 Test 4: Invalid Credentials');
    console.log('================================');
    
    await page.type('input[type="email"]', 'invalid@email.com');
    await page.type('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForResponse(response => response.url().includes('/api/superadmin/auth/login'), { timeout: 10000 });
      console.log('✅ Invalid credentials API call made');
      
      // Check for error message
      const errorElement = await page.$('.text-red-500, .text-red-600, [class*="error"]');
      if (errorElement) {
        const errorText = await errorElement.evaluate(el => el.textContent);
        console.log('✅ Error message displayed:', errorText);
      }
    } catch (error) {
      console.log('❌ Invalid credentials test failed');
    }

    // Test Valid Login
    console.log('\n📋 Test 5: Valid Login');
    console.log('=======================');
    
    // Clear form
    await page.evaluate(() => {
      document.querySelector('input[type="email"]').value = '';
      document.querySelector('input[type="password"]').value = '';
    });
    
    // Fill with valid credentials
    await page.type('input[type="email"]', 'admin@superadmin.com');
    await page.type('input[type="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForNavigation({ timeout: 10000 });
      console.log('✅ Login successful, redirected to dashboard');
      
      // Check if we're on dashboard
      const currentUrl = page.url();
      if (currentUrl.includes('/superadmin/dashboard')) {
        console.log('✅ Successfully logged in and on dashboard');
      } else {
        console.log('❌ Login failed, still on login page');
      }
    } catch (error) {
      console.log('❌ Login failed or no navigation occurred');
    }

    // Test Token Storage
    console.log('\n📋 Test 6: Token Storage');
    console.log('==========================');
    
    const localStorage = await page.evaluate(() => {
      return {
        persistRoot: localStorage.getItem('persist:superadmin-root'),
        refreshToken: localStorage.getItem('refresh_token'),
        accessToken: sessionStorage.getItem('access_token')
      };
    });
    
    console.log('📦 localStorage persist:superadmin-root:', localStorage.persistRoot ? 'EXISTS' : 'NOT FOUND');
    console.log('📦 localStorage refresh_token:', localStorage.refreshToken ? 'EXISTS' : 'NOT FOUND');
    console.log('📦 sessionStorage access_token:', localStorage.accessToken ? 'EXISTS' : 'NOT FOUND');

    // Test Cookies
    console.log('\n📋 Test 7: Cookies');
    console.log('==================');
    
    const cookies = await page.cookies();
    const superadminToken = cookies.find(cookie => cookie.name === 'superadmin_token');
    console.log('🍪 superadmin_token cookie:', superadminToken ? 'EXISTS' : 'NOT FOUND');

    console.log('\n🎉 Login Feature Tests Completed!');

  } catch (error) {
    console.error('❌ Login test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testLoginFeature(); 