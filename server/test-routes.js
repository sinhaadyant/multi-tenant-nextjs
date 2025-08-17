const app = require('./tests/e2e/test-app-ts');
const request = require('supertest');

async function testRoutes() {
  console.log('Testing route loading...');

  try {
    // Test health endpoint
    const healthResponse = await request(app).get('/api/health').expect(200);

    console.log('✅ Health endpoint works:', healthResponse.body);

    // Test auth login endpoint (should return 400 for missing data)
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({})
      .expect(400);

    console.log('✅ Auth login endpoint works:', loginResponse.body);

    // Test root endpoint
    const rootResponse = await request(app).get('/').expect(200);

    console.log('✅ Root endpoint works:', rootResponse.body);
  } catch (error) {
    console.error('❌ Route test failed:', error.message);
    console.error('Response:', error.response?.body);
  }
}

testRoutes();
