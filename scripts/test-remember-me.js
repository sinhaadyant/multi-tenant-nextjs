/**
 * Test script for "Remember Me" functionality
 * Tests session duration and refresh token behavior for both tenant and superadmin users
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Test data
const testData = {
  superadmin: {
    email: 'superadmin@example.com',
    password: 'password123',
    tenantSlug: null
  },
  tenant: {
    email: 'user@example.com',
    password: 'password123',
    tenantSlug: 'test-tenant'
  }
};

async function testLogin(credentials, rememberMe = false) {
  console.log(`\n🔐 Testing login with rememberMe=${rememberMe}...`);
  
  const endpoint = credentials.tenantSlug 
    ? '/api/tenant/auth/login'
    : '/api/superadmin/auth/login';
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...credentials,
        rememberMe
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Login successful');
      console.log(`   Access token expires at: ${new Date(data.data.expiresAt).toLocaleString()}`);
      console.log(`   Refresh token expires at: ${new Date(data.data.refreshExpiresAt).toLocaleString()}`);
      
      // Calculate session duration
      const now = Date.now();
      const accessDuration = Math.round((data.data.expiresAt - now) / (1000 * 60)); // minutes
      const refreshDuration = Math.round((data.data.refreshExpiresAt - now) / (1000 * 60 * 60 * 24)); // days
      
      console.log(`   Access token duration: ${accessDuration} minutes`);
      console.log(`   Refresh token duration: ${refreshDuration} days`);
      
      // Verify expected duration based on rememberMe
      const expectedRefreshDays = rememberMe ? 30 : 7;
      if (Math.abs(refreshDuration - expectedRefreshDays) <= 1) {
        console.log(`✅ Refresh token duration is correct (${expectedRefreshDays} days)`);
      } else {
        console.log(`❌ Refresh token duration is incorrect. Expected ~${expectedRefreshDays} days, got ${refreshDuration} days`);
      }
      
      return data.data;
    } else {
      console.log('❌ Login failed:', data.message || data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return null;
  }
}

async function testRefreshToken(refreshToken, userType) {
  console.log(`\n🔄 Testing refresh token for ${userType}...`);
  
  const endpoint = userType === 'superadmin' 
    ? '/api/superadmin/auth/refresh'
    : '/api/tenant/auth/refresh';
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Token refresh successful');
      console.log(`   New access token expires at: ${new Date(data.data.expiresAt).toLocaleString()}`);
      console.log(`   New refresh token expires at: ${new Date(data.data.refreshExpiresAt).toLocaleString()}`);
      return data.data;
    } else {
      console.log('❌ Token refresh failed:', data.message || data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Token refresh error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Starting "Remember Me" functionality tests...\n');
  
  // Test superadmin login without "Remember Me"
  console.log('=== Testing SuperAdmin Login (No Remember Me) ===');
  const superadminSession = await testLogin(testData.superadmin, false);
  
  if (superadminSession) {
    await testRefreshToken(superadminSession.refreshToken, 'superadmin');
  }
  
  // Test superadmin login with "Remember Me"
  console.log('\n=== Testing SuperAdmin Login (With Remember Me) ===');
  const superadminRememberMe = await testLogin(testData.superadmin, true);
  
  if (superadminRememberMe) {
    await testRefreshToken(superadminRememberMe.refreshToken, 'superadmin');
  }
  
  // Test tenant login without "Remember Me"
  console.log('\n=== Testing Tenant Login (No Remember Me) ===');
  const tenantSession = await testLogin(testData.tenant, false);
  
  if (tenantSession) {
    await testRefreshToken(tenantSession.refreshToken, 'tenant');
  }
  
  // Test tenant login with "Remember Me"
  console.log('\n=== Testing Tenant Login (With Remember Me) ===');
  const tenantRememberMe = await testLogin(testData.tenant, true);
  
  if (tenantRememberMe) {
    await testRefreshToken(tenantRememberMe.refreshToken, 'tenant');
  }
  
  console.log('\n🎉 "Remember Me" functionality tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testLogin, testRefreshToken };
