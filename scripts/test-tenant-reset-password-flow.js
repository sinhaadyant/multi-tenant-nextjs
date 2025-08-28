// Comprehensive test script for tenant reset password flow
// This script tests the complete flow from forgot password to reset password

console.log('🧪 Testing Complete Tenant Reset Password Flow...');

const TENANT_SLUG = 'amazon';
const TEST_EMAIL = 'admin@amazon.com'; // Change this to a real email in your tenant

// Step 1: Request password reset
async function requestPasswordReset() {
  console.log('\n📋 Step 1: Requesting password reset...');
  try {
    const response = await fetch('/api/tenant/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        tenantSlug: TENANT_SLUG
      })
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.success) {
      console.log('✅ Password reset request successful');
      console.log('Token:', data.data?.token);
      return data.data?.token;
    } else {
      console.log('❌ Password reset request failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// Step 2: Verify the token
async function verifyToken(token) {
  console.log('\n📋 Step 2: Verifying token...');
  try {
    const response = await fetch(`/api/tenant/auth/verify-reset-token?token=${token}`);
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.success) {
      console.log('✅ Token verification successful');
      console.log('Email:', data.data?.email);
      console.log('Tenant Slug:', data.data?.tenantSlug);
      return true;
    } else {
      console.log('❌ Token verification failed:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Step 3: Reset password
async function resetPassword(token) {
  console.log('\n📋 Step 3: Resetting password...');
  try {
    const newPassword = 'NewPassword123!';
    const response = await fetch('/api/tenant/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        newPassword: newPassword,
        confirmPassword: newPassword
      })
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.success) {
      console.log('✅ Password reset successful');
      console.log('New password:', newPassword);
      return true;
    } else {
      console.log('❌ Password reset failed:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Test the complete flow
async function testCompleteFlow() {
  console.log(`Testing complete flow for tenant: ${TENANT_SLUG}`);
  console.log(`Testing with email: ${TEST_EMAIL}`);
  
  // Step 1: Request password reset
  const token = await requestPasswordReset();
  if (!token) {
    console.log('❌ Flow stopped: Could not get reset token');
    return;
  }
  
  // Step 2: Verify token
  const isValid = await verifyToken(token);
  if (!isValid) {
    console.log('❌ Flow stopped: Token verification failed');
    return;
  }
  
  // Step 3: Reset password
  const resetSuccess = await resetPassword(token);
  if (!resetSuccess) {
    console.log('❌ Flow stopped: Password reset failed');
    return;
  }
  
  console.log('\n🎉 Complete flow test successful!');
  console.log('The tenant reset password functionality is working correctly.');
}

// Test error cases
async function testErrorCases() {
  console.log('\n📋 Testing Error Cases...');
  
  // Test 1: Invalid tenant
  console.log('\n📋 Error Case 1: Invalid tenant');
  try {
    const response = await fetch('/api/tenant/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        tenantSlug: 'invalid-tenant'
      })
    });
    
    const data = await response.json();
    console.log('Response:', data);
    console.log('✅ Expected: success: false, message about invalid tenant');
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  // Test 2: Invalid email
  console.log('\n📋 Error Case 2: Invalid email');
  try {
    const response = await fetch('/api/tenant/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid@email.com',
        tenantSlug: TENANT_SLUG
      })
    });
    
    const data = await response.json();
    console.log('Response:', data);
    console.log('✅ Expected: success: false, message about user not found');
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  // Test 3: Invalid token
  console.log('\n📋 Error Case 3: Invalid token');
  try {
    const response = await fetch('/api/tenant/auth/verify-reset-token?token=invalid_token');
    const data = await response.json();
    console.log('Response:', data);
    console.log('✅ Expected: success: false, message about invalid token');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting comprehensive tenant reset password tests...');
  
  // Test error cases first
  await testErrorCases();
  
  // Test complete flow
  await testCompleteFlow();
  
  console.log('\n🎉 All tests completed!');
  console.log('Check the console output above to verify the tenant reset password flow.');
}

// Run tests
runAllTests();
