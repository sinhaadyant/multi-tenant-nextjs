import * as fs from 'fs';

// Files that need permission usage updates
const filesToUpdate = [
  'src/app/api/tenant/[tenantSlug]/roles/route.ts',
  'src/app/api/tenant/[tenantSlug]/roles/[id]/route.ts',
  'src/app/api/tenant/[tenantSlug]/roles/[id]/clone/route.ts',
  'src/app/api/tenant/[tenantSlug]/roles/[id]/permissions/route.ts',
  'src/app/api/tenant/[tenantSlug]/roles/assign/route.ts',
  'src/app/api/tenant/[tenantSlug]/modules/route.ts',
];

function updatePermissionUsage(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Replace old permission access patterns
  const patterns = [
    // Replace rp.permission.moduleKey with rp.moduleKey
    {
      old: /rp\.permission\.moduleKey/g,
      new: 'rp.moduleKey'
    },
    // Replace rp.permission.action with direct field checks
    {
      old: /rp\.permission\.action/g,
      new: 'action'
    },
    // Replace permission object access with direct field access
    {
      old: /const permission = rp\.permission;/g,
      new: '// Permission fields are now directly on rp'
    },
    // Replace permission.moduleKey with rp.moduleKey
    {
      old: /permission\.moduleKey/g,
      new: 'rp.moduleKey'
    },
    // Replace permission.action with action variable
    {
      old: /permission\.action/g,
      new: 'action'
    }
  ];

  patterns.forEach(pattern => {
    if (pattern.old.test(content)) {
      content = content.replace(pattern.old, pattern.new);
      updated = true;
      console.log(`✅ Updated ${filePath} - ${pattern.old}`);
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
  } else {
    console.log(`ℹ️  No permission usage changes needed for ${filePath}`);
  }
}

console.log('🔧 Fixing permission usage patterns...\n');

filesToUpdate.forEach(file => {
  updatePermissionUsage(file);
});

console.log('\n✅ Permission usage fixes completed!');
console.log('\n📝 Note: You may need to manually review some files');
console.log('   to ensure the permission logic is correctly updated.');
