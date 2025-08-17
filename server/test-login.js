// Register TypeScript and path mapping
require('tsconfig-paths/register');
require('ts-node').register({
  transpileOnly: true,
});

const app = require('./tests/e2e/test-app-ts');
const request = require('supertest');
const credentials = require('./tests/credentials');

async function testLogin() {
  console.log('Testing login with credentials from credentials file...');

  const testUsers = [
    credentials.users.user,
    credentials.users.admin,
    credentials.users.superadmin,
    credentials.users.testuser,
  ];

  for (const user of testUsers) {
    try {
      console.log(`\nTesting login for: ${user.email}`);

      const response = await request(app).post('/api/auth/login').send({
        email: user.email,
        password: user.password,
        tenantSlug: credentials.tenants.primary.domain,
      });

      console.log(`Status: ${response.status}`);
      console.log(`Message: ${response.body.message}`);

      if (response.status === 200) {
        console.log('✅ Login successful!');
        console.log('User data:', response.body.data.user);
      } else {
        console.log('❌ Login failed');
        console.log('Error details:', response.body);
      }
    } catch (error) {
      console.log(
        `❌ Error testing ${user.email}:`,
        error.response?.body || error.message
      );
    }
  }
}

testLogin();
