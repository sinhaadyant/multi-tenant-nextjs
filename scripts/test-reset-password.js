// Test script to verify reset password token validation
// Run this in your browser console to test different scenarios

console.log('🧪 Testing Reset Password Token Validation...');

// Test 1: No token
async function testNoToken() {
  console.log('\n📋 Test 1: No token');
  try {
    const response = await fetch('/api/superadmin/auth/verify-reset-token');
    const data = await response.json();
    console.log('Response:', data);
    console.log('✅ Expected: success: false, message: "Token is required"');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Test 2: Empty token
async function testEmptyToken() {
  console.log('\n📋 Test 2: Empty token');
  try {
    const response = await fetch('/api/superadmin/auth/verify-reset-token?token=');
    const data = await response.json();
    console.log('Response:', data);
    console.log('✅ Expected: success: false, message: "Token is required"');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Test 3: Short token
async function testShortToken() {
  console.log('\n📋 Test 3: Short token');
  try {
    const response = await fetch('/api/superadmin/auth/verify-reset-token?token=123');
    const data = await response.json();
    console.log('Response:', data);
    console.log('✅ Expected: success: false, message: "Invalid token format"');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Test 4: Invalid token
async function testInvalidToken() {
  console.log('\n📋 Test 4: Invalid token');
  try {
    const response = await fetch('/api/superadmin/auth/verify-reset-token?token=invalid_token_123456789');
    const data = await response.json();
    console.log('Response:', data);
    console.log('✅ Expected: success: false, message: "Invalid reset token"');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Test 5: Test page with invalid token
function testInvalidTokenPage() {
  console.log('\n📋 Test 5: Invalid token page');
  console.log('Navigate to: /superadmin/reset-password?token=invalid_token_123456789');
  console.log('Expected: Should show "Invalid Reset URL" page');
}

// Run all tests
async function runAllTests() {
  await testNoToken();
  await testEmptyToken();
  await testShortToken();
  await testInvalidToken();
  testInvalidTokenPage();
  
  console.log('\n🎉 All tests completed!');
  console.log('Check the console output above to verify token validation is working correctly.');
}

// Run tests
runAllTests(); 