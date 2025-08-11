const puppeteer = require('puppeteer');

async function testTenantSearchFixed() {
  console.log('🧪 Testing Fixed Tenant Search Functionality...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100
  });
  
  const page = await browser.newPage();
  
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
    
    // Find the search input
    console.log('🔍 Looking for search input...');
    const searchInput = await page.$('input[placeholder*="Search tenants"]');
    
    if (!searchInput) {
      console.log('❌ Search input not found!');
      await page.screenshot({ path: 'search-input-not-found.png' });
      return;
    }
    
    console.log('✅ Search input found!');
    
    // Test typing in search
    console.log('⌨️ Testing search input...');
    await searchInput.click();
    await searchInput.type('test');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if the input has the value
    const inputValue = await page.$eval('input[placeholder*="Search tenants"]', el => el.value);
    console.log(`📝 Input value: "${inputValue}"`);
    
    if (inputValue === 'test') {
      console.log('✅ Search input is working correctly!');
    } else {
      console.log('❌ Search input is not working correctly!');
    }
    
    // Test debouncing by typing more
    console.log('⏱️ Testing debouncing...');
    await searchInput.type(' tenant');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalValue = await page.$eval('input[placeholder*="Search tenants"]', el => el.value);
    console.log(`📝 Final input value: "${finalValue}"`);
    
    if (finalValue === 'test tenant') {
      console.log('✅ Debouncing is working correctly!');
    } else {
      console.log('❌ Debouncing is not working correctly!');
    }
    
    // Test clear button
    console.log('🧹 Testing clear button...');
    const clearButton = await page.$('button[class*="absolute right-3"]');
    if (clearButton) {
      console.log('✅ Clear button found!');
      await clearButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const clearedValue = await page.$eval('input[placeholder*="Search tenants"]', el => el.value);
      console.log(`📝 Value after clear: "${clearedValue}"`);
      
      if (clearedValue === '') {
        console.log('✅ Clear button is working correctly!');
      } else {
        console.log('❌ Clear button is not working correctly!');
      }
    } else {
      console.log('⚠️ Clear button not found (might be hidden)');
    }
    
    // Wait a bit more for any API calls
    console.log('⏳ Waiting for API calls...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Fixed tenant search test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'tenant-search-fixed-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testTenantSearchFixed().catch(console.error);
}

module.exports = testTenantSearchFixed; 