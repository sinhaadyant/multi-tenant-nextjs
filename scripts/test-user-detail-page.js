const axios = require('axios');

async function testUserDetailPage() {
  const BASE_URL = 'http://localhost:3000';
  const SUPERADMIN_EMAIL = 'sinhaadyant74@gmail.com';
  const SUPERADMIN_PASSWORD = 'password123';

  try {
    console.log('👤 Testing User Detail Page');
    console.log('==========================');

    // Step 1: Login as superadmin
    console.log('\n1. Logging in as superadmin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD
    });

    if (!loginResponse.data.success) {
      throw new Error('Superadmin login failed: ' + loginResponse.data.message);
    }

    const superadminToken = loginResponse.data.data.token;
    console.log('✅ Superadmin login successful');

    // Step 2: Get users list to find a user ID
    console.log('\n2. Getting users list...');
    const usersResponse = await axios.get(`${BASE_URL}/api/superadmin/users`, {
      headers: {
        'Authorization': `Bearer ${superadminToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 5
      }
    });

    console.log('✅ Users list retrieved');
    console.log('📊 Total users:', usersResponse.data.data.users.length);

    if (usersResponse.data.data.users.length === 0) {
      console.log('❌ No users found to test with');
      return;
    }

    const testUser = usersResponse.data.data.users[0];
    console.log('👤 Test user:', {
      id: testUser.id,
      name: testUser.name,
      email: testUser.email
    });

    // Step 3: Test getting single user details
    console.log('\n3. Testing single user details API...');
    const userDetailResponse = await axios.get(`${BASE_URL}/api/superadmin/users/${testUser.id}`, {
      headers: {
        'Authorization': `Bearer ${superadminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ User details API successful!');
    console.log('📊 User data:', {
      id: userDetailResponse.data.data.user.id,
      name: userDetailResponse.data.data.user.name,
      email: userDetailResponse.data.data.user.email,
      isActive: userDetailResponse.data.data.user.isActive,
      role: userDetailResponse.data.data.user.role?.name || 'No role',
      tenant: userDetailResponse.data.data.user.tenant?.name || 'No tenant'
    });

    // Step 4: Test user detail page in browser
    console.log('\n4. Testing user detail page...');
    console.log(`🌐 Open this URL in your browser: ${BASE_URL}/superadmin/users/${testUser.id}`);
    console.log('   Make sure you are logged in as superadmin first');

    // Step 5: Test roles API
    console.log('\n5. Testing roles API...');
    try {
      const rolesResponse = await axios.get(`${BASE_URL}/api/superadmin/roles`, {
        headers: {
          'Authorization': `Bearer ${superadminToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Roles API successful!');
      console.log('📊 Total roles:', rolesResponse.data.data.roles.length);
    } catch (error) {
      console.log('❌ Roles API failed:', error.response?.data?.message || error.message);
    }

    // Step 6: Test permissions API
    console.log('\n6. Testing permissions API...');
    try {
      const permissionsResponse = await axios.get(`${BASE_URL}/api/superadmin/permissions`, {
        headers: {
          'Authorization': `Bearer ${superadminToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Permissions API successful!');
      console.log('📊 Total permissions:', permissionsResponse.data.data.permissions.length);
    } catch (error) {
      console.log('❌ Permissions API failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🎯 Test Summary:');
    console.log('   ✅ Authentication: Working');
    console.log('   ✅ Users list API: Working');
    console.log('   ✅ User details API: Working');
    console.log('   ❓ User detail page: Check browser');
    console.log('   ❓ Roles API: Check above');
    console.log('   ❓ Permissions API: Check above');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testUserDetailPage();
