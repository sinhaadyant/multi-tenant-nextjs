const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/superadmin';
const EMAIL = 'superadmin_1755549143258@example.com';
const PASSWORD = 'SuperAdmin1755549143258';

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD
    });
    
    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ ${method} ${endpoint}: Success`);
    return response.data;
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting SuperAdmin API Tests\n');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without login');
    return;
  }
  
  console.log('\n📋 Testing APIs:\n');
  
  // Test Dashboard
  await testAPI('/dashboard');
  
  // Test Menu Management
  await testAPI('/menu');
  await testAPI('/menu', 'POST', {
    label: 'Test Menu',
    path: '/test',
    icon: 'Settings',
    isActive: true
  });
  
  // Test Tenants
  await testAPI('/tenants');
  
  // Test Users
  await testAPI('/users');
  
  // Test Audit Logs
  await testAPI('/audit-logs');
  
  // Test Backup History
  await testAPI('/backup/history');
  
  // Test Reports
  await testAPI('/reports');
  
  // Test Notifications
  await testAPI('/notifications');
  
  // Test Support Tickets
  await testAPI('/support-tickets');
  
  // Test Data Management
  await testAPI('/data-management/counts');
  
  console.log('\n🎉 API testing completed!');
}

runTests().catch(console.error);
