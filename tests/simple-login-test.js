const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login functionality...\n');

    // Test 1: Successful login with superadmin
    console.log('1. Testing successful login with superadmin...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'superadmin@example.com',
      password: 'password123'
    });

    console.log('✅ Login successful!');
    console.log('Response status:', loginResponse.status);
    console.log('User:', loginResponse.data.data.user.name);
    console.log('Access token received:', !!loginResponse.data.data.accessToken);
    console.log('Refresh token received:', !!loginResponse.data.data.refreshToken);
    console.log('');

    // Test 2: Failed login with wrong password
    console.log('2. Testing failed login with wrong password...');
    try {
      await axios.post('http://localhost:3001/api/auth/login', {
        email: 'superadmin@example.com',
        password: 'wrongpassword'
      });
      console.log('❌ Expected failure but got success');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly failed with 401 Unauthorized');
        console.log('Error message:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 3: Failed login with non-existent user
    console.log('3. Testing failed login with non-existent user...');
    try {
      await axios.post('http://localhost:3001/api/auth/login', {
        email: 'nonexistent@example.com',
        password: 'password123'
      });
      console.log('❌ Expected failure but got success');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly failed with 401 Unauthorized');
        console.log('Error message:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 4: Failed login with missing email
    console.log('4. Testing failed login with missing email...');
    try {
      await axios.post('http://localhost:3001/api/auth/login', {
        password: 'password123'
      });
      console.log('❌ Expected failure but got success');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly failed with 400 Bad Request');
        console.log('Error message:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 5: Failed login with missing password
    console.log('5. Testing failed login with missing password...');
    try {
      await axios.post('http://localhost:3001/api/auth/login', {
        email: 'superadmin@example.com'
      });
      console.log('❌ Expected failure but got success');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly failed with 400 Bad Request');
        console.log('Error message:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 6: Test logout with valid token
    console.log('6. Testing logout with valid token...');
    const accessToken = loginResponse.data.data.accessToken;
    try {
      const logoutResponse = await axios.post('http://localhost:3001/api/auth/logout', {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      console.log('✅ Logout successful!');
      console.log('Response status:', logoutResponse.status);
    } catch (error) {
      console.log('❌ Logout failed:', error.message);
    }
    console.log('');

    // Test 7: Test profile endpoint with valid token
    console.log('7. Testing profile endpoint with valid token...');
    try {
      const profileResponse = await axios.get('http://localhost:3001/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      console.log('✅ Profile retrieval successful!');
      console.log('User profile:', profileResponse.data.data.name);
    } catch (error) {
      console.log('❌ Profile retrieval failed:', error.message);
    }
    console.log('');

    console.log('🎉 Login module testing completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testLogin();
