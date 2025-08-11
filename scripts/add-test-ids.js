const fs = require('fs');
const path = require('path');

// Test ID mappings for components
const testIdMappings = {
  // Superadmin components
  'src/app/superadmin/dashboard/page.tsx': {
    'main': 'data-testid="dashboard"',
    '.stats-card': 'data-testid="stats-card"',
    'nav': 'data-testid="sidebar"',
    'header': 'data-testid="header"'
  },
  
  'src/app/superadmin/tenants/page.tsx': {
    'table': 'data-testid="tenants-table"',
    'button[href*="new"]': 'data-testid="create-tenant-btn"',
    '.filters': 'data-testid="tenant-filters"'
  },
  
  'src/app/superadmin/users/page.tsx': {
    'table': 'data-testid="users-table"',
    'input[type="search"]': 'data-testid="user-search"'
  },
  
  'src/app/superadmin/roles/page.tsx': {
    'table': 'data-testid="roles-table"',
    'button[href*="new"]': 'data-testid="create-role-btn"'
  },
  
  'src/app/superadmin/audit/page.tsx': {
    'table': 'data-testid="audit-table"'
  },
  
  'src/app/superadmin/reports/page.tsx': {
    'main': 'data-testid="reports-section"'
  },
  
  'src/app/superadmin/notifications/page.tsx': {
    'ul': 'data-testid="notifications-list"'
  },
  
  'src/app/superadmin/support/page.tsx': {
    'main': 'data-testid="support-section"'
  },
  
  'src/app/superadmin/profile/page.tsx': {
    'form': 'data-testid="settings-form"'
  },
  
  // Tenant components
  'src/app/[tenantSlug]/dashboard/page.tsx': {
    'main': 'data-testid="tenant-dashboard"',
    '.stats-card': 'data-testid="tenant-stats"',
    'nav': 'data-testid="tenant-sidebar"'
  },
  
  'src/app/[tenantSlug]/users/page.tsx': {
    'table': 'data-testid="tenant-users-table"'
  },
  
  'src/app/[tenantSlug]/roles/page.tsx': {
    'table': 'data-testid="tenant-roles-table"'
  },
  
  'src/app/[tenantSlug]/modules/page.tsx': {
    'ul': 'data-testid="modules-list"'
  },
  
  'src/app/[tenantSlug]/audit/page.tsx': {
    'table': 'data-testid="tenant-audit-table"'
  },
  
  'src/app/[tenantSlug]/support/page.tsx': {
    'main': 'data-testid="tenant-support-section"'
  }
};

// Navigation test IDs
const navigationTestIds = {
  'src/layout/SuperAdminSidebar.tsx': {
    'a[href*="/tenants"]': 'data-testid="nav-tenants"',
    'a[href*="/users"]': 'data-testid="nav-users"',
    'a[href*="/roles"]': 'data-testid="nav-roles"',
    'a[href*="/audit"]': 'data-testid="nav-audit"',
    'a[href*="/reports"]': 'data-testid="nav-reports"',
    'a[href*="/notifications"]': 'data-testid="nav-notifications"',
    'a[href*="/support"]': 'data-testid="nav-support"',
    'a[href*="/profile"]': 'data-testid="nav-settings"'
  },
  
  'src/layout/DynamicSidebar.tsx': {
    'a[href*="/users"]': 'data-testid="nav-tenant-users"',
    'a[href*="/roles"]': 'data-testid="nav-tenant-roles"',
    'a[href*="/modules"]': 'data-testid="nav-module-management"',
    'a[href*="/audit"]': 'data-testid="nav-tenant-audit"',
    'a[href*="/support"]': 'data-testid="nav-tenant-support"'
  }
};

function addTestIdsToFile(filePath, mappings) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const [selector, testId] of Object.entries(mappings)) {
    // Check if test ID already exists
    if (content.includes(testId)) {
      continue;
    }

    // Simple regex to add test IDs to elements
    const elementRegex = new RegExp(`(<[^>]*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*>)`, 'g');
    
    if (elementRegex.test(content)) {
      content = content.replace(elementRegex, (match) => {
        if (match.includes('data-testid')) {
          return match;
        }
        return match.replace('>', ` ${testId}>`);
      });
      modified = true;
      console.log(`✅ Added ${testId} to ${filePath}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    return true;
  }

  return false;
}

function addTestIdsToAllFiles() {
  console.log('🔧 Adding test IDs to components...');
  
  let totalModified = 0;
  
  // Add test IDs to main components
  for (const [filePath, mappings] of Object.entries(testIdMappings)) {
    if (addTestIdsToFile(filePath, mappings)) {
      totalModified++;
    }
  }
  
  // Add test IDs to navigation components
  for (const [filePath, mappings] of Object.entries(navigationTestIds)) {
    if (addTestIdsToFile(filePath, mappings)) {
      totalModified++;
    }
  }
  
  console.log(`✅ Modified ${totalModified} files with test IDs`);
}

// Run the script
if (require.main === module) {
  addTestIdsToAllFiles();
}

module.exports = { addTestIdsToAllFiles, addTestIdsToFile }; 