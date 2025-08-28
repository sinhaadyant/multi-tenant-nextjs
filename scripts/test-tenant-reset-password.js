// Test script to verify tenant reset password functionality
// Run this in your browser console to test different scenarios

console.log('🧪 Testing Tenant Reset Password Functionality...');

const TENANT_SLUG = 'amazon'; // Change this to your tenant slug
const TEST_EMAIL = 'test@example.com'; // Change this to a real email in your tenant

// Test 1: Request password reset for tenant
async function testRequestPasswordReset() {
  console.log('\n📋 Test 1: Request password reset for tenant');
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
      console.log('Token (for testing):', data.data?.token);
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

// Test 2: Verify reset token
async function testVerifyToken(token) {
  console.log('\n📋 Test 2: Verify reset token');
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

// Test 3: Reset password
async function testResetPassword(token) {
  console.log('\n📋 Test 3: Reset password');
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

// Test 4: Test invalid token verification
async function testInvalidToken() {
  console.log('\n📋 Test 4: Invalid token verification');
  try {
    const response = await fetch('/api/tenant/auth/verify-reset-token?token=invalid_token_123456789');
    const data = await response.json();
    console.log('Response:', data);
    console.log('✅ Expected: success: false, message: "Invalid reset token"');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Test 5: Test reset password page URL
function testResetPasswordPage() {
  console.log('\n📋 Test 5: Reset password page URL');
  console.log(`Navigate to: /${TENANT_SLUG}/reset-password?token=YOUR_TOKEN_HERE`);
  console.log('Expected: Should show reset password form if token is valid');
}

// Test 6: Test forgot password page URL
function testForgotPasswordPage() {
  console.log('\n📋 Test 6: Forgot password page URL');
  console.log(`Navigate to: /${TENANT_SLUG}/forgot-password`);
  console.log('Expected: Should show forgot password form');
}

// Run all tests
async function runAllTests() {
  console.log(`Testing for tenant: ${TENANT_SLUG}`);
  console.log(`Testing with email: ${TEST_EMAIL}`);
  
  // Test invalid token first
  await testInvalidToken();
  
  // Test password reset request
  const token = await testRequestPasswordReset();
  
  if (token) {
    // Test token verification
    const isValid = await testVerifyToken(token);
    
    if (isValid) {
      // Test password reset
      await testResetPassword(token);
    }
  }
  
  // Test page URLs
  testForgotPasswordPage();
  testResetPasswordPage();
  
  console.log('\n🎉 All tests completed!');
  console.log('Check the console output above to verify tenant reset password is working correctly.');
}

// Run tests
runAllTests();
