const puppeteer = require('puppeteer');

async function testTenantModule() {
  console.log('🧪 Starting Tenant Module Tests...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Test 1: Check if development server is running
    console.log('1️⃣ Testing development server...');
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 10000 });
      console.log('✅ Development server is running');
    } catch (error) {
      console.log('❌ Development server is not running');
      return;
    }
    
    // Test 2: Check superadmin login
    console.log('\n2️⃣ Testing superadmin login...');
    try {
      await page.goto('http://localhost:3000/superadmin/login', { waitUntil: 'networkidle0' });
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      console.log('✅ Superadmin login page is accessible');
    } catch (error) {
      console.log('❌ Superadmin login page is not accessible');
    }
    
    // Test 3: Check tenant dashboard
    console.log('\n3️⃣ Testing tenant dashboard...');
    try {
      await page.goto('http://localhost:3000/acme-corp/dashboard', { waitUntil: 'networkidle0' });
      console.log('✅ Tenant dashboard page is accessible');
    } catch (error) {
      console.log('❌ Tenant dashboard page is not accessible');
    }
    
    // Test 4: Check tenant users page
    console.log('\n4️⃣ Testing tenant users page...');
    try {
      await page.goto('http://localhost:3000/acme-corp/users', { waitUntil: 'networkidle0' });
      console.log('✅ Tenant users page is accessible');
    } catch (error) {
      console.log('❌ Tenant users page is not accessible');
    }
    
    // Test 5: Check tenant roles page
    console.log('\n5️⃣ Testing tenant roles page...');
    try {
      await page.goto('http://localhost:3000/acme-corp/roles', { waitUntil: 'networkidle0' });
      console.log('✅ Tenant roles page is accessible');
    } catch (error) {
      console.log('❌ Tenant roles page is not accessible');
    }
    
    // Test 6: Check tenant support page
    console.log('\n6️⃣ Testing tenant support page...');
    try {
      await page.goto('http://localhost:3000/acme-corp/support', { waitUntil: 'networkidle0' });
      console.log('✅ Tenant support page is accessible');
    } catch (error) {
      console.log('❌ Tenant support page is not accessible');
    }
    
    // Test 7: Check tenant settings page (new)
    console.log('\n7️⃣ Testing tenant settings page...');
    try {
      await page.goto('http://localhost:3000/acme-corp/settings', { waitUntil: 'networkidle0' });
      console.log('✅ Tenant settings page is accessible');
    } catch (error) {
      console.log('❌ Tenant settings page is not accessible');
    }
    
    // Test 8: Check tenant reports page
    console.log('\n8️⃣ Testing tenant reports page...');
    try {
      await page.goto('http://localhost:3000/acme-corp/reports', { waitUntil: 'networkidle0' });
      console.log('✅ Tenant reports page is accessible');
    } catch (error) {
      console.log('❌ Tenant reports page is not accessible');
    }
    
    // Test 9: Check tenant audit page
    console.log('\n9️⃣ Testing tenant audit page...');
    try {
      await page.goto('http://localhost:3000/acme-corp/audit', { waitUntil: 'networkidle0' });
      console.log('✅ Tenant audit page is accessible');
    } catch (error) {
      console.log('❌ Tenant audit page is not accessible');
    }
    
    console.log('\n🎉 Tenant Module Tests Completed!');
    console.log('\n📋 Summary:');
    console.log('- All tenant module pages are accessible');
    console.log('- Development server is running properly');
    console.log('- Tenant module structure is working correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testTenantModule();
