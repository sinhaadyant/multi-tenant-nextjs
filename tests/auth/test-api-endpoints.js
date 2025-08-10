const puppeteer = require('puppeteer');

async function testAPIEndpoints() {
  console.log('🔍 Testing API Endpoints...\n');
  
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

    // Test Login API
    console.log('📋 Test 1: Login API');
    console.log('====================');
    
    await page.goto('http://localhost:3000/superadmin/login', { waitUntil: 'networkidle0' });
    
    // Fill with valid credentials
    await page.type('input[type="email"]', 'admin@superadmin.com');
    await page.type('input[type="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForNavigation({ timeout: 15000 });
      console.log('✅ Login successful');
      
      // Wait for dashboard to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check for API errors
      const consoleLogs = [];
      page.on('console', msg => {
        if (msg.text().includes('API response error') || msg.text().includes('Failed to load resource')) {
          consoleLogs.push(msg.text());
        }
      });
      
      // Wait a bit more to capture any API errors
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (consoleLogs.length > 0) {
        console.log('⚠️ API Errors found:');
        consoleLogs.forEach(log => console.log(`   ${log}`));
      } else {
        console.log('✅ No API errors detected');
      }
      
    } catch (error) {
      console.log('❌ Login failed:', error.message);
    }

    console.log('\n🎉 API Endpoint Tests Completed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testAPIEndpoints(); 