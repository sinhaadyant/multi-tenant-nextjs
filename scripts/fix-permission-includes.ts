import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Files that need to be updated
const filesToUpdate = [
  'src/app/api/tenant/[tenantSlug]/roles/route.ts',
  'src/app/api/tenant/[tenantSlug]/roles/[id]/route.ts',
  'src/app/api/tenant/[tenantSlug]/roles/[id]/clone/route.ts',
  'src/app/api/tenant/[tenantSlug]/roles/[id]/permissions/route.ts',
  'src/app/api/tenant/[tenantSlug]/roles/assign/route.ts',
  'src/app/api/tenant/[tenantSlug]/modules/route.ts',
  'src/app/api/superadmin/roles/[id]/route.ts',
  'src/app/api/superadmin/roles/export/route.ts',
  'src/app/api/superadmin/roles/[id]/status/route.ts',
  'src/app/api/superadmin/permissions/[id]/route.ts',
];

function updateFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Replace old permission include structure
  const oldPattern = /permissions:\s*{\s*include:\s*{\s*permission:\s*true\s*}\s*}/g;
  const newPattern = `permissions: {
                  include: {
                    module: true
                  }
                }`;

  if (oldPattern.test(content)) {
    content = content.replace(oldPattern, newPattern);
    updated = true;
    console.log(`✅ Updated ${filePath}`);
  }

  // Replace simple permissions: true
  const simpleOldPattern = /permissions:\s*true/g;
  const simpleNewPattern = `permissions: {
                  include: {
                    module: true
                  }
                }`;

  if (simpleOldPattern.test(content)) {
    content = content.replace(simpleOldPattern, simpleNewPattern);
    updated = true;
    console.log(`✅ Updated ${filePath} (simple pattern)`);
  }

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
  } else {
    console.log(`ℹ️  No changes needed for ${filePath}`);
  }
}

console.log('🔧 Fixing permission include issues...\n');

filesToUpdate.forEach(file => {
  updateFile(file);
});

console.log('\n✅ Permission include fixes completed!');
console.log('\n📝 Note: You may need to update the code that uses these permissions');
console.log('   since the structure has changed from nested permission objects to direct fields.');
