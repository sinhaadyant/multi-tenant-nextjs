const puppeteer = require('puppeteer');

async function basicSignupTest() {
  let browser = null;
  let page = null;
  
  try {
    console.log('🚀 Starting basic SuperAdmin signup test...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    console.log('✅ Browser launched successfully');
    
    // Navigate to signup page with invalid token
    console.log('📝 Testing invalid token access...');
    await page.goto('http://localhost:3000/superadmin/signup?token=invalid-token&email=test@example.com', {
      waitUntil: 'networkidle0'
    });
    
    // Check page content
    const pageContent = await page.content();
    const currentUrl = page.url();
    
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Page contains 'Invalid': ${pageContent.includes('Invalid')}`);
    console.log(`Page contains 'Error': ${pageContent.includes('Error')}`);
    console.log(`Page contains 'not found': ${pageContent.includes('not found')}`);
    
    if (currentUrl.includes('/superadmin/login') || 
        pageContent.includes('Invalid') || 
        pageContent.includes('Error') ||
        pageContent.includes('not found')) {
      console.log('✅ Invalid token properly rejected');
    } else {
      console.log('❌ Invalid token not properly handled');
    }
    
    console.log('🎉 Basic test completed successfully!');
    
  } catch (error) {
    console.error('❌ Basic test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
basicSignupTest(); 