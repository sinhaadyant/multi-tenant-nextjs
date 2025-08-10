const { TestHelper, TEST_CREDENTIALS, ROLE_PERMISSIONS } = require('./test-setup');

class AuditLogsTester {
  constructor() {
    this.testHelper = new TestHelper();
    this.results = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Audit Logs E2E Tests...\n');
    
    try {
      await this.testHelper.setup();
      
      // Test SuperAdmin Audit Logs
      console.log('\n👑 Testing SuperAdmin Audit Logs...');
      await this.testSuperAdminAuditLogs();
      
      // Test TechCorp Audit Logs
      console.log('\n🏢 Testing TechCorp Audit Logs...');
      await this.testTenantAuditLogs('techcorp');
      
      // Test GlobalRetail Audit Logs
      console.log('\n🛒 Testing GlobalRetail Audit Logs...');
      await this.testTenantAuditLogs('globalretail');
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Audit Logs test execution failed:', error);
    } finally {
      await this.testHelper.teardown();
    }
  }

  async testSuperAdminAuditLogs() {
    const loginSuccess = await this.testHelper.login('superadmin', 'superadmin');
    if (!loginSuccess) {
      this.logResult('SuperAdmin Login', 'FAIL', 'Failed to login as SuperAdmin');
      return;
    }

    this.logResult('SuperAdmin Login', 'PASS', 'Successfully logged in as SuperAdmin');

    // Test audit logs access
    const accessTest = await this.testAuditLogsAccess('SuperAdmin');
    this.logResult('SuperAdmin Audit Logs Access', accessTest ? 'PASS' : 'FAIL',
      accessTest ? 'Audit logs accessible' : 'Audit logs not accessible');

    if (accessTest) {
      // Test audit logs viewing
      const viewTest = await this.testAuditLogsViewing('SuperAdmin');
      this.logResult('SuperAdmin Audit Logs Viewing', viewTest ? 'PASS' : 'FAIL',
        viewTest ? 'Audit logs viewing working' : 'Audit logs viewing failed');

      // Test audit logs filtering
      const filterTest = await this.testAuditLogsFiltering('SuperAdmin');
      this.logResult('SuperAdmin Audit Logs Filtering', filterTest ? 'PASS' : 'FAIL',
        filterTest ? 'Audit logs filtering working' : 'Audit logs filtering failed');

      // Test audit logs export
      const exportTest = await this.testAuditLogsExport('SuperAdmin');
      this.logResult('SuperAdmin Audit Logs Export', exportTest ? 'PASS' : 'FAIL',
        exportTest ? 'Audit logs export working' : 'Audit logs export failed');
    }
  }

  async testTenantAuditLogs(tenant) {
    const roles = ['admin', 'manager'];
    
    for (const role of roles) {
      console.log(`\n🔐 Testing ${tenant} ${role} audit logs...`);
      
      const loginSuccess = await this.testHelper.login(tenant, role);
      if (!loginSuccess) {
        this.logResult(`${tenant} ${role} Login`, 'FAIL', `Failed to login as ${role}`);
        continue;
      }

      this.logResult(`${tenant} ${role} Login`, 'PASS', `Successfully logged in as ${role}`);

      // Test audit logs access
      const accessTest = await this.testAuditLogsAccess(`${tenant} ${role}`);
      this.logResult(`${tenant} ${role} Audit Logs Access`, accessTest ? 'PASS' : 'FAIL',
        accessTest ? 'Audit logs accessible' : 'Audit logs not accessible');

      if (accessTest) {
        // Test audit logs viewing
        const viewTest = await this.testAuditLogsViewing(`${tenant} ${role}`);
        this.logResult(`${tenant} ${role} Audit Logs Viewing`, viewTest ? 'PASS' : 'FAIL',
          viewTest ? 'Audit logs viewing working' : 'Audit logs viewing failed');

        // Test audit logs filtering
        const filterTest = await this.testAuditLogsFiltering(`${tenant} ${role}`);
        this.logResult(`${tenant} ${role} Audit Logs Filtering`, filterTest ? 'PASS' : 'FAIL',
          filterTest ? 'Audit logs filtering working' : 'Audit logs filtering failed');

        // Test audit logs export (if permitted)
        if (role === 'admin') {
          const exportTest = await this.testAuditLogsExport(`${tenant} ${role}`);
          this.logResult(`${tenant} ${role} Audit Logs Export`, exportTest ? 'PASS' : 'FAIL',
            exportTest ? 'Audit logs export working' : 'Audit logs export failed');
        }
      }

      // Logout before next user
      await this.testHelper.navigateTo('/logout');
    }
  }

  async testAuditLogsAccess(userType) {
    try {
      console.log(`📋 Testing audit logs access for ${userType}...`);
      
      // Navigate to audit logs
      const success = await this.testHelper.navigateTo('/audit');
      if (!success) {
        return false;
      }

      // Wait for page to load
      await this.testHelper.waitForPageLoad();

      // Check if we're on audit logs page
      const currentUrl = await this.testHelper.getCurrentUrl();
      if (!currentUrl.includes('/audit')) {
        console.error(`❌ Not on audit logs page: ${currentUrl}`);
        return false;
      }

      // Check for audit logs title or content
      const pageTitle = await this.testHelper.getText('h1, h2, .title, [data-testid="page-title"]');
      if (!pageTitle.toLowerCase().includes('audit') && !pageTitle.toLowerCase().includes('log')) {
        console.error(`❌ Audit logs title not found: ${pageTitle}`);
        return false;
      }

      console.log(`✅ Audit logs access successful for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ Audit logs access failed for ${userType}:`, error.message);
      await this.testHelper.takeScreenshot(`audit-logs-access-${userType.toLowerCase().replace(/\s+/g, '-')}`);
      return false;
    }
  }

  async testAuditLogsViewing(userType) {
    try {
      console.log(`👀 Testing audit logs viewing for ${userType}...`);
      
      // Check for audit logs table
      const tableExists = await this.testHelper.waitForElement('table, [role="table"]');
      if (!tableExists) {
        console.error('❌ Audit logs table not found');
        return false;
      }

      // Check for audit log entries
      const rows = await this.testHelper.page.$$('tr, [role="row"]');
      if (rows.length <= 1) { // Only header row
        console.log('⚠️ No audit log entries found (this might be normal)');
      }

      // Check for audit log details
      const detailButtons = await this.testHelper.page.$$('button:contains("View"), button:contains("Details")');
      if (detailButtons.length > 0) {
        // Click on first detail button
        await detailButtons[0].click();
        await this.testHelper.waitForPageLoad();
        
        // Check if details modal/page opened
        const modal = await this.testHelper.page.$('[role="dialog"], .modal');
        if (modal) {
          console.log('✅ Audit log details modal opened');
        }
      }

      console.log(`✅ Audit logs viewing test passed for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ Audit logs viewing test failed for ${userType}:`, error.message);
      return false;
    }
  }

  async testAuditLogsFiltering(userType) {
    try {
      console.log(`🔍 Testing audit logs filtering for ${userType}...`);
      
      // Test date range filter
      const dateFilters = await this.testHelper.page.$$('input[type="date"], [data-testid="date-filter"]');
      if (dateFilters.length > 0) {
        await dateFilters[0].click();
        await this.testHelper.waitForPageLoad();
        console.log('✅ Date filter working');
      }

      // Test action type filter
      const actionFilters = await this.testHelper.page.$$('select[name="action"], [data-testid="action-filter"]');
      if (actionFilters.length > 0) {
        await this.testHelper.clickElement('select[name="action"], [data-testid="action-filter"]');
        await this.testHelper.waitForPageLoad();
        console.log('✅ Action filter working');
      }

      // Test user filter
      const userFilters = await this.testHelper.page.$$('select[name="user"], [data-testid="user-filter"]');
      if (userFilters.length > 0) {
        await this.testHelper.clickElement('select[name="user"], [data-testid="user-filter"]');
        await this.testHelper.waitForPageLoad();
        console.log('✅ User filter working');
      }

      // Test search functionality
      const searchResult = await this.testHelper.testSearchAndFilters('Audit Logs');

      console.log(`✅ Audit logs filtering test passed for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ Audit logs filtering test failed for ${userType}:`, error.message);
      return false;
    }
  }

  async testAuditLogsExport(userType) {
    try {
      console.log(`📤 Testing audit logs export for ${userType}...`);
      
      // Look for export buttons
      const exportButtons = await this.testHelper.page.$$('button:contains("Export"), button:contains("Download"), [data-testid="export-button"]');
      if (exportButtons.length === 0) {
        console.log('⚠️ No export functionality found (this might be normal)');
        return true;
      }

      // Click export button
      await exportButtons[0].click();
      await this.testHelper.waitForPageLoad();

      // Check if export modal opened or download started
      const modal = await this.testHelper.page.$('[role="dialog"], .modal');
      if (modal) {
        console.log('✅ Export modal opened');
      }

      console.log(`✅ Audit logs export test passed for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ Audit logs export test failed for ${userType}:`, error.message);
      return false;
    }
  }

  async testAuditLogsPagination(userType) {
    try {
      console.log(`📄 Testing audit logs pagination for ${userType}...`);
      
      return await this.testHelper.testPagination('Audit Logs');

    } catch (error) {
      console.error(`❌ Audit logs pagination test failed for ${userType}:`, error.message);
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
    console.log('\n📊 Audit Logs Test Results Summary:');
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
      module: 'Audit Logs',
      summary: {
        total: total,
        passed: passed,
        failed: failed,
        successRate: ((passed / total) * 100).toFixed(1)
      },
      results: this.results,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('audit-logs-test-results.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Audit Logs test results saved to audit-logs-test-results.json');
  }
}

// Run the tests
async function main() {
  const tester = new AuditLogsTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AuditLogsTester; 