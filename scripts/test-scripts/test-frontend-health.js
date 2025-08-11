const puppeteer = require('puppeteer');

async function testFrontendHealth() {
  let browser;
  
  try {
    console.log('🧪 Testing frontend health...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to the login page
    console.log('🌐 Navigating to login page...');
    await page.goto('http://localhost:3000/superadmin/login', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Check if the page loaded without errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    // Wait a bit for any errors to appear
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (pageErrors.length > 0) {
      console.log('❌ Page errors found:');
      pageErrors.forEach(error => console.log(`  - ${error}`));
      return false;
    }
    
    // Check if the login form is present
    const loginForm = await page.$('form');
    if (!loginForm) {
      console.log('❌ Login form not found');
      return false;
    }
    
    // Check if email and password inputs are present
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (!emailInput || !passwordInput) {
      console.log('❌ Login inputs not found');
      return false;
    }
    
    console.log('✅ Frontend is healthy!');
    console.log('✅ Login page loaded successfully');
    console.log('✅ Login form is present');
    console.log('✅ Email and password inputs are present');
    
    return true;
    
  } catch (error) {
    console.error('❌ Frontend health check failed:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testFrontendHealth().then(success => {
  if (success) {
    console.log('🎉 Frontend is ready for e2e tests!');
    process.exit(0);
  } else {
    console.log('💥 Frontend has issues that need to be fixed');
    process.exit(1);
  }
}); 