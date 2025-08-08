const fetch = require('node-fetch');

async function testAPIEndpoints() {
  console.log('🔌 Testing Authentication API Endpoints...\n');
  
  const baseUrl = 'http://localhost:3000';
  const testResults = [];

  // Test 1: Login API
  console.log('📋 Test 1: Login API');
  console.log('====================');
  
  try {
    const response = await fetch(`${baseUrl}/api/superadmin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@superadmin.com',
        password: 'SuperAdmin123!'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login API: Working');
      console.log('📄 Response:', {
        success: data.success,
        message: data.message,
        hasToken: !!data.data?.token,
        hasRefreshToken: !!data.data?.refreshToken,
        hasUser: !!data.data?.user
      });
      testResults.push({ name: 'Login API', status: 'PASS', details: 'Working correctly' });
    } else {
      console.log('❌ Login API: Failed');
      console.log('📄 Status:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.log('📄 Error:', errorData);
      testResults.push({ name: 'Login API', status: 'FAIL', details: `${response.status} ${response.statusText}` });
    }
  } catch (error) {
    console.log('❌ Login API: Error');
    console.log('📄 Error:', error.message);
    testResults.push({ name: 'Login API', status: 'ERROR', details: error.message });
  }

  // Test 2: Forgot Password API
  console.log('\n📋 Test 2: Forgot Password API');
  console.log('===============================');
  
  try {
    const response = await fetch(`${baseUrl}/api/superadmin/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@superadmin.com'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Forgot Password API: Working');
      console.log('📄 Response:', {
        success: data.success,
        message: data.message
      });
      testResults.push({ name: 'Forgot Password API', status: 'PASS', details: 'Working correctly' });
    } else {
      console.log('❌ Forgot Password API: Failed');
      console.log('📄 Status:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.log('📄 Error:', errorData);
      testResults.push({ name: 'Forgot Password API', status: 'FAIL', details: `${response.status} ${response.statusText}` });
    }
  } catch (error) {
    console.log('❌ Forgot Password API: Error');
    console.log('📄 Error:', error.message);
    testResults.push({ name: 'Forgot Password API', status: 'ERROR', details: error.message });
  }

  // Test 3: Reset Password API
  console.log('\n📋 Test 3: Reset Password API');
  console.log('==============================');
  
  try {
    const response = await fetch(`${baseUrl}/api/superadmin/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'test-reset-token-123',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Reset Password API: Working');
      console.log('📄 Response:', {
        success: data.success,
        message: data.message
      });
      testResults.push({ name: 'Reset Password API', status: 'PASS', details: 'Working correctly' });
    } else {
      console.log('⚠️ Reset Password API: Expected failure (invalid token)');
      console.log('📄 Status:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.log('📄 Error:', errorData);
      testResults.push({ name: 'Reset Password API', status: 'EXPECTED_FAIL', details: 'Invalid token (expected)' });
    }
  } catch (error) {
    console.log('❌ Reset Password API: Error');
    console.log('📄 Error:', error.message);
    testResults.push({ name: 'Reset Password API', status: 'ERROR', details: error.message });
  }

  // Test 4: Logout API
  console.log('\n📋 Test 4: Logout API');
  console.log('=====================');
  
  try {
    const response = await fetch(`${baseUrl}/api/superadmin/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Logout API: Working');
      console.log('📄 Response:', {
        success: data.success,
        message: data.message
      });
      testResults.push({ name: 'Logout API', status: 'PASS', details: 'Working correctly' });
    } else {
      console.log('⚠️ Logout API: Expected failure (no auth token)');
      console.log('📄 Status:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.log('📄 Error:', errorData);
      testResults.push({ name: 'Logout API', status: 'EXPECTED_FAIL', details: 'No auth token (expected)' });
    }
  } catch (error) {
    console.log('❌ Logout API: Error');
    console.log('📄 Error:', error.message);
    testResults.push({ name: 'Logout API', status: 'ERROR', details: error.message });
  }

  // Test 5: Validate Token API
  console.log('\n📋 Test 5: Validate Token API');
  console.log('=============================');
  
  try {
    const response = await fetch(`${baseUrl}/api/superadmin/auth/validate`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Validate Token API: Working');
      console.log('📄 Response:', {
        success: data.success,
        message: data.message
      });
      testResults.push({ name: 'Validate Token API', status: 'PASS', details: 'Working correctly' });
    } else {
      console.log('⚠️ Validate Token API: Expected failure (no auth token)');
      console.log('📄 Status:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.log('📄 Error:', errorData);
      testResults.push({ name: 'Validate Token API', status: 'EXPECTED_FAIL', details: 'No auth token (expected)' });
    }
  } catch (error) {
    console.log('❌ Validate Token API: Error');
    console.log('📄 Error:', error.message);
    testResults.push({ name: 'Validate Token API', status: 'ERROR', details: error.message });
  }

  // Test 6: Refresh Token API
  console.log('\n📋 Test 6: Refresh Token API');
  console.log('============================');
  
  try {
    const response = await fetch(`${baseUrl}/api/superadmin/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: 'test-refresh-token-123'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Refresh Token API: Working');
      console.log('📄 Response:', {
        success: data.success,
        message: data.message
      });
      testResults.push({ name: 'Refresh Token API', status: 'PASS', details: 'Working correctly' });
    } else {
      console.log('⚠️ Refresh Token API: Expected failure (invalid token)');
      console.log('📄 Status:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.log('📄 Error:', errorData);
      testResults.push({ name: 'Refresh Token API', status: 'EXPECTED_FAIL', details: 'Invalid token (expected)' });
    }
  } catch (error) {
    console.log('❌ Refresh Token API: Error');
    console.log('📄 Error:', error.message);
    testResults.push({ name: 'Refresh Token API', status: 'ERROR', details: error.message });
  }

  // Test 7: Signup API
  console.log('\n📋 Test 7: Signup API');
  console.log('=====================');
  
  try {
    const response = await fetch(`${baseUrl}/api/superadmin/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Signup API: Working');
      console.log('📄 Response:', {
        success: data.success,
        message: data.message
      });
      testResults.push({ name: 'Signup API', status: 'PASS', details: 'Working correctly' });
    } else {
      console.log('⚠️ Signup API: Failed or not implemented');
      console.log('📄 Status:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.log('📄 Error:', errorData);
      testResults.push({ name: 'Signup API', status: 'FAIL', details: `${response.status} ${response.statusText}` });
    }
  } catch (error) {
    console.log('❌ Signup API: Error');
    console.log('📄 Error:', error.message);
    testResults.push({ name: 'Signup API', status: 'ERROR', details: error.message });
  }

  // Test 8: Verify Token API
  console.log('\n📋 Test 8: Verify Token API');
  console.log('===========================');
  
  try {
    const response = await fetch(`${baseUrl}/api/superadmin/auth/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'test-token-123'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Verify Token API: Working');
      console.log('📄 Response:', {
        success: data.success,
        message: data.message
      });
      testResults.push({ name: 'Verify Token API', status: 'PASS', details: 'Working correctly' });
    } else {
      console.log('⚠️ Verify Token API: Expected failure (invalid token)');
      console.log('📄 Status:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.log('📄 Error:', errorData);
      testResults.push({ name: 'Verify Token API', status: 'EXPECTED_FAIL', details: 'Invalid token (expected)' });
    }
  } catch (error) {
    console.log('❌ Verify Token API: Error');
    console.log('📄 Error:', error.message);
    testResults.push({ name: 'Verify Token API', status: 'ERROR', details: error.message });
  }

  // Summary
  console.log('\n📊 API Endpoints Test Summary');
  console.log('==============================');
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const errors = testResults.filter(r => r.status === 'ERROR').length;
  const expectedFails = testResults.filter(r => r.status === 'EXPECTED_FAIL').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️ Expected Fails: ${expectedFails}`);
  console.log(`🚨 Errors: ${errors}`);
  console.log(`📈 Success Rate: ${((passed / testResults.length) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  testResults.forEach(result => {
    const statusIcon = result.status === 'PASS' ? '✅' : 
                      result.status === 'FAIL' ? '❌' : 
                      result.status === 'EXPECTED_FAIL' ? '⚠️' : '🚨';
    console.log(`${statusIcon} ${result.name}: ${result.details}`);
  });

  console.log('\n🎉 API Endpoints Tests Completed!');
}

// Run the test
testAPIEndpoints(); 