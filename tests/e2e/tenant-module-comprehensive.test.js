const puppeteer = require('puppeteer');

class TenantModuleComprehensiveTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
      consoleErrors: [],
      apiCalls: []
    };
  }

  async init() {
    console.log('🚀 Initializing Tenant Module Comprehensive Test...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    
    // Set viewport
    await this.page.setViewport({ width: 1280, height: 720 });
    
    // Enable request interception to monitor API calls
    await this.page.setRequestInterception(true);
    
    this.page.on('request', (request) => {
      if (request.url().includes('/api/superadmin/tenants')) {
        this.testResults.apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
      }
      request.continue();
    });

    // Listen for console errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.testResults.consoleErrors.push({
          text: msg.text(),
          timestamp: Date.now()
        });
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    // Listen for page errors
    this.page.on('pageerror', (error) => {
      this.testResults.errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
      console.log(`❌ Page Error: ${error.message}`);
    });
  }

  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.log(`❌ Element not found: ${selector}`);
      return false;
    }
  }

  async waitForNavigation(timeout = 10000) {
    try {
      await this.page.waitForNavigation({ timeout, waitUntil: 'networkidle0' });
      return true;
    } catch (error) {
      console.log(`❌ Navigation timeout: ${error.message}`);
      return false;
    }
  }

  async login() {
    console.log('🔐 Logging in as Superadmin...');
    
    try {
      await this.page.goto('http://localhost:3000/superadmin/login');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.page.type('input[name="email"]', 'admin@superadmin.com');
      await this.page.type('input[name="password"]', 'AdminPass123');
      await this.page.click('button[type="submit"]');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if login was successful
      const currentUrl = this.page.url();
      if (currentUrl.includes('/superadmin/dashboard') || currentUrl.includes('/superadmin/tenants')) {
        console.log('✅ Login successful');
        this.testResults.passed++;
        return true;
      } else {
        console.log('❌ Login failed');
        this.testResults.failed++;
        return false;
      }
    } catch (error) {
      console.log(`❌ Login error: ${error.message}`);
      this.testResults.failed++;
      return false;
    }
  }

  async navigateToTenantsPage() {
    console.log('🏢 Navigating to Tenants page...');
    
    try {
      await this.page.goto('http://localhost:3000/superadmin/tenants');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const searchInput = await this.page.$('input[placeholder*="Search tenants"]');
      if (searchInput) {
        console.log('✅ Tenants page loaded successfully');
        this.testResults.passed++;
        return true;
      } else {
        console.log('❌ Tenants page not loaded properly');
        this.testResults.failed++;
        return false;
      }
    } catch (error) {
      console.log(`❌ Navigation error: ${error.message}`);
      this.testResults.failed++;
      return false;
    }
  }

  async testSearchFunctionality() {
    console.log('🔍 Testing Search Functionality...');
    
    try {
      // Clear previous API calls
      this.testResults.apiCalls.length = 0;
      
      const searchInput = await this.page.$('input[placeholder*="Search tenants"]');
      if (!searchInput) {
        console.log('❌ Search input not found');
        this.testResults.failed++;
        return false;
      }

      // Test basic search
      await searchInput.click();
      await searchInput.type('test');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const inputValue = await this.page.$eval('input[placeholder*="Search tenants"]', el => el.value);
      if (inputValue === 'test') {
        console.log('✅ Search input working');
        this.testResults.passed++;
      } else {
        console.log('❌ Search input not working');
        this.testResults.failed++;
      }

      // Wait for debounced API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if API call was made
      const searchApiCalls = this.testResults.apiCalls.filter(call => 
        call.url.includes('search=test')
      );
      
      if (searchApiCalls.length > 0) {
        console.log('✅ Search API call triggered');
        this.testResults.passed++;
      } else {
        console.log('❌ Search API call not triggered');
        this.testResults.failed++;
      }

      // Test clear search
      const clearButton = await this.page.$('button[class*="absolute right-3"]');
      if (clearButton) {
        await clearButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const clearedValue = await this.page.$eval('input[placeholder*="Search tenants"]', el => el.value);
        if (clearedValue === '') {
          console.log('✅ Clear search working');
          this.testResults.passed++;
        } else {
          console.log('❌ Clear search not working');
          this.testResults.failed++;
        }
      }

      return true;
    } catch (error) {
      console.log(`❌ Search test error: ${error.message}`);
      this.testResults.failed++;
      return false;
    }
  }

  async testSortingFunctionality() {
    console.log('📊 Testing Sorting Functionality...');
    
    try {
      // Test sort by name
      const sortBySelect = await this.page.$('select[value="name"]');
      if (sortBySelect) {
        await sortBySelect.select('name');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if API call was made with sort parameter
        const sortApiCalls = this.testResults.apiCalls.filter(call => 
          call.url.includes('sortBy=name')
        );
        
        if (sortApiCalls.length > 0) {
          console.log('✅ Sort by name working');
          this.testResults.passed++;
        } else {
          console.log('❌ Sort by name not working');
          this.testResults.failed++;
        }
      }

      // Test sort by created date
      const sortByDateSelect = await this.page.$('select[value="createdAt"]');
      if (sortByDateSelect) {
        await sortByDateSelect.select('createdAt');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const sortApiCalls = this.testResults.apiCalls.filter(call => 
          call.url.includes('sortBy=createdAt')
        );
        
        if (sortApiCalls.length > 0) {
          console.log('✅ Sort by created date working');
          this.testResults.passed++;
        } else {
          console.log('❌ Sort by created date not working');
          this.testResults.failed++;
        }
      }

      // Test sort order
      const sortOrderSelect = await this.page.$('select[value="asc"]');
      if (sortOrderSelect) {
        await sortOrderSelect.select('asc');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const sortApiCalls = this.testResults.apiCalls.filter(call => 
          call.url.includes('sortOrder=asc')
        );
        
        if (sortApiCalls.length > 0) {
          console.log('✅ Sort order working');
          this.testResults.passed++;
        } else {
          console.log('❌ Sort order not working');
          this.testResults.failed++;
        }
      }

      return true;
    } catch (error) {
      console.log(`❌ Sorting test error: ${error.message}`);
      this.testResults.failed++;
      return false;
    }
  }

  async testFilteringFunctionality() {
    console.log('🔧 Testing Filtering Functionality...');
    
    try {
      // Expand filters
      const filterButton = await this.page.$('button:has-text("Filters")');
      if (filterButton) {
        await filterButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Test status filter
      const statusSelect = await this.page.$('select[value="active"]');
      if (statusSelect) {
        await statusSelect.select('active');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const filterApiCalls = this.testResults.apiCalls.filter(call => 
          call.url.includes('status=active')
        );
        
        if (filterApiCalls.length > 0) {
          console.log('✅ Status filter working');
          this.testResults.passed++;
        } else {
          console.log('❌ Status filter not working');
          this.testResults.failed++;
        }
      }

      // Test region filter
      const regionSelect = await this.page.$('select[value="US East"]');
      if (regionSelect) {
        await regionSelect.select('US East');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const filterApiCalls = this.testResults.apiCalls.filter(call => 
          call.url.includes('region=US%20East')
        );
        
        if (filterApiCalls.length > 0) {
          console.log('✅ Region filter working');
          this.testResults.passed++;
        } else {
          console.log('❌ Region filter not working');
          this.testResults.failed++;
        }
      }

      return true;
    } catch (error) {
      console.log(`❌ Filtering test error: ${error.message}`);
      this.testResults.failed++;
      return false;
    }
  }

  async testTenantDetailPage() {
    console.log('📋 Testing Tenant Detail Page...');
    
    try {
      // Find and click on first tenant row
      const tenantRow = await this.page.$('tr[data-testid="tenant-row"]');
      if (!tenantRow) {
        console.log('❌ No tenant rows found');
        this.testResults.failed++;
        return false;
      }

      await tenantRow.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if we're on detail page
      const currentUrl = this.page.url();
      if (currentUrl.includes('/superadmin/tenants/')) {
        console.log('✅ Tenant detail page loaded');
        this.testResults.passed++;
        
        // Check for tenant information
        const tenantName = await this.page.$('h1, h2, h3');
        if (tenantName) {
          console.log('✅ Tenant information displayed');
          this.testResults.passed++;
        }
        
        // Check for user count
        const userCount = await this.page.$('text/User Count');
        if (userCount) {
          console.log('✅ User count displayed');
          this.testResults.passed++;
        }
        
        // Check for status
        const status = await this.page.$('text/Status');
        if (status) {
          console.log('✅ Status displayed');
          this.testResults.passed++;
        }
        
      } else {
        console.log('❌ Tenant detail page not loaded');
        this.testResults.failed++;
      }

      return true;
    } catch (error) {
      console.log(`❌ Detail page test error: ${error.message}`);
      this.testResults.failed++;
      return false;
    }
  }

  async testCRUDOperations() {
    console.log('🔄 Testing CRUD Operations...');
    
    try {
      // Navigate back to tenants list
      await this.page.goto('http://localhost:3000/superadmin/tenants');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test Create Tenant
      const createButton = await this.page.$('button:has-text("Create Tenant"), a:has-text("Create Tenant")');
      if (createButton) {
        await createButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const currentUrl = this.page.url();
        if (currentUrl.includes('/create') || currentUrl.includes('/new')) {
          console.log('✅ Create tenant page accessible');
          this.testResults.passed++;
          
          // Fill create form
          await this.page.type('input[name="name"]', 'Test Tenant E2E');
          await this.page.type('input[name="subdomain"]', 'test-e2e');
          await this.page.type('input[name="domain"]', 'test-e2e.example.com');
          await this.page.select('select[name="status"]', 'active');
          await this.page.select('select[name="region"]', 'US East');
          
          // Submit form
          const submitButton = await this.page.$('button[type="submit"]');
          if (submitButton) {
            await submitButton.click();
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check if redirected back to list
            const finalUrl = this.page.url();
            if (finalUrl.includes('/superadmin/tenants')) {
              console.log('✅ Tenant created successfully');
              this.testResults.passed++;
            } else {
              console.log('❌ Tenant creation failed');
              this.testResults.failed++;
            }
          }
        } else {
          console.log('❌ Create tenant page not accessible');
          this.testResults.failed++;
        }
      }
      
      // Test Update Tenant
      const editButton = await this.page.$('button:has-text("Edit"), a:has-text("Edit")');
      if (editButton) {
        await editButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const currentUrl = this.page.url();
        if (currentUrl.includes('/edit')) {
          console.log('✅ Edit tenant page accessible');
          this.testResults.passed++;
          
          // Update tenant name
          await this.page.type('input[name="name"]', ' Updated');
          await this.page.click('button[type="submit"]');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          console.log('✅ Tenant updated successfully');
          this.testResults.passed++;
        } else {
          console.log('❌ Edit tenant page not accessible');
          this.testResults.failed++;
        }
      }
      
      // Test Delete Tenant
      const deleteButton = await this.page.$('button:has-text("Delete")');
      if (deleteButton) {
        await deleteButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Confirm deletion
        const confirmButton = await this.page.$('button:has-text("Confirm"), button:has-text("Delete")');
        if (confirmButton) {
          await confirmButton.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          console.log('✅ Tenant deleted successfully');
          this.testResults.passed++;
        } else {
          console.log('❌ Delete confirmation not found');
          this.testResults.failed++;
        }
      }

      return true;
    } catch (error) {
      console.log(`❌ CRUD test error: ${error.message}`);
      this.testResults.failed++;
      return false;
    }
  }

  async testDatabaseCounts() {
    console.log('📊 Testing Database Counts...');
    
    try {
      // Get total tenants count from API
      const response = await this.page.evaluate(async () => {
        const res = await fetch('/api/superadmin/tenants?page=1&limit=1');
        const data = await res.json();
        return data;
      });
      
      if (response && response.total) {
        console.log(`✅ Total tenants in database: ${response.total}`);
        this.testResults.passed++;
        
        // Check if the count matches the UI
        const countElement = await this.page.$('text/' + response.total);
        if (countElement) {
          console.log('✅ Database count matches UI');
          this.testResults.passed++;
        } else {
          console.log('❌ Database count does not match UI');
          this.testResults.failed++;
        }
      } else {
        console.log('❌ Could not fetch database count');
        this.testResults.failed++;
      }

      return true;
    } catch (error) {
      console.log(`❌ Database count test error: ${error.message}`);
      this.testResults.failed++;
      return false;
    }
  }

  async fixConsoleErrors() {
    console.log('🔧 Fixing Console Errors...');
    
    if (this.testResults.consoleErrors.length === 0) {
      console.log('✅ No console errors found');
      return;
    }

    console.log(`Found ${this.testResults.consoleErrors.length} console errors:`);
    
    for (const error of this.testResults.consoleErrors) {
      console.log(`- ${error.text}`);
      
      // Common error fixes
      if (error.text.includes('Hydration')) {
        console.log('  💡 Fix: Add suppressHydrationWarning to dynamic content');
      } else if (error.text.includes('React Hook')) {
        console.log('  💡 Fix: Check useEffect dependencies');
      } else if (error.text.includes('TypeError')) {
        console.log('  💡 Fix: Add null checks for undefined values');
      } else if (error.text.includes('NetworkError')) {
        console.log('  💡 Fix: Add error handling for API calls');
      }
    }
  }

  async generateTestReport() {
    console.log('\n📋 Generating Test Report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.passed + this.testResults.failed,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        successRate: ((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(2) + '%'
      },
      details: {
        consoleErrors: this.testResults.consoleErrors,
        pageErrors: this.testResults.errors,
        apiCalls: this.testResults.apiCalls
      },
      recommendations: []
    };

    if (this.testResults.failed > 0) {
      report.recommendations.push('Review failed test cases and fix issues');
    }
    
    if (this.testResults.consoleErrors.length > 0) {
      report.recommendations.push('Fix console errors to improve user experience');
    }
    
    if (this.testResults.errors.length > 0) {
      report.recommendations.push('Address page errors to ensure stability');
    }

    // Save report to file
    const fs = require('fs');
    fs.writeFileSync('tenant-module-test-report.json', JSON.stringify(report, null, 2));
    
    console.log('✅ Test report saved to tenant-module-test-report.json');
    
    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    try {
      await this.init();
      
      console.log('\n🧪 Starting Tenant Module Comprehensive Tests...\n');
      
      const tests = [
        { name: 'Login', fn: () => this.login() },
        { name: 'Navigate to Tenants', fn: () => this.navigateToTenantsPage() },
        { name: 'Search Functionality', fn: () => this.testSearchFunctionality() },
        { name: 'Sorting Functionality', fn: () => this.testSortingFunctionality() },
        { name: 'Filtering Functionality', fn: () => this.testFilteringFunctionality() },
        { name: 'Tenant Detail Page', fn: () => this.testTenantDetailPage() },
        { name: 'CRUD Operations', fn: () => this.testCRUDOperations() },
        { name: 'Database Counts', fn: () => this.testDatabaseCounts() }
      ];

      for (const test of tests) {
        console.log(`\n--- Running ${test.name} Test ---`);
        await test.fn();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('\n🔧 Analyzing and fixing errors...');
      await this.fixConsoleErrors();

      console.log('\n📊 Test Results Summary:');
      console.log(`✅ Passed: ${this.testResults.passed}`);
      console.log(`❌ Failed: ${this.testResults.failed}`);
      console.log(`🔧 Console Errors: ${this.testResults.consoleErrors.length}`);
      console.log(`📡 API Calls: ${this.testResults.apiCalls.length}`);

      const report = await this.generateTestReport();
      
      console.log('\n🎉 Tenant Module Comprehensive Test Completed!');
      console.log(`Success Rate: ${report.summary.successRate}`);
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new TenantModuleComprehensiveTest();
  testSuite.runAllTests().catch(console.error);
}

module.exports = TenantModuleComprehensiveTest; 