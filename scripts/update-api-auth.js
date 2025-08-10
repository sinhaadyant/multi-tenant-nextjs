#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration for different route types
const routeConfigs = {
  // Tenant routes that require tenant authentication
  tenantAuth: [
    'src/app/api/tenant/[tenantSlug]/permissions/current-user/route.ts',
    'src/app/api/tenant/[tenantSlug]/dashboard/stats/route.ts',
    'src/app/api/tenant/[tenantSlug]/dashboard/charts/route.ts',
    'src/app/api/tenant/[tenantSlug]/users/route.ts',
    'src/app/api/tenant/[tenantSlug]/users/[id]/route.ts',
    'src/app/api/tenant/[tenantSlug]/roles/route.ts',
    'src/app/api/tenant/[tenantSlug]/roles/[id]/route.ts',
    'src/app/api/tenant/[tenantSlug]/roles/assign/route.ts',
    'src/app/api/tenant/[tenantSlug]/audit-logs/route.ts',
    'src/app/api/tenant/[tenantSlug]/audit-logs/export/route.ts',
    'src/app/api/tenant/[tenantSlug]/notifications/route.ts',
    'src/app/api/tenant/[tenantSlug]/support/route.ts',
    'src/app/api/tenant/[tenantSlug]/profile/route.ts',
    'src/app/api/tenant/[tenantSlug]/info/route.ts',
    'src/app/api/tenant/[tenantSlug]/modules/route.ts'
  ],
  
  // SuperAdmin routes that require superadmin authentication
  superAdminAuth: [
    'src/app/api/superadmin/dashboard/route.ts',
    'src/app/api/superadmin/tenants/route.ts',
    'src/app/api/superadmin/tenants/[id]/route.ts',
    'src/app/api/superadmin/users/route.ts',
    'src/app/api/superadmin/users/[id]/route.ts',
    'src/app/api/superadmin/audit/route.ts',
    'src/app/api/superadmin/reports/route.ts',
    'src/app/api/superadmin/backup/route.ts',
    'src/app/api/superadmin/import/route.ts',
    'src/app/api/superadmin/notifications/route.ts',
    'src/app/api/superadmin/support/route.ts',
    'src/app/api/superadmin/profile/route.ts'
  ],
  
  // Public routes that don't require authentication
  public: [
    'src/app/api/tenant/auth/login/route.ts',
    'src/app/api/tenant/auth/forgot-password/route.ts',
    'src/app/api/tenant/auth/reset-password/route.ts',
    'src/app/api/superadmin/auth/login/route.ts',
    'src/app/api/superadmin/auth/forgot-password/route.ts',
    'src/app/api/superadmin/auth/reset-password/route.ts',
    'src/app/api/auth/verify/route.ts',
    'src/app/api/auth/logout/route.ts',
    'src/app/api/auth/refresh/route.ts'
  ]
};

// Templates for different authentication types
const templates = {
  tenantAuth: {
    imports: `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';`,
    
    handler: `export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    // User is already authenticated and verified by middleware
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Your logic here...
    
    return createSuccessResponse(data, 'Success message');
  } catch (error: any) {
    console.error('Error:', error);
    return createErrorResponse('Error message', 500);
  }
});`
  },
  
  superAdminAuth: {
    imports: `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { withSuperAdminAuth, AuthenticatedRequest } from '@/lib/authMiddleware';`,
    
    handler: `export const GET = withSuperAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    // User is already authenticated and verified by middleware
    const userId = req.user!.id;

    // Your logic here...
    
    return createSuccessResponse(data, 'Success message');
  } catch (error: any) {
    console.error('Error:', error);
    return createErrorResponse('Error message', 500);
  }
});`
  },
  
  public: {
    imports: `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { withOptionalAuth, AuthenticatedRequest } from '@/lib/authMiddleware';`,
    
    handler: `export const GET = withOptionalAuth(async (req: AuthenticatedRequest) => {
  try {
    // Optional authentication - req.user may be null
    const userId = req.user?.id;

    // Your logic here...
    
    return createSuccessResponse(data, 'Success message');
  } catch (error: any) {
    console.error('Error:', error);
    return createErrorResponse('Error message', 500);
  }
});`
  }
};

// Function to update a single route file
function updateRouteFile(filePath, authType) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const template = templates[authType];
  
  if (!template) {
    console.log(`⚠️  Unknown auth type: ${authType}`);
    return false;
  }

  // Check if already updated
  if (content.includes('withTenantAuth') || content.includes('withSuperAdminAuth') || content.includes('withOptionalAuth')) {
    console.log(`✅ Already updated: ${filePath}`);
    return true;
  }

  // Create backup
  const backupPath = filePath + '.backup';
  fs.writeFileSync(backupPath, content);
  console.log(`📦 Backup created: ${backupPath}`);

  // Update the file
  let updatedContent = content;
  
  // Replace imports
  updatedContent = updatedContent.replace(
    /import.*from.*['"]@\/lib\/jwt['"];?\n?/g,
    ''
  );
  
  updatedContent = updatedContent.replace(
    /import.*NextRequest.*NextResponse.*from.*['"]next\/server['"];?\n?/g,
    template.imports + '\n'
  );

  // Replace manual auth with middleware
  updatedContent = updatedContent.replace(
    /export const GET = asyncHandler\(async \(req: NextRequest.*?\) => \{[\s\S]*?const authHeader = req\.headers\.get\('authorization'\);[\s\S]*?if \(!authHeader \|\| !authHeader\.startsWith\('Bearer '\)\) \{[\s\S]*?return createErrorResponse\('Unauthorized.*?401\);[\s\S]*?\}/g,
    template.handler
  );

  // Write updated content
  fs.writeFileSync(filePath, updatedContent);
  console.log(`✅ Updated: ${filePath}`);
  
  return true;
}

// Main function
function main() {
  console.log('🚀 Starting API Authentication Update...\n');

  let updatedCount = 0;
  let totalCount = 0;

  // Update tenant routes
  console.log('📋 Updating Tenant Routes...');
  routeConfigs.tenantAuth.forEach(filePath => {
    totalCount++;
    if (updateRouteFile(filePath, 'tenantAuth')) {
      updatedCount++;
    }
  });

  // Update superadmin routes
  console.log('\n📋 Updating SuperAdmin Routes...');
  routeConfigs.superAdminAuth.forEach(filePath => {
    totalCount++;
    if (updateRouteFile(filePath, 'superAdminAuth')) {
      updatedCount++;
    }
  });

  // Update public routes
  console.log('\n📋 Updating Public Routes...');
  routeConfigs.public.forEach(filePath => {
    totalCount++;
    if (updateRouteFile(filePath, 'public')) {
      updatedCount++;
    }
  });

  console.log(`\n🎉 Update Complete!`);
  console.log(`📊 Updated: ${updatedCount}/${totalCount} files`);
  console.log(`\n📝 Next Steps:`);
  console.log(`1. Review the updated files`);
  console.log(`2. Test the authentication flows`);
  console.log(`3. Update any custom logic in the route handlers`);
  console.log(`4. Remove .backup files after testing`);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { updateRouteFile, routeConfigs, templates }; 