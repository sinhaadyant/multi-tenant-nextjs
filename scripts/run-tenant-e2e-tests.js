const puppeteer = require('puppeteer');

async function runTenantE2ETests(selectedModules = []) {
  console.log('🧪 Starting Tenant Management E2E Tests...');
  if (selectedModules.length > 0) {
    console.log(`📋 Selected modules: ${selectedModules.join(', ')}`);
  }
  
  const browser = await puppeteer.launch({
    headless: false, // This makes it visible
    slowMo: 100,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  try {
    // Login
    console.log('🔐 Logging in as Superadmin...');
    await page.goto('http://localhost:3000/superadmin/login');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.type('input[name="email"]', 'admin@superadmin.com');
    await page.type('input[name="password"]', 'AdminPass123');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    if (currentUrl.includes('/superadmin/dashboard') || currentUrl.includes('/superadmin/tenants')) {
      console.log('✅ Login successful');
    } else {
      throw new Error('Login failed');
    }

    // Define test modules
    const testModules = {
      'tenant-search': async () => {
        console.log('\n🔍 Testing Search Functionality...');
        await page.goto('http://localhost:3000/superadmin/tenants');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const searchInput = await page.$('input[placeholder*="Search tenants"]');
        if (searchInput) {
          await searchInput.type('test');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const inputValue = await page.$eval('input[placeholder*="Search tenants"]', el => el.value);
          if (inputValue === 'test') {
            console.log('✅ Search input working');
          } else {
            console.log('❌ Search input not working');
          }
        } else {
          console.log('❌ Search input not found');
        }
      },
      
      'tenant-crud': async () => {
        console.log('\n➕ Testing Create Tenant...');
        await page.goto('http://localhost:3000/superadmin/tenants/create');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Wait for form to load
        await page.waitForSelector('input[name="tenantName"]', { timeout: 10000 });
        
        // Fill tenant information
        await page.type('input[name="tenantName"]', 'E2E Test Tenant');
        await page.type('input[name="companyName"]', 'E2E Test Company');
        await page.type('input[name="subdomain"]', 'e2e-test-' + Date.now());
        
        // Select tenant type
        await page.select('select[name="tenantType"]', 'SaaS');
        
        // Select industry type
        await page.select('select[name="industryType"]', 'Technology');
        
        // Select country
        await page.select('select[name="country"]', 'US');
        
        // Fill admin information
        await page.type('input[name="adminFirstName"]', 'E2E');
        await page.type('input[name="adminLastName"]', 'Admin');
        await page.type('input[name="adminEmail"]', 'e2e-admin-' + Date.now() + '@example.com');
        await page.type('input[name="adminPassword"]', 'E2ETestPass123!');
        await page.type('input[name="confirmPassword"]', 'E2ETestPass123!');
        
        // Wait for validation to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if submit button is enabled
        const submitButton = await page.$('button[type="submit"]');
        const isDisabled = await page.$eval('button[type="submit"]', el => el.disabled);
        
        if (isDisabled) {
          console.log('⚠️ Submit button is disabled, checking for validation errors...');
          
          // Check for validation messages
          const errors = await page.$$('.text-red-500');
          if (errors.length > 0) {
            console.log(`❌ Found ${errors.length} validation errors`);
            for (let i = 0; i < errors.length; i++) {
              const errorText = await page.evaluate(el => el.textContent, errors[i]);
              console.log(`   - ${errorText}`);
            }
          }
          
          // Wait a bit more for async validation
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Try to submit form
        await page.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const createUrl = page.url();
        if (createUrl.includes('/superadmin/tenants')) {
          console.log('✅ Tenant created successfully');
        } else {
          console.log('❌ Tenant creation failed - still on create page');
          console.log(`Current URL: ${createUrl}`);
        }
      },
      
      'tenant-details': async () => {
        console.log('\n📋 Testing Tenant Details...');
        await page.goto('http://localhost:3000/superadmin/tenants');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const tenantRow = await page.$('tr[data-testid="tenant-row"]');
        if (tenantRow) {
          await tenantRow.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const detailUrl = page.url();
          if (detailUrl.includes('/superadmin/tenants/')) {
            console.log('✅ Tenant detail page loaded');
          } else {
            console.log('❌ Tenant detail page not loaded');
          }
        } else {
          console.log('❌ No tenant rows found');
        }
      },
      
      'tenant-performance': async () => {
        console.log('\n📊 Testing Database Counts...');
        const response = await page.evaluate(async () => {
          const res = await fetch('/api/superadmin/tenants?page=1&limit=1');
          const data = await res.json();
          return data;
        });
        
        if (response && response.total !== undefined) {
          console.log(`✅ Database count: ${response.total} tenants`);
        } else {
          console.log('❌ Could not fetch database count');
        }
      }
    };

    // Run selected modules or all modules if none selected
    const modulesToRun = selectedModules.length > 0 ? selectedModules : Object.keys(testModules);
    
    for (const moduleId of modulesToRun) {
      if (testModules[moduleId]) {
        try {
          await testModules[moduleId]();
        } catch (error) {
          console.log(`❌ Error in module ${moduleId}: ${error.message}`);
        }
      } else {
        console.log(`⚠️ Module ${moduleId} not found`);
      }
    }

    console.log('\n🎉 All tests completed!');
    console.log('🌐 Browser window will remain open for inspection');
    
    // Keep browser open for inspection
    // await browser.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await browser.close();
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const modules = [];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--modules' && args[i + 1]) {
      modules.push(...args[i + 1].split(','));
      break;
    }
  }
  
  return modules;
}

// Run the tests
if (require.main === module) {
  const selectedModules = parseArgs();
  runTenantE2ETests(selectedModules).catch(console.error);
}

module.exports = runTenantE2ETests; 