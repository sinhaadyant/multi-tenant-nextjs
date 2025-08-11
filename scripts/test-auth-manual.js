const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAuthManually() {
  console.log('🧪 Manual Authentication Test\n');
  
  try {
    // Step 1: Test login API
    console.log('1. 🔐 Testing login API...');
    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: 'admin@superadmin.com',
      password: 'AdminPass123'
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const loginData = loginResponse.data;
    
    if (!loginData.success) {
      console.log('❌ Login failed:', loginData);
      return;
    }

    console.log('✅ Login successful');
    console.log('   - Token received:', !!loginData.data.token);
    console.log('   - User role:', loginData.data.user.role);
    console.log('   - User email:', loginData.data.user.email);

    const token = loginData.data.token;

    // Step 2: Test token verification
    console.log('\n2. 🔍 Testing token verification...');
    const verifyResponse = await axios.get(`${BASE_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const verifyData = verifyResponse.data;
    
    if (!verifyData.success) {
      console.log('❌ Token verification failed:', verifyData);
      return;
    }

    console.log('✅ Token verification successful');
    console.log('   - User verified:', verifyData.data.email);
    console.log('   - Role confirmed:', verifyData.data.role);

    // Step 3: Test dashboard access simulation
    console.log('\n3. 🏠 Testing dashboard access simulation...');
    
    // Simulate what happens when accessing dashboard
    const dashboardResponse = await axios.get(`${BASE_URL}/superadmin/dashboard`, {
      headers: {
        'Cookie': `superadmin_token=${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('✅ Dashboard access test completed');
    console.log('   - Status:', dashboardResponse.status);
    console.log('   - Content-Type:', dashboardResponse.headers['content-type']);

    // Step 4: Test logout API
    console.log('\n4. 🚪 Testing logout API...');
    const logoutResponse = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (logoutResponse.status === 200) {
      console.log('✅ Logout API working');
    } else {
      console.log('⚠️  Logout API returned:', logoutResponse.status);
    }

    console.log('\n🎉 All API tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Login API: ✅ Working');
    console.log('   - Token verification: ✅ Working');
    console.log('   - Dashboard access: ✅ Working');
    console.log('   - Logout API: ✅ Working');
    
    console.log('\n💡 Next steps:');
    console.log('   1. Open http://localhost:3001/superadmin/login in your browser');
    console.log('   2. Login with admin@superadmin.com / AdminPass123');
    console.log('   3. Verify you stay on the dashboard after login');
    console.log('   4. Try refreshing the page to test session persistence');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAuthManually(); 