#!/usr/bin/env node

/**
 * Comprehensive Test Script for Tenant Login and Role-Based Permissions
 * This script tests all the fixes implemented for tenant authentication and permissions
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TENANTS = [
  {
    slug: 'acme-corp',
    admin: { email: 'admin@acme-corp.com', password: 'AcmeAdmin123!' },
    user: { email: 'user@acme-corp.com', password: 'AcmeUser123!' }
  },
  {
    slug: 'techstart',
    admin: { email: 'admin@techstart.com', password: 'TechStart123!' }
  },
  {
    slug: 'global-solutions',
    admin: { email: 'admin@global-solutions.com', password: 'GlobalAdmin123!' }
  }
];

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  },
  tests: []
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const addTestResult = (testName, passed, error = null) => {
  testResults.summary.total++;
  if (passed) {
    testResults.summary.passed++;
    log(`PASS: ${testName}`, 'success');
  } else {
    testResults.summary.failed++;
    testResults.summary.errors.push(error);
    log(`FAIL: ${testName} - ${error}`, 'error');
  }
  
  testResults.tests.push({
    name: testName,
    passed,
    error,
    timestamp: new Date().toISOString()
  });
};

// Test functions
const testTenantInfo = async (tenantSlug) => {
  try {
    log(`Testing tenant info for: ${tenantSlug}`);
    const response = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/info`);
    
    if (response.data.success && response.data.data?.tenant) {
      addTestResult(`Tenant Info - ${tenantSlug}`, true);
      return response.data.data.tenant;
    } else {
      addTestResult(`Tenant Info - ${tenantSlug}`, false, 'Invalid response format');
      return null;
    }
  } catch (error) {
    addTestResult(`Tenant Info - ${tenantSlug}`, false, error.message);
    return null;
  }
};

const testTenantLogin = async (tenantSlug, credentials) => {
  try {
    log(`Testing login for: ${credentials.email} in ${tenantSlug}`);
    
    const response = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: credentials.email,
      password: credentials.password,
      tenantSlug: tenantSlug
    });
    
    if (response.data.success && response.data.data?.token) {
      addTestResult(`Login - ${credentials.email}`, true);
      return response.data.data;
    } else {
      addTestResult(`Login - ${credentials.email}`, false, 'Login failed - no token received');
      return null;
    }
  } catch (error) {
    addTestResult(`Login - ${credentials.email}`, false, error.response?.data?.message || error.message);
    return null;
  }
};

const testUserProfile = async (tenantSlug, token) => {
  try {
    log(`Testing user profile fetch for tenant: ${tenantSlug}`);
    
    const response = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success && response.data.data?.id) {
      addTestResult(`User Profile - ${tenantSlug}`, true);
      return response.data.data;
    } else {
      addTestResult(`User Profile - ${tenantSlug}`, false, 'Invalid profile response');
      return null;
    }
  } catch (error) {
    addTestResult(`User Profile - ${tenantSlug}`, false, error.response?.data?.message || error.message);
    return null;
  }
};

const testRolePermissions = async (userProfile) => {
  try {
    log(`Testing role permissions for user: ${userProfile.email}`);
    
    if (!userProfile.roles || userProfile.roles.length === 0) {
      addTestResult(`Role Permissions - ${userProfile.email}`, false, 'No roles assigned');
      return false;
    }
    
    if (!userProfile.permissions || userProfile.permissions.length === 0) {
      addTestResult(`Role Permissions - ${userProfile.email}`, false, 'No permissions assigned');
      return false;
    }
    
    // Check for basic permissions
    const hasBasicPermissions = userProfile.permissions.some(p => 
      p.moduleKey === 'dashboard' && p.canRead
    );
    
    if (hasBasicPermissions) {
      addTestResult(`Role Permissions - ${userProfile.email}`, true);
      return true;
    } else {
      addTestResult(`Role Permissions - ${userProfile.email}`, false, 'Missing basic dashboard permissions');
      return false;
    }
  } catch (error) {
    addTestResult(`Role Permissions - ${userProfile.email}`, false, error.message);
    return false;
  }
};

const testDashboardAccess = async (tenantSlug, token) => {
  try {
    log(`Testing dashboard access for tenant: ${tenantSlug}`);
    
    const response = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      addTestResult(`Dashboard Access - ${tenantSlug}`, true);
      return true;
    } else {
      addTestResult(`Dashboard Access - ${tenantSlug}`, false, 'Dashboard access denied');
      return false;
    }
  } catch (error) {
    addTestResult(`Dashboard Access - ${tenantSlug}`, false, error.response?.data?.message || error.message);
    return false;
  }
};

const testTokenValidation = async (tenantSlug, token) => {
  try {
    log(`Testing token validation for tenant: ${tenantSlug}`);
    
    // Test with a simple API call that requires authentication
    const response = await axios.get(`${BASE_URL}/api/tenant/${tenantSlug}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      addTestResult(`Token Validation - ${tenantSlug}`, true);
      return true;
    } else {
      addTestResult(`Token Validation - ${tenantSlug}`, false, 'Token validation failed');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      addTestResult(`Token Validation - ${tenantSlug}`, false, 'Token is invalid or expired');
    } else {
      addTestResult(`Token Validation - ${tenantSlug}`, false, error.message);
    }
    return false;
  }
};

const testLogout = async (tenantSlug, token) => {
  try {
    log(`Testing logout for tenant: ${tenantSlug}`);
    
    const response = await axios.post(`${BASE_URL}/api/tenant/${tenantSlug}/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      addTestResult(`Logout - ${tenantSlug}`, true);
      return true;
    } else {
      addTestResult(`Logout - ${tenantSlug}`, false, 'Logout failed');
      return false;
    }
  } catch (error) {
    addTestResult(`Logout - ${tenantSlug}`, false, error.response?.data?.message || error.message);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  log('🚀 Starting comprehensive tenant authentication and permission tests...');
  
  for (const tenant of TEST_TENANTS) {
    log(`\n📋 Testing tenant: ${tenant.slug}`);
    
    // Test 1: Tenant info
    const tenantInfo = await testTenantInfo(tenant.slug);
    if (!tenantInfo) continue;
    
    // Test 2: Admin login
    const adminAuth = await testTenantLogin(tenant.slug, tenant.admin);
    if (!adminAuth) continue;
    
    // Test 3: Admin user profile
    const adminProfile = await testUserProfile(tenant.slug, adminAuth.token);
    if (!adminProfile) continue;
    
    // Test 4: Admin role permissions
    await testRolePermissions(adminProfile);
    
    // Test 5: Admin dashboard access
    await testDashboardAccess(tenant.slug, adminAuth.token);
    
    // Test 6: Token validation
    await testTokenValidation(tenant.slug, adminAuth.token);
    
    // Test 7: Logout
    await testLogout(tenant.slug, adminAuth.token);
    
    // Test 8: User login (if available)
    if (tenant.user) {
      log(`\n📋 Testing user login for: ${tenant.slug}`);
      
      const userAuth = await testTenantLogin(tenant.slug, tenant.user);
      if (userAuth) {
        const userProfile = await testUserProfile(tenant.slug, userAuth.token);
        if (userProfile) {
          await testRolePermissions(userProfile);
          await testDashboardAccess(tenant.slug, userAuth.token);
          await testLogout(tenant.slug, userAuth.token);
        }
      }
    }
  }
  
  // Generate test report
  log('\n📊 Generating test report...');
  
  const report = {
    ...testResults,
    summary: {
      ...testResults.summary,
      successRate: `${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2)}%`
    }
  };
  
  // Save report to file
  const reportFile = `tenant-test-results-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  // Print summary
  log('\n📈 Test Summary:');
  log(`Total Tests: ${testResults.summary.total}`);
  log(`Passed: ${testResults.summary.passed}`);
  log(`Failed: ${testResults.summary.failed}`);
  log(`Success Rate: ${report.summary.successRate}`);
  
  if (testResults.summary.errors.length > 0) {
    log('\n❌ Errors:');
    testResults.summary.errors.forEach((error, index) => {
      log(`${index + 1}. ${error}`);
    });
  }
  
  log(`\n📄 Detailed report saved to: ${reportFile}`);
  
  // Exit with appropriate code
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
};

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'error');
  process.exit(1);
});

// Run tests
runTests().catch(error => {
  log(`Test runner failed: ${error.message}`, 'error');
  process.exit(1);
});
