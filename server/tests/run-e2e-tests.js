#!/usr/bin/env node

/**
 * E2E Test Runner for Multi-Tenant Admin API
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(` ${message}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSection(message) {
  log('\n' + '-'.repeat(40), 'yellow');
  log(` ${message}`, 'yellow');
  log('-'.repeat(40), 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test configuration
const config = {
  testFiles: [
    'tests/e2e/auth.test.js',
    'tests/e2e/user-management.test.js',
    'tests/e2e/role-management.test.js',
    'tests/e2e/tenant-management.test.js',
    'tests/e2e/session-management.test.js',
    'tests/e2e/search.test.js',
    'tests/e2e/analytics.test.js',
    'tests/e2e/notification.test.js',
  ],
};

// Check prerequisites
function checkPrerequisites() {
  logSection('Checking Prerequisites');

  const requiredFiles = [
    'package.json',
    'jest.config.js',
    'tests/credentials.js',
  ];

  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logSuccess(`Found: ${file}`);
    } else {
      logError(`Missing: ${file}`);
    }
  });
}

// Setup test environment
function setupTestEnvironment() {
  logSection('Setting Up Test Environment');

  try {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ||
      'mysql://root:@localhost:3306/multi-tenant-scale';
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    process.env.JWT_SECRET =
      process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
    process.env.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET ||
      'test-refresh-secret-key-for-testing-only';

    logInfo('Environment variables set');
    logSuccess('Test environment setup completed');
  } catch (error) {
    logError(`Failed to setup test environment: ${error.message}`);
    throw error;
  }
}

// Run individual test file
function runTestFile(testFile) {
  logSection(`Running Test: ${testFile}`);

  try {
    const command = `npx jest ${testFile} --config jest.config.js --testTimeout=30000 --verbose --colors`;
    logInfo(`Executing: ${command}`);

    execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8',
      env: { ...process.env },
    });

    logSuccess(`Test completed: ${testFile}`);
    return { success: true, file: testFile };
  } catch (error) {
    logError(`Test failed: ${testFile}`);
    return { success: false, file: testFile, error: error.message };
  }
}

// Run all tests
function runAllTests() {
  logSection('Running All E2E Tests');

  const results = [];
  let passedTests = 0;
  let failedTests = 0;

  config.testFiles.forEach(testFile => {
    if (fs.existsSync(testFile)) {
      const result = runTestFile(testFile);
      results.push(result);

      if (result.success) {
        passedTests++;
      } else {
        failedTests++;
      }
    } else {
      logError(`Test file not found: ${testFile}`);
    }
  });

  return { results, passedTests, failedTests };
}

// Generate test report
function generateReport(results, passedTests, failedTests) {
  logSection('Test Results Summary');

  logInfo(`Total Test Files: ${results.length}`);
  logSuccess(`Passed: ${passedTests}`);
  logError(`Failed: ${failedTests}`);

  if (failedTests > 0) {
    logSection('Failed Tests');
    results
      .filter(r => !r.success)
      .forEach(result => {
        logError(`${result.file}: ${result.error || 'Unknown error'}`);
      });
  }

  const successRate =
    results.length > 0 ? (passedTests / results.length) * 100 : 0;
  logInfo(`Success Rate: ${successRate.toFixed(1)}%`);

  return { successRate, passedTests, failedTests };
}

// Main execution function
async function main() {
  try {
    logHeader('Multi-Tenant Admin API - E2E Test Suite');

    // Check prerequisites
    checkPrerequisites();

    // Setup test environment
    setupTestEnvironment();

    // Run all tests
    const { results, passedTests, failedTests } = runAllTests();

    // Generate report
    const report = generateReport(results, passedTests, failedTests);

    // Final summary
    logHeader('Test Suite Summary');
    logInfo(`Total Tests: ${results.length}`);
    logSuccess(`Passed: ${passedTests}`);
    logError(`Failed: ${failedTests}`);
    logInfo(`Success Rate: ${report.successRate.toFixed(1)}%`);

    if (failedTests > 0) {
      logError('Some tests failed. Please check the output above for details.');
      process.exit(1);
    } else {
      logSuccess('All tests passed successfully! 🎉');
      process.exit(0);
    }
  } catch (error) {
    logError(`Test suite execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  logHeader('E2E Test Runner Help');
  logInfo('Usage: node run-e2e-tests.js [options]');
  logInfo('');
  logInfo('Options:');
  logInfo('  --help, -h     Show this help message');
  logInfo('  --file <file>  Run specific test file');
  logInfo('');
  logInfo('Examples:');
  logInfo('  node run-e2e-tests.js');
  logInfo('  node run-e2e-tests.js --file tests/e2e/auth.test.js');
  process.exit(0);
}

const fileIndex = args.indexOf('--file');
if (fileIndex !== -1 && args[fileIndex + 1]) {
  const specificFile = args[fileIndex + 1];
  logHeader(`Running Specific Test: ${specificFile}`);

  if (!fs.existsSync(specificFile)) {
    logError(`Test file not found: ${specificFile}`);
    process.exit(1);
  }

  checkPrerequisites();
  setupTestEnvironment();
  const result = runTestFile(specificFile);

  if (result.success) {
    logSuccess('Test passed!');
    process.exit(0);
  } else {
    logError('Test failed!');
    process.exit(1);
  }
}

// Run main function
main();
