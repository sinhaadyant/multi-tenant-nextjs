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

async function testModulesAPI() {
  console.log('🧪 Testing Modules API...\n');

  try {
    // Test 1: Get all modules
    console.log('1. Testing GET /api/modules');
    const modulesResponse = await axios.get(`${BASE_URL}/modules`);
    console.log('✅ Success:', modulesResponse.data.message);
    console.log('   Modules found:', modulesResponse.data.data.length);
    console.log('');

    // Test 2: Create a new module
    console.log('2. Testing POST /api/modules');
    const createModuleResponse = await axios.post(
      `${BASE_URL}/modules`,
      testModule
    );
    console.log('✅ Success:', createModuleResponse.data.message);
    const createdModule = createModuleResponse.data.data;
    console.log('   Created module ID:', createdModule.id);
    console.log('');

    // Test 3: Get single module
    console.log('3. Testing GET /api/modules/:id');
    const singleModuleResponse = await axios.get(
      `${BASE_URL}/modules/${createdModule.id}`
    );
    console.log('✅ Success:', singleModuleResponse.data.message);
    console.log('');

    // Test 4: Update module
    console.log('4. Testing PUT /api/modules/:id');
    const updateData = { ...testModule, name: 'Updated Test Module' };
    const updateModuleResponse = await axios.put(
      `${BASE_URL}/modules/${createdModule.id}`,
      updateData
    );
    console.log('✅ Success:', updateModuleResponse.data.message);
    console.log('');

    // Test 5: Get menu modules
    console.log('5. Testing GET /api/modules/menu');
    const menuModulesResponse = await axios.get(`${BASE_URL}/modules/menu`);
    console.log('✅ Success:', menuModulesResponse.data.message);
    console.log('   Menu modules found:', menuModulesResponse.data.data.length);
    console.log('');

    // Test 6: Toggle module status
    console.log('6. Testing PATCH /api/modules/:id/toggle');
    const toggleResponse = await axios.patch(
      `${BASE_URL}/modules/${createdModule.id}/toggle`
    );
    console.log('✅ Success:', toggleResponse.data.message);
    console.log('');

    // Test 7: Get all submodules
    console.log('7. Testing GET /api/submodules');
    const submodulesResponse = await axios.get(`${BASE_URL}/submodules`);
    console.log('✅ Success:', submodulesResponse.data.message);
    console.log('   Submodules found:', submodulesResponse.data.data.length);
    console.log('');

    // Test 8: Create a submodule
    console.log('8. Testing POST /api/submodules');
    testSubmodule.moduleId = createdModule.id;
    const createSubmoduleResponse = await axios.post(
      `${BASE_URL}/submodules`,
      testSubmodule
    );
    console.log('✅ Success:', createSubmoduleResponse.data.message);
    const createdSubmodule = createSubmoduleResponse.data.data;
    console.log('   Created submodule ID:', createdSubmodule.id);
    console.log('');

    // Test 9: Get submodules by module ID
    console.log('9. Testing GET /api/submodules/module/:moduleId');
    const moduleSubmodulesResponse = await axios.get(
      `${BASE_URL}/submodules/module/${createdModule.id}`
    );
    console.log('✅ Success:', moduleSubmodulesResponse.data.message);
    console.log(
      '   Submodules in module:',
      moduleSubmodulesResponse.data.data.length
    );
    console.log('');

    // Test 10: Update submodule
    console.log('10. Testing PUT /api/submodules/:id');
    const updateSubmoduleData = {
      ...testSubmodule,
      name: 'Updated Test Submodule',
    };
    const updateSubmoduleResponse = await axios.put(
      `${BASE_URL}/submodules/${createdSubmodule.id}`,
      updateSubmoduleData
    );
    console.log('✅ Success:', updateSubmoduleResponse.data.message);
    console.log('');

    // Test 11: Toggle submodule status
    console.log('11. Testing PATCH /api/submodules/:id/toggle');
    const toggleSubmoduleResponse = await axios.patch(
      `${BASE_URL}/submodules/${createdSubmodule.id}/toggle`
    );
    console.log('✅ Success:', toggleSubmoduleResponse.data.message);
    console.log('');

    // Test 12: Delete submodule
    console.log('12. Testing DELETE /api/submodules/:id');
    const deleteSubmoduleResponse = await axios.delete(
      `${BASE_URL}/submodules/${createdSubmodule.id}`
    );
    console.log('✅ Success:', deleteSubmoduleResponse.data.message);
    console.log('');

    // Test 13: Delete module
    console.log('13. Testing DELETE /api/modules/:id');
    const deleteModuleResponse = await axios.delete(
      `${BASE_URL}/modules/${createdModule.id}`
    );
    console.log('✅ Success:', deleteModuleResponse.data.message);
    console.log('');

    console.log('🎉 All tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

// Run the tests
testModulesAPI();
