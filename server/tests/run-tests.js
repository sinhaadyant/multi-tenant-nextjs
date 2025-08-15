#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log(
  '🚀 Starting comprehensive test suite for Multi-Tenant Admin API...\n'
);

// Test configuration
const testConfig = {
  unit: {
    pattern: 'tests/unit/**/*.test.ts',
    description: 'Unit Tests',
  },
  integration: {
    pattern: 'tests/integration/**/*.test.ts',
    description: 'Integration Tests',
  },
  e2e: {
    pattern: 'tests/e2e/**/*.test.ts',
    description: 'End-to-End Tests',
  },
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.cyan}${description}${colors.reset}`);
  log(`${colors.yellow}Running: ${command}${colors.reset}\n`);

  try {
    const result = execSync(command, {
      stdio: 'inherit',
      cwd: __dirname,
      env: { ...process.env, NODE_ENV: 'test' },
    });
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    return false;
  }
}

// Main test execution
async function runTests() {
  log('📋 Test Suite Overview:', 'bright');
  log('=======================', 'bright');

  Object.entries(testConfig).forEach(([type, config]) => {
    log(`• ${config.description} (${type})`, 'blue');
  });

  log('\n🔧 Setting up test environment...', 'bright');

  // Setup test database
  const setupSuccess = runCommand('npm run db:test:setup', 'Database Setup');

  if (!setupSuccess) {
    log('❌ Failed to setup test database. Exiting.', 'red');
    process.exit(1);
  }

  log('\n🧪 Running Test Suites:', 'bright');
  log('======================', 'bright');

  let allTestsPassed = true;

  // Run unit tests
  const unitSuccess = runCommand('npm run test:unit', 'Unit Tests');
  allTestsPassed = allTestsPassed && unitSuccess;

  // Run integration tests
  const integrationSuccess = runCommand(
    'npm run test:integration',
    'Integration Tests'
  );
  allTestsPassed = allTestsPassed && integrationSuccess;

  // Run E2E tests
  const e2eSuccess = runCommand('npm run test:e2e', 'End-to-End Tests');
  allTestsPassed = allTestsPassed && e2eSuccess;

  // Generate coverage report
  log('\n📊 Generating Coverage Report:', 'bright');
  const coverageSuccess = runCommand(
    'npm run test:coverage',
    'Coverage Report'
  );

  // Cleanup
  log('\n🧹 Cleaning up test environment...', 'bright');
  runCommand('npm run db:test:clean', 'Database Cleanup');

  // Final results
  log('\n📈 Test Results Summary:', 'bright');
  log('=======================', 'bright');

  if (allTestsPassed) {
    log('🎉 All tests passed successfully!', 'green');
    log('✅ Unit Tests: PASSED', 'green');
    log('✅ Integration Tests: PASSED', 'green');
    log('✅ E2E Tests: PASSED', 'green');
    if (coverageSuccess) {
      log('✅ Coverage Report: GENERATED', 'green');
    }
  } else {
    log('💥 Some tests failed!', 'red');
    if (!unitSuccess) log('❌ Unit Tests: FAILED', 'red');
    if (!integrationSuccess) log('❌ Integration Tests: FAILED', 'red');
    if (!e2eSuccess) log('❌ E2E Tests: FAILED', 'red');
    process.exit(1);
  }

  log('\n🏁 Test suite execution completed!', 'bright');
}

// Handle command line arguments
const args = process.argv.slice(2);
const testType = args[0];

if (testType && testConfig[testType]) {
  log(`🎯 Running ${testConfig[testType].description} only...`, 'bright');

  const command =
    testType === 'unit'
      ? 'npm run test:unit'
      : testType === 'integration'
        ? 'npm run test:integration'
        : 'npm run test:e2e';

  const success = runCommand(command, testConfig[testType].description);

  if (!success) {
    process.exit(1);
  }
} else if (testType) {
  log(`❌ Unknown test type: ${testType}`, 'red');
  log('Available types: unit, integration, e2e', 'yellow');
  process.exit(1);
} else {
  runTests();
}
