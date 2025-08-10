#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const API_DIR = 'src/app/api';
const BACKUP_DIR = 'backup/api';

// Patterns to replace
const PATTERNS = {
  // Import patterns
  imports: {
    old: /import\s*{\s*verifyToken\s*}\s*from\s*['"]@\/lib\/jwt['"];?/g,
    new: `import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';`
  },
  
  // Function signature patterns
  functionSignature: {
    old: /export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=\s*asyncHandler\s*\(\s*async\s*\(\s*req:\s*NextRequest/g,
    new: (method) => `export const ${method} = withAuth(async (req: AuthenticatedRequest`
  },
  
  // Manual token verification patterns
  tokenVerification: {
    old: /\/\/\s*Get authorization header[\s\S]*?const\s+decoded\s*=\s*verifyToken\(token\)[\s\S]*?if\s*\(\s*!decoded[\s\S]*?return\s+createErrorResponse\('Invalid token',\s*401\)[\s\S]*?}/g,
    new: `// User is already authenticated and verified by middleware
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;`
  },
  
  // Replace decoded.id with userId
  userId: {
    old: /decoded\.id/g,
    new: 'userId'
  },
  
  // Replace decoded.tenantId with tenantId
  tenantId: {
    old: /decoded\.tenantId/g,
    new: 'tenantId'
  }
};

// Helper function to determine auth type based on route path
function getAuthType(routePath) {
  if (routePath.includes('/superadmin/')) {
    return 'withSuperAdminAuth';
  } else if (routePath.includes('/[tenantSlug]/')) {
    return 'withTenantAuth';
  } else if (routePath.includes('/auth/')) {
    return 'withAuth'; // For auth routes, use basic auth
  } else {
    return 'withAuth'; // Default to basic auth
  }
}

// Helper function to backup file
function backupFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  const backupPath = path.join(BACKUP_DIR, relativePath);
  
  // Create backup directory
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Copy file to backup
  fs.copyFileSync(filePath, backupPath);
  console.log(`✅ Backed up: ${relativePath}`);
}

// Helper function to update file content
function updateFileContent(content, filePath) {
  let updatedContent = content;
  const authType = getAuthType(filePath);
  
  // Update imports
  updatedContent = updatedContent.replace(PATTERNS.imports.old, PATTERNS.imports.new);
  
  // Update function signatures
  ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
    const methodPattern = new RegExp(`export\\s+const\\s+${method}\\s*=\\s*asyncHandler\\s*\\(\\s*async\\s*\\(\\s*req:\\s*NextRequest`, 'g');
    updatedContent = updatedContent.replace(methodPattern, `export const ${method} = ${authType}(async (req: AuthenticatedRequest`);
  });
  
  // Update token verification
  updatedContent = updatedContent.replace(PATTERNS.tokenVerification.old, PATTERNS.tokenVerification.new);
  
  // Update user ID references
  updatedContent = updatedContent.replace(PATTERNS.userId.old, PATTERNS.userId.new);
  updatedContent = updatedContent.replace(PATTERNS.tenantId.old, PATTERNS.tenantId.new);
  
  return updatedContent;
}

// Main function to process API routes
function updateApiRoutes() {
  console.log('🔄 Starting API route authentication update...\n');
  
  // Create backup directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  // Find all route.ts files
  const routeFiles = [];
  
  function findRouteFiles(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findRouteFiles(fullPath);
      } else if (item === 'route.ts') {
        routeFiles.push(fullPath);
      }
    }
  }
  
  findRouteFiles(API_DIR);
  
  console.log(`📁 Found ${routeFiles.length} API route files\n`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  
  for (const filePath of routeFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if file needs updating
      const needsUpdate = content.includes('verifyToken') || 
                         content.includes('req: NextRequest') ||
                         content.includes('decoded.id') ||
                         content.includes('decoded.tenantId');
      
      if (!needsUpdate) {
        console.log(`⏭️  Skipped: ${path.relative(process.cwd(), filePath)} (no changes needed)`);
        skippedCount++;
        continue;
      }
      
      // Backup file
      backupFile(filePath);
      
      // Update content
      const updatedContent = updateFileContent(content, filePath);
      
      // Write updated content
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      
      console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
      updatedCount++;
      
    } catch (error) {
      console.error(`❌ Error updating ${filePath}:`, error.message);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Updated: ${updatedCount} files`);
  console.log(`   ⏭️  Skipped: ${skippedCount} files`);
  console.log(`   📁 Backups: ${BACKUP_DIR}/`);
  
  console.log(`\n🔧 Next steps:`);
  console.log(`   1. Review the updated files`);
  console.log(`   2. Test the authentication flows`);
  console.log(`   3. Check for any manual adjustments needed`);
  console.log(`   4. Run your application and test API calls`);
}

// Run the script
if (require.main === module) {
  updateApiRoutes();
}

module.exports = { updateApiRoutes }; 