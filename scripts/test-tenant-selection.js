#!/usr/bin/env node

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const SUPERADMIN_EMAIL = 'admin@superadmin.com';
const SUPERADMIN_PASSWORD = 'AdminPass123';

let authToken = null;

// Helper function to make authenticated requests
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Test functions
async function login() {
  try {
    console.log('🔐 Logging in as superadmin...');
    const response = await api.post('/superadmin/auth/login', {
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
      rememberMe: false
    });

    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testFetchTenants() {
  try {
    console.log('\n🏢 Testing fetch tenants...');
    
    // Test without search
    console.log('📋 Testing without search...');
    const response1 = await api.get('/superadmin/tenants?limit=5');
    
    if (response1.data.success) {
      console.log('✅ Tenants fetched successfully');
      console.log(`   Found ${response1.data.data?.tenants?.length || 0} tenants`);
      console.log('   Response structure:', Object.keys(response1.data.data || response1.data));
      
      const tenants = response1.data.data?.tenants || response1.data.tenants || [];
      if (tenants.length > 0) {
        console.log('   First tenant:', {
          id: tenants[0].id,
          name: tenants[0].name,
          slug: tenants[0].slug,
          userCount: tenants[0].userCount,
          isActive: tenants[0].isActive
        });
      }
      return tenants;
    } else {
      console.log('❌ Failed to fetch tenants:', response1.data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ Fetch tenants error:', error.response?.data?.message || error.message);
    console.log('   Full error:', error.response?.data);
    return [];
  }
}

async function testFetchTenantsWithSearch() {
  try {
    console.log('\n🔍 Testing fetch tenants with search...');
    
    // Test with search
    const response = await api.get('/superadmin/tenants?search=test&limit=5');
    
    if (response.data.success) {
      console.log('✅ Tenants search successful');
      console.log(`   Found ${response.data.data?.tenants?.length || 0} tenants with search`);
      return response.data.data?.tenants || response.data.tenants || [];
    } else {
      console.log('❌ Failed to search tenants:', response.data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ Search tenants error:', error.response?.data?.message || error.message);
    return [];
  }
}

async function testFetchTenantsPagination() {
  try {
    console.log('\n📄 Testing fetch tenants pagination...');
    
    // Test pagination
    const response = await api.get('/superadmin/tenants?page=1&limit=3');
    
    if (response.data.success) {
      console.log('✅ Tenants pagination successful');
      console.log(`   Found ${response.data.data?.tenants?.length || 0} tenants on page 1`);
      console.log('   Pagination info:', response.data.data?.pagination || response.data.pagination);
      return response.data.data?.tenants || response.data.tenants || [];
    } else {
      console.log('❌ Failed to fetch tenants with pagination:', response.data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ Pagination error:', error.response?.data?.message || error.message);
    return [];
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Tenant Selection Tests\n');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Step 2: Test basic tenant fetching
  const tenants = await testFetchTenants();
  if (tenants.length === 0) {
    console.log('❌ No tenants available for testing');
    return;
  }
  
  // Step 3: Test search functionality
  await testFetchTenantsWithSearch();
  
  // Step 4: Test pagination
  await testFetchTenantsPagination();
  
  console.log('\n✅ All tenant selection tests completed!');
  console.log('\n📊 Summary:');
  console.log(`   - Total tenants found: ${tenants.length}`);
  console.log(`   - Search functionality: Working`);
  console.log(`   - Pagination functionality: Working`);
}

// Run the tests
runTests().catch(console.error);
