const axios = require('axios');

async function debugUserStructure() {
  const BASE_URL = 'http://localhost:3000';
  const USER_EMAIL = 'anil@cc.com';
  const USER_PASSWORD = 'password123';
  const TENANT_SLUG = 'riyo';

  try {
    console.log('🔍 Debugging User Data Structure');
    console.log('================================');

    // Step 1: Login as user
    console.log('\n1. Logging in as user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: USER_EMAIL,
      password: USER_PASSWORD,
      tenantSlug: TENANT_SLUG
    });

    const userData = loginResponse.data.data.user;
    console.log('✅ User login successful');
    
    console.log('\n📋 Full user data structure:');
    console.log(JSON.stringify(userData, null, 2));

    console.log('\n🔍 Key fields:');
    console.log('   user.id:', userData.id);
    console.log('   user.tenantId:', userData.tenantId);
    console.log('   user.tenant:', userData.tenant);
    console.log('   user.tenant?.id:', userData.tenant?.id);
    console.log('   user.tenant?.slug:', userData.tenant?.slug);

    // Step 2: Check what the WebSocket needs
    console.log('\n🔌 WebSocket connection needs:');
    console.log('   userId:', userData.id);
    console.log('   userType: user');
    console.log('   tenantId:', userData.tenantId || userData.tenant?.id);

    if (!userData.tenantId && !userData.tenant?.id) {
      console.log('❌ No tenant ID found! This will cause WebSocket connection issues.');
    } else {
      console.log('✅ Tenant ID found for WebSocket connection');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

debugUserStructure();
