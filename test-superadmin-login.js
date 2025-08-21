const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

const testCredentials = [
  { email: 'admin@superadmin.com', password: 'Admin123!' },
  { email: 'admin@superadmin.com', password: 'SuperAdmin123!' },
  { email: 'admin@superadmin.com', password: 'AdminPass123' },
  { email: 'superadmin@example.com', password: 'SuperAdmin123!' },
  { email: 'admin@example.com', password: 'Admin123!' }
];

async function testSuperadminLogin() {
  console.log('🔍 Testing SuperAdmin Login with different credentials...\n');

  for (let i = 0; i < testCredentials.length; i++) {
    const creds = testCredentials[i];
    console.log(`📝 Test ${i + 1}: ${creds.email} / ${creds.password}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, creds);
      
      if (response.data.success) {
        console.log('✅ SUCCESS! Valid credentials found!');
        console.log(`   Email: ${creds.email}`);
        console.log(`   Password: ${creds.password}`);
        console.log(`   Token: ${response.data.data.token.substring(0, 20)}...`);
        return creds;
      } else {
        console.log('❌ Failed:', response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ Invalid credentials');
      } else {
        console.log('❌ Error:', error.response?.data?.message || error.message);
      }
    }
    console.log('');
  }
  
  console.log('❌ No valid SuperAdmin credentials found');
  return null;
}

testSuperadminLogin();
