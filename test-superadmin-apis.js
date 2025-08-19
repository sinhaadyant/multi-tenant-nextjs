const axios = require('axios');

async function testSuperadminAPIs() {
  const baseURL = 'http://localhost:3000/api/superadmin';

  console.log('🧪 Testing Superadmin APIs with Authentication...\n');

  const testCredentials = {
    email: 'admin@superadmin.com',
    password: 'AdminPass123',
    rememberMe: false
  };

  let authToken = null;

  // Step 1: Authenticate
  console.log('🔐 Step 1: Authenticating...');
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, testCredentials, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Authentication successful!');
      console.log(`👤 User: ${loginResponse.data.data.user.name} (${loginResponse.data.data.user.email})`);
    } else {
      console.log('❌ Authentication failed:', loginResponse.data.message);
      return;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.response?.data?.message || error.message);
    return;
  }

  // Step 2: Test Superadmin List API
  console.log('\n🔍 Step 2: Testing Superadmin List API...');
  try {
    const listResponse = await axios.get(`${baseURL}/superadmins`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (listResponse.data.success) {
      console.log('✅ Superadmin List API successful!');
      console.log(`📊 Total superadmins: ${listResponse.data.data.stats.total}`);
      console.log(`👥 Active: ${listResponse.data.data.stats.active}`);
      console.log(`🚫 Inactive: ${listResponse.data.data.stats.inactive}`);
      console.log(`📋 Superadmins found: ${listResponse.data.data.superadmins.length}`);
      
      if (listResponse.data.data.superadmins.length > 0) {
        console.log('📋 Superadmins:');
        listResponse.data.data.superadmins.forEach((superadmin, index) => {
          console.log(`  ${index + 1}. ${superadmin.name} (${superadmin.email}) - ${superadmin.isActive ? 'Active' : 'Inactive'}`);
        });
      }
    } else {
      console.log('❌ Superadmin List API failed:', listResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Superadmin List API error:', error.response?.data?.message || error.message);
  }

  // Step 3: Test Create Invite API
  console.log('\n🔍 Step 3: Testing Create Invite API...');
  try {
    const inviteData = {
      email: `test_${Date.now()}@example.com`,
      name: `Test Superadmin ${Date.now()}`
    };

    const inviteResponse = await axios.post(`${baseURL}/superadmins/invite`, inviteData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (inviteResponse.data.success) {
      console.log('✅ Create Invite API successful!');
      console.log(`📧 Invite created for: ${inviteResponse.data.data.invite.email}`);
      console.log(`🔗 Invite link: ${inviteResponse.data.data.invite.inviteLink}`);
    } else {
      console.log('❌ Create Invite API failed:', inviteResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Create Invite API error:', error.response?.data?.message || error.message);
  }

  console.log('\n✅ Superadmin API testing completed!');
}

testSuperadminAPIs().catch(console.error);
