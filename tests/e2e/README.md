# Multi-Tenant Next.js E2E Tests

Comprehensive end-to-end tests for the multi-tenant admin panel built with Next.js and RBAC permissions.

## 🎯 Overview

This test suite covers all major modules of the multi-tenant admin panel:

- **Dashboard** - Main dashboard functionality and role-based content
- **User Management** - User CRUD operations and role-based permissions
- **Audit Logs** - Audit trail viewing and filtering
- **Notifications** - Notification creation, viewing, and management
- **Support System** - Support ticket creation and management

## 🏗️ Test Architecture

### Test Structure
```
tests/e2e/
├── test-setup.js              # Common test utilities and helpers
├── dashboard.test.js          # Dashboard module tests
├── user-management.test.js    # User management module tests
├── audit-logs.test.js         # Audit logs module tests
├── notifications.test.js      # Notifications module tests
├── support-system.test.js     # Support system module tests
├── run-all-tests.js          # Test runner and orchestrator
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

### Test Credentials
The tests use predefined credentials for different tenant types and roles:

#### SuperAdmin
- Email: `admin@superadmin.com`
- Password: `SuperAdmin123!`

#### TechCorp Tenant
- **Admin**: `admin@techcorp.com` / `AdminPass123`
- **Manager**: `manager@techcorp.com` / `AdminPass123`
- **User**: `user@techcorp.com` / `AdminPass123`
- **Viewer**: `viewer@techcorp.com` / `AdminPass123`

#### GlobalRetail Tenant
- **Admin**: `admin@globalretail.com` / `AdminPass123`
- **Manager**: `manager@globalretail.com` / `AdminPass123`
- **User**: `user@globalretail.com` / `AdminPass123`
- **Viewer**: `viewer@globalretail.com` / `AdminPass123`

## 🚀 Setup

### Prerequisites
- Node.js >= 16.0.0
- Your Next.js application running on `http://localhost:3000`
- Database with test data populated

### Installation

1. **Ensure you're in the main project directory:**
   ```bash
   # Make sure you're in the project root (where package.json is located)
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Ensure your application is running:**
   ```bash
   npm run dev
   ```

## 🧪 Running Tests

### Run All Tests
```bash
# From project root
node tests/e2e/run-all-tests.js
```

### Run Specific Module Tests
```bash
# Dashboard tests
node tests/e2e/run-all-tests.js dashboard

# User Management tests
node tests/e2e/run-all-tests.js user-management

# Audit Logs tests
node tests/e2e/run-all-tests.js audit-logs

# Notifications tests
node tests/e2e/run-all-tests.js notifications

# Support System tests
node tests/e2e/run-all-tests.js support-system
```

### Run Tests in Different Modes

#### Headless Mode (CI/CD)
```bash
HEADLESS=true node tests/e2e/run-all-tests.js
```

#### Debug Mode (Visible Browser)
```bash
HEADLESS=false node tests/e2e/run-all-tests.js
```

### Get Help
```bash
node tests/e2e/run-all-tests.js --help
```

## 📊 Test Coverage

### Dashboard Module
- ✅ Dashboard access for all roles
- ✅ Dashboard content loading
- ✅ Dashboard widgets functionality
- ✅ Dashboard navigation
- ✅ Role-based content visibility

### User Management Module
- ✅ User management access (Admin/Manager only)
- ✅ User CRUD operations
- ✅ User search and filtering
- ✅ User pagination
- ✅ Role-based permissions

### Audit Logs Module
- ✅ Audit logs access (Admin/Manager only)
- ✅ Audit logs viewing
- ✅ Audit logs filtering
- ✅ Audit logs export (Admin only)
- ✅ Audit logs pagination

### Notifications Module
- ✅ Notifications access for all roles
- ✅ Notifications viewing
- ✅ Notifications creation (Admin/Manager only)
- ✅ Notifications filtering
- ✅ Notifications pagination

### Support System Module
- ✅ Support system access for all roles
- ✅ Ticket creation (except Viewer)
- ✅ Ticket viewing
- ✅ Ticket filtering
- ✅ Ticket pagination

## 🔧 Test Features

### Smart Selectors
Tests use multiple selector strategies for robustness:
- `data-testid` attributes (preferred)
- Semantic selectors (role, aria-*)
- CSS classes
- Text content (fallback)

### Screenshot Capture
- Automatic screenshots on test failures
- Screenshots saved to `test-screenshots/` directory
- Timestamped filenames for easy identification

### Comprehensive Reporting
- Individual test results
- Module-level summaries
- Overall test statistics
- JSON reports for CI/CD integration
- Console output with emojis for readability

### Error Handling
- Graceful handling of missing elements
- Timeout management
- Network error recovery
- Detailed error messages

## 📈 Test Results

### Console Output
```
🧪 Starting Dashboard E2E Tests...

🔐 Testing TechCorp admin dashboard...
✅ TechCorp admin Login: Successfully logged in as admin
✅ TechCorp admin Dashboard Access: Dashboard loaded successfully
✅ TechCorp admin Dashboard Content: Dashboard content displayed correctly
✅ TechCorp admin Dashboard Widgets: Dashboard widgets working
✅ TechCorp admin Dashboard Navigation: Dashboard navigation working
✅ TechCorp admin Role-Based Content: Role-based content displayed correctly

📊 Dashboard Test Results Summary:
==================================================
Total Tests: 25
Passed: 24 ✅
Failed: 1 ❌
Success Rate: 96.0%
```

### JSON Reports
Test results are saved as JSON files:
- `dashboard-test-results.json`
- `user-management-test-results.json`
- `audit-logs-test-results.json`
- `notifications-test-results.json`
- `support-system-test-results.json`
- `e2e-test-results-comprehensive.json`

## 🛠️ Configuration

### Environment Variables
- `HEADLESS` - Set to `true` for headless mode (default: `false`)
- `TEST_BASE_URL` - Base URL for testing (default: `http://localhost:3000`)

### Test Configuration
Modify `test-setup.js` to adjust:
- Browser launch options
- Timeout values
- Screenshot settings
- Test credentials

## 🔍 Debugging

### View Screenshots
Screenshots are automatically captured on failures:
```bash
ls test-screenshots/
```

### Debug Mode
Run tests with visible browser for debugging:
```bash
HEADLESS=false npm test
```

### Individual Test Debugging
```bash
# Run specific module with debug output
HEADLESS=false node run-all-tests.js dashboard
```

## 🚨 Troubleshooting

### Common Issues

#### Application Not Running
```
❌ Navigation failed to http://localhost:3000/techcorp/login
```
**Solution:** Ensure your Next.js application is running on port 3000

#### Login Failures
```
❌ Login failed for admin in techcorp: Login failed - still on login page
```
**Solution:** Check that test credentials are correct in database

#### Element Not Found
```
❌ Element not found: button[data-testid="create-user"]
```
**Solution:** Verify that the element exists and the selector is correct

#### Timeout Issues
```
❌ Element not found: table (timeout: 10000ms)
```
**Solution:** Increase timeout in `test-setup.js` or check page loading

### Performance Tips
- Use headless mode for faster execution
- Close unnecessary browser tabs
- Ensure stable internet connection
- Monitor system resources

## 📝 Adding New Tests

### Create New Module Test
1. Create new test file: `new-module.test.js`
2. Extend the test pattern from existing files
3. Add to `run-all-tests.js`
4. Update this README

### Test Structure Template
```javascript
const { TestHelper, TEST_CREDENTIALS, ROLE_PERMISSIONS } = require('./test-setup');

class NewModuleTester {
  constructor() {
    this.testHelper = new TestHelper();
    this.results = [];
  }

  async runAllTests() {
    // Test implementation
  }

  logResult(testName, status, details) {
    // Logging implementation
  }

  generateReport() {
    // Report generation
  }
}

module.exports = NewModuleTester;
```

## 🤝 Contributing

1. Follow the existing test patterns
2. Add comprehensive error handling
3. Include screenshots on failures
4. Update documentation
5. Test with multiple roles and tenants

## 📄 License

MIT License - see LICENSE file for details 