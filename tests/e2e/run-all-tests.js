const DashboardTester = require('./dashboard.test');
const UserManagementTester = require('./user-management.test');
const AuditLogsTester = require('./audit-logs.test');
const NotificationsTester = require('./notifications.test');
const SupportSystemTester = require('./support-system.test');

class TestRunner {
  constructor() {
    this.results = [];
    this.startTime = null;
  }

  async runAllTests() {
    console.log('🚀 Starting All E2E Tests...\n');
    this.startTime = Date.now();
    
    const testModules = [
      { name: 'Dashboard', tester: DashboardTester },
      { name: 'User Management', tester: UserManagementTester },
      { name: 'Audit Logs', tester: AuditLogsTester },
      { name: 'Notifications', tester: NotificationsTester },
      { name: 'Support System', tester: SupportSystemTester }
    ];

    for (const module of testModules) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🧪 Testing Module: ${module.name}`);
      console.log(`${'='.repeat(60)}`);
      
      try {
        const tester = new module.tester();
        await tester.runAllTests();
        
        // Collect results from the tester
        if (tester.results) {
          this.results.push({
            module: module.name,
            results: tester.results
          });
        }
        
      } catch (error) {
        console.error(`❌ Error running ${module.name} tests:`, error.message);
        this.results.push({
          module: module.name,
          results: [{
            test: 'Module Execution',
            status: 'FAIL',
            details: `Error: ${error.message}`,
            timestamp: new Date().toISOString()
          }]
        });
      }
    }

    this.generateFinalReport();
  }

  async runModule(moduleName) {
    console.log(`🚀 Starting ${moduleName} E2E Tests...\n`);
    this.startTime = Date.now();
    
    const testModules = {
      'dashboard': DashboardTester,
      'user-management': UserManagementTester,
      'audit-logs': AuditLogsTester,
      'notifications': NotificationsTester,
      'support-system': SupportSystemTester
    };

    const testerClass = testModules[moduleName.toLowerCase()];
    if (!testerClass) {
      console.error(`❌ Unknown module: ${moduleName}`);
      console.log('Available modules:', Object.keys(testModules).join(', '));
      return;
    }

    try {
      const tester = new testerClass();
      await tester.runAllTests();
      
      // Collect results from the tester
      if (tester.results) {
        this.results.push({
          module: moduleName,
          results: tester.results
        });
      }
      
    } catch (error) {
      console.error(`❌ Error running ${moduleName} tests:`, error.message);
      this.results.push({
        module: moduleName,
        results: [{
          test: 'Module Execution',
          status: 'FAIL',
          details: `Error: ${error.message}`,
          timestamp: new Date().toISOString()
        }]
      });
    }

    this.generateFinalReport();
  }

  generateFinalReport() {
    const endTime = Date.now();
    const totalDuration = ((endTime - this.startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL E2E TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    
    this.results.forEach(moduleResult => {
      const moduleTests = moduleResult.results.length;
      const modulePassed = moduleResult.results.filter(r => r.status === 'PASS').length;
      const moduleFailed = moduleResult.results.filter(r => r.status === 'FAIL').length;
      
      totalTests += moduleTests;
      totalPassed += modulePassed;
      totalFailed += moduleFailed;
      
      const moduleSuccessRate = ((modulePassed / moduleTests) * 100).toFixed(1);
      
      console.log(`\n📋 ${moduleResult.module}:`);
      console.log(`   Total Tests: ${moduleTests}`);
      console.log(`   Passed: ${modulePassed} ✅`);
      console.log(`   Failed: ${moduleFailed} ❌`);
      console.log(`   Success Rate: ${moduleSuccessRate}%`);
    });
    
    const overallSuccessRate = ((totalPassed / totalTests) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(80));
    console.log('📈 OVERALL SUMMARY:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Total Passed: ${totalPassed} ✅`);
    console.log(`   Total Failed: ${totalFailed} ❌`);
    console.log(`   Overall Success Rate: ${overallSuccessRate}%`);
    console.log(`   Total Duration: ${totalDuration} seconds`);
    console.log('='.repeat(80));
    
    // Save comprehensive results to file
    const fs = require('fs');
    const reportData = {
      summary: {
        totalTests: totalTests,
        totalPassed: totalPassed,
        totalFailed: totalFailed,
        overallSuccessRate: overallSuccessRate,
        totalDuration: totalDuration
      },
      modules: this.results,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('e2e-test-results-comprehensive.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Comprehensive test results saved to e2e-test-results-comprehensive.json');
    
    // Exit with appropriate code
    if (totalFailed > 0) {
      console.log('\n❌ Some tests failed. Exiting with code 1.');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed! Exiting with code 0.');
      process.exit(0);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const testRunner = new TestRunner();

if (args.length === 0) {
  // Run all tests
  testRunner.runAllTests().catch(console.error);
} else if (args[0] === '--help' || args[0] === '-h') {
  console.log('E2E Test Runner Usage:');
  console.log('  node run-all-tests.js                    - Run all tests');
  console.log('  node run-all-tests.js <module-name>      - Run specific module');
  console.log('');
  console.log('Available modules:');
  console.log('  dashboard');
  console.log('  user-management');
  console.log('  audit-logs');
  console.log('  notifications');
  console.log('  support-system');
  console.log('');
  console.log('Examples:');
  console.log('  node run-all-tests.js dashboard');
  console.log('  node run-all-tests.js user-management');
} else {
  // Run specific module
  const moduleName = args[0];
  testRunner.runModule(moduleName).catch(console.error);
}

module.exports = TestRunner; 