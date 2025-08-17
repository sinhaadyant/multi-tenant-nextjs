// Register TypeScript and path mapping
require('tsconfig-paths/register');
require('ts-node').register({
  transpileOnly: true,
});

const app = require('./tests/e2e/test-app-ts');
const request = require('supertest');

async function testEndpoints() {
  console.log('Testing available endpoints...');

  const endpoints = [
    {
      method: 'POST',
      path: '/api/auth/login',
      data: { email: 'test@test.com', password: 'test123' },
    },
    {
      method: 'POST',
      path: '/api/auth/register',
      data: { email: 'test@test.com', password: 'test123' },
    },
    {
      method: 'POST',
      path: '/api/auth/forgot-password',
      data: { email: 'test@test.com' },
    },
    {
      method: 'POST',
      path: '/api/auth/reset-password',
      data: { token: 'test', password: 'test123' },
    },
    {
      method: 'POST',
      path: '/api/auth/change-password',
      data: { currentPassword: 'test', newPassword: 'test123' },
    },
    {
      method: 'POST',
      path: '/api/auth/request-reset',
      data: { email: 'test@test.com' },
    },
    {
      method: 'POST',
      path: '/api/auth/confirm-reset',
      data: { token: 'test', password: 'test123' },
    },
    {
      method: 'POST',
      path: '/api/users',
      data: { email: 'test@test.com', password: 'test123', name: 'Test User' },
    },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await request(app)
        [endpoint.method.toLowerCase()](endpoint.path)
        .send(endpoint.data);

      console.log(
        `${endpoint.method} ${endpoint.path}: ${response.status} - ${response.body.message || response.body.success}`
      );
    } catch (error) {
      console.log(
        `${endpoint.method} ${endpoint.path}: ${error.response?.status || 'ERROR'} - ${error.response?.body?.message || error.message}`
      );
    }
  }
}

testEndpoints();
