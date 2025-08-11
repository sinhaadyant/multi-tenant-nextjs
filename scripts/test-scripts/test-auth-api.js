const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAuthAPI() {
  console.log('🧪 Starting Authentication API Tests...\n');

  // Test 1: Login API
  console.log('📋 Test 1: Login API');
  try {
    const loginResponse = await fetch('http://localhost:3000/api/superadmin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@superadmin.com',
        password: 'SuperAdmin123!'
      }),
    });

    const loginData = await loginResponse.json();
    
    console.log('📊 Login Response Status:', loginResponse.status);
    console.log('📊 Login Response:', JSON.stringify(loginData, null, 2));
    
    if (loginResponse.ok && loginData.success) {
      console.log('✅ Login API Test: PASSED');
      
      // Test 2: Token Validation
      console.log('\n📋 Test 2: Token Validation');
      const token = loginData.data.token;
      
      if (token) {
        console.log('✅ Token received:', token.substring(0, 20) + '...');
        
        // Test 3: Dashboard Access with Token
        console.log('\n📋 Test 3: Dashboard Access with Token');
        const dashboardResponse = await fetch('http://localhost:3000/superadmin/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cookie': `superadmin_token=${token}`
          }
        });
        
        console.log('📊 Dashboard Response Status:', dashboardResponse.status);
        console.log('📊 Dashboard Response Headers:', Object.fromEntries(dashboardResponse.headers.entries()));
        
        if (dashboardResponse.status === 200) {
          console.log('✅ Dashboard Access Test: PASSED');
        } else {
          console.log('❌ Dashboard Access Test: FAILED');
        }
        
      } else {
        console.log('❌ No token received from login');
      }
      
    } else {
      console.log('❌ Login API Test: FAILED');
      console.log('❌ Error:', loginData.message || 'Unknown error');
    }
    
  } catch (error) {
    console.log('❌ Login API Test: ERROR');
    console.log('❌ Error:', error.message);
  }

  // Test 4: Invalid Login
  console.log('\n📋 Test 4: Invalid Login');
  try {
    const invalidLoginResponse = await fetch('http://localhost:3000/api/superadmin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@superadmin.com',
        password: 'wrongpassword'
      }),
    });

    const invalidLoginData = await invalidLoginResponse.json();
    
    console.log('📊 Invalid Login Response Status:', invalidLoginResponse.status);
    console.log('📊 Invalid Login Response:', JSON.stringify(invalidLoginData, null, 2));
    
    if (invalidLoginResponse.status === 401) {
      console.log('✅ Invalid Login Test: PASSED');
    } else {
      console.log('❌ Invalid Login Test: FAILED');
    }
    
  } catch (error) {
    console.log('❌ Invalid Login Test: ERROR');
    console.log('❌ Error:', error.message);
  }

  // Test 5: Missing Email/Password
  console.log('\n📋 Test 5: Missing Credentials');
  try {
    const missingCredsResponse = await fetch('http://localhost:3000/api/superadmin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: '',
        password: ''
      }),
    });

    const missingCredsData = await missingCredsResponse.json();
    
    console.log('📊 Missing Creds Response Status:', missingCredsResponse.status);
    console.log('📊 Missing Creds Response:', JSON.stringify(missingCredsData, null, 2));
    
    if (missingCredsResponse.status === 400) {
      console.log('✅ Missing Credentials Test: PASSED');
    } else {
      console.log('❌ Missing Credentials Test: FAILED');
    }
    
  } catch (error) {
    console.log('❌ Missing Credentials Test: ERROR');
    console.log('❌ Error:', error.message);
  }

  console.log('\n🏁 Authentication API Tests Complete!');
}

testAuthAPI(); 