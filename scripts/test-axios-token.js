// Test script to verify axios token validation
// Run this in your browser console

console.log('🧪 Testing Axios Token Validation...');

// Test with invalid token using axios
async function testInvalidTokenWithAxios() {
  const invalidToken = 'invalid_token_123456789';
  console.log('Testing invalid token with axios:', invalidToken);
  
  try {
    const response = await axios.get('/api/superadmin/auth/verify-reset-token', {
      params: { token: invalidToken },
      timeout: 10000
    });
    
    console.log('✅ Axios Response:', response.data);
    console.log('Response status:', response.status);
    
    if (response.data.success) {
      console.log('❌ PROBLEM: Invalid token returned success=true');
    } else {
      console.log('✅ GOOD: Invalid token correctly returned success=false');
    }
  } catch (error) {
    console.log('❌ Axios Error:', error);
    if (error.response) {
      console.log('Error response:', error.response.data);
      console.log('Error status:', error.response.status);
    }
  }
}

// Test with no token using axios
async function testNoTokenWithAxios() {
  console.log('Testing no token with axios');
  
  try {
    const response = await axios.get('/api/superadmin/auth/verify-reset-token', {
      timeout: 10000
    });
    
    console.log('✅ Axios Response (no token):', response.data);
    console.log('Response status:', response.status);
  } catch (error) {
    console.log('❌ Axios Error (no token):', error);
    if (error.response) {
      console.log('Error response:', error.response.data);
      console.log('Error status:', error.response.status);
    }
  }
}

// Test with short token using axios
async function testShortTokenWithAxios() {
  const shortToken = '123';
  console.log('Testing short token with axios:', shortToken);
  
  try {
    const response = await axios.get('/api/superadmin/auth/verify-reset-token', {
      params: { token: shortToken },
      timeout: 10000
    });
    
    console.log('✅ Axios Response (short token):', response.data);
    console.log('Response status:', response.status);
  } catch (error) {
    console.log('❌ Axios Error (short token):', error);
    if (error.response) {
      console.log('Error response:', error.response.data);
      console.log('Error status:', error.response.status);
    }
  }
}

// Run all tests
async function runAxiosTests() {
  console.log('🧪 Running axios tests...\n');
  
  await testNoTokenWithAxios();
  console.log('\n---\n');
  
  await testShortTokenWithAxios();
  console.log('\n---\n');
  
  await testInvalidTokenWithAxios();
  
  console.log('\n🎯 Axios tests completed!');
  console.log('Check the console output above to see if axios is working correctly.');
}

// Run the tests
runAxiosTests(); 