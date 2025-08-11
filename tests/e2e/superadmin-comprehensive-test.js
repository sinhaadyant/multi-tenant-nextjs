const puppeteer = require('puppeteer');
const { TestHelper, TEST_CREDENTIALS } = require('./test-setup');
const SuperAdminDatabaseHelper = require('./superadmin-db-helper');

// Import individual test modules
const SuperAdminAuthTester = require('./superadmin/auth-test');
const SuperAdminDashboardTester = require('./superadmin/dashboard-test');
const SuperAdminTenantTester = require('./superadmin/tenant-test');
const SuperAdminUserTester = require('./superadmin/user-test');
const SuperAdminRoleTester = require('./superadmin/role-test');
const SuperAdminAuditTester = require('./superadmin/audit-test');
const SuperAdminNotificationTester = require('./superadmin/notification-test');
const SuperAdminSupportTester = require('./superadmin/support-test');
const SuperAdminCrossVerificationTester = require('./superadmin/cross-verification-test');

class SuperAdminComprehensiveTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testHelper = null;
    this.dbHelper = new SuperAdminDatabaseHelper();
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
      details: []
    };
    this.createdTestData = {
      tenants: [],
      users: [],
      roles: [],
      notifications: [],
      supportTickets: []
    };
  }

  async initialize() {
    try {
      console.log('🚀 Initializing SuperAdmin Comprehensive Test Suite...');
      
      // Connect to database
      await this.dbHelper.connect();
      
      // Launch browser
      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
      });
      
      this.page = await this.browser.newPage();
      this.testHelper = new TestHelper(this.browser, this.page);
      
      console.log('✅ SuperAdmin test suite initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SuperAdmin test suite:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      console.log('🧹 Cleaning up SuperAdmin test data...');
      
      // Clean up created test data
      await this.cleanupTestData();
      
      // Disconnect from database
      await this.dbHelper.disconnect();
      
      // Close browser
      if (this.browser) {
        await this.browser.close();
      }
      
      console.log('✅ SuperAdmin test suite cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      console.log('\n🎯 Starting SuperAdmin Comprehensive Test Suite...\n');
      
      // Test modules in order
      const testModules = [
        { name: 'Authentication', tester: new SuperAdminAuthTester(this.testHelper, this.dbHelper) },
        { name: 'Dashboard', tester: new SuperAdminDashboardTester(this.testHelper, this.dbHelper) },
        { name: 'Tenant Management', tester: new SuperAdminTenantTester(this.testHelper, this.dbHelper) },
        { name: 'User Management', tester: new SuperAdminUserTester(this.testHelper, this.dbHelper) },
        { name: 'Role Management', tester: new SuperAdminRoleTester(this.testHelper, this.dbHelper) },
        { name: 'Audit Logs', tester: new SuperAdminAuditTester(this.testHelper, this.dbHelper) },
        { name: 'Notifications', tester: new SuperAdminNotificationTester(this.testHelper, this.dbHelper) },
        { name: 'Support System', tester: new SuperAdminSupportTester(this.testHelper, this.dbHelper) },
        { name: 'Cross Verification', tester: new SuperAdminCrossVerificationTester(this.testHelper, this.dbHelper) }
      ];

      for (const module of testModules) {
        console.log(`\n📋 Testing ${module.name}...`);
        try {
          const result = await module.tester.runAllTests();
          this.aggregateResults(result);
          console.log(`✅ ${module.name} tests completed`);
        } catch (error) {
          console.error(`❌ ${module.name} tests failed:`, error);
          this.testResults.errors.push(`${module.name}: ${error.message}`);
          this.testResults.failed++;
        }
      }

      await this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ SuperAdmin test suite failed:', error);
      this.testResults.errors.push(`Test Suite: ${error.message}`);
      this.testResults.failed++;
    } finally {
      await this.cleanup();
    }
  }

  async aggregateResults(result) {
    this.testResults.passed += result.passed || 0;
    this.testResults.failed += result.failed || 0;
    if (result.errors) {
      this.testResults.errors.push(...result.errors);
    }
    if (result.details) {
      this.testResults.details.push(...result.details);
    }
  }

  async cleanupTestData() {
    try {
      // Clean up in reverse order of creation
      for (const userId of this.createdTestData.users) {
        try {
          await this.dbHelper.deleteUserInDB(userId);
        } catch (error) {
          console.warn(`Warning: Could not delete test user ${userId}:`, error.message);
        }
      }

      for (const roleId of this.createdTestData.roles) {
        try {
          await this.dbHelper.prisma.role.delete({ where: { id: roleId } });
        } catch (error) {
          console.warn(`Warning: Could not delete test role ${roleId}:`, error.message);
        }
      }

      for (const tenantId of this.createdTestData.tenants) {
        try {
          await this.dbHelper.deleteTenantInDB(tenantId);
        } catch (error) {
          console.warn(`Warning: Could not delete test tenant ${tenantId}:`, error.message);
        }
      }

      for (const notificationId of this.createdTestData.notifications) {
        try {
          await this.dbHelper.prisma.notification.delete({ where: { id: notificationId } });
        } catch (error) {
          console.warn(`Warning: Could not delete test notification ${notificationId}:`, error.message);
        }
      }

      for (const ticketId of this.createdTestData.supportTickets) {
        try {
          await this.dbHelper.prisma.supportTicket.delete({ where: { id: ticketId } });
        } catch (error) {
          console.warn(`Warning: Could not delete test support ticket ${ticketId}:`, error.message);
        }
      }

      console.log('✅ Test data cleanup completed');
    } catch (error) {
      console.error('❌ Error during test data cleanup:', error);
    }
  }

  async generateFinalReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUPERADMIN COMPREHENSIVE TEST SUITE RESULTS');
    console.log('='.repeat(80));
    
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(2)}%`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n🚨 Errors:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (this.testResults.details.length > 0) {
      console.log('\n📋 Test Details:');
      this.testResults.details.forEach((detail, index) => {
        console.log(`${index + 1}. ${detail}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Save detailed report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        successRate: ((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(2)
      },
      errors: this.testResults.errors,
      details: this.testResults.details
    };
    
    const fs = require('fs');
    const reportPath = `tests/e2e/reports/superadmin-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new SuperAdminComprehensiveTester();
  tester.runAllTests().catch(console.error);
}

module.exports = SuperAdminComprehensiveTester; 