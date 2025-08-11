// This script can be run in the browser console to check localStorage
console.log('🔍 Checking localStorage...');

// Check all localStorage keys
console.log('📋 All localStorage keys:', Object.keys(localStorage));

// Check for common token keys
const tokenKeys = ['auth_token', 'access_token', 'token', 'jwt', 'user_token', 'authToken'];
tokenKeys.forEach(key => {
  const value = localStorage.getItem(key);
  if (value) {
    console.log(`✅ Found ${key}:`, value.substring(0, 50) + '...');
  } else {
    console.log(`❌ No ${key} found`);
  }
});

// Check for user/permission data
const userKeys = ['user', 'userData', 'permissions', 'roles', 'auth'];
userKeys.forEach(key => {
  const value = localStorage.getItem(key);
  if (value) {
    try {
      const parsed = JSON.parse(value);
      console.log(`✅ Found ${key}:`, typeof parsed === 'object' ? Object.keys(parsed) : parsed);
    } catch (e) {
      console.log(`✅ Found ${key} (not JSON):`, value.substring(0, 100) + '...');
    }
  } else {
    console.log(`❌ No ${key} found`);
  }
});

// Check sessionStorage too
console.log('\n📋 All sessionStorage keys:', Object.keys(sessionStorage)); 