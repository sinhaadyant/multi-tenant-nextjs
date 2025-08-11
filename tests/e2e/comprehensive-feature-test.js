const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ComprehensiveFeatureTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
    this.errors = [];
    this.baseUrl = 'http://localhost:3000';
    this.superadminCredentials = {
      email: 'admin@superadmin.com',
      password: 'AdminPass123'
    };
    this.tenantCredentials = {
      email: 'admin@techcorp.com',
      password: 'AdminPass123'
    };
  }

  async init() {
    console.log('🚀 Starting comprehensive feature tests...');
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set viewport
    await this.page.setViewport({ width: 1280, height: 720 });
    
    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.errors.push({
          type: 'console_error',
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    // Listen for page errors
    this.page.on('pageerror', error => {
      this.errors.push({
        type: 'page_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      console.log(`❌ Page Error: ${error.message}`);
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async logTestResult(testName, success, details = '') {
    const result = {
      testName,
      success,
      details,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    
    if (success) {
      console.log(`✅ ${testName}: PASSED`);
    } else {
      console.log(`❌ ${testName}: FAILED - ${details}`);
    }
  }

  async waitForElement(selector, timeout = 5000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  async waitForNavigation(timeout = 5000) {
    try {
      await this.page.waitForNavigation({ timeout, waitUntil: 'networkidle0' });
      return true;
    } catch (error) {
      return false;
    }
  }

  // ========================================
  // SUPERADMIN TESTS
  // ========================================

  async testSuperadminAuthentication() {
    console.log('\n🔐 Testing Superadmin Authentication...');
    
    try {
      // Test login page
      await this.page.goto(`${this.baseUrl}/superadmin/login`);
      await this.page.waitForTimeout(1000);
      
      const loginFormExists = await this.waitForElement('form');
      await this.logTestResult('Superadmin Login Page Loads', loginFormExists);
      
      // Test login functionality
      await this.page.type('input[name="email"]', this.superadminCredentials.email);
      await this.page.type('input[name="password"]', this.superadminCredentials.password);
      await this.page.click('button[type="submit"]');
      
      const dashboardLoaded = await this.waitForElement('[data-testid="dashboard"]', 10000);
      await this.logTestResult('Superadmin Login Success', dashboardLoaded);
      
      return dashboardLoaded;
    } catch (error) {
      await this.logTestResult('Superadmin Authentication', false, error.message);
      return false;
    }
  }

  async testSuperadminDashboard() {
    console.log('\n📊 Testing Superadmin Dashboard...');
    
    try {
      // Check dashboard elements
      const statsCards = await this.page.$$('[data-testid="stats-card"]');
      await this.logTestResult('Dashboard Stats Cards', statsCards.length > 0);
      
      const sidebar = await this.waitForElement('[data-testid="sidebar"]');
      await this.logTestResult('Dashboard Sidebar', sidebar);
      
      const header = await this.waitForElement('[data-testid="header"]');
      await this.logTestResult('Dashboard Header', header);
      
      return true;
    } catch (error) {
      await this.logTestResult('Superadmin Dashboard', false, error.message);
      return false;
    }
  }

  async testSuperadminTenantManagement() {
    console.log('\n🏢 Testing Superadmin Tenant Management...');
    
    try {
      // Navigate to tenants page
      await this.page.click('[data-testid="nav-tenants"]');
      await this.waitForNavigation();
      
      const tenantsTable = await this.waitForElement('[data-testid="tenants-table"]');
      await this.logTestResult('Tenants Table Loads', tenantsTable);
      
      // Test create tenant button
      const createButton = await this.waitForElement('[data-testid="create-tenant-btn"]');
      await this.logTestResult('Create Tenant Button', createButton);
      
      // Test tenant filters
      const filterSection = await this.waitForElement('[data-testid="tenant-filters"]');
      await this.logTestResult('Tenant Filters', filterSection);
      
      return true;
    } catch (error) {
      await this.logTestResult('Superadmin Tenant Management', false, error.message);
      return false;
    }
  }

  async testSuperadminUserManagement() {
    console.log('\n👥 Testing Superadmin User Management...');
    
    try {
      // Navigate to users page
      await this.page.click('[data-testid="nav-users"]');
      await this.waitForNavigation();
      
      const usersTable = await this.waitForElement('[data-testid="users-table"]');
      await this.logTestResult('Users Table Loads', usersTable);
      
      // Test user search
      const searchInput = await this.waitForElement('[data-testid="user-search"]');
      await this.logTestResult('User Search Input', searchInput);
      
      return true;
    } catch (error) {
      await this.logTestResult('Superadmin User Management', false, error.message);
      return false;
    }
  }

  async testSuperadminRolesPermissions() {
    console.log('\n🛡️ Testing Superadmin Roles & Permissions...');
    
    try {
      // Navigate to roles page
      await this.page.click('[data-testid="nav-roles"]');
      await this.waitForNavigation();
      
      const rolesTable = await this.waitForElement('[data-testid="roles-table"]');
      await this.logTestResult('Roles Table Loads', rolesTable);
      
      // Test create role button
      const createRoleBtn = await this.waitForElement('[data-testid="create-role-btn"]');
      await this.logTestResult('Create Role Button', createRoleBtn);
      
      return true;
    } catch (error) {
      await this.logTestResult('Superadmin Roles & Permissions', false, error.message);
      return false;
    }
  }

  async testSuperadminAuditLogs() {
    console.log('\n📋 Testing Superadmin Audit Logs...');
    
    try {
      // Navigate to audit logs
      await this.page.click('[data-testid="nav-audit"]');
      await this.waitForNavigation();
      
      const auditTable = await this.waitForElement('[data-testid="audit-table"]');
      await this.logTestResult('Audit Logs Table', auditTable);
      
      return true;
    } catch (error) {
      await this.logTestResult('Superadmin Audit Logs', false, error.message);
      return false;
    }
  }

  async testSuperadminReports() {
    console.log('\n📈 Testing Superadmin Reports...');
    
    try {
      // Navigate to reports
      await this.page.click('[data-testid="nav-reports"]');
      await this.waitForNavigation();
      
      const reportsSection = await this.waitForElement('[data-testid="reports-section"]');
      await this.logTestResult('Reports Section', reportsSection);
      
      return true;
    } catch (error) {
      await this.logTestResult('Superadmin Reports', false, error.message);
      return false;
    }
  }

  async testSuperadminNotifications() {
    console.log('\n🔔 Testing Superadmin Notifications...');
    
    try {
      // Navigate to notifications
      await this.page.click('[data-testid="nav-notifications"]');
      await this.waitForNavigation();
      
      const notificationsList = await this.waitForElement('[data-testid="notifications-list"]');
      await this.logTestResult('Notifications List', notificationsList);
      
      return true;
    } catch (error) {
      await this.logTestResult('Superadmin Notifications', false, error.message);
      return false;
    }
  }

  async testSuperadminSupport() {
    console.log('\n🆘 Testing Superadmin Support...');
    
    try {
      // Navigate to support
      await this.page.click('[data-testid="nav-support"]');
      await this.waitForNavigation();
      
      const supportSection = await this.waitForElement('[data-testid="support-section"]');
      await this.logTestResult('Support Section', supportSection);
      
      return true;
    } catch (error) {
      await this.logTestResult('Superadmin Support', false, error.message);
      return false;
    }
  }

  async testSuperadminSettings() {
    console.log('\n⚙️ Testing Superadmin Settings...');
    
    try {
      // Navigate to settings
      await this.page.click('[data-testid="nav-settings"]');
      await this.waitForNavigation();
      
      const settingsForm = await this.waitForElement('[data-testid="settings-form"]');
      await this.logTestResult('Settings Form', settingsForm);
      
      return true;
    } catch (error) {
      await this.logTestResult('Superadmin Settings', false, error.message);
      return false;
    }
  }

  // ========================================
  // TENANT TESTS
  // ========================================

  async testTenantAuthentication() {
    console.log('\n🔐 Testing Tenant Authentication...');
    
    try {
      // Navigate to tenant login
      await this.page.goto(`${this.baseUrl}/techcorp/login`);
      await this.page.waitForTimeout(1000);
      
      const loginFormExists = await this.waitForElement('form');
      await this.logTestResult('Tenant Login Page Loads', loginFormExists);
      
      // Test login functionality
      await this.page.type('input[name="email"]', this.tenantCredentials.email);
      await this.page.type('input[name="password"]', this.tenantCredentials.password);
      await this.page.click('button[type="submit"]');
      
      const dashboardLoaded = await this.waitForElement('[data-testid="tenant-dashboard"]', 10000);
      await this.logTestResult('Tenant Login Success', dashboardLoaded);
      
      return dashboardLoaded;
    } catch (error) {
      await this.logTestResult('Tenant Authentication', false, error.message);
      return false;
    }
  }

  async testTenantDashboard() {
    console.log('\n📊 Testing Tenant Dashboard...');
    
    try {
      // Check tenant dashboard elements
      const tenantStats = await this.page.$$('[data-testid="tenant-stats"]');
      await this.logTestResult('Tenant Dashboard Stats', tenantStats.length > 0);
      
      const tenantSidebar = await this.waitForElement('[data-testid="tenant-sidebar"]');
      await this.logTestResult('Tenant Dashboard Sidebar', tenantSidebar);
      
      return true;
    } catch (error) {
      await this.logTestResult('Tenant Dashboard', false, error.message);
      return false;
    }
  }

  async testTenantUserManagement() {
    console.log('\n👥 Testing Tenant User Management...');
    
    try {
      // Navigate to tenant users page
      await this.page.click('[data-testid="nav-tenant-users"]');
      await this.waitForNavigation();
      
      const tenantUsersTable = await this.waitForElement('[data-testid="tenant-users-table"]');
      await this.logTestResult('Tenant Users Table', tenantUsersTable);
      
      return true;
    } catch (error) {
      await this.logTestResult('Tenant User Management', false, error.message);
      return false;
    }
  }

  async testTenantRolesPermissions() {
    console.log('\n🛡️ Testing Tenant Roles & Permissions...');
    
    try {
      // Navigate to tenant roles page
      await this.page.click('[data-testid="nav-tenant-roles"]');
      await this.waitForNavigation();
      
      const tenantRolesTable = await this.waitForElement('[data-testid="tenant-roles-table"]');
      await this.logTestResult('Tenant Roles Table', tenantRolesTable);
      
      return true;
    } catch (error) {
      await this.logTestResult('Tenant Roles & Permissions', false, error.message);
      return false;
    }
  }

  async testTenantModuleManagement() {
    console.log('\n🔧 Testing Tenant Module Management...');
    
    try {
      // Navigate to module management
      await this.page.click('[data-testid="nav-module-management"]');
      await this.waitForNavigation();
      
      const modulesList = await this.waitForElement('[data-testid="modules-list"]');
      await this.logTestResult('Modules List', modulesList);
      
      return true;
    } catch (error) {
      await this.logTestResult('Tenant Module Management', false, error.message);
      return false;
    }
  }

  async testTenantAuditLogs() {
    console.log('\n📋 Testing Tenant Audit Logs...');
    
    try {
      // Navigate to tenant audit logs
      await this.page.click('[data-testid="nav-tenant-audit"]');
      await this.waitForNavigation();
      
      const tenantAuditTable = await this.waitForElement('[data-testid="tenant-audit-table"]');
      await this.logTestResult('Tenant Audit Table', tenantAuditTable);
      
      return true;
    } catch (error) {
      await this.logTestResult('Tenant Audit Logs', false, error.message);
      return false;
    }
  }

  async testTenantSupport() {
    console.log('\n🆘 Testing Tenant Support...');
    
    try {
      // Navigate to tenant support
      await this.page.click('[data-testid="nav-tenant-support"]');
      await this.waitForNavigation();
      
      const tenantSupportSection = await this.waitForElement('[data-testid="tenant-support-section"]');
      await this.logTestResult('Tenant Support Section', tenantSupportSection);
      
      return true;
    } catch (error) {
      await this.logTestResult('Tenant Support', false, error.message);
      return false;
    }
  }

  // ========================================
  // ERROR HANDLING & FIXING
  // ========================================

  async fixConsoleErrors() {
    console.log('\n🔧 Attempting to fix console errors...');
    
    for (const error of this.errors) {
      if (error.type === 'console_error') {
        // Common error fixes
        if (error.message.includes('Hydration')) {
          console.log('⚠️ Hydration error detected - this is common in Next.js development');
        } else if (error.message.includes('404')) {
          console.log('⚠️ 404 error - route may not exist yet');
        } else if (error.message.includes('CORS')) {
          console.log('⚠️ CORS error - check API configuration');
        } else {
          console.log(`⚠️ Unhandled error: ${error.message}`);
        }
      }
    }
  }

  async generateTestReport() {
    console.log('\n📊 Generating Test Report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.testResults.length,
        passed: this.testResults.filter(r => r.success).length,
        failed: this.testResults.filter(r => !r.success).length,
        errors: this.errors.length
      },
      testResults: this.testResults,
      errors: this.errors
    };
    
    // Save report to file
    const reportPath = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Test report saved to: ${reportPath}`);
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Errors: ${report.summary.errors}`);
    console.log('='.repeat(50));
    
    return report;
  }

  // ========================================
  // MAIN TEST RUNNER
  // ========================================

  async runAllTests() {
    try {
      await this.init();
      
      // Superadmin tests
      const superadminAuth = await this.testSuperadminAuthentication();
      if (superadminAuth) {
        await this.testSuperadminDashboard();
        await this.testSuperadminTenantManagement();
        await this.testSuperadminUserManagement();
        await this.testSuperadminRolesPermissions();
        await this.testSuperadminAuditLogs();
        await this.testSuperadminReports();
        await this.testSuperadminNotifications();
        await this.testSuperadminSupport();
        await this.testSuperadminSettings();
      }
      
      // Tenant tests
      const tenantAuth = await this.testTenantAuthentication();
      if (tenantAuth) {
        await this.testTenantDashboard();
        await this.testTenantUserManagement();
        await this.testTenantRolesPermissions();
        await this.testTenantModuleManagement();
        await this.testTenantAuditLogs();
        await this.testTenantSupport();
      }
      
      // Error handling
      await this.fixConsoleErrors();
      
      // Generate report
      await this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test runner error:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new ComprehensiveFeatureTest();
  tester.runAllTests().catch(console.error);
}

module.exports = ComprehensiveFeatureTest; 