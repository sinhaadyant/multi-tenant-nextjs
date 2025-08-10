const puppeteer = require('puppeteer');

async function testDashboardSimple() {
  console.log('🔍 Testing Dashboard Simple...\n');
  
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

    // Enable error capture
    page.on('pageerror', error => {
      console.error(`❌ Page Error: ${error.message}`);
    });

    // Test Login and Dashboard Access
    console.log('📋 Test 1: Login and Dashboard Access');
    console.log('=====================================');
    
    // Login first
    await page.goto('http://localhost:3000/superadmin/login', { waitUntil: 'networkidle0', timeout: 60000 });
    console.log('✅ Login page loaded');
    
    await page.type('input[type="email"]', 'admin@superadmin.com');
    await page.type('input[type="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ timeout: 30000 });
    console.log('✅ Login successful');
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000/superadmin/dashboard', { waitUntil: 'networkidle0', timeout: 60000 });
    console.log('✅ Dashboard page loaded');
    
    // Wait a bit for content to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check what's actually on the page
    console.log('\n📋 Test 2: Page Content Analysis');
    console.log('================================');
    
    // Get page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Get current URL
    const url = page.url();
    console.log('🌐 Current URL:', url);
    
    // Check for h1 elements
    const h1Elements = await page.$$eval('h1', elements => elements.map(el => el.textContent));
    console.log('📝 H1 elements found:', h1Elements);
    
    // Check for any text content
    const bodyText = await page.$eval('body', el => el.textContent);
    console.log('📄 Body text preview:', bodyText.substring(0, 200) + '...');
    
    // Check for any div elements with text
    const divElements = await page.$$eval('div', elements => 
      elements
        .filter(el => el.textContent && el.textContent.trim().length > 0)
        .slice(0, 10)
        .map(el => el.textContent.trim().substring(0, 50))
    );
    console.log('📝 First 10 div elements with text:', divElements);
    
    // Take a screenshot
    await page.screenshot({ 
      path: './test-screenshots/dashboard-debug.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved as dashboard-debug.png');

    console.log('\n🎉 Dashboard Simple Test Completed!');

  } catch (error) {
    console.error('❌ Dashboard test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testDashboardSimple(); 