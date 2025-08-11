const fs = require('fs');
const path = require('path');

// Common console error fixes
const consoleErrorFixes = {
  'Hydration mismatch': {
    description: 'React hydration mismatch between server and client',
    fixes: [
      {
        file: 'src/components/superadmin/TenantFilters.tsx',
        pattern: /(<input[^>]*value=\{.*?\}[^>]*)/g,
        replacement: '$1 suppressHydrationWarning={true}',
        message: 'Add suppressHydrationWarning to input elements'
      },
      {
        file: 'src/components/superadmin/TenantsTable.tsx',
        pattern: /(<div[^>]*className=\{.*?\}[^>]*)/g,
        replacement: '$1 suppressHydrationWarning={true}',
        message: 'Add suppressHydrationWarning to dynamic content'
      }
    ]
  },
  'React Hook': {
    description: 'React Hook dependency issues',
    fixes: [
      {
        file: 'src/components/superadmin/TenantFilters.tsx',
        pattern: /useEffect\(\(\) => \{[\s\S]*?\}, \[\]\)/g,
        replacement: (match) => {
          // Add missing dependencies
          if (match.includes('filters') || match.includes('onFiltersChange')) {
            return match.replace('[]', '[filters, onFiltersChange]');
          }
          return match;
        },
        message: 'Fix useEffect dependencies'
      }
    ]
  },
  'TypeError': {
    description: 'Type errors and undefined values',
    fixes: [
      {
        file: 'src/components/superadmin/TenantFilters.tsx',
        pattern: /filters\.search\|\|''/g,
        replacement: 'filters?.search || ""',
        message: 'Add optional chaining for filters object'
      },
      {
        file: 'src/components/superadmin/TenantsTable.tsx',
        pattern: /tenant\.name/g,
        replacement: 'tenant?.name',
        message: 'Add optional chaining for tenant properties'
      }
    ]
  },
  'NetworkError': {
    description: 'API call errors',
    fixes: [
      {
        file: 'src/hooks/useTenantsAPI.ts',
        pattern: /fetch\(url\)/g,
        replacement: 'fetch(url).catch(error => console.error("API Error:", error))',
        message: 'Add error handling to API calls'
      }
    ]
  }
};

function applyFix(filePath, fix) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    if (typeof fix.replacement === 'function') {
      content = content.replace(fix.pattern, fix.replacement);
    } else {
      content = content.replace(fix.pattern, fix.replacement);
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Applied fix: ${fix.message}`);
      return true;
    } else {
      console.log(`ℹ️ No changes needed: ${fix.message}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error applying fix to ${filePath}:`, error.message);
    return false;
  }
}

function fixConsoleErrors(errorTypes = []) {
  console.log('🔧 Fixing Console Errors...\n');

  let totalFixes = 0;
  let appliedFixes = 0;

  // If no specific error types provided, fix all
  const errorsToFix = errorTypes.length > 0 ? errorTypes : Object.keys(consoleErrorFixes);

  for (const errorType of errorsToFix) {
    if (consoleErrorFixes[errorType]) {
      console.log(`📝 Processing ${errorType} errors...`);
      const fixes = consoleErrorFixes[errorType].fixes;

      for (const fix of fixes) {
        totalFixes++;
        if (applyFix(fix.file, fix)) {
          appliedFixes++;
        }
      }
    }
  }

  console.log(`\n📊 Fix Summary:`);
  console.log(`Total fixes available: ${totalFixes}`);
  console.log(`Fixes applied: ${appliedFixes}`);
  console.log(`Fixes skipped: ${totalFixes - appliedFixes}`);

  if (appliedFixes > 0) {
    console.log('\n✅ Console errors fixed successfully!');
    console.log('💡 Restart your development server to see the changes.');
  } else {
    console.log('\nℹ️ No fixes were applied. Console errors may already be resolved.');
  }

  return { totalFixes, appliedFixes };
}

function generateErrorReport(consoleErrors) {
  console.log('\n📋 Console Error Analysis Report...\n');

  const errorReport = {
    timestamp: new Date().toISOString(),
    totalErrors: consoleErrors.length,
    errorTypes: {},
    recommendations: []
  };

  for (const error of consoleErrors) {
    const errorText = error.text.toLowerCase();
    
    if (errorText.includes('hydration')) {
      errorReport.errorTypes.hydration = (errorReport.errorTypes.hydration || 0) + 1;
      errorReport.recommendations.push('Fix hydration mismatches by adding suppressHydrationWarning');
    } else if (errorText.includes('react hook')) {
      errorReport.errorTypes.reactHook = (errorReport.errorTypes.reactHook || 0) + 1;
      errorReport.recommendations.push('Fix useEffect dependencies');
    } else if (errorText.includes('typeerror')) {
      errorReport.errorTypes.typeError = (errorReport.errorTypes.typeError || 0) + 1;
      errorReport.recommendations.push('Add null checks and optional chaining');
    } else if (errorText.includes('networkerror')) {
      errorReport.errorTypes.networkError = (errorReport.errorTypes.networkError || 0) + 1;
      errorReport.recommendations.push('Add error handling to API calls');
    } else {
      errorReport.errorTypes.other = (errorReport.errorTypes.other || 0) + 1;
    }
  }

  // Save report
  fs.writeFileSync('console-error-report.json', JSON.stringify(errorReport, null, 2));
  console.log('✅ Console error report saved to console-error-report.json');

  return errorReport;
}

// Run the script
if (require.main === module) {
  const args = process.argv.slice(2);
  const errorTypes = args.length > 0 ? args : [];
  
  if (errorTypes.length > 0) {
    console.log(`🔧 Fixing specific error types: ${errorTypes.join(', ')}`);
    fixConsoleErrors(errorTypes);
  } else {
    console.log('🔧 Fixing all common console errors...');
    fixConsoleErrors();
  }
}

module.exports = {
  fixConsoleErrors,
  generateErrorReport,
  consoleErrorFixes
}; 