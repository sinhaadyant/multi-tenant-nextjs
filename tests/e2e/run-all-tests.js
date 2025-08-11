const DashboardTester = require("./dashboard.test");
const UserManagementTester = require("./user-management.test");
const AuditLogsTester = require("./audit-logs.test");
const NotificationsTester = require("./notifications.test");
const SupportSystemTester = require("./support-system.test");
const ComprehensiveTenantTester = require("./comprehensive-tenant-test");
const EnhancedComprehensiveTester = require("./enhanced-comprehensive-test");
const SuperAdminComprehensiveTester = require("./superadmin-comprehensive-test");

class TestRunner {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log("🚀 Starting All E2E Tests");
    console.log("=========================");

    const testModules = [
      { name: "dashboard", tester: DashboardTester },
      { name: "user-management", tester: UserManagementTester },
      { name: "audit-logs", tester: AuditLogsTester },
      { name: "notifications", tester: NotificationsTester },
      { name: "support-system", tester: SupportSystemTester },
    ];

    for (const module of testModules) {
      console.log(`\n📋 Testing ${module.name}...`);
      try {
        const tester = new module.tester();
        await tester.runAllTests();
        this.testResults.push({ module: module.name, status: "PASSED" });
      } catch (error) {
        console.error(`❌ ${module.name} test failed:`, error.message);
        this.testResults.push({
          module: module.name,
          status: "FAILED",
          error: error.message,
        });
      }
    }

    await this.generateFinalReport();
  }

  async runModule(moduleName) {
    console.log(`🚀 Starting ${moduleName} Tests`);
    console.log("=".repeat(30));

    let tester;
    switch (moduleName.toLowerCase()) {
      case "dashboard":
        tester = new DashboardTester();
        break;
      case "user-management":
        tester = new UserManagementTester();
        break;
      case "audit-logs":
        tester = new AuditLogsTester();
        break;
      case "notifications":
        tester = new NotificationsTester();
        break;
      case "support-system":
        tester = new SupportSystemTester();
        break;
      case "comprehensive":
        tester = new ComprehensiveTenantTester();
        break;
      case "enhanced":
        tester = new EnhancedComprehensiveTester();
        break;
      case "superadmin":
        tester = new SuperAdminComprehensiveTester();
        break;
      default:
        console.error(`❌ Unknown module: ${moduleName}`);
        console.log(
          "Available modules: dashboard, user-management, audit-logs, notifications, support-system, comprehensive, enhanced, superadmin"
        );
        process.exit(1);
    }

    try {
      await tester.runAllTests();
      console.log(`✅ ${moduleName} tests completed successfully!`);
    } catch (error) {
      console.error(`❌ ${moduleName} tests failed:`, error);
      process.exit(1);
    }
  }

  async generateFinalReport() {
    const endTime = Date.now();
    const duration = (endTime - this.startTime) / 1000;

    console.log("\n📊 FINAL E2E TEST RESULTS SUMMARY");
    console.log("==================================");

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(
      (r) => r.status === "PASSED"
    ).length;
    const failedTests = this.testResults.filter(
      (r) => r.status === "FAILED"
    ).length;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(
      `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`
    );
    console.log(`Duration: ${duration.toFixed(2)} seconds`);

    console.log("\n📋 Detailed Results:");
    this.testResults.forEach((result) => {
      const statusIcon = result.status === "PASSED" ? "✅" : "❌";
      console.log(`${statusIcon} ${result.module}: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    // Save results to file
    const fs = require("fs");
    const reportData = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: ((passedTests / totalTests) * 100).toFixed(1),
        duration: duration.toFixed(2),
      },
      results: this.testResults,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(
      `e2e-test-results-comprehensive-${
        new Date().toISOString().split("T")[0]
      }.json`,
      JSON.stringify(reportData, null, 2)
    );

    console.log("\n💾 Comprehensive test results saved to JSON file");
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const moduleName = args[0];

const runner = new TestRunner();

if (moduleName) {
  // Run specific module
  runner.runModule(moduleName);
} else {
  // Run all tests
  runner.runAllTests();
}

module.exports = TestRunner;
