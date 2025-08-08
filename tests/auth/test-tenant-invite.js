const puppeteer = require('puppeteer');

async function testTenantInviteFeature() {
  console.log('📧 Testing Tenant Invite Feature...\n');
  
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

    // First, login to access tenant management
    console.log('📋 Test 1: Login to Access Tenant Management');
    console.log('============================================');
    
    await page.goto('http://localhost:3000/superadmin/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'admin@superadmin.com');
    await page.type('input[type="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForNavigation({ timeout: 10000 });
      console.log('✅ Login successful, redirected to dashboard');
    } catch (error) {
      console.log('❌ Login failed, cannot proceed with tenant tests');
      return;
    }

    // Test Tenants Page Access
    console.log('\n📋 Test 2: Tenants Page Access');
    console.log('==============================');
    
    await page.goto('http://localhost:3000/superadmin/tenants', { waitUntil: 'networkidle0' });
    console.log('✅ Tenants page loaded successfully');
    
    // Test Page Elements
    console.log('\n📋 Test 3: Page Elements');
    console.log('==========================');
    
    const pageTitle = await page.$('h1, h2, [class*="title"]');
    const tenantsTable = await page.$('table, [class*="table"]');
    const searchInput = await page.$('input[type="search"], input[placeholder*="search"]');
    
    if (pageTitle) console.log('✅ Page title found');
    if (tenantsTable) console.log('✅ Tenants table found');
    if (searchInput) console.log('✅ Search input found');
    
    // Look for invite/create tenant button
    console.log('\n📋 Test 4: Invite/Create Button');
    console.log('================================');
    
    const allButtons = await page.$$('button, a');
    let inviteButton = null;
    let inviteButtonText = '';
    
    for (const button of allButtons) {
      const text = await button.evaluate(el => el.textContent?.toLowerCase());
      const href = await button.evaluate(el => el.href);
      
      if (text?.includes('invite') || text?.includes('create') || text?.includes('new') || 
          text?.includes('add') || href?.includes('new') || href?.includes('create')) {
        inviteButton = button;
        inviteButtonText = text;
        break;
      }
    }
    
    if (inviteButton) {
      console.log(`✅ Invite/Create button found: "${inviteButtonText}"`);
    } else {
      console.log('❌ Invite/Create button not found');
      console.log('⚠️ Tenant invite functionality may not be implemented yet');
      return;
    }

    // Test Button Click and Navigation
    console.log('\n📋 Test 5: Button Navigation');
    console.log('=============================');
    
    try {
      await inviteButton.click();
      await page.waitForNavigation({ timeout: 5000 });
      console.log('✅ Successfully navigated to tenant creation page');
      
      const currentUrl = page.url();
      console.log('📍 Current URL:', currentUrl);
      
      if (currentUrl.includes('/new') || currentUrl.includes('/create')) {
        console.log('✅ URL indicates tenant creation page');
      }
    } catch (error) {
      console.log('❌ Could not navigate to tenant creation page');
      console.log('⚠️ Button click may not be working properly');
      return;
    }

    // Test Tenant Creation Form
    console.log('\n📋 Test 6: Tenant Creation Form');
    console.log('================================');
    
    const tenantForm = await page.$('form');
    if (!tenantForm) {
      console.log('❌ Tenant creation form not found');
      return;
    }
    console.log('✅ Tenant creation form found');
    
    // Test Form Elements
    const nameInput = await page.$('input[name="name"], input[placeholder*="name"]');
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const subdomainInput = await page.$('input[name="subdomain"], input[placeholder*="subdomain"]');
    const planSelect = await page.$('select[name="plan"], [class*="plan-select"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (nameInput) console.log('✅ Name input field found');
    if (emailInput) console.log('✅ Email input field found');
    if (subdomainInput) console.log('✅ Subdomain input field found');
    if (planSelect) console.log('✅ Plan select field found');
    if (submitButton) console.log('✅ Submit button found');

    // Test Form Validation
    console.log('\n📋 Test 7: Form Validation');
    console.log('============================');
    
    // Test empty form submission
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for validation errors
    const validationErrors = await page.$$('.text-red-500, .text-red-600, [class*="error"]');
    if (validationErrors.length > 0) {
      console.log('✅ Form validation working (showing errors for empty fields)');
    }

    // Test Invalid Data
    console.log('\n📋 Test 8: Invalid Data Validation');
    console.log('===================================');
    
    if (nameInput) {
      await page.type('input[name="name"], input[placeholder*="name"]', 'Test Tenant');
    }
    if (emailInput) {
      await page.type('input[type="email"], input[name="email"]', 'invalid-email');
    }
    if (subdomainInput) {
      await page.type('input[name="subdomain"], input[placeholder*="subdomain"]', 'test-tenant');
    }
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check for validation errors
    const dataValidationErrors = await page.$$('.text-red-500, .text-red-600, [class*="error"]');
    if (dataValidationErrors.length > 0) {
      console.log('✅ Data validation working');
    }

    // Test Valid Tenant Creation
    console.log('\n📋 Test 9: Valid Tenant Creation');
    console.log('==================================');
    
    // Clear form
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => input.value = '');
    });
    
    // Fill with valid data
    if (nameInput) {
      await page.type('input[name="name"], input[placeholder*="name"]', 'Test Tenant');
    }
    if (emailInput) {
      await page.type('input[type="email"], input[name="email"]', 'test@tenant.com');
    }
    if (subdomainInput) {
      await page.type('input[name="subdomain"], input[placeholder*="subdomain"]', 'test-tenant');
    }
    
    // Select plan if available
    if (planSelect) {
      await page.select('select[name="plan"], [class*="plan-select"]', 'basic');
    }
    
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForResponse(response => response.url().includes('/api/superadmin/tenants'), { timeout: 10000 });
      console.log('✅ Tenant creation API call made');
      
      // Check for success message
      const successElement = await page.$('.text-green-500, .text-green-600, [class*="success"]');
      if (successElement) {
        const successText = await successElement.evaluate(el => el.textContent);
        console.log('✅ Success message displayed:', successText);
      }
    } catch (error) {
      console.log('❌ Tenant creation test failed');
    }

    // Test Back to Tenants List
    console.log('\n📋 Test 10: Back to Tenants List');
    console.log('=================================');
    
    const backButton = await page.$('a[href*="tenants"], button:has-text("Back"), a:has-text("Cancel")');
    if (backButton) {
      await backButton.click();
      try {
        await page.waitForNavigation({ timeout: 5000 });
        const currentUrl = page.url();
        if (currentUrl.includes('/superadmin/tenants')) {
          console.log('✅ Successfully navigated back to tenants list');
        } else {
          console.log('❌ Back navigation failed');
        }
      } catch (error) {
        console.log('❌ Back navigation failed');
      }
    } else {
      console.log('⚠️ Back button not found');
    }

    // Test API Endpoint Directly
    console.log('\n📋 Test 11: API Endpoint Test');
    console.log('==============================');
    
    try {
      const response = await fetch('http://localhost:3000/api/superadmin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Tenant',
          email: 'test@tenant.com',
          subdomain: 'test-tenant',
          plan: 'basic'
        })
      });
      
      if (response.ok) {
        console.log('✅ Tenant creation API endpoint working');
        const data = await response.json();
        console.log('📄 API Response:', data.message || 'Success');
      } else {
        console.log('❌ Tenant creation API endpoint failed:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.log('📄 Error details:', errorData);
      }
    } catch (error) {
      console.log('❌ API endpoint test failed:', error.message);
    }

    console.log('\n🎉 Tenant Invite Feature Tests Completed!');

  } catch (error) {
    console.error('❌ Tenant invite test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testTenantInviteFeature(); 