const fs = require('fs');
const path = require('path');

// Test ID mappings for tenant components
const tenantTestIds = {
  'src/app/superadmin/tenants/page.tsx': {
    'main': 'data-testid="tenants-page"',
    'search-input': 'data-testid="tenant-search-input"',
    'filter-button': 'data-testid="tenant-filter-button"',
    'create-button': 'data-testid="tenant-create-button"',
    'tenant-table': 'data-testid="tenant-table"',
    'pagination': 'data-testid="tenant-pagination"'
  },
  'src/components/superadmin/TenantFilters.tsx': {
    'search-input': 'data-testid="tenant-search-input"',
    'clear-button': 'data-testid="tenant-clear-search"',
    'filter-toggle': 'data-testid="tenant-filter-toggle"',
    'status-filter': 'data-testid="tenant-status-filter"',
    'region-filter': 'data-testid="tenant-region-filter"',
    'sort-by': 'data-testid="tenant-sort-by"',
    'sort-order': 'data-testid="tenant-sort-order"',
    'clear-filters': 'data-testid="tenant-clear-filters"'
  },
  'src/components/superadmin/TenantsTable.tsx': {
    'table': 'data-testid="tenant-table"',
    'table-header': 'data-testid="tenant-table-header"',
    'table-body': 'data-testid="tenant-table-body"',
    'tenant-row': 'data-testid="tenant-row"',
    'tenant-name': 'data-testid="tenant-name"',
    'tenant-status': 'data-testid="tenant-status"',
    'tenant-actions': 'data-testid="tenant-actions"',
    'edit-button': 'data-testid="tenant-edit-button"',
    'delete-button': 'data-testid="tenant-delete-button"',
    'view-button': 'data-testid="tenant-view-button"'
  },
  'src/app/superadmin/tenants/[id]/page.tsx': {
    'detail-page': 'data-testid="tenant-detail-page"',
    'tenant-info': 'data-testid="tenant-info"',
    'user-count': 'data-testid="tenant-user-count"',
    'status-badge': 'data-testid="tenant-status-badge"',
    'edit-link': 'data-testid="tenant-edit-link"',
    'back-button': 'data-testid="tenant-back-button"'
  },
  'src/app/superadmin/tenants/create/page.tsx': {
    'create-form': 'data-testid="tenant-create-form"',
    'name-input': 'data-testid="tenant-name-input"',
    'subdomain-input': 'data-testid="tenant-subdomain-input"',
    'domain-input': 'data-testid="tenant-domain-input"',
    'status-select': 'data-testid="tenant-status-select"',
    'region-select': 'data-testid="tenant-region-select"',
    'submit-button': 'data-testid="tenant-submit-button"',
    'cancel-button': 'data-testid="tenant-cancel-button"'
  },
  'src/app/superadmin/tenants/[id]/edit/page.tsx': {
    'edit-form': 'data-testid="tenant-edit-form"',
    'name-input': 'data-testid="tenant-name-input"',
    'subdomain-input': 'data-testid="tenant-subdomain-input"',
    'domain-input': 'data-testid="tenant-domain-input"',
    'status-select': 'data-testid="tenant-status-select"',
    'region-select': 'data-testid="tenant-region-select"',
    'submit-button': 'data-testid="tenant-submit-button"',
    'cancel-button': 'data-testid="tenant-cancel-button"'
  }
};

function addTestIdsToFile(filePath, mappings) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const [element, testId] of Object.entries(mappings)) {
      // Add test IDs to different element types
      const patterns = [
        // Input elements
        { regex: /(<input[^>]*)(\/?>)/g, replacement: `$1 ${testId}$2` },
        // Button elements
        { regex: /(<button[^>]*)(\/?>)/g, replacement: `$1 ${testId}$2` },
        // Select elements
        { regex: /(<select[^>]*)(\/?>)/g, replacement: `$1 ${testId}$2` },
        // Table elements
        { regex: /(<table[^>]*)(\/?>)/g, replacement: `$1 ${testId}$2` },
        { regex: /(<thead[^>]*)(\/?>)/g, replacement: `$1 ${testId}$2` },
        { regex: /(<tbody[^>]*)(\/?>)/g, replacement: `$1 ${testId}$2` },
        { regex: /(<tr[^>]*)(\/?>)/g, replacement: `$1 ${testId}$2` },
        // Form elements
        { regex: /(<form[^>]*)(\/?>)/g, replacement: `$1 ${testId}$2` },
        // Div elements (for containers)
        { regex: /(<div[^>]*)(\/?>)/g, replacement: `$1 ${testId}$2` },
        // Link elements
        { regex: /(<a[^>]*)(\/?>)/g, replacement: `$1 ${testId}$2` }
      ];

      for (const pattern of patterns) {
        if (pattern.regex.test(content)) {
          content = content.replace(pattern.regex, pattern.replacement);
          modified = true;
          break;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Added test IDs to: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️ No changes needed for: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function addTestIdsToAllTenantFiles() {
  console.log('🔧 Adding test IDs to tenant components...\n');

  let totalFiles = 0;
  let modifiedFiles = 0;

  for (const [filePath, mappings] of Object.entries(tenantTestIds)) {
    totalFiles++;
    if (addTestIdsToFile(filePath, mappings)) {
      modifiedFiles++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`Total files processed: ${totalFiles}`);
  console.log(`Files modified: ${modifiedFiles}`);
  console.log(`Files unchanged: ${totalFiles - modifiedFiles}`);

  if (modifiedFiles > 0) {
    console.log('\n✅ Test IDs added successfully!');
    console.log('💡 You can now run the comprehensive tenant tests with better element selection.');
  } else {
    console.log('\nℹ️ No files were modified. Test IDs may already be present.');
  }
}

// Run the script
if (require.main === module) {
  addTestIdsToAllTenantFiles();
}

module.exports = {
  addTestIdsToAllTenantFiles,
  tenantTestIds
}; 