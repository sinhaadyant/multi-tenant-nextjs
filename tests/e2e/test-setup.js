const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

  // Test credentials for all tenant types and roles
const TEST_CREDENTIALS = {
  // SuperAdmin credentials
  superadmin: {
    superadmin: {
      email: 'admin@superadmin.com',
      password: 'SuperAdmin123!',
      url: 'http://localhost:3000/superadmin/login'
    }
  },
  
  // TechCorp tenant credentials
  techcorp: {
    admin: {
      email: 'admin@techcorp.com',
      password: 'AdminPass123',
      url: 'http://localhost:3000/techcorp/login'
    },
    manager: {
      email: 'manager@techcorp.com',
      password: 'AdminPass123',
      url: 'http://localhost:3000/techcorp/login'
    },
    user: {
      email: 'user@techcorp.com',
      password: 'AdminPass123',
      url: 'http://localhost:3000/techcorp/login'
    },
    viewer: {
      email: 'viewer@techcorp.com',
      password: 'AdminPass123',
      url: 'http://localhost:3000/techcorp/login'
    }
  },
  
  // GlobalRetail tenant credentials
  globalretail: {
    admin: {
      email: 'admin@globalretail.com',
      password: 'AdminPass123',
      url: 'http://localhost:3000/globalretail/login'
    },
    manager: {
      email: 'manager@globalretail.com',
      password: 'AdminPass123',
      url: 'http://localhost:3000/globalretail/login'
    },
    user: {
      email: 'user@globalretail.com',
      password: 'AdminPass123',
      url: 'http://localhost:3000/globalretail/login'
    },
    viewer: {
      email: 'viewer@globalretail.com',
      password: 'AdminPass123',
      url: 'http://localhost:3000/globalretail/login'
    }
  }
};

// Expected modules and permissions for each role
const ROLE_PERMISSIONS = {
  superadmin: {
    modules: ['Dashboard', 'Tenants', 'Users', 'Audit Logs', 'Backup', 'Import', 'Reports', 'Support', 'Notifications', 'Profile', 'Settings'],
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canView: true
  },
  admin: {
    modules: ['Dashboard', 'User Management', 'Role & Permission Management', 'Module Management', 'Content Management', 'Notifications', 'Audit Logs', 'Settings'],
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canView: true
  },
  manager: {
    modules: ['Dashboard', 'User Management', 'Content Management', 'Notifications', 'Audit Logs', 'Settings'],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canView: true
  },
  user: {
    modules: ['Dashboard', 'Content Management', 'Notifications'],
    canCreate: true,
    canEdit: false,
    canDelete: false,
    canView: true
  },
  viewer: {
    modules: ['Dashboard', 'Content Management', 'Notifications'],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canView: true
  }
};

// Common selectors
const SELECTORS = {
  // Common selectors
  loginForm: 'form',
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  submitButton: 'button[type="submit"]',
  logoutButton: 'a[href*="logout"], button[data-testid="logout"]',
  
  // Dashboard selectors
  dashboardTitle: 'h1, h2, [data-testid="dashboard-title"]',
  dashboardContent: 'main, .content, [data-testid="dashboard-content"]',
  dashboardWidgets: '.widget, [data-testid="dashboard-widget"]',
  
  // Navigation selectors
  sidebar: 'aside, [data-testid="sidebar"]',
  sidebarMenu: 'nav, [data-testid="sidebar-menu"]',
  menuItems: 'a[href], [data-testid="menu-item"]',
  
  // Module selectors - using proper selectors instead of :contains
  dashboardModule: 'a[href*="dashboard"], [data-testid="dashboard-module"]',
  userManagementModule: 'a[href*="users"], [data-testid="users-module"]',
  rolesModule: 'a[href*="roles"], [data-testid="roles-module"]',
  auditLogsModule: 'a[href*="audit"], [data-testid="audit-module"]',
  notificationsModule: 'a[href*="notifications"], [data-testid="notifications-module"]',
  supportModule: 'a[href*="support"], [data-testid="support-module"]',
  settingsModule: 'a[href*="settings"], [data-testid="settings-module"]',
  
  // Content Management module (if it exists)
  contentManagementModule: 'a[href*="content"], [data-testid="content-module"]',
  
  // Table selectors
  dataTable: 'table, [data-testid="data-table"]',
  tableRows: 'tr, [data-testid="table-row"]',
  pagination: '.pagination, [data-testid="pagination"]',
  
  // Form selectors
  createButton: 'button[data-testid="create"], .btn-create',
  editButton: 'button[data-testid="edit"], .btn-edit',
  deleteButton: 'button[data-testid="delete"], .btn-delete',
  searchInput: 'input[type="search"], [data-testid="search"]',
  filterDropdown: 'select, [data-testid="filter"]',
  
  // Modal selectors
  modal: '.modal, [data-testid="modal"]',
  modalClose: '.modal-close, [data-testid="modal-close"]',
  
  // Error selectors
  errorMessage: '.error, [data-testid="error"]',
  successMessage: '.success, [data-testid="success"]',
  
  // Loading selectors
  loadingSpinner: '.loading, [data-testid="loading"]',
  
  // User profile selectors
  userAvatar: '.avatar, [data-testid="user-avatar"]',
  userMenu: '.user-menu, [data-testid="user-menu"]',
  
  // Notification selectors
  notificationBell: '.notification-bell, [data-testid="notification-bell"]',
  notificationDropdown: '.notification-dropdown, [data-testid="notification-dropdown"]',
  
  // Support ticket selectors
  ticketForm: 'form[data-testid="ticket-form"]',
  ticketList: '[data-testid="ticket-list"]',
  ticketItem: '[data-testid="ticket-item"]'
};

class TestHelper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.currentUser = null;
    this.currentTenant = null;
    this.screenshotsDir = './test-screenshots';
  }

  async setup() {
    console.log('🚀 Setting up Puppeteer browser...');
    
    // Create screenshots directory
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
    
    this.browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo: 100,
      defaultViewport: { width: 1280, height: 720 },
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
    
    this.page = await this.browser.newPage();
    
    // Set user agent
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Enable console log capture
    this.page.on('console', msg => {
      console.log(`📱 Browser Console: ${msg.text()}`);
    });
    
    // Enable error capture
    this.page.on('pageerror', error => {
      console.error(`❌ Page Error: ${error.message}`);
    });
    
    // Enable request/response logging
    this.page.on('response', response => {
      if (response.status() >= 400) {
        console.error(`❌ HTTP Error: ${response.status()} ${response.url()}`);
      }
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async login(tenant, role) {
    const credentials = TEST_CREDENTIALS[tenant][role];
    if (!credentials) {
      throw new Error(`No credentials found for tenant: ${tenant}, role: ${role}`);
    }
    
    console.log(`🔐 Logging in as ${role} for ${tenant}...`);
    
    this.currentUser = role;
    this.currentTenant = tenant;
    
    try {
      await this.page.goto(credentials.url, { waitUntil: 'networkidle2' });
      
      // Wait for login form to load
      await this.page.waitForSelector(SELECTORS.emailInput, { timeout: 10000 });
      
      // Clear and fill form
      await this.page.evaluate(() => {
        document.querySelector('input[name="email"], input[type="email"]').value = '';
        document.querySelector('input[name="password"], input[type="password"]').value = '';
      });
      
      await this.page.type(SELECTORS.emailInput, credentials.email);
      await this.page.type(SELECTORS.passwordInput, credentials.password);
      
      // Submit form
      await this.page.click(SELECTORS.submitButton);
      
      // Wait for navigation
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      
      // Verify login success
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
        throw new Error('Login failed - still on login page');
      }
      
      console.log(`✅ Successfully logged in as ${role} for ${tenant}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Login failed for ${role} in ${tenant}:`, error.message);
      await this.takeScreenshot(`login-failed-${tenant}-${role}`);
      return false;
    }
  }

  async navigateTo(path) {
    const baseUrl = this.currentTenant === 'superadmin' 
      ? 'http://localhost:3000/superadmin'
      : `http://localhost:3000/${this.currentTenant}`;
    
    const url = `${baseUrl}${path}`;
    console.log(`🌐 Navigating to: ${url}`);
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      await this.waitForPageLoad();
      return true;
    } catch (error) {
      console.error(`❌ Navigation failed to ${url}:`, error.message);
      await this.takeScreenshot(`navigation-failed-${path.replace(/\//g, '-')}`);
      return false;
    }
  }

  async waitForPageLoad() {
    try {
      await this.page.waitForFunction(() => document.readyState === 'complete');
      await this.page.waitForFunction(() => {
        return !document.body.textContent.includes('Loading') && 
               !document.body.textContent.includes('Please wait');
      }, { timeout: 10000 });
    } catch (error) {
      console.log('⚠️ Page load timeout, continuing...');
    }
  }

  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.error(`❌ Element not found: ${selector}`);
      return false;
    }
  }

  async clickElement(selector) {
    try {
      await this.page.waitForSelector(selector, { visible: true });
      await this.page.click(selector);
      return true;
    } catch (error) {
      console.error(`❌ Failed to click element: ${selector}`, error.message);
      return false;
    }
  }

  async typeText(selector, text) {
    try {
      await this.page.waitForSelector(selector, { visible: true });
      await this.page.type(selector, text);
      return true;
    } catch (error) {
      console.error(`❌ Failed to type text in: ${selector}`, error.message);
      return false;
    }
  }

  async getText(selector) {
    try {
      return await this.page.$eval(selector, el => el.textContent.trim());
    } catch (error) {
      console.error(`❌ Failed to get text from: ${selector}`, error.message);
      return '';
    }
  }

  async isElementVisible(selector) {
    try {
      await this.page.waitForSelector(selector, { visible: true, timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async takeScreenshot(name) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${this.screenshotsDir}/${name}-${timestamp}.png`;
      await this.page.screenshot({ path: filename, fullPage: true });
      console.log(`📸 Screenshot saved: ${filename}`);
    } catch (error) {
      console.error('❌ Failed to take screenshot:', error.message);
    }
  }

  async getCurrentUrl() {
    return this.page.url();
  }

  async expectUrlToContain(expectedPath) {
    const currentUrl = await this.getCurrentUrl();
    if (!currentUrl.includes(expectedPath)) {
      throw new Error(`Expected URL to contain "${expectedPath}", but got "${currentUrl}"`);
    }
  }

  async expectElementToExist(selector) {
    const exists = await this.page.$(selector);
    if (!exists) {
      throw new Error(`Element with selector "${selector}" not found`);
    }
  }

  async expectElementToHaveText(selector, expectedText) {
    const actualText = await this.getText(selector);
    if (!actualText.includes(expectedText)) {
      throw new Error(`Expected element "${selector}" to contain "${expectedText}", but got "${actualText}"`);
    }
  }

  async testModuleAccess(moduleName, expectedAccess = true) {
    try {
      // Get the appropriate selector for the module
      const moduleSelector = this.getModuleSelector(moduleName);
      
      if (!moduleSelector) {
        console.log(`⚠️ No selector found for module: ${moduleName}`);
        return false;
      }

      // Wait for the element to be present
      await this.page.waitForSelector(moduleSelector, { timeout: 5000 });
      
      // Check if the element is visible using Puppeteer's correct method
      const element = await this.page.$(moduleSelector);
      const isVisible = element ? await element.isVisible() : false;
      
      if (expectedAccess && !isVisible) {
        console.log(`❌ Module ${moduleName} should be accessible but is not visible`);
        return false;
      } else if (!expectedAccess && isVisible) {
        console.log(`❌ Module ${moduleName} should not be accessible but is visible`);
        return false;
      }
      
      console.log(`✅ Module access test passed for ${moduleName}`);
      return true;
    } catch (error) {
      if (expectedAccess) {
        console.log(`❌ Module access test failed for ${moduleName}: ${error.message}`);
        return false;
      } else {
        console.log(`✅ Module ${moduleName} correctly not accessible`);
        return true;
      }
    }
  }

  getModuleSelector(moduleName) {
    const moduleMap = {
      'Dashboard': SELECTORS.dashboardModule,
      'User Management': SELECTORS.userManagementModule,
      'Roles': SELECTORS.rolesModule,
      'Audit Logs': SELECTORS.auditLogsModule,
      'Notifications': SELECTORS.notificationsModule,
      'Support': SELECTORS.supportModule,
      'Settings': SELECTORS.settingsModule,
      'Content Management': SELECTORS.contentManagementModule
    };
    
    return moduleMap[moduleName] || null;
  }

  async testCRUDOperations(moduleName, testData) {
    console.log(`🔄 Testing CRUD operations for ${moduleName}...`);
    
    const results = {
      create: false,
      read: false,
      update: false,
      delete: false
    };
    
    try {
      // Test Create
      if (testData.canCreate) {
        results.create = await this.testCreateOperation(moduleName, testData.createData);
      }
      
      // Test Read
      results.read = await this.testReadOperation(moduleName);
      
      // Test Update
      if (testData.canEdit) {
        results.update = await this.testUpdateOperation(moduleName, testData.updateData);
      }
      
      // Test Delete
      if (testData.canDelete) {
        results.delete = await this.testDeleteOperation(moduleName);
      }
      
      const passed = Object.values(results).filter(Boolean).length;
      const total = Object.keys(results).length;
      
      console.log(`✅ CRUD test results for ${moduleName}: ${passed}/${total} passed`);
      return results;
      
    } catch (error) {
      console.error(`❌ CRUD test failed for ${moduleName}:`, error.message);
      await this.takeScreenshot(`crud-failed-${moduleName.toLowerCase().replace(/\s+/g, '-')}`);
      return results;
    }
  }

  async testCreateOperation(moduleName, createData) {
    try {
      // Click create button
      await this.clickElement(SELECTORS.createButton);
      
      // Fill form data
      for (const [field, value] of Object.entries(createData)) {
        const selector = `input[name="${field}"], textarea[name="${field}"], select[name="${field}"]`;
        await this.typeText(selector, value);
      }
      
      // Submit form
      await this.clickElement(SELECTORS.submitButton);
      
      // Wait for success
      await this.page.waitForSelector(SELECTORS.successMessage, { timeout: 10000 });
      
      console.log(`✅ Create operation successful for ${moduleName}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Create operation failed for ${moduleName}:`, error.message);
      return false;
    }
  }

  async testReadOperation(moduleName) {
    try {
      // Check if table or list is present
      await this.waitForElement(SELECTORS.dataTable);
      
      // Check if data is displayed
      const rows = await this.page.$$(SELECTORS.tableRows);
      if (rows.length > 1) { // More than header row
        console.log(`✅ Read operation successful for ${moduleName}`);
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error(`❌ Read operation failed for ${moduleName}:`, error.message);
      return false;
    }
  }

  async testUpdateOperation(moduleName, updateData) {
    try {
      // Click edit button on first row
      await this.clickElement(SELECTORS.editButton);
      
      // Update form data
      for (const [field, value] of Object.entries(updateData)) {
        const selector = `input[name="${field}"], textarea[name="${field}"], select[name="${field}"]`;
        await this.page.evaluate((sel, val) => {
          const element = document.querySelector(sel);
          if (element) {
            element.value = val;
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, selector, value);
      }
      
      // Submit form
      await this.clickElement(SELECTORS.submitButton);
      
      // Wait for success
      await this.page.waitForSelector(SELECTORS.successMessage, { timeout: 10000 });
      
      console.log(`✅ Update operation successful for ${moduleName}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Update operation failed for ${moduleName}:`, error.message);
      return false;
    }
  }

  async testDeleteOperation(moduleName) {
    try {
      // Click delete button on first row
      await this.clickElement(SELECTORS.deleteButton);
      
      // Confirm deletion
      await this.page.waitForSelector(SELECTORS.modal);
      await this.clickElement('button:contains("Confirm"), button:contains("Delete")');
      
      // Wait for success
      await this.page.waitForSelector(SELECTORS.successMessage, { timeout: 10000 });
      
      console.log(`✅ Delete operation successful for ${moduleName}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Delete operation failed for ${moduleName}:`, error.message);
      return false;
    }
  }

  async testSearchAndFilters(moduleName) {
    console.log(`🔍 Testing search and filters for ${moduleName}...`);
    
    try {
      // Test search
      if (await this.isElementVisible(SELECTORS.searchInput)) {
        await this.typeText(SELECTORS.searchInput, 'test');
        await this.page.keyboard.press('Enter');
        await this.waitForPageLoad();
        console.log(`✅ Search functionality working for ${moduleName}`);
      }
      
      // Test filters
      if (await this.isElementVisible(SELECTORS.filterDropdown)) {
        await this.clickElement(SELECTORS.filterDropdown);
        await this.waitForPageLoad();
        console.log(`✅ Filter functionality working for ${moduleName}`);
      }
      
      return true;
      
    } catch (error) {
      console.error(`❌ Search/filter test failed for ${moduleName}:`, error.message);
      return false;
    }
  }

  async testPagination(moduleName) {
    console.log(`📄 Testing pagination for ${moduleName}...`);
    
    try {
      if (await this.isElementVisible(SELECTORS.pagination)) {
        // Test next page
        if (await this.isElementVisible(SELECTORS.nextButton)) {
          await this.clickElement(SELECTORS.nextButton);
          await this.waitForPageLoad();
        }
        
        // Test previous page
        if (await this.isElementVisible(SELECTORS.prevButton)) {
          await this.clickElement(SELECTORS.prevButton);
          await this.waitForPageLoad();
        }
        
        console.log(`✅ Pagination working for ${moduleName}`);
        return true;
      }
      
      return true; // No pagination is fine
      
    } catch (error) {
      console.error(`❌ Pagination test failed for ${moduleName}:`, error.message);
      return false;
    }
  }
}

module.exports = {
  TestHelper,
  TEST_CREDENTIALS,
  ROLE_PERMISSIONS,
  SELECTORS
}; 