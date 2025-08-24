const axios = require('axios');

async function debugLogin() {
  const BASE_URL = 'http://localhost:3000';
  const SUPERADMIN_EMAIL = 'sinhaadyant74@gmail.com';
  const SUPERADMIN_PASSWORD = 'password123';

  try {
    console.log('🔍 Debugging superadmin login...');
    
    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD
    });

    console.log('✅ Login successful');
    console.log('📋 Response data:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.token;
    console.log('🔑 Token type:', typeof token);
    console.log('🔑 Token length:', token ? token.length : 'null');
    console.log('🔑 Token preview:', token ? token.substring(0, 50) + '...' : 'null');

  } catch (error) {
    console.error('❌ Login failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

debugLogin();
