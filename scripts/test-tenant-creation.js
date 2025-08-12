const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'superadmin@example.com';
const TEST_PASSWORD = 'password123';

async function testTenantCreation() {
  console.log('🧪 Testing Tenant Creation...\n');

  try {
    // Step 1: Login as superadmin
    console.log('1. Logging in as superadmin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/superadmin/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    const { accessToken } = loginResponse.data.data;
    console.log('✅ Login successful\n');

    // Step 2: Test tenant creation with unique data
    console.log('2. Testing tenant creation...');
    const tenantData = {
      tenant: {
        name: `Test Tenant ${Date.now()}`,
        slug: `test-tenant-${Date.now()}`,
        domain: `test-${Date.now()}.example.com`,
        description: 'Test tenant for API validation',
        plan: 'starter',
        region: 'us-east-1',
        features: ['feature1', 'feature2']
      },
      admin: {
        name: `Test Admin ${Date.now()}`,
        email: `testadmin${Date.now()}@example.com`,
        password: 'SecurePassword123!'
      }
    };

    const createResponse = await axios.post(`${BASE_URL}/api/superadmin/tenants`, tenantData, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('✅ Tenant creation successful:', {
      status: createResponse.status,
      tenantName: createResponse.data.data.tenant.name,
      tenantSlug: createResponse.data.data.tenant.slug
    });
    console.log('');

    // Step 3: Test duplicate email validation
    console.log('3. Testing duplicate email validation...');
    const duplicateEmailData = {
      tenant: {
        name: `Test Tenant Duplicate ${Date.now()}`,
        slug: `test-tenant-duplicate-${Date.now()}`,
        domain: `test-duplicate-${Date.now()}.example.com`,
        description: 'Test tenant with duplicate admin email',
        plan: 'starter',
        region: 'us-east-1',
        features: []
      },
      admin: {
        name: 'Duplicate Admin',
        email: tenantData.admin.email, // Use the same email as above
        password: 'SecurePassword123!'
      }
    };

    try {
      await axios.post(`${BASE_URL}/api/superadmin/tenants`, duplicateEmailData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('❌ Duplicate email validation failed - should have rejected');
    } catch (error) {
      if (error.response?.status === 409 && error.response?.data?.message?.includes('Admin email already exists')) {
        console.log('✅ Duplicate email validation working correctly');
      } else {
        console.log('❌ Unexpected error for duplicate email:', error.response?.data);
      }
    }
    console.log('');

    // Step 4: Test duplicate slug validation
    console.log('4. Testing duplicate slug validation...');
    const duplicateSlugData = {
      tenant: {
        name: `Test Tenant Duplicate Slug ${Date.now()}`,
        slug: tenantData.tenant.slug, // Use the same slug as above
        domain: `test-duplicate-slug-${Date.now()}.example.com`,
        description: 'Test tenant with duplicate slug',
        plan: 'starter',
        region: 'us-east-1',
        features: []
      },
      admin: {
        name: 'Duplicate Slug Admin',
        email: `duplicateslug${Date.now()}@example.com`,
        password: 'SecurePassword123!'
      }
    };

    try {
      await axios.post(`${BASE_URL}/api/superadmin/tenants`, duplicateSlugData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('❌ Duplicate slug validation failed - should have rejected');
    } catch (error) {
      if (error.response?.status === 409 && error.response?.data?.message?.includes('Tenant slug already exists')) {
        console.log('✅ Duplicate slug validation working correctly');
      } else {
        console.log('❌ Unexpected error for duplicate slug:', error.response?.data);
      }
    }
    console.log('');

    // Step 5: Test user creation with unique email
    console.log('5. Testing user creation...');
    const userData = {
      name: `Test User ${Date.now()}`,
      email: `testuser${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      tenantId: createResponse.data.data.tenant.id
    };

    const userResponse = await axios.post(`${BASE_URL}/api/superadmin/users`, userData, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('✅ User creation successful:', {
      status: userResponse.status,
      userName: userResponse.data.data.user.name,
      userEmail: userResponse.data.data.user.email
    });
    console.log('');

    // Step 6: Test duplicate user email validation
    console.log('6. Testing duplicate user email validation...');
    const duplicateUserData = {
      name: 'Duplicate User',
      email: userData.email, // Use the same email as above
      password: 'SecurePassword123!',
      tenantId: createResponse.data.data.tenant.id
    };

    try {
      await axios.post(`${BASE_URL}/api/superadmin/users`, duplicateUserData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('❌ Duplicate user email validation failed - should have rejected');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('User with this email already exists')) {
        console.log('✅ Duplicate user email validation working correctly');
      } else {
        console.log('❌ Unexpected error for duplicate user email:', error.response?.data);
      }
    }
    console.log('');

    console.log('🎉 All tenant creation tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testTenantCreation();
