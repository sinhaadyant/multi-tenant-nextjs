# End-to-End Testing Suite

This directory contains comprehensive end-to-end tests for the multi-tenant NextJS application.

## 🚀 Quick Start

### Prerequisites
1. Make sure your application is running on `http://localhost:3000`
2. Ensure the database is seeded with test data
3. Install dependencies: `npm install`

### Running Tests

#### 1. Setup and Run All Tests
```bash
npm run test:e2e:setup
```

#### 2. Add Test IDs to Components (if needed)
```bash
npm run test:e2e:add-ids
```

#### 3. Run Comprehensive Tests Only
```bash
npm run test:e2e:comprehensive
```

## 📋 Test Coverage

### Superadmin Features
- ✅ Authentication (Login, Logout)
- ✅ Dashboard (Stats, Navigation)
- ✅ Tenant Management (List, Create, Edit)
- ✅ User Management (List, Search, Create)
- ✅ Roles & Permissions (Create, Edit, Assign)
- ✅ Audit Logs (View, Export)
- ✅ Reports & Analytics
- ✅ Notifications
- ✅ Support System
- ✅ Settings & Configuration

### Tenant Features
- ✅ Authentication (Login, Logout)
- ✅ Dashboard (Stats, Navigation)
- ✅ User Management (List, Create, Edit)
- ✅ Roles & Permissions (Create, Edit, Assign)
- ✅ Module Management (Enable/Disable)
- ✅ Content Management
- ✅ Audit Logs
- ✅ Support System
- ✅ Settings

## 🔧 Error Handling

The test suite includes comprehensive error handling:

### Console Error Detection
- Automatically captures all console errors
- Categorizes errors by type (console_error, page_error)
- Provides suggestions for common error fixes

### Common Error Fixes
- **Hydration Errors**: Common in Next.js development
- **404 Errors**: Route may not exist yet
- **CORS Errors**: Check API configuration
- **Network Errors**: Check server status

## 📊 Test Reports

After running tests, a detailed report is generated at:
```
tests/e2e/test-report.json
```

The report includes:
- Test summary (total, passed, failed)
- Detailed test results with timestamps
- Error logs with categorization
- Performance metrics

## 🛠️ Configuration

### Test Credentials
Default test credentials are configured in the test file:

**Superadmin:**
- Email: `admin@superadmin.com`
- Password: `AdminPass123`

**Tenant:**
- Email: `admin@techcorp.com`
- Password: `AdminPass123`

### Browser Configuration
- **Headless Mode**: Set `headless: true` for CI/CD
- **Viewport**: 1280x720
- **Slow Motion**: 100ms for debugging

## 🔍 Debugging

### Visual Debugging
Set `headless: false` in the test file to see the browser in action.

### Error Logging
All errors are logged to console with timestamps and categorized by type.

### Screenshots
The test suite can be extended to capture screenshots on failures.

## 📝 Adding New Tests

### 1. Add Test IDs
Update `scripts/add-test-ids.js` to include new component selectors.

### 2. Add Test Methods
Add new test methods to the `ComprehensiveFeatureTest` class:

```javascript
async testNewFeature() {
  console.log('\n🔧 Testing New Feature...');
  
  try {
    // Navigate to feature
    await this.page.click('[data-testid="nav-new-feature"]');
    await this.waitForNavigation();
    
    // Test functionality
    const element = await this.waitForElement('[data-testid="new-feature-element"]');
    await this.logTestResult('New Feature Element', element);
    
    return true;
  } catch (error) {
    await this.logTestResult('New Feature', false, error.message);
    return false;
  }
}
```

### 3. Update Test Runner
Add the new test to the `runAllTests()` method.

## 🚨 Troubleshooting

### Common Issues

1. **Tests Fail to Start**
   - Check if application is running on port 3000
   - Verify database is seeded
   - Check console for startup errors

2. **Authentication Fails**
   - Verify test credentials are correct
   - Check if users exist in database
   - Ensure login endpoints are working

3. ** Elements Not Found**
   - Run `npm run test:e2e:add-ids` to add missing test IDs
   - Check if components have proper data-testid attributes
   - Verify page structure matches expectations

4. **Console Errors**
   - Check browser console for JavaScript errors
   - Verify API endpoints are responding
   - Check for CORS issues

### Performance Tips

1. **Faster Execution**
   - Set `headless: true` for faster runs
   - Reduce `slowMo` value
   - Use `--no-sandbox` flag

2. **Reliable Tests**
   - Add proper wait conditions
   - Use data-testid attributes consistently
   - Handle async operations properly

## 📈 Continuous Integration

For CI/CD pipelines:

1. Set `headless: true`
2. Add timeout configurations
3. Configure error reporting
4. Set up test result artifacts

Example CI configuration:
```yaml
- name: Run E2E Tests
  run: |
    npm run test:e2e:comprehensive
  env:
    CI: true
```

## 🤝 Contributing

When adding new features:

1. Add corresponding e2e tests
2. Update test ID mappings
3. Document new test methods
4. Update this README

## 📞 Support

For issues with the test suite:
1. Check the test report for detailed error information
2. Review console logs for specific error messages
3. Verify application functionality manually
4. Check browser developer tools for additional errors 