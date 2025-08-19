#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANTS = ['acme-corp', 'techstart', 'global-solutions'];

const log = (message, type = 'info') => {
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
  console.log(`${prefix} ${message}`);
};

const testEndpoint = async (name, url, method = 'GET', data = null, headers = {}) => {
  try {
    log(`Testing: ${name}`);
    const response = await axios({
      method,
      url: `${BASE_URL}${url}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
    
    if (response.data.success !== false) {
      log(`✅ ${name} - Success`, 'success');
      return true;
    } else {
      log(`❌ ${name} - Failed: ${response.data.message}`, 'error');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      log(`⚠️  ${name} - Requires authentication (expected)`, 'info');
      return true; // 401 is expected for protected endpoints
    } else {
      log(`❌ ${name} - Error: ${error.response?.data?.message || error.message}`, 'error');
      return false;
    }
  }
};

const runTests = async () => {
  log('🚀 Testing API Endpoints...');
  
  // Test tenant info endpoints
  for (const tenant of TENANTS) {
    await testEndpoint(
      `Tenant Info - ${tenant}`,
      `/api/tenant/${tenant}/info`
    );
  }
  
  // Test login endpoint
  await testEndpoint(
    'Login Endpoint',
    '/api/tenant/auth/login',
    'POST',
    {
      email: 'admin@acme-corp.com',
      password: 'AcmeAdmin123!',
      tenantSlug: 'acme-corp'
    }
  );
  
  // Test protected endpoints (should return 401)
  for (const tenant of TENANTS) {
    await testEndpoint(
      `User Profile - ${tenant}`,
      `/api/tenant/${tenant}/me`
    );
    
    await testEndpoint(
      `Dashboard - ${tenant}`,
      `/api/tenant/${tenant}/dashboard`
    );
  }
  
  log('✅ API endpoint testing completed!');
};

runTests().catch(error => {
  log(`Test runner failed: ${error.message}`, 'error');
  process.exit(1);
});
