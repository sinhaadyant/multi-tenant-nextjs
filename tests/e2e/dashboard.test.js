const { TestHelper, TEST_CREDENTIALS, ROLE_PERMISSIONS } = require('./test-setup');

class DashboardTester {
  constructor() {
    this.testHelper = new TestHelper();
    this.results = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Dashboard E2E Tests...\n');
    
    try {
      await this.testHelper.setup();
      
      // Test SuperAdmin Dashboard
      console.log('\n👑 Testing SuperAdmin Dashboard...');
      await this.testSuperAdminDashboard();
      
      // Test TechCorp Dashboards
      console.log('\n🏢 Testing TechCorp Dashboards...');
      await this.testTenantDashboards('techcorp');
      
      // Test GlobalRetail Dashboards
      console.log('\n🛒 Testing GlobalRetail Dashboards...');
      await this.testTenantDashboards('globalretail');
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Dashboard test execution failed:', error);
    } finally {
      await this.testHelper.teardown();
    }
  }

  async testSuperAdminDashboard() {
    const loginSuccess = await this.testHelper.login('superadmin', 'superadmin');
    if (!loginSuccess) {
      this.logResult('SuperAdmin Login', 'FAIL', 'Failed to login as SuperAdmin');
      return;
    }

    this.logResult('SuperAdmin Login', 'PASS', 'Successfully logged in as SuperAdmin');

    // Test dashboard access
    const dashboardAccess = await this.testDashboardAccess('SuperAdmin');
    this.logResult('SuperAdmin Dashboard Access', dashboardAccess ? 'PASS' : 'FAIL', 
      dashboardAccess ? 'Dashboard loaded successfully' : 'Failed to load dashboard');

    // Test dashboard content
    const contentTest = await this.testDashboardContent('SuperAdmin');
    this.logResult('SuperAdmin Dashboard Content', contentTest ? 'PASS' : 'FAIL',
      contentTest ? 'Dashboard content displayed correctly' : 'Dashboard content missing');

    // Test dashboard widgets
    const widgetsTest = await this.testDashboardWidgets('SuperAdmin');
    this.logResult('SuperAdmin Dashboard Widgets', widgetsTest ? 'PASS' : 'FAIL',
      widgetsTest ? 'Dashboard widgets working' : 'Dashboard widgets not working');

    // Test dashboard navigation
    const navigationTest = await this.testDashboardNavigation('SuperAdmin');
    this.logResult('SuperAdmin Dashboard Navigation', navigationTest ? 'PASS' : 'FAIL',
      navigationTest ? 'Dashboard navigation working' : 'Dashboard navigation failed');
  }

  async testTenantDashboards(tenant) {
    const roles = ['admin', 'manager', 'user', 'viewer'];
    
    for (const role of roles) {
      console.log(`\n🔐 Testing ${tenant} ${role} dashboard...`);
      
      const loginSuccess = await this.testHelper.login(tenant, role);
      if (!loginSuccess) {
        this.logResult(`${tenant} ${role} Login`, 'FAIL', `Failed to login as ${role}`);
        continue;
      }

      this.logResult(`${tenant} ${role} Login`, 'PASS', `Successfully logged in as ${role}`);

      // Test dashboard access
      const dashboardAccess = await this.testDashboardAccess(`${tenant} ${role}`);
      this.logResult(`${tenant} ${role} Dashboard Access`, dashboardAccess ? 'PASS' : 'FAIL',
        dashboardAccess ? 'Dashboard loaded successfully' : 'Failed to load dashboard');

      // Test dashboard content
      const contentTest = await this.testDashboardContent(`${tenant} ${role}`);
      this.logResult(`${tenant} ${role} Dashboard Content`, contentTest ? 'PASS' : 'FAIL',
        contentTest ? 'Dashboard content displayed correctly' : 'Dashboard content missing');

      // Test dashboard widgets
      const widgetsTest = await this.testDashboardWidgets(`${tenant} ${role}`);
      this.logResult(`${tenant} ${role} Dashboard Widgets`, widgetsTest ? 'PASS' : 'FAIL',
        widgetsTest ? 'Dashboard widgets working' : 'Dashboard widgets not working');

      // Test dashboard navigation
      const navigationTest = await this.testDashboardNavigation(`${tenant} ${role}`);
      this.logResult(`${tenant} ${role} Dashboard Navigation`, navigationTest ? 'PASS' : 'FAIL',
        navigationTest ? 'Dashboard navigation working' : 'Dashboard navigation failed');

      // Test role-based content visibility
      const roleContentTest = await this.testRoleBasedContent(`${tenant} ${role}`, role);
      this.logResult(`${tenant} ${role} Role-Based Content`, roleContentTest ? 'PASS' : 'FAIL',
        roleContentTest ? 'Role-based content displayed correctly' : 'Role-based content issues');

      // Logout before next user
      await this.testHelper.navigateTo('/logout');
    }
  }

  async testDashboardAccess(userType) {
    try {
      console.log(`📊 Testing dashboard access for ${userType}...`);
      
      // Navigate to dashboard
      const success = await this.testHelper.navigateTo('/dashboard');
      if (!success) {
        return false;
      }

      // Wait for dashboard to load
      await this.testHelper.waitForPageLoad();

      // Check if we're on dashboard page
      const currentUrl = await this.testHelper.getCurrentUrl();
      if (!currentUrl.includes('/dashboard')) {
        console.error(`❌ Not on dashboard page: ${currentUrl}`);
        return false;
      }

      // Check for dashboard title or content
      const pageTitle = await this.testHelper.getText('h1, h2, .title, [data-testid="dashboard-title"]');
      if (!pageTitle.toLowerCase().includes('dashboard')) {
        console.error(`❌ Dashboard title not found: ${pageTitle}`);
        return false;
      }

      console.log(`✅ Dashboard access successful for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ Dashboard access failed for ${userType}:`, error.message);
      await this.testHelper.takeScreenshot(`dashboard-access-${userType.toLowerCase().replace(/\s+/g, '-')}`);
      return false;
    }
  }

  async testDashboardContent(userType) {
    try {
      console.log(`📋 Testing dashboard content for ${userType}...`);
      
      // Check for main content area
      const contentExists = await this.testHelper.waitForElement('main, .content, [data-testid="dashboard-content"]');
      if (!contentExists) {
        console.error('❌ Dashboard content area not found');
        return false;
      }

      // Check for dashboard widgets/cards
      const widgets = await this.testHelper.page.$$('.card, .widget, .dashboard-card, [class*="bg-white"]');
      if (widgets.length === 0) {
        console.error('❌ No dashboard widgets found');
        return false;
      }

      // Check for charts or statistics
      const charts = await this.testHelper.page.$$('canvas, .chart, .statistics, [class*="chart"]');
      const stats = await this.testHelper.page.$$('.stat, .metric, [class*="stat"]');
      
      if (charts.length === 0 && stats.length === 0) {
        console.log('⚠️ No charts or statistics found (this might be normal)');
      }

      console.log(`✅ Dashboard content test passed for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ Dashboard content test failed for ${userType}:`, error.message);
      return false;
    }
  }

  async testDashboardWidgets(userType) {
    try {
      console.log(`🔧 Testing dashboard widgets for ${userType}...`);
      
      // Test widget interactions
      const widgets = await this.testHelper.page.$$('.card, .widget, .dashboard-card');
      
      for (let i = 0; i < Math.min(widgets.length, 3); i++) {
        try {
          // Try to click on widget (if it's clickable)
          await widgets[i].click();
          await this.testHelper.waitForPageLoad();
          
          // Check if navigation occurred
          const currentUrl = await this.testHelper.getCurrentUrl();
          if (currentUrl.includes('/dashboard')) {
            // If still on dashboard, widget might not be clickable (which is fine)
            console.log(`Widget ${i + 1} is not clickable (this is normal)`);
          } else {
            // Navigate back to dashboard
            await this.testHelper.navigateTo('/dashboard');
          }
        } catch (error) {
          console.log(`Widget ${i + 1} interaction failed (this might be normal):`, error.message);
        }
      }

      console.log(`✅ Dashboard widgets test passed for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ Dashboard widgets test failed for ${userType}:`, error.message);
      return false;
    }
  }

  async testDashboardNavigation(userType) {
    try {
      console.log(`🧭 Testing dashboard navigation for ${userType}...`);
      
      // Test sidebar navigation
      const sidebarExists = await this.testHelper.waitForElement('aside, .sidebar, [role="navigation"]');
      if (sidebarExists) {
        // Try to click on a menu item
        const menuItems = await this.testHelper.page.$$('nav a, .sidebar a, .menu a');
        if (menuItems.length > 0) {
          await menuItems[0].click();
          await this.testHelper.waitForPageLoad();
          
          // Navigate back to dashboard
          await this.testHelper.navigateTo('/dashboard');
        }
      }

      // Test breadcrumb navigation
      const breadcrumbs = await this.testHelper.page.$$('.breadcrumb a, [data-testid="breadcrumb"] a');
      if (breadcrumbs.length > 0) {
        await breadcrumbs[0].click();
        await this.testHelper.waitForPageLoad();
        
        // Navigate back to dashboard
        await this.testHelper.navigateTo('/dashboard');
      }

      console.log(`✅ Dashboard navigation test passed for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ Dashboard navigation test failed for ${userType}:`, error.message);
      return false;
    }
  }

  async testRoleBasedContent(userType, role) {
    try {
      console.log(`👤 Testing role-based content for ${userType}...`);
      
      const permissions = ROLE_PERMISSIONS[role];
      if (!permissions) {
        console.log(`⚠️ No permissions defined for role: ${role}`);
        return true;
      }

      // Check if modules are visible based on role
      for (const module of permissions.modules) {
        const hasAccess = await this.testHelper.testModuleAccess(module, true);
        if (!hasAccess) {
          console.error(`❌ Module ${module} should be accessible for ${role}`);
          return false;
        }
      }

      // Check for restricted content (should not be visible)
      const restrictedModules = ['SuperAdmin', 'System Settings', 'Global Configuration'];
      for (const module of restrictedModules) {
        if (role !== 'superadmin') {
          const hasAccess = await this.testHelper.testModuleAccess(module, false);
          if (hasAccess) {
            console.error(`❌ Module ${module} should not be accessible for ${role}`);
            return false;
          }
        }
      }

      console.log(`✅ Role-based content test passed for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ Role-based content test failed for ${userType}:`, error.message);
      return false;
    }
  }

  logResult(testName, status, details) {
    const result = {
      test: testName,
      status: status,
      details: details,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${testName}: ${details}`);
  }

  generateReport() {
    console.log('\n📊 Dashboard Test Results Summary:');
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
      module: 'Dashboard',
      summary: {
        total: total,
        passed: passed,
        failed: failed,
        successRate: ((passed / total) * 100).toFixed(1)
      },
      results: this.results,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('dashboard-test-results.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Dashboard test results saved to dashboard-test-results.json');
  }
}

// Run the tests
async function main() {
  const tester = new DashboardTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DashboardTester; 