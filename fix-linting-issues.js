#!/usr/bin/env node

/**
 * Script to fix common linting issues in the codebase
 * This script addresses the most critical issues that could affect functionality
 */

const fs = require('fs');
const path = require('path');

// Common fixes to apply
const fixes = [
  // Fix unused imports in TenantDashboardClient.tsx
  {
    file: 'src/components/tenant/TenantDashboardClient.tsx',
    find: [
      'Bell,',
      'LifeBuoy,',
      'Eye,',
      'Edit,',
      'Trash2,',
      'Download,',
      'Upload,',
      'RefreshCw,'
    ],
    replace: ''
  },
  
  // Fix unused variables in TenantDashboardClient.tsx
  {
    file: 'src/components/tenant/TenantDashboardClient.tsx',
    find: [
      'const dashboardPermissions = useDataPermissions(\'dashboard\');',
      'const notificationsPermissions = useDataPermissions(\'notifications\');',
      'const supportPermissions = useDataPermissions(\'support\');',
      'const settingsPermissions = useDataPermissions(\'settings\');'
    ],
    replace: ''
  },
  
  // Fix unused imports in TenantDashboard.tsx
  {
    file: 'src/components/tenant/TenantDashboard.tsx',
    find: [
      'Clock,',
      'TrendingUp,',
      'AlertCircle,',
      'Shield,',
      'Building2'
    ],
    replace: ''
  },
  
  // Fix unused imports in TenantDashboard.tsx
  {
    file: 'src/components/tenant/TenantDashboard.tsx',
    find: [
      'import { useTenantCharts } from \'@/hooks/useTenantCharts\';',
      'import { RoleDistributionChart } from \'./charts/RoleDistributionChart\';',
      'import { UserActivityChart } from \'./charts/UserActivityChart\';',
      'import { LoginTrendsChart } from \'./charts/LoginTrendsChart\';'
    ],
    replace: ''
  },
  
  // Fix unused variables in TenantDashboard.tsx
  {
    file: 'src/components/tenant/TenantDashboard.tsx',
    find: [
      'const { data: chartData, isLoading: chartsLoading } = useTenantCharts(tenantSlug);',
      'const { error } = useTenantAuditLogs();'
    ],
    replace: ''
  },
  
  // Fix unused imports in TenantSidebar.tsx
  {
    file: 'src/layout/TenantSidebar.tsx',
    find: [
      'LayoutDashboard,',
      'Database,',
      'HardDrive,',
      'Mail,',
      'Key,',
      'RefreshCw,',
      'UserPlus,',
      'LogIn,'
    ],
    replace: ''
  },
  
  // Fix unused imports in useReduxAuth.ts
  {
    file: 'src/hooks/useReduxAuth.ts',
    find: [
      'setTenantLogout,',
      'setTenantPermissions,',
      'selectPermissionsLoading,'
    ],
    replace: ''
  },
  
  // Fix unused variables in useReduxAuth.ts
  {
    file: 'src/hooks/useReduxAuth.ts',
    find: [
      'const tenantAuth = useSelector(selectTenantAuth);'
    ],
    replace: ''
  }
];

function applyFixes() {
  console.log('🔧 Applying linting fixes...');
  
  fixes.forEach((fix, index) => {
    const filePath = path.join(process.cwd(), fix.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${fix.file}`);
      return;
    }
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      if (Array.isArray(fix.find)) {
        fix.find.forEach((findStr, i) => {
          if (content.includes(findStr)) {
            content = content.replace(findStr, fix.replace || '');
            modified = true;
            console.log(`✅ Fixed: ${fix.file} - removed unused import/variable`);
          }
        });
      } else {
        if (content.includes(fix.find)) {
          content = content.replace(fix.find, fix.replace || '');
          modified = true;
          console.log(`✅ Fixed: ${fix.file}`);
        }
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
    } catch (error) {
      console.error(`❌ Error fixing ${fix.file}:`, error.message);
    }
  });
  
  console.log('🎉 Linting fixes applied!');
}

// Run the fixes
applyFixes();
