import axios from 'axios';

async function testReportsAPI() {
  console.log('🧪 Testing Reports API via HTTP...\n');

  try {
    // Test 1: Check if the API endpoint is accessible
    console.log('📡 Testing API endpoint accessibility...');
    
    const baseURL = 'http://localhost:3000';
    const endpoint = '/api/superadmin/reports';
    
    try {
      const response = await axios.get(`${baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });
      
      console.log('✅ API endpoint is accessible');
      console.log('📊 Response status:', response.status);
      console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
      
    } catch (error: any) {
      console.log('❌ API endpoint error:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message || error.message);
      console.log('   Data:', JSON.stringify(error.response?.data, null, 2));
    }

    // Test 2: Test overview endpoint
    console.log('\n📡 Testing overview endpoint...');
    
    try {
      const overviewResponse = await axios.get(`${baseURL}/api/superadmin/reports/overview`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });
      
      console.log('✅ Overview endpoint is accessible');
      console.log('📊 Response status:', overviewResponse.status);
      console.log('📊 Response data:', JSON.stringify(overviewResponse.data, null, 2));
      
    } catch (error: any) {
      console.log('❌ Overview endpoint error:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message || error.message);
      console.log('   Data:', JSON.stringify(error.response?.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testReportsAPI();
