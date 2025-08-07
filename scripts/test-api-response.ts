#!/usr/bin/env tsx

import axios from 'axios';

async function testApiResponse() {
  console.log('🔍 Testing API response structure...');

  try {
    // Test the subdomain check API
    const response = await axios.get('http://localhost:3000/api/superadmin/tenants/check-subdomain?subdomain=test-company');
    
    console.log('📋 Full API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n🔍 Response Structure Analysis:');
    console.log('response.data.success:', response.data.success);
    console.log('response.data.status:', response.data.status);
    console.log('response.data.message:', response.data.message);
    console.log('response.data.data:', response.data.data);
    console.log('response.data.data.available:', response.data.data?.available);
    console.log('response.data.data.subdomain:', response.data.data?.subdomain);
    
    // Test the correct way to access the data
    const available = response.data.data.available;
    const subdomain = response.data.data.subdomain;
    
    console.log('\n✅ Correct Data Access:');
    console.log(`Subdomain: ${subdomain}`);
    console.log(`Available: ${available}`);
    
  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
  }
}

testApiResponse()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 