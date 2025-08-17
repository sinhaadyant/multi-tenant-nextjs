// Register TypeScript and path mapping
require('tsconfig-paths/register');
require('ts-node').register({
  transpileOnly: true,
});

const request = require('supertest');
const app = require('./tests/e2e/test-app-ts');

async function testRealAuth() {
  console.log('✅ Real routes loaded successfully');
  console.log('Testing authentication with real database users...\n');

  // Test with the actual seeded users in the database
  const testUsers = [
    {
      email: 'superadmin@example.com',
      password: 'password123',
      tenantSlug: null, // Superadmin doesn't need tenant
      description: 'Superadmin user'
    },
    {
      email: 'admin@tenant-a.com',
      password: 'password123',
      tenantSlug: 'tenant-a.example.com',
      description: 'Tenant A Admin'
    },
    {
      email: 'john@tenant-a.com',
      password: 'password123',
      tenantSlug: 'tenant-a.example.com',
      description: 'Tenant A User'
    }
  ];

  for (const user of testUsers) {
    console.log(`Testing login for: ${user.email} (${user.description})`);
    
    try {
      const loginData = {
        email: user.email,
        password: user.password,
      };
      
      // Only add tenantSlug if it's provided
      if (user.tenantSlug) {
        loginData.tenantSlug = user.tenantSlug;
      }

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      console.log(`Status: ${loginResponse.status}`);
      console.log(`Message: ${loginResponse.body.message}`);
      
      if (loginResponse.status === 200) {
        console.log('✅ Login successful!');
        console.log('Response:', JSON.stringify(loginResponse.body, null, 2));
        
        // Test getting current user
        const authToken = loginResponse.body.data.accessToken;
        console.log('\nTesting GET /api/auth/me...');
        
        const meResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`);
        
        console.log(`Me status: ${meResponse.status}`);
        if (meResponse.status === 200) {
          console.log('✅ Get current user successful!');
          console.log('User data:', JSON.stringify(meResponse.body, null, 2));
        } else {
          console.log('❌ Get current user failed');
          console.log('Error:', meResponse.body);
        }
        
        // Test logout
        console.log('\nTesting logout...');
        const logoutResponse = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            refreshToken: loginResponse.body.data.refreshToken
          });
        
        console.log(`Logout status: ${logoutResponse.status}`);
        if (logoutResponse.status === 200) {
          console.log('✅ Logout successful!');
        } else {
          console.log('❌ Logout failed');
          console.log('Error:', logoutResponse.body);
        }
        
        break; // Stop after first successful login to avoid too much output
        
      } else {
        console.log('❌ Login failed');
        console.log('Error details:', loginResponse.body);
      }
    } catch (error) {
      console.log('❌ Login error:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
  }

  // Test password reset with a seeded user
  console.log('Testing POST /api/auth/request-reset...');
  try {
    const resetResponse = await request(app)
      .post('/api/auth/request-reset')
      .send({
        email: 'admin@tenant-a.com'
      });

    console.log(`Reset request status: ${resetResponse.status}`);
    console.log(`Reset response:`, resetResponse.body);
    
    if (resetResponse.status === 200) {
      console.log('✅ Password reset request successful!');
    } else {
      console.log('❌ Password reset request failed');
    }
  } catch (error) {
    console.log('❌ Password reset error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test registration
  console.log('Testing POST /api/auth/register...');
  try {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User 3',
        email: 'testuser3@example.com',
        password: 'password123',
        tenantSlug: 'tenant-a.example.com'
      });

    console.log(`Register status: ${registerResponse.status}`);
    console.log(`Register response:`, registerResponse.body);
    
    if (registerResponse.status === 201) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed');
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
  }
}

testRealAuth();
