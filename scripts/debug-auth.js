const axios = require('axios');

async function debugAuth() {
  console.log('🔍 Debugging Authentication Flow...\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Attempting login...');
    const loginResponse = await axios.post('http://localhost:3000/api/tenant/auth/login', {
      email: 'admin@acme-corp.com',
      password: 'AcmeAdmin123!',
      tenantSlug: 'acme-corp',
      rememberMe: true
    });

    console.log('✅ Login successful');
    console.log('Token:', loginResponse.data.data.token.substring(0, 50) + '...');
    console.log('User ID:', loginResponse.data.data.user.id);
    console.log('Tenant Slug:', loginResponse.data.data.user.tenant.slug);

    // Step 2: Test /me endpoint
    console.log('\n2️⃣ Testing /me endpoint...');
    const meResponse = await axios.get('http://localhost:3000/api/tenant/acme-corp/me', {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.data.token}`
      }
    });

    console.log('✅ /me endpoint successful');
    console.log('User authenticated:', meResponse.data.data.name);

    // Step 3: Test dashboard access
    console.log('\n3️⃣ Testing dashboard access...');
    const dashboardResponse = await axios.get('http://localhost:3000/acme-corp/dashboard', {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.data.token}`,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    console.log('✅ Dashboard access successful');
    console.log('Status:', dashboardResponse.status);
    console.log('Content-Type:', dashboardResponse.headers['content-type']);
    console.log('Content length:', dashboardResponse.data.length);

    // Check if it's a 404 page
    if (dashboardResponse.data.includes('ERROR') || dashboardResponse.data.includes('404')) {
      console.log('❌ Dashboard returned 404 page');
    } else {
      console.log('✅ Dashboard loaded successfully');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.statusText);
    console.error('Error details:', error.response?.data);
  }
}

debugAuth();
