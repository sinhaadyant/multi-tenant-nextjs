#!/usr/bin/env node

/**
 * Script to clear expired tokens from browser storage
 * This can be run in the browser console to force a re-login
 */

console.log('🧹 Clearing expired tokens...');

// Clear all possible token locations
try {
  // Clear localStorage
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('tenant_auth_token');
  localStorage.removeItem('superadmin_token');
  localStorage.removeItem('persist:superadmin-root');
  localStorage.removeItem('persist:tenant-root');
  
  // Clear sessionStorage
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('tenant_auth_token');
  
  // Clear cookies
  document.cookie = 'superadmin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  document.cookie = 'tenant_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  
  console.log('✅ All tokens cleared successfully!');
  console.log('🔄 Please refresh the page and log in again.');
  
  // Optionally redirect to login page
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/superadmin')) {
    window.location.href = '/superadmin/login';
  } else if (currentPath.includes('/tenant') || currentPath.split('/').length > 1) {
    const tenantSlug = currentPath.split('/')[1];
    if (tenantSlug && tenantSlug !== 'tenant') {
      window.location.href = `/${tenantSlug}/login`;
    } else {
      window.location.href = '/login';
    }
  } else {
    window.location.href = '/login';
  }
  
} catch (error) {
  console.error('❌ Error clearing tokens:', error);
  console.log('🔄 Please manually clear your browser storage and log in again.');
}

// Also provide a function that can be called later
window.clearExpiredTokens = function() {
  console.log('🧹 Clearing expired tokens...');
  
  try {
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear specific cookies
    document.cookie = 'superadmin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'tenant_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    console.log('✅ All tokens cleared successfully!');
    console.log('🔄 Please refresh the page and log in again.');
    
    window.location.reload();
  } catch (error) {
    console.error('❌ Error clearing tokens:', error);
  }
};

console.log('💡 You can also call window.clearExpiredTokens() anytime to clear tokens.');
