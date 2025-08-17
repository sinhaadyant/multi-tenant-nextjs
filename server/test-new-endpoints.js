// Register TypeScript and path mapping
require('tsconfig-paths/register');
require('ts-node').register({
  transpileOnly: true,
});

const app = require('./tests/e2e/test-app-ts');
const request = require('supertest');

async function testNewEndpoints() {
  console.log('Testing new API endpoints...');

  // Test 1: Register endpoint
  console.log('\n1. Testing POST /api/auth/register...');
  try {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'newuser@test.com',
        password: 'TestPassword123!',
      });

    console.log(`Status: ${registerResponse.status}`);
    console.log('Response:', registerResponse.body);

    if (registerResponse.status === 201) {
      console.log('✅ Register endpoint working!');
    } else {
      console.log('❌ Register endpoint failed');
    }
  } catch (error) {
    console.log(
      '❌ Register endpoint error:',
      error.response?.body || error.message
    );
  }

  // Test 2: Forgot password endpoint (alias)
  console.log('\n2. Testing POST /api/auth/forgot-password...');
  try {
    const forgotResponse = await request(app)
      .post('/api/auth/forgot-password')
      .send({
        email: 'superadmin@example.com',
      });

    console.log(`Status: ${forgotResponse.status}`);
    console.log('Response:', forgotResponse.body);

    if (forgotResponse.status === 200) {
      console.log('✅ Forgot password endpoint working!');
    } else {
      console.log('❌ Forgot password endpoint failed');
    }
  } catch (error) {
    console.log(
      '❌ Forgot password endpoint error:',
      error.response?.body || error.message
    );
  }

  // Test 3: Reset password endpoint (alias)
  console.log('\n3. Testing POST /api/auth/reset-password...');
  try {
    const resetResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: 'test-token',
        password: 'NewPassword123!',
      });

    console.log(`Status: ${resetResponse.status}`);
    console.log('Response:', resetResponse.body);

    if (resetResponse.status === 400 || resetResponse.status === 401) {
      console.log(
        '✅ Reset password endpoint working! (expected validation error)'
      );
    } else {
      console.log('❌ Reset password endpoint failed');
    }
  } catch (error) {
    console.log(
      '❌ Reset password endpoint error:',
      error.response?.body || error.message
    );
  }

  // Test 4: Login to get token for change password test
  console.log('\n4. Testing login to get token...');
  let authToken = null;
  try {
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'superadmin@example.com',
      password: 'password123',
      tenantSlug: 'tenant-a.com',
    });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.data.accessToken;
      console.log('✅ Login successful, got token for change password test');
    } else {
      console.log('❌ Login failed, skipping change password test');
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.body || error.message);
  }

  // Test 5: Change password endpoint
  if (authToken) {
    console.log('\n5. Testing POST /api/auth/change-password...');
    try {
      const changeResponse = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'NewPassword123!',
        });

      console.log(`Status: ${changeResponse.status}`);
      console.log('Response:', changeResponse.body);

      if (changeResponse.status === 200) {
        console.log('✅ Change password endpoint working!');
      } else {
        console.log('❌ Change password endpoint failed');
      }
    } catch (error) {
      console.log(
        '❌ Change password endpoint error:',
        error.response?.body || error.message
      );
    }
  }

  console.log('\n🎉 New endpoints testing completed!');
}

testNewEndpoints();
