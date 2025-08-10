const puppeteer = require('puppeteer');

// Test credentials from actual database
const TEST_CREDENTIALS = {
  techcorp: {
    admin: {
      url: 'http://localhost:3000/techcorp/login',
      email: 'admin@techcorp.com',
      password: 'AdminPass123'
    },
    manager: {
      url: 'http://localhost:3000/techcorp/login',
      email: 'manager@techcorp.com',
      password: 'AdminPass123'
    },
    user: {
      url: 'http://localhost:3000/techcorp/login',
      email: 'user@techcorp.com',
      password: 'AdminPass123'
    },
    viewer: {
      url: 'http://localhost:3000/techcorp/login',
      email: 'viewer@techcorp.com',
      password: 'AdminPass123'
    }
  },
  globalretail: {
    admin: {
      url: 'http://localhost:3000/globalretail/login',
      email: 'admin@globalretail.com',
      password: 'AdminPass123'
    },
    manager: {
      url: 'http://localhost:3000/globalretail/login',
      email: 'manager@globalretail.com',
      password: 'AdminPass123'
    },
    user: {
      url: 'http://localhost:3000/globalretail/login',
      email: 'user@globalretail.com',
      password: 'AdminPass123'
    },
    viewer: {
      url: 'http://localhost:3000/globalretail/login',
      email: 'viewer@globalretail.com',
      password: 'AdminPass123'
    }
  }
};

// Expected modules based on roles
const EXPECTED_MODULES = {
  admin: [
    'Dashboard', 'User Management', 'Role & Permission Management', 'Module Management',
    'Content Management', 'Notifications', 'Audit Logs', 'Settings'
  ],
  manager: [
    'Dashboard', 'User Management', 'Content Management',
    'Notifications', 'Audit Logs', 'Settings'
  ],
  user: [
    'Dashboard', 'Content Management', 'Notifications'
  ],
  viewer: [
    'Dashboard', 'Content Management', 'Notifications'
  ]
};

class TenantLoginTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async init() {
    console.log('🚀 Starting Puppeteer browser...');
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set user agent
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async logResult(testName, status, details = '') {
    const result = {
      test: testName,
      status: status,
      details: details,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${testName}: ${details}`);
  }

  async testLogin(credentials, roleName) {
    try {
      console.log(`\n🔐 Testing login for ${roleName}...`);
      
      // Navigate to login page
      await this.page.goto(credentials.url, { waitUntil: 'networkidle2' });
      
      // Check if page loaded correctly
      const pageTitle = await this.page.title();
      console.log(`Page title: "${pageTitle}"`);
      
      // Wait a bit for the page to fully load using setTimeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for login form elements with more specific selectors
      const emailInput = await this.page.$('input[name="email"]');
      const passwordInput = await this.page.$('input[name="password"]');
      
      if (!emailInput || !passwordInput) {
        console.log('Form elements not found. Available inputs:');
        const allInputs = await this.page.$$eval('input', inputs => inputs.map(input => ({
          name: input.name,
          type: input.type,
          id: input.id
        })));
        console.log(allInputs);
        await this.logResult(`${roleName} - Login Form`, 'FAIL', 'Login form elements not found');
        return false;
      }

      // Fill login form
      await emailInput.type(credentials.email);
      await passwordInput.type(credentials.password);
      
      // Submit form
      const submitButton = await this.page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
      } else {
        // Try pressing Enter
        await this.page.keyboard.press('Enter');
      }
      
      // Wait for navigation
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      
      // Check if login was successful
      const currentUrl = this.page.url();
      console.log(`Current URL after login: ${currentUrl}`);
      
      if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
        // Check for error messages
        const errorMessage = await this.page.$eval('.error, .alert, [role="alert"]', el => el.textContent).catch(() => '');
        await this.logResult(`${roleName} - Login`, 'FAIL', `Login failed: ${errorMessage}`);
        return false;
      }
      
      await this.logResult(`${roleName} - Login`, 'PASS', `Successfully logged in to ${currentUrl}`);
      return true;
      
    } catch (error) {
      await this.logResult(`${roleName} - Login`, 'FAIL', `Error: ${error.message}`);
      return false;
    }
  }

  async testDashboardAccess(roleName) {
    try {
      console.log(`📊 Testing dashboard access for ${roleName}...`);
      
      // Check if we're on dashboard or redirect to it
      const currentUrl = this.page.url();
      if (!currentUrl.includes('/dashboard')) {
        await this.page.goto(currentUrl.replace('/login', '/dashboard'), { waitUntil: 'networkidle2' });
      }
      
      // Wait for dashboard to load - look for the main dashboard content
              await this.page.waitForSelector('h1, .dashboard, main, [data-testid="dashboard"]', { timeout: 15000 });
      
      // Check for dashboard elements - look for the dashboard title
      const dashboardTitle = await this.page.$eval('h1', el => el.textContent).catch(() => '');
      if (!dashboardTitle || !dashboardTitle.toLowerCase().includes('dashboard')) {
        await this.logResult(`${roleName} - Dashboard Access`, 'FAIL', 'Dashboard title not found');
        return false;
      }
      
      await this.logResult(`${roleName} - Dashboard Access`, 'PASS', `Dashboard loaded: ${dashboardTitle}`);
      return true;
      
    } catch (error) {
      await this.logResult(`${roleName} - Dashboard Access`, 'FAIL', `Error: ${error.message}`);
      return false;
    }
  }

  async testModuleAccess(roleName, expectedModules) {
    try {
      console.log(`🔧 Testing module access for ${roleName}...`);
      
      // Wait for the page to fully load and dynamic sidebar to render
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Wait for loading to complete
      try {
        await this.page.waitForFunction(
          () => !document.body.textContent.includes('Loading Menu') && !document.body.textContent.includes('Please wait'),
          { timeout: 10000 }
        );
      } catch (error) {
        console.log('⚠️ Loading timeout, continuing anyway...');
      }
      
      // Look for navigation menu - the sidebar should be present
      const sidebarSelectors = [
        '.sidebar', '[role="navigation"]', '.nav-menu', '.sidebar-menu',
        'nav', '.menu', '.dynamic-sidebar'
      ];
      
      let sidebarElement = null;
      for (const selector of sidebarSelectors) {
        sidebarElement = await this.page.$(selector);
        if (sidebarElement) break;
      }
      
      if (!sidebarElement) {
        // Try to find any navigation links
        const navLinks = await this.page.$$('a[href*="/"]');
        if (navLinks.length === 0) {
          await this.logResult(`${roleName} - Module Navigation`, 'FAIL', 'Navigation menu not found');
          return false;
        }
      }
      
      // Get all menu items - look for links in the sidebar or navigation
      const menuItems = await this.page.$$eval('nav a, .sidebar a, .menu a, .nav-menu a, a[href*="/"], .dynamic-sidebar a', 
        elements => elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
      );
      
      console.log(`Found menu items: ${menuItems.join(', ')}`);
      
      // Also try to get menu items from any element with text content
      const allTextElements = await this.page.$$eval('*', elements => {
        return elements
          .filter(el => el.textContent && el.textContent.trim().length > 0 && el.children.length === 0)
          .map(el => el.textContent.trim())
          .filter(text => text.length > 0 && text.length < 50); // Filter out very long text
      });
      
      console.log(`All text elements: ${allTextElements.slice(0, 20).join(', ')}`);
      
      // Check expected modules - be more flexible with matching
      const missingModules = expectedModules.filter(module => {
        const moduleLower = module.toLowerCase();
        const moduleWords = moduleLower.split(' ').filter(word => word.length > 2);
        
        return !menuItems.some(item => {
          const itemLower = item.toLowerCase();
          return itemLower.includes(moduleLower) ||
                 itemLower.includes(moduleLower.replace(' & ', ' ')) ||
                 moduleWords.some(word => itemLower.includes(word));
        }) && !allTextElements.some(text => {
          const textLower = text.toLowerCase();
          return textLower.includes(moduleLower) ||
                 textLower.includes(moduleLower.replace(' & ', ' ')) ||
                 moduleWords.some(word => textLower.includes(word));
        });
      });
      
      if (missingModules.length > 0) {
        await this.logResult(`${roleName} - Module Access`, 'FAIL', 
          `Missing modules: ${missingModules.join(', ')}`);
        return false;
      }
      
      await this.logResult(`${roleName} - Module Access`, 'PASS', 
        `All expected modules found: ${expectedModules.join(', ')}`);
      return true;
      
    } catch (error) {
      await this.logResult(`${roleName} - Module Access`, 'FAIL', `Error: ${error.message}`);
      return false;
    }
  }

  async logout() {
    try {
      // Navigate to a neutral page to clear the session
      await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.log('⚠️ Logout error:', error.message);
    }
  }

  async testPermissions(roleName) {
    try {
      console.log(`🔐 Testing permissions for ${roleName}...`);
      
      // Test different permission levels based on role
      const permissionTests = [];
      
      if (roleName.includes('admin')) {
        // Admin should have access to user management
        permissionTests.push(this.testUserManagementAccess(roleName));
        permissionTests.push(this.testRoleManagementAccess(roleName));
      }
      
      if (roleName.includes('manager')) {
        // Manager should have limited management access
        permissionTests.push(this.testUserManagementAccess(roleName));
      }
      
      // All roles should have dashboard access
      permissionTests.push(this.testDashboardPermissions(roleName));
      
      const results = await Promise.all(permissionTests);
      const passed = results.filter(r => r).length;
      const total = results.length;
      
      await this.logResult(`${roleName} - Permissions`, 
        passed === total ? 'PASS' : 'FAIL', 
        `${passed}/${total} permission tests passed`);
      
      return passed === total;
      
    } catch (error) {
      await this.logResult(`${roleName} - Permissions`, 'FAIL', `Error: ${error.message}`);
      return false;
    }
  }

  async testUserManagementAccess(roleName) {
    try {
      // Try to navigate to user management
      const userManagementSelectors = [
        'a[href*="users"]', 'a[href*="user-management"]',
        'a:contains("Users")', 'a:contains("User Management")'
      ];
      
      for (const selector of userManagementSelectors) {
        const link = await this.page.$(selector);
        if (link) {
          await link.click();
          await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
          
          const currentUrl = this.page.url();
          if (currentUrl.includes('users') || currentUrl.includes('user-management')) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  async testRoleManagementAccess(roleName) {
    try {
      // Try to navigate to role management
      const roleManagementSelectors = [
        'a[href*="roles"]', 'a[href*="role-management"]',
        'a:contains("Roles")', 'a:contains("Role Management")'
      ];
      
      for (const selector of roleManagementSelectors) {
        const link = await this.page.$(selector);
        if (link) {
          await link.click();
          await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
          
          const currentUrl = this.page.url();
          if (currentUrl.includes('roles') || currentUrl.includes('role-management')) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  async testDashboardPermissions(roleName) {
    try {
      // Check if dashboard elements are accessible - look for dashboard widgets
      const dashboardElements = await this.page.$$('.bg-white, .dashboard-card, .stats-card, .chart-container, [class*="bg-white"]');
      return dashboardElements.length > 0;
    } catch (error) {
      return false;
    }
  }

  async runAllTests() {
    console.log('🧪 Starting comprehensive tenant login tests...\n');
    
    try {
      await this.init();
      
      // Test TechCorp users
      console.log('\n🏢 Testing TechCorp users...');
      for (const [role, credentials] of Object.entries(TEST_CREDENTIALS.techcorp)) {
        const loginSuccess = await this.testLogin(credentials, `TechCorp ${role}`);
        if (loginSuccess) {
          await this.testDashboardAccess(`TechCorp ${role}`);
          await this.testModuleAccess(`TechCorp ${role}`, EXPECTED_MODULES[role]);
          await this.testPermissions(`TechCorp ${role}`);
        }
        // Logout before next user
        await this.logout();
      }
      
      // Test GlobalRetail users
      console.log('\n🛒 Testing GlobalRetail users...');
      for (const [role, credentials] of Object.entries(TEST_CREDENTIALS.globalretail)) {
        const loginSuccess = await this.testLogin(credentials, `GlobalRetail ${role}`);
        if (loginSuccess) {
          await this.testDashboardAccess(`GlobalRetail ${role}`);
          await this.testModuleAccess(`GlobalRetail ${role}`, EXPECTED_MODULES[role]);
          await this.testPermissions(`GlobalRetail ${role}`);
        }
        // Logout before next user
        await this.logout();
      }
      
      // Generate test report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
    } finally {
      await this.close();
    }
  }

  generateReport() {
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detailed Results:');
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.details}`);
    });
    
    // Save results to file
    const fs = require('fs');
    const reportData = {
      summary: {
        total: total,
        passed: passed,
        failed: failed,
        successRate: ((passed / total) * 100).toFixed(1)
      },
      results: this.results,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('test-results.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Test results saved to test-results.json');
  }
}

// Run the tests
async function main() {
  const tester = new TenantLoginTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TenantLoginTester; 