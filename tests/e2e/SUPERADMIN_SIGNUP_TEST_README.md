# SuperAdmin Signup Test Suite

This test suite provides comprehensive end-to-end testing for the SuperAdmin signup functionality using Puppeteer. It tests the complete flow from invite token verification to account creation and validation.

## 🎯 Test Coverage

The test suite covers the following scenarios:

### 1. **Token Validation Tests**
- ✅ **Invalid Token Access**: Tests rejection of invalid invite tokens
- ✅ **Valid Token Access**: Tests successful access with valid tokens
- ✅ **Expired Token Signup**: Tests rejection of expired tokens
- ✅ **Email Mismatch Signup**: Tests rejection when email doesn't match token

### 2. **Form Validation Tests**
- ✅ **Name Validation**: Tests required field validation and minimum length
- ✅ **Email Validation**: Tests email format validation
- ✅ **Contact Number Validation**: Tests numeric-only input and length requirements
- ✅ **Password Strength Validation**: Tests password complexity requirements
- ✅ **Password Match Validation**: Tests password confirmation matching

### 3. **Signup Flow Tests**
- ✅ **Successful Signup**: Tests complete signup process with database verification
- ✅ **Duplicate Email Signup**: Tests rejection of duplicate email addresses
- ✅ **Database Integration**: Verifies user creation and token usage tracking

## 🚀 Running the Tests

### Prerequisites

1. **Database Setup**: Ensure your database is running and migrations are applied
2. **Application Running**: Start your Next.js application on `http://localhost:3000`
3. **Dependencies**: Install required packages:
   ```bash
   npm install puppeteer
   ```

### Quick Start

```bash
# Run the complete signup test suite
node tests/e2e/run-superadmin-signup-test.js

# Or run the test file directly
node tests/e2e/superadmin-signup.test.js
```

### Environment Variables

You can customize the test behavior with these environment variables:

```bash
# Run in non-headless mode (see browser)
HEADLESS=false node tests/e2e/run-superadmin-signup-test.js

# Add delay between actions for debugging
SLOW_MO=1000 node tests/e2e/run-superadmin-signup-test.js

# Open DevTools for debugging
DEVTOOLS=true node tests/e2e/run-superadmin-signup-test.js
```

## 📋 Test Details

### Test Data Management

The test suite automatically:
- Creates unique test invite tokens
- Generates unique email addresses for each test run
- Cleans up all test data after completion
- Verifies database state before and after tests

### Test Flow

1. **Initialization**: Connects to database and launches browser
2. **Token Creation**: Creates test invite tokens as needed
3. **Test Execution**: Runs each test scenario
4. **Verification**: Checks UI responses and database state
5. **Cleanup**: Removes all test data and closes browser

### Error Handling

The test suite includes comprehensive error handling:
- Graceful failure handling for each test
- Detailed error messages and stack traces
- Automatic cleanup even on test failures
- Database connection error recovery

## 🔧 Test Configuration

### Browser Settings

```javascript
// Default browser configuration
{
  headless: process.env.HEADLESS !== 'false',
  defaultViewport: null,
  args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
}
```

### Timeout Settings

- **Page Navigation**: 10 seconds
- **Element Selection**: 5 seconds
- **Form Submission**: 10 seconds
- **Database Operations**: 30 seconds

## 📊 Test Results

The test suite provides detailed reporting:

```
🎯 Starting SuperAdmin Signup Test Suite...

📝 Testing access with invalid token...
    ✅ Invalid token properly rejected

📝 Testing access with valid token...
    ✅ Valid token access successful, email pre-filled

📝 Testing form validations...
    ✅ Name validation working
    ✅ Email validation working

📊 SuperAdmin Signup Test Results:
✅ Passed: 15
❌ Failed: 0

🎉 Test Suite PASSED
```

## 🐛 Debugging

### Common Issues

1. **Database Connection Errors**
   - Ensure database is running
   - Check connection string in environment
   - Verify Prisma client is properly configured

2. **Element Not Found Errors**
   - Check if application is running on correct port
   - Verify element selectors match current UI
   - Run in non-headless mode to see what's happening

3. **Timeout Errors**
   - Increase timeout values for slow environments
   - Check network connectivity
   - Verify application response times

### Debug Mode

Run tests with debugging enabled:

```bash
# Non-headless mode with DevTools
HEADLESS=false DEVTOOLS=true node tests/e2e/run-superadmin-signup-test.js

# With slow motion for step-by-step observation
SLOW_MO=2000 HEADLESS=false node tests/e2e/run-superadmin-signup-test.js
```

### Screenshots

The test suite can capture screenshots on failure (if configured):

```javascript
// Add to test methods for debugging
await this.page.screenshot({ 
  path: `test-screenshots/signup-error-${Date.now()}.png` 
});
```

## 🔄 Integration with CI/CD

### GitHub Actions Example

```yaml
name: SuperAdmin Signup Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run db:migrate
      - run: npm run dev &
      - run: sleep 10
      - run: node tests/e2e/run-superadmin-signup-test.js
```

### Docker Integration

```dockerfile
# Add to your Dockerfile
RUN npm install puppeteer
RUN node tests/e2e/run-superadmin-signup-test.js
```

## 📈 Performance Considerations

### Optimization Tips

1. **Parallel Execution**: Tests are designed to run sequentially for stability
2. **Database Cleanup**: Efficient cleanup prevents test data accumulation
3. **Resource Management**: Proper browser and database connection handling
4. **Timeout Optimization**: Balanced timeouts for reliability vs speed

### Monitoring

Track test performance with:

```bash
# Time the test execution
time node tests/e2e/run-superadmin-signup-test.js

# Monitor memory usage
node --max-old-space-size=4096 tests/e2e/run-superadmin-signup-test.js
```

## 🤝 Contributing

### Adding New Tests

1. Add new test method to `SuperAdminSignupTester` class
2. Follow naming convention: `test[FeatureName]()`
3. Include proper error handling and cleanup
4. Add test to `runAllTests()` method
5. Update this README with new test details

### Test Structure

```javascript
async testNewFeature() {
  try {
    console.log('  📝 Testing new feature...');
    
    // Test implementation
    // Assertions and verifications
    
    console.log('    ✅ New feature working');
    this.testResults.passed++;
    this.testResults.details.push('New feature working correctly');
  } catch (error) {
    console.error('    ❌ New feature test failed:', error.message);
    this.testResults.failed++;
    this.testResults.errors.push(`New feature: ${error.message}`);
  }
}
```

## 📚 Related Documentation

- [Puppeteer Documentation](https://pptr.dev/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)
- [SuperAdmin API Documentation](../docs/api/API_DOCUMENTATION_README.md)

## 🆘 Support

For issues with the test suite:

1. Check the [Common Issues](#common-issues) section
2. Review the [Debugging](#debugging) guide
3. Run tests in debug mode for detailed output
4. Check application logs for related errors
5. Verify database state and connectivity

---

**Last Updated**: August 2025  
**Version**: 1.0.0  
**Maintainer**: Development Team 