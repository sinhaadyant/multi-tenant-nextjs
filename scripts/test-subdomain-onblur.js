const puppeteer = require('puppeteer');

async function testSubdomainOnBlur() {
  console.log('🧪 Testing Subdomain OnBlur Functionality...\n');

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, 
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Navigate to the superadmin login page
    console.log('1. Navigating to superadmin login...');
    await page.goto('http://localhost:3000/superadmin/login', { waitUntil: 'networkidle0' });

    // Login as superadmin
    console.log('2. Logging in as superadmin...');
    await page.type('input[name="email"]', 'admin@superadmin.com');
    await page.type('input[name="password"]', 'AdminPass123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Login successful\n');

    // Navigate to create tenant page
    console.log('3. Navigating to create tenant page...');
    await page.goto('http://localhost:3000/superadmin/tenants/create', { waitUntil: 'networkidle0' });
    console.log('✅ Create tenant page loaded\n');

    // Test 1: Enter valid subdomain and blur
    console.log('4. Testing valid subdomain on blur...');
    await page.type('input[name="subdomain"]', 'test-company-123');
    await page.click('input[name="subdomain"]'); // Focus
    await page.click('body'); // Blur by clicking outside
    
    // Wait for subdomain check to complete
    await page.waitForTimeout(2000);
    
    // Check if validation message appears
    const validationMessage = await page.$eval('p.text-green-500', el => el.textContent).catch(() => null);
    if (validationMessage && validationMessage.includes('Subdomain is available')) {
      console.log('✅ Valid subdomain check on blur working');
    } else {
      console.log('❌ Valid subdomain check on blur failed');
    }

    console.log('\n🎉 Subdomain onBlur testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testSubdomainOnBlur();
