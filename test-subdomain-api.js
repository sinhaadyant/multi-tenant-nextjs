const axios = require('axios');

async function testSubdomainAPI() {
  try {
    console.log('Testing subdomain API...');
    
    const response = await axios.get('http://localhost:3000/api/superadmin/tenants/check-subdomain?subdomain=test-company', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // You'll need to add a valid token
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    // Check the structure
    if (response.data && response.data.success && response.data.data) {
      console.log('✅ API response structure is correct');
      console.log('Available:', response.data.data.available);
      console.log('Subdomain:', response.data.data.subdomain);
    } else {
      console.log('❌ API response structure is incorrect');
    }
    
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
}

testSubdomainAPI();
