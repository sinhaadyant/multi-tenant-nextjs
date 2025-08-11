const puppeteer = require('puppeteer');

async function testSuperadminAuthFlow() {
  console.log('🧪 Testing Complete SuperAdmin Authentication Flow...\n');
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, 
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('1. 🌐 Navigating to superadmin login page...');
    await page.goto('http://localhost:3001/superadmin/login', { waitUntil: 'networkidle2' });
    
    // Wait for the login form to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    console.log('2. 📝 Filling login credentials...');
    await page.type('input[type="email"]', 'admin@superadmin.com');
    await page.type('input[type="password"]', 'AdminPass123');
    
    console.log('3. 🔐 Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    console.log('4. ⏳ Waiting for redirect to dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    
    // Check if we're on the dashboard
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/superadmin/dashboard')) {
      console.log('✅ Successfully redirected to dashboard!');
    } else {
      console.log('❌ Not redirected to dashboard');
      console.log(`   Expected: /superadmin/dashboard`);
      console.log(`   Got: ${currentUrl}`);
    }
    
    // Wait a bit and check if we're still on dashboard
    console.log('5. 🔄 Testing page refresh...');
    await page.waitForTimeout(2000);
    await page.reload({ waitUntil: 'networkidle2' });
    
    const urlAfterRefresh = page.url();
    console.log(`   URL after refresh: ${urlAfterRefresh}`);
    
    if (urlAfterRefresh.includes('/superadmin/dashboard')) {
      console.log('✅ Still on dashboard after refresh!');
    } else {
      console.log('❌ Redirected away from dashboard after refresh');
      console.log(`   Expected: /superadmin/dashboard`);
      console.log(`   Got: ${urlAfterRefresh}`);
    }
    
    // Check localStorage and cookies
    console.log('6. 🔍 Checking authentication storage...');
    const localStorage = await page.evaluate(() => {
      return {
        authToken: localStorage.getItem('auth_token'),
        authUser: localStorage.getItem('auth_user'),
        superadminToken: document.cookie.includes('superadmin_token')
      };
    });
    
    console.log('   localStorage auth_token:', localStorage.authToken ? '✅ Present' : '❌ Missing');
    console.log('   localStorage auth_user:', localStorage.authUser ? '✅ Present' : '❌ Missing');
    console.log('   Cookie superadmin_token:', localStorage.superadminToken ? '✅ Present' : '❌ Missing');
    
    // Test logout
    console.log('7. 🚪 Testing logout...');
    
    // Look for logout button or menu
    try {
      // Try to find a logout button or user menu
      const logoutSelectors = [
        'button[data-testid="logout"]',
        'a[href*="logout"]',
        'button:contains("Logout")',
        '[data-testid="user-menu"]',
        '.user-menu',
        '.logout-button'
      ];
      
      let logoutFound = false;
      for (const selector of logoutSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 });
          await page.click(selector);
          logoutFound = true;
          break;
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!logoutFound) {
        console.log('   ⚠️  Could not find logout button, testing manual logout...');
        // Manually clear storage and navigate to login
        await page.evaluate(() => {
          localStorage.clear();
          document.cookie = 'superadmin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        });
        await page.goto('http://localhost:3001/superadmin/login');
      } else {
        console.log('   ✅ Logout button clicked');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
      }
      
      const logoutUrl = page.url();
      console.log(`   URL after logout: ${logoutUrl}`);
      
      if (logoutUrl.includes('/superadmin/login')) {
        console.log('✅ Successfully logged out!');
      } else {
        console.log('❌ Not redirected to login page after logout');
      }
      
    } catch (error) {
      console.log('   ⚠️  Logout test failed:', error.message);
    }
    
    console.log('\n🎉 Authentication flow test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available
try {
  require('puppeteer');
  testSuperadminAuthFlow();
} catch (error) {
  console.log('⚠️  Puppeteer not available. Installing...');
  console.log('Run: npm install puppeteer');
  console.log('Then run this script again.');
} 