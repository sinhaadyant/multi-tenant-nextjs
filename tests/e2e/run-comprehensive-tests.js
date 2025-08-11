const ComprehensiveTenantTester = require('./comprehensive-tenant-test');

async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Tenant Testing Suite');
  console.log('==============================================');
  
  const tester = new ComprehensiveTenantTester();
  
  try {
    await tester.runAllTests();
    console.log('\n✅ Comprehensive testing completed successfully!');
  } catch (error) {
    console.error('\n❌ Comprehensive testing failed:', error);
    process.exit(1);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runComprehensiveTests();
}

module.exports = { runComprehensiveTests }; 