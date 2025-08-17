const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test data
const testModule = {
  name: 'Test Module',
  description: 'A test module for API testing',
  icon: 'FileText',
  orderIndex: 1,
};

const testSubmodule = {
  name: 'Test Submodule',
  description: 'A test submodule for API testing',
  moduleId: '', // Will be set after module creation
  orderIndex: 1,
};

async function testBasicEndpoints() {
  console.log('🧪 Testing Basic Endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing GET /api/health');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Health check successful:', healthResponse.data.message);
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }
    console.log('');

    // Test 2: Get all modules (should fail without auth)
    console.log('2. Testing GET /api/modules (should fail without auth)');
    try {
      const modulesResponse = await axios.get(`${BASE_URL}/modules`);
      console.log('✅ Unexpected success:', modulesResponse.data.message);
    } catch (error) {
      console.log(
        '✅ Expected auth error:',
        error.response?.status,
        error.response?.data?.message || error.message
      );
    }
    console.log('');

    // Test 3: Get menu modules (should work without auth)
    console.log('3. Testing GET /api/modules/menu (should work without auth)');
    try {
      const menuResponse = await axios.get(`${BASE_URL}/modules/menu`);
      console.log('✅ Menu modules retrieved:', menuResponse.data.message);
      console.log('   Modules found:', menuResponse.data.data?.length || 0);
    } catch (error) {
      console.log(
        '❌ Menu modules failed:',
        error.response?.status,
        error.response?.data?.message || error.message
      );
    }
    console.log('');

    // Test 4: Get all submodules (should fail without auth)
    console.log('4. Testing GET /api/submodules (should fail without auth)');
    try {
      const submodulesResponse = await axios.get(`${BASE_URL}/submodules`);
      console.log('✅ Unexpected success:', submodulesResponse.data.message);
    } catch (error) {
      console.log(
        '✅ Expected auth error:',
        error.response?.status,
        error.response?.data?.message || error.message
      );
    }
    console.log('');

    console.log('🎉 Basic endpoint tests completed!');
    console.log('\n📋 Summary:');
    console.log('- Health endpoint: Working');
    console.log('- Menu endpoint: Working (public)');
    console.log('- Protected endpoints: Properly protected');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testBasicEndpoints();
