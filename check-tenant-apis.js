const fs = require('fs');
const path = require('path');

// Check tenant API structure
const tenantApiPath = path.join(__dirname, 'src/app/api/tenant');

function checkApiStructure() {
  console.log('🔍 Checking Tenant API Structure...\n');

  // Check main tenant auth endpoints
  const authEndpoints = [
    'auth/login',
    'auth/forgot-password',
    'auth/reset-password',
    'auth/refresh',
    'auth/verify-reset-token'
  ];

  console.log('📁 Auth Endpoints:');
  authEndpoints.forEach(endpoint => {
    const fullPath = path.join(tenantApiPath, endpoint, 'route.ts');
    const exists = fs.existsSync(fullPath);
    console.log(`  ${exists ? '✅' : '❌'} ${endpoint}/route.ts`);
  });

  // Check tenant-specific endpoints
  const tenantSpecificEndpoints = [
    '[tenantSlug]/info',
    '[tenantSlug]/me',
    '[tenantSlug]/dashboard',
    '[tenantSlug]/users',
    '[tenantSlug]/roles',
    '[tenantSlug]/notifications',
    '[tenantSlug]/audit-logs',
    '[tenantSlug]/reports',
    '[tenantSlug]/settings',
    '[tenantSlug]/profile',
    '[tenantSlug]/logout',
    '[tenantSlug]/modules',
    '[tenantSlug]/content',
    '[tenantSlug]/support',
    '[tenantSlug]/permissions'
  ];

  console.log('\n📁 Tenant-Specific Endpoints:');
  tenantSpecificEndpoints.forEach(endpoint => {
    const fullPath = path.join(tenantApiPath, endpoint, 'route.ts');
    const exists = fs.existsSync(fullPath);
    console.log(`  ${exists ? '✅' : '❌'} ${endpoint}/route.ts`);
  });

  // Check for missing critical endpoints
  const criticalEndpoints = [
    'auth/login',
    'auth/forgot-password',
    'auth/reset-password',
    '[tenantSlug]/info',
    '[tenantSlug]/me',
    '[tenantSlug]/dashboard',
    '[tenantSlug]/users'
  ];

  console.log('\n🚨 Critical Endpoints Status:');
  const missingCritical = criticalEndpoints.filter(endpoint => {
    const fullPath = path.join(tenantApiPath, endpoint, 'route.ts');
    return !fs.existsSync(fullPath);
  });

  if (missingCritical.length === 0) {
    console.log('✅ All critical endpoints exist');
  } else {
    console.log('❌ Missing critical endpoints:');
    missingCritical.forEach(endpoint => {
      console.log(`  - ${endpoint}/route.ts`);
    });
  }

  // Check middleware usage
  console.log('\n🔧 Middleware Usage Check:');
  const endpointsWithMiddleware = [
    '[tenantSlug]/users',
    '[tenantSlug]/dashboard',
    '[tenantSlug]/roles',
    '[tenantSlug]/notifications'
  ];

  endpointsWithMiddleware.forEach(endpoint => {
    const fullPath = path.join(tenantApiPath, endpoint, 'route.ts');
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasMiddleware = content.includes('withTenantAuth') || content.includes('withAuth');
      console.log(`  ${hasMiddleware ? '✅' : '❌'} ${endpoint} - ${hasMiddleware ? 'Has middleware' : 'Missing middleware'}`);
    }
  });

  console.log('\n📋 Summary:');
  console.log('- Auth endpoints should be at /api/tenant/auth/*');
  console.log('- Tenant-specific endpoints should be at /api/tenant/[tenantSlug]/*');
  console.log('- All endpoints should use proper authentication middleware');
  console.log('- Login API expects tenantSlug in request body');
}

checkApiStructure();
