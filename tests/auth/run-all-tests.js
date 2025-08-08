const { exec } = require('child_process');
const path = require('path');

async function runAllAuthTests() {
  console.log('🧪 Running All Authentication Tests...\n');
  
  const tests = [
    { name: 'Login', file: 'test-login.js' },
    { name: 'Forgot Password', file: 'test-forgot-password.js' },
    { name: 'Reset Password', file: 'test-reset-password.js' },
    { name: 'Signup', file: 'test-signup.js' },
    { name: 'Tenant Invite', file: 'test-tenant-invite.js' },
    { name: 'Logout', file: 'test-logout.js' },
    { name: 'API Endpoints', file: 'test-api-endpoints.js' }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n🔐 Running ${test.name} Test...`);
    console.log('='.repeat(50));
    
    try {
      const result = await runTest(test.file);
      results.push({
        name: test.name,
        status: 'COMPLETED',
        duration: result.duration,
        success: result.success
      });
    } catch (error) {
      console.log(`❌ ${test.name} test failed:`, error.message);
      results.push({
        name: test.name,
        status: 'FAILED',
        duration: 0,
        success: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n📊 All Authentication Tests Summary');
  console.log('===================================');
  
  const completed = results.filter(r => r.status === 'COMPLETED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`✅ Completed: ${completed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️ Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`📈 Success Rate: ${((completed / results.length) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  results.forEach(result => {
    const statusIcon = result.status === 'COMPLETED' ? '✅' : '❌';
    const duration = result.duration > 0 ? `(${(result.duration / 1000).toFixed(1)}s)` : '';
    console.log(`${statusIcon} ${result.name}: ${result.status} ${duration}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n🎉 All Authentication Tests Completed!');
}

function runTest(testFile) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const testPath = path.join(__dirname, testFile);
    
    const child = exec(`node "${testPath}"`, {
      timeout: 60000 // 60 seconds timeout
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data;
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      errorOutput += data;
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      
      if (code === 0) {
        resolve({
          success: true,
          duration: duration,
          output: output
        });
      } else {
        reject(new Error(`Test failed with code ${code}: ${errorOutput}`));
      }
    });

    child.on('error', (error) => {
      const duration = Date.now() - startTime;
      reject(new Error(`Test execution error: ${error.message}`));
    });
  });
}

// Run all tests
runAllAuthTests().catch(error => {
  console.error('❌ Test runner failed:', error.message);
  process.exit(1);
}); 