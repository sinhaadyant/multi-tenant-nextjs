const puppeteer = require('puppeteer');

async function testLogin() {
  console.log('🧪 Testing Login Functionality...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to superadmin login
    console.log('📱 Navigating to superadmin login...');
    await page.goto('http://localhost:3000/superadmin/login');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if the page loaded properly
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Check if email input exists
    const emailInput = await page.$('input[name="email"]');
    if (emailInput) {
      console.log('✅ Email input found');
    } else {
      console.log('❌ Email input not found');
      await page.screenshot({ path: 'login-page.png' });
      return;
    }
    
    // Check if password input exists
    const passwordInput = await page.$('input[name="password"]');
    if (passwordInput) {
      console.log('✅ Password input found');
    } else {
      console.log('❌ Password input not found');
      return;
    }
    
    // Try to login
    console.log('🔐 Attempting login...');
    await page.type('input[name="email"]', 'admin@superadmin.com');
    await page.type('input[name="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('/superadmin/dashboard')) {
      console.log('✅ Login successful!');
    } else {
      console.log('❌ Login failed or redirected to:', currentUrl);
      
      // Check for error messages
      const errorElement = await page.$('.text-red-500, .text-red-800');
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement);
        console.log('❌ Error message:', errorText);
      }
      
      await page.screenshot({ path: 'login-failed.png' });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'login-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testLogin().catch(console.error); 