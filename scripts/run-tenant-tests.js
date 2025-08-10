#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Tenant API Test Suite...\n');

// Test configuration
const TEST_CONFIG = {
  // Test user credentials
  testUsers: {
    techcorp: {
      admin: { email: 'admin@techcorp.com', password: 'AdminPass123' },
      manager: { email: 'manager@techcorp.com', password: 'AdminPass123' },
      user: { email: 'user@techcorp.com', password: 'AdminPass123' },
      viewer: { email: 'viewer@techcorp.com', password: 'AdminPass123' }
    },
    globalretail: {
      admin: { email: 'admin@globalretail.com', password: 'AdminPass123' },
      manager: { email: 'manager@globalretail.com', password: 'AdminPass123' },
      user: { email: 'user@globalretail.com', password: 'AdminPass123' },
      viewer: { email: 'viewer@globalretail.com', password: 'AdminPass123' }
    }
  },
  
  // Test files to run
  testFiles: [
    'src/__tests__/api/tenant/tenant-auth-tests.ts',
    'src/__tests__/api/tenant/tenant-users-api.test.ts',
    'src/__tests__/api/tenant/tenant-roles-api.test.ts',
    'src/__tests__/api/tenant/tenant-audit-logs-api.test.ts'
  ]
};

// Test runner
class TenantTestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  // Run all tests
  async runAllTests() {
    console.log('📋 Test Configuration:');
    console.log(`- Test Users: ${Object.keys(TEST_CONFIG.testUsers).length} tenants`);
    console.log(`- Test Files: ${TEST_CONFIG.testFiles.length} files`);
    console.log('');

    try {
      // Run authentication tests
      await this.runTestCategory('Authentication', 'tenant-auth-tests');
      
      // Run users API tests
      await this.runTestCategory('Users API', 'tenant-users-api');
      
      // Run roles API tests
      await this.runTestCategory('Roles API', 'tenant-roles-api');
      
      // Run audit logs API tests
      await this.runTestCategory('Audit Logs API', 'tenant-audit-logs-api');
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  // Run test category
  async runTestCategory(category, testPattern) {
    console.log(`🔍 Running ${category} Tests...`);
    
    try {
      const command = `npm run test:tenant:api -- --testPathPattern="${testPattern}" --verbose --silent`;
      const result = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 60000 // 60 second timeout
      });
      
      this.results.push({
        category,
        status: 'PASS',
        output: result,
        timestamp: new Date().toISOString()
      });
      
      console.log(`  ✅ ${category} tests passed\n`);
      
    } catch (error) {
      this.results.push({
        category,
        status: 'FAIL',
        error: error.message,
        output: error.stdout || error.stderr,
        timestamp: new Date().toISOString()
      });
      
      console.log(`  ❌ ${category} tests failed: ${error.message}\n`);
    }
  }

  // Generate test report
  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const totalTests = this.results.length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(2);

    console.log('📊 Test Report');
    console.log('==============');
    console.log(`Total Test Categories: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Total Duration: ${totalDuration}ms`);

    // Show failed tests
    if (failedTests > 0) {
      console.log('\n❌ Failed Test Categories:');
      console.log('==========================');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`- ${result.category}: ${result.error}`);
        });
    }

    // Show passed tests
    if (passedTests > 0) {
      console.log('\n✅ Passed Test Categories:');
      console.log('==========================');
      this.results
        .filter(r => r.status === 'PASS')
        .forEach(result => {
          console.log(`- ${result.category}`);
        });
    }

    // Save detailed report
    this.saveDetailedReport();

    // Exit with appropriate code
    if (failedTests > 0) {
      console.log('\n❌ Some tests failed. Please review the errors above.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed successfully!');
      process.exit(0);
    }
  }

  // Save detailed report
  saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.length,
        passedTests: this.results.filter(r => r.status === 'PASS').length,
        failedTests: this.results.filter(r => r.status === 'FAIL').length,
        totalDuration: Date.now() - this.startTime
      },
      results: this.results,
      testConfig: TEST_CONFIG
    };

    const fs = require('fs');
    const reportPath = path.join(__dirname, 'tenant-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Main execution
if (require.main === module) {
  const runner = new TenantTestRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = { TenantTestRunner, TEST_CONFIG }; 