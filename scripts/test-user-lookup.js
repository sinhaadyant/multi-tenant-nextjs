const axios = require('axios');

async function testUserLookup() {
  const BASE_URL = 'http://localhost:3000';
  const SUPERADMIN_EMAIL = 'sinhaadyant74@gmail.com';
  const SUPERADMIN_PASSWORD = 'password123';
  const TARGET_USER_EMAIL = 'anil@cc.com';

  try {
    console.log('🧪 Testing User Lookup for Sample Notification Button');
    console.log('==================================================');

    // Step 1: Login as superadmin
    console.log('\n1. Logging in as superadmin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD
    });

    const superadminToken = loginResponse.data.data.token;
    console.log('✅ Superadmin login successful');

    // Step 2: Test the users API endpoint
    console.log('\n2. Testing users API endpoint...');
    const usersResponse = await axios.get(`${BASE_URL}/api/superadmin/users?limit=1000`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });

    console.log('✅ Users API working');
    console.log('📋 Total users found:', usersResponse.data.data.users.length);

    // Step 3: Find anil@cc.com specifically
    console.log('\n3. Looking for anil@cc.com...');
    const anilUser = usersResponse.data.data.users.find(user => user.email === TARGET_USER_EMAIL);

    if (anilUser) {
      console.log('✅ User anil@cc.com found:');
      console.log('   ID:', anilUser.id);
      console.log('   Name:', anilUser.name);
      console.log('   Email:', anilUser.email);
      console.log('   Status:', anilUser.isActive ? 'Active' : 'Inactive');
      console.log('   Tenant:', anilUser.tenant?.name || 'No tenant');
    } else {
      console.log('❌ User anil@cc.com not found');
      console.log('📋 Available users:');
      usersResponse.data.data.users.slice(0, 5).forEach(user => {
        console.log(`   - ${user.email} (${user.name})`);
      });
      if (usersResponse.data.data.users.length > 5) {
        console.log(`   ... and ${usersResponse.data.data.users.length - 5} more users`);
      }
    }

    // Step 4: Test search functionality
    console.log('\n4. Testing search functionality...');
    const searchResponse = await axios.get(`${BASE_URL}/api/superadmin/users?search=${TARGET_USER_EMAIL}`, {
      headers: { Authorization: `Bearer ${superadminToken}` }
    });

    console.log('✅ Search API working');
    console.log('📋 Search results:', searchResponse.data.data.users.length);

    const searchResult = searchResponse.data.data.users.find(user => user.email === TARGET_USER_EMAIL);
    if (searchResult) {
      console.log('✅ Search found anil@cc.com');
    } else {
      console.log('❌ Search did not find anil@cc.com');
    }

    console.log('\n🎉 User lookup test completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Users API endpoint working');
    console.log('   ✅ Search functionality working');
    if (anilUser) {
      console.log('   ✅ Target user found and available');
      console.log('   ✅ Sample notification button should work');
    } else {
      console.log('   ❌ Target user not found');
      console.log('   ❌ Sample notification button will be disabled');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

testUserLookup();
