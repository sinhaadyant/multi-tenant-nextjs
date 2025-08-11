#!/usr/bin/env node

const SuperAdminSignupSimpleTester = require('./superadmin-signup-simple.test');

async function runSignupSimpleTest() {
  console.log('🎯 Starting SuperAdmin Signup Simple Test...\n');
  
  const tester = new SuperAdminSignupSimpleTester();
  
  try {
    const results = await tester.runAllTests();
    
    console.log('\n📊 Final Test Results:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📝 Total: ${results.passed + results.failed}`);
    
    if (results.details.length > 0) {
      console.log('\n📝 Test Details:');
      results.details.forEach(detail => console.log(`  - ${detail}`));
    }
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    const success = results.failed === 0;
    console.log(`\n${success ? '🎉' : '💥'} Test Suite ${success ? 'PASSED' : 'FAILED'}`);
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run the test
runSignupSimpleTest(); 