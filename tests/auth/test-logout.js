const puppeteer = require('puppeteer');

async function testLogoutFeature() {
  console.log('🚪 Testing Logout Feature...\n');
  
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

    // First, login to test logout
    console.log('📋 Test 1: Login to Test Logout');
    console.log('===============================');
    
    await page.goto('http://localhost:3000/superadmin/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'admin@superadmin.com');
    await page.type('input[type="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForNavigation({ timeout: 10000 });
      console.log('✅ Login successful, redirected to dashboard');
    } catch (error) {
      console.log('❌ Login failed, cannot proceed with logout tests');
      return;
    }

    // Test Dashboard Access
    console.log('\n📋 Test 2: Dashboard Access');
    console.log('============================');
    
    const currentUrl = page.url();
    if (currentUrl.includes('/superadmin/dashboard')) {
      console.log('✅ Successfully on dashboard');
    } else {
      console.log('❌ Not on dashboard, cannot test logout');
      return;
    }

    // Test Logout Button Location
    console.log('\n📋 Test 3: Logout Button Location');
    console.log('==================================');
    
    // Look for logout button in different locations
    const possibleLogoutSelectors = [
      'button:has-text("Logout")',
      'a:has-text("Logout")',
      '[data-testid="logout"]',
      '[class*="logout"]',
      'button[onclick*="logout"]',
      'a[href*="logout"]'
    ];
    
    let logoutButton = null;
    let logoutButtonLocation = '';
    
    // Check header/navigation area
    const header = await page.$('header, nav, [class*="header"], [class*="nav"]');
    if (header) {
      console.log('✅ Header/navigation area found');
      
      for (const selector of possibleLogoutSelectors) {
        try {
          const button = await header.$(selector);
          if (button) {
            logoutButton = button;
            logoutButtonLocation = 'header/navigation';
            break;
          }
        } catch (error) {
          // Selector not supported, continue
        }
      }
    }
    
    // If not found in header, check entire page
    if (!logoutButton) {
      console.log('🔍 Checking entire page for logout button...');
      
      const allElements = await page.$$('button, a, [data-testid="logout"]');
      for (const element of allElements) {
        const text = await element.evaluate(el => el.textContent?.toLowerCase());
        const testId = await element.evaluate(el => el.getAttribute('data-testid'));
        const className = await element.evaluate(el => el.className?.toLowerCase());
        
        if (text?.includes('logout') || testId === 'logout' || className?.includes('logout')) {
          logoutButton = element;
          logoutButtonLocation = 'page';
          break;
        }
      }
    }
    
    if (logoutButton) {
      console.log(`✅ Logout button found in: ${logoutButtonLocation}`);
    } else {
      console.log('❌ Logout button not found');
      console.log('⚠️ Logout functionality may not be implemented yet');
      
      // Test if logout is accessible via URL
      console.log('\n📋 Test 3.1: Direct Logout URL Access');
      console.log('======================================');
      
      try {
        await page.goto('http://localhost:3000/superadmin/logout', { waitUntil: 'networkidle0', timeout: 5000 });
        const logoutUrl = page.url();
        if (logoutUrl.includes('/login')) {
          console.log('✅ Direct logout URL works');
        } else {
          console.log('❌ Direct logout URL not working');
        }
      } catch (error) {
        console.log('❌ Direct logout URL not accessible');
      }
      
      return;
    }

    // Test Logout Button Click
    console.log('\n📋 Test 4: Logout Button Click');
    console.log('===============================');
    
    try {
      await logoutButton.click();
      console.log('✅ Logout button clicked');
      
      // Wait for navigation or API call
      try {
        await page.waitForNavigation({ timeout: 5000 });
        console.log('✅ Navigation occurred after logout');
      } catch (error) {
        console.log('⚠️ No navigation occurred, checking for API call...');
        
        // Check if there was an API call
        try {
          await page.waitForResponse(response => response.url().includes('/api/superadmin/auth/logout'), { timeout: 5000 });
          console.log('✅ Logout API call made');
        } catch (apiError) {
          console.log('❌ No logout API call detected');
        }
      }
    } catch (error) {
      console.log('❌ Logout button click failed:', error.message);
    }

    // Test Post-Logout State
    console.log('\n📋 Test 5: Post-Logout State');
    console.log('=============================');
    
    const postLogoutUrl = page.url();
    console.log('📍 Post-logout URL:', postLogoutUrl);
    
    if (postLogoutUrl.includes('/superadmin/login')) {
      console.log('✅ Successfully redirected to login page');
    } else if (postLogoutUrl.includes('/superadmin/dashboard')) {
      console.log('❌ Still on dashboard after logout');
    } else {
      console.log('⚠️ Redirected to unexpected page:', postLogoutUrl);
    }

    // Test Token Cleanup
    console.log('\n📋 Test 6: Token Cleanup');
    console.log('==========================');
    
    const localStorage = await page.evaluate(() => {
      return {
        persistRoot: localStorage.getItem('persist:superadmin-root'),
        refreshToken: localStorage.getItem('refresh_token'),
        accessToken: sessionStorage.getItem('access_token')
      };
    });
    
    console.log('📦 localStorage persist:superadmin-root:', localStorage.persistRoot ? 'EXISTS' : 'CLEARED');
    console.log('📦 localStorage refresh_token:', localStorage.refreshToken ? 'EXISTS' : 'CLEARED');
    console.log('📦 sessionStorage access_token:', localStorage.accessToken ? 'EXISTS' : 'CLEARED');

    // Test Cookies Cleanup
    console.log('\n📋 Test 7: Cookies Cleanup');
    console.log('===========================');
    
    const cookies = await page.cookies();
    const superadminToken = cookies.find(cookie => cookie.name === 'superadmin_token');
    console.log('🍪 superadmin_token cookie:', superadminToken ? 'EXISTS' : 'CLEARED');

    // Test Protected Route Access After Logout
    console.log('\n📋 Test 8: Protected Route Access After Logout');
    console.log('================================================');
    
    try {
      await page.goto('http://localhost:3000/superadmin/dashboard', { waitUntil: 'networkidle0' });
      const dashboardUrl = page.url();
      
      if (dashboardUrl.includes('/superadmin/login')) {
        console.log('✅ Protected route correctly redirects to login after logout');
      } else if (dashboardUrl.includes('/superadmin/dashboard')) {
        console.log('❌ Protected route still accessible after logout');
      } else {
        console.log('⚠️ Unexpected redirect after logout');
      }
    } catch (error) {
      console.log('❌ Error testing protected route access');
    }

    // Test API Endpoint Directly
    console.log('\n📋 Test 9: API Endpoint Test');
    console.log('=============================');
    
    try {
      const response = await fetch('http://localhost:3000/api/superadmin/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        console.log('✅ Logout API endpoint working');
        const data = await response.json();
        console.log('📄 API Response:', data.message || 'Success');
      } else {
        console.log('❌ Logout API endpoint failed:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.log('📄 Error details:', errorData);
      }
    } catch (error) {
      console.log('❌ API endpoint test failed:', error.message);
    }

    // Test Re-Login After Logout
    console.log('\n📋 Test 10: Re-Login After Logout');
    console.log('==================================');
    
    await page.goto('http://localhost:3000/superadmin/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'admin@superadmin.com');
    await page.type('input[type="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForNavigation({ timeout: 10000 });
      const reLoginUrl = page.url();
      
      if (reLoginUrl.includes('/superadmin/dashboard')) {
        console.log('✅ Re-login successful after logout');
      } else {
        console.log('❌ Re-login failed after logout');
      }
    } catch (error) {
      console.log('❌ Re-login test failed');
    }

    console.log('\n🎉 Logout Feature Tests Completed!');

  } catch (error) {
    console.error('❌ Logout test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testLogoutFeature(); 