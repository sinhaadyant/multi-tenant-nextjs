const axios = require('axios');

async function testRolePermissionsAPI() {
  const baseURL = 'http://localhost:3000';
  const roleId = 'cme63jpc1002eukmo8xpzrfzs';
  
  try {
    console.log('🔍 Testing GET /api/superadmin/roles/[id]/permissions');
    
    // Test GET request
    const getResponse = await axios.get(`${baseURL}/api/superadmin/roles/${roleId}/permissions`, {
      headers: {
        'Authorization': 'Bearer your-token-here' // Replace with actual token
      }
    });
    
    console.log('✅ GET Response:', getResponse.data);
    
    // Test POST request with sample data
    console.log('\n🔍 Testing POST /api/superadmin/roles/[id]/permissions');
    
    const postData = {
      permissions: [
        {
          moduleId: 'dashboard',
          actions: ['view']
        },
        {
          moduleId: 'users',
          actions: ['view', 'create']
        }
      ]
    };
    
    const postResponse = await axios.post(`${baseURL}/api/superadmin/roles/${roleId}/permissions`, postData, {
      headers: {
        'Authorization': 'Bearer your-token-here', // Replace with actual token
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ POST Response:', postResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testRolePermissionsAPI();
