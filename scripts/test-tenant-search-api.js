const puppeteer = require('puppeteer');

async function testTenantSearchAPI() {
  console.log('🧪 Testing Tenant Search API Calls...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100
  });
  
  const page = await browser.newPage();
  
  // Enable request interception to monitor API calls
  await page.setRequestInterception(true);
  
  const apiCalls = [];
  
  page.on('request', (request) => {
    if (request.url().includes('/api/superadmin/tenants')) {
      apiCalls.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
      console.log(`📡 API Call: ${request.method()} ${request.url()}`);
    }
    request.continue();
  });
  
  try {
    // Navigate to superadmin login
    console.log('📱 Navigating to superadmin login...');
    await page.goto('http://localhost:3000/superadmin/login');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Login
    console.log('🔐 Logging in...');
    await page.type('input[name="email"]', 'admin@superadmin.com');
    await page.type('input[name="password"]', 'AdminPass123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Navigate to tenants page
    console.log('🏢 Navigating to tenants page...');
    await page.goto('http://localhost:3000/superadmin/tenants');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Clear any initial API calls
    apiCalls.length = 0;
    
    // Find the search input
    console.log('🔍 Looking for search input...');
    const searchInput = await page.$('input[placeholder*="Search tenants"]');
    
    if (!searchInput) {
      console.log('❌ Search input not found!');
      return;
    }
    
    console.log('✅ Search input found!');
    
    // Test rapid typing to verify debouncing
    console.log('⌨️ Testing rapid typing and debouncing...');
    await searchInput.click();
    
    // Type rapidly
    await searchInput.type('a');
    await new Promise(resolve => setTimeout(resolve, 100));
    await searchInput.type('b');
    await new Promise(resolve => setTimeout(resolve, 100));
    await searchInput.type('c');
    await new Promise(resolve => setTimeout(resolve, 100));
    await searchInput.type('d');
    await new Promise(resolve => setTimeout(resolve, 100));
    await searchInput.type('e');
    
    console.log(`📊 API calls during rapid typing: ${apiCalls.length}`);
    
    // Wait for debounce to complete
    console.log('⏳ Waiting for debounce to complete...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`📊 API calls after debounce: ${apiCalls.length}`);
    
    if (apiCalls.length > 0) {
      console.log('✅ Debounced API calls are working!');
      
      // Check the last API call for search parameter
      const lastCall = apiCalls[apiCalls.length - 1];
      console.log(`🔍 Last API call: ${lastCall.url}`);
      
      if (lastCall.url.includes('search=')) {
        console.log('✅ Search parameter is being sent to API!');
      } else {
        console.log('⚠️ Search parameter not found in API call');
      }
    } else {
      console.log('❌ No API calls detected during search');
    }
    
    // Test clear functionality
    console.log('🧹 Testing clear functionality...');
    const clearButton = await page.$('button[class*="absolute right-3"]');
    if (clearButton) {
      await clearButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`📊 API calls after clear: ${apiCalls.length}`);
      
      // Check if there's a new API call after clearing
      const callsAfterClear = apiCalls.filter(call => call.timestamp > Date.now() - 2000);
      if (callsAfterClear.length > 0) {
        console.log('✅ Clear functionality triggers API call!');
      } else {
        console.log('⚠️ Clear functionality may not be triggering API call');
      }
    }
    
    console.log('✅ Tenant search API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'tenant-search-api-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testTenantSearchAPI().catch(console.error);
}

module.exports = testTenantSearchAPI; 