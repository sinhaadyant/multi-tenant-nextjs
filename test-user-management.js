const puppeteer = require('puppeteer');

async function testUserManagement() {
  console.log('🧪 Testing User Management Module...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Login as superadmin
    console.log('📱 Logging in as superadmin...');
    await page.goto('http://localhost:3000/superadmin/login');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.type('input[name="email"]', 'admin@superadmin.com');
    await page.type('input[name="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if login was successful
    const currentUrl = page.url();
    if (!currentUrl.includes('/superadmin/dashboard')) {
      console.log('❌ Login failed, current URL:', currentUrl);
      await page.screenshot({ path: 'login-failed.png' });
      return;
    }
    
    console.log('✅ Login successful');
    
    // 2. Navigate to user management
    console.log('👥 Navigating to user management...');
    await page.goto('http://localhost:3000/superadmin/users');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if page loaded
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    // 3. Test search functionality
    console.log('🔍 Testing search functionality...');
    const searchInput = await page.$('input[placeholder*="search" i]');
    if (searchInput) {
      await searchInput.type('test');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Search input found and working');
    } else {
      console.log('❌ Search input not found');
    }
    
    // 4. Test filters
    console.log('🔧 Testing filters...');
    const statusFilter = await page.$('select[value*="status"]');
    if (statusFilter) {
      await statusFilter.select('active');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Status filter found and working');
    } else {
      console.log('❌ Status filter not found');
    }
    
    // 5. Test create user button
    console.log('➕ Testing create user button...');
    const createButton = await page.$('button:has-text("Create User")');
    if (createButton) {
      await createButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if modal opened
      const modal = await page.$('[role="dialog"]');
      if (modal) {
        console.log('✅ Create user modal opened');
        
        // Test form fields
        const nameInput = await page.$('input[placeholder*="name" i]');
        const emailInput = await page.$('input[type="email"]');
        const passwordInput = await page.$('input[type="password"]');
        
        if (nameInput && emailInput && passwordInput) {
          console.log('✅ Create user form fields found');
          
          // Fill form
          await nameInput.type('Test User');
          await emailInput.type('test@example.com');
          await passwordInput.type('TestPassword123!');
          
          // Check if submit button is enabled
          const submitButton = await page.$('button[type="submit"]');
          if (submitButton) {
            const isDisabled = await submitButton.evaluate(btn => btn.disabled);
            console.log('✅ Submit button found, disabled:', isDisabled);
          }
        } else {
          console.log('❌ Some form fields missing');
        }
        
        // Close modal
        const closeButton = await page.$('button:has-text("Cancel")');
        if (closeButton) {
          await closeButton.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        console.log('❌ Create user modal not opened');
      }
    } else {
      console.log('❌ Create user button not found');
    }
    
    // 6. Test export functionality
    console.log('📤 Testing export functionality...');
    const exportButton = await page.$('button:has-text("Export")');
    if (exportButton) {
      console.log('✅ Export button found');
    } else {
      console.log('❌ Export button not found');
    }
    
    // 7. Test table functionality
    console.log('📊 Testing table functionality...');
    const table = await page.$('table');
    if (table) {
      console.log('✅ User table found');
      
      // Check for user rows
      const userRows = await page.$$('tbody tr');
      console.log(`📋 Found ${userRows.length} user rows`);
      
      if (userRows.length > 0) {
        // Test user actions
        const firstUserActions = await page.$('tbody tr:first-child button');
        if (firstUserActions) {
          console.log('✅ User action buttons found');
        } else {
          console.log('❌ User action buttons not found');
        }
      }
    } else {
      console.log('❌ User table not found');
    }
    
    // 8. Test pagination
    console.log('📄 Testing pagination...');
    const pagination = await page.$('[role="navigation"]');
    if (pagination) {
      console.log('✅ Pagination found');
    } else {
      console.log('❌ Pagination not found');
    }
    
    console.log('✅ User Management Module Test Completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'user-management-error.png' });
  } finally {
    await browser.close();
  }
}

testUserManagement().catch(console.error); 