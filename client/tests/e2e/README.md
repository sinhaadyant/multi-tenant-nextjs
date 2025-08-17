# Client E2E Tests

This directory contains comprehensive End-to-End (E2E) tests for the Next.js multi-tenant admin panel frontend using Playwright.

## Overview

These tests mirror the backend API test scenarios from a frontend UI perspective, ensuring that all backend functionality is properly implemented and accessible through the user interface.

## Test Structure

```
client/tests/e2e/
├── helpers/
│   ├── auth.ts              # Authentication helper functions
│   ├── test-utils.ts        # General test utilities
│   └── credentials.ts       # Test credentials management
├── login.spec.ts            # Login page tests
├── users.spec.ts            # User management tests
└── README.md               # This file
```

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Backend server** running on `http://localhost:3001`
4. **Frontend client** running on `http://localhost:3000`
5. **Database** with seeded test data

## Environment Setup

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Install Playwright

```bash
npx playwright install
```

### 3. Environment Variables

Create a `.env.local` file in the `client` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start Services

In separate terminals:

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

## Running Tests

### Run All E2E Tests

```bash
cd client
npm run test:e2e
```

### Run Specific Test File

```bash
cd client
npx playwright test tests/e2e/login.spec.ts
```

### Run Tests in UI Mode

```bash
cd client
npx playwright test --ui
```

### Run Tests in Debug Mode

```bash
cd client
npx playwright test --debug
```

### Run Tests on Mobile

```bash
cd client
npx playwright test --project=e2e-mobile
```

## Test Configuration

The tests are configured in `client/playwright.config.ts` with the following settings:

- **Base URL**: `http://localhost:3000` (frontend)
- **Backend URL**: `http://localhost:3001` (API)
- **Browsers**: Chrome (desktop) and iPhone 12 (mobile)
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Auto-start**: Both frontend and backend servers

## Test Credentials

Test credentials are loaded from the common credentials file at `tests/e2e/test-credentials.json` and include:

### Superadmin
- **Email**: `superadmin@example.com`
- **Password**: `password123`
- **Permissions**: Full access to all modules

### Tenant Admins
- **Tenant A Admin**: `tenant-a-admin@example.com`
- **Tenant B Admin**: `tenant-b-admin@example.com`
- **Permissions**: Full access within their tenant

### Tenant Users
- **Tenant A Users**: `john.doe@tenant-a.com`, `jane.smith@tenant-a.com`
- **Tenant B Users**: `bob.wilson@tenant-b.com`, `alice.johnson@tenant-b.com`
- **Permissions**: Limited access based on role assignments

## Test Coverage

### Login Page (`login.spec.ts`)

#### Successful Login Scenarios
- ✅ Valid credentials login
- ✅ Login with tenant slug
- ✅ Login with remember me
- ✅ Superadmin login

#### Form Validation Errors
- ✅ Invalid email format
- ✅ Empty required fields
- ✅ Long input validation
- ✅ SQL injection attempts

#### Authentication Errors
- ✅ Non-existent user
- ✅ Wrong password
- ✅ Invalid tenant slug
- ✅ Inactive tenant
- ✅ Expired password

#### UI/UX Features
- ✅ Password visibility toggle
- ✅ Loading states
- ✅ Error message clearing
- ✅ Keyboard navigation
- ✅ Enter key submission

#### Navigation and Links
- ✅ Forgot password link
- ✅ Signup link
- ✅ Back to dashboard
- ✅ Authenticated user redirect

#### Social Login
- ✅ Google login button
- ✅ X (Twitter) login button
- ✅ OAuth flow handling

#### Rate Limiting
- ✅ Multiple failed attempts
- ✅ Rate limit error display

#### Accessibility
- ✅ ARIA labels
- ✅ Form structure
- ✅ Keyboard accessibility

#### Mobile Responsiveness
- ✅ Mobile viewport testing
- ✅ Responsive design validation

### User Management (`users.spec.ts`)

#### Navigation and Access
- ✅ Sidebar navigation
- ✅ Role-based access control
- ✅ Permission enforcement
- ✅ Breadcrumb navigation

#### User Listing
- ✅ Table column display
- ✅ Data scope (superadmin vs tenant admin)
- ✅ Empty state handling

#### User Creation
- ✅ Successful user creation
- ✅ Form validation
- ✅ Email format validation
- ✅ Password strength validation
- ✅ Duplicate email prevention

#### User Editing
- ✅ Successful user editing
- ✅ Permission checks
- ✅ Email uniqueness validation

#### User Deletion
- ✅ Confirmation dialogs
- ✅ Cancellation handling
- ✅ Self-deletion prevention

#### Search and Filtering
- ✅ Name search
- ✅ Email search
- ✅ Role filtering
- ✅ Tenant filtering
- ✅ Status filtering

#### Bulk Operations
- ✅ Multiple user selection
- ✅ Bulk activation
- ✅ Bulk deactivation
- ✅ Bulk deletion

#### Pagination
- ✅ Page navigation
- ✅ Page size changes

#### Export Functionality
- ✅ CSV export
- ✅ Excel export

#### Error Handling
- ✅ API error handling
- ✅ Network error handling

#### Accessibility
- ✅ Keyboard navigation
- ✅ ARIA labels

#### Mobile Responsiveness
- ✅ Mobile viewport testing

## Test Helpers

### E2EAuthHelper

Provides authentication-related functions:

```typescript
// Login via UI
await authHelper.login(email, password, tenantSlug, rememberMe);

// Login via API
const tokens = await authHelper.loginViaAPI(email, password, tenantSlug);

// Logout
await authHelper.logout();

// Save storage state for session reuse
await authHelper.saveStorageState(email, password, tenantSlug);

// Assertions
await authHelper.expectToBeLoggedIn();
await authHelper.expectToBeLoggedOut();
await authHelper.expectPermissionDenied();
```

### E2ETestUtils

Provides general test utilities:

```typescript
// Data generation
const email = testUtils.generateRandomEmail();
const password = testUtils.generateRandomPassword();

// Form interactions
await testUtils.fillForm({ name: "Test User", email: "test@example.com" });

// Assertions
await testUtils.expectFormValidationError("Email", "Invalid email");
await testUtils.expectSuccessMessage("User created successfully");
await testUtils.expectTableToHaveData();
await testUtils.expectModalToBeVisible();

// UI interactions
await testUtils.clickButton("Create User");
await testUtils.confirmDialog();
await testUtils.closeModal();
```

### CredentialsHelper

Provides access to test credentials:

```typescript
// Get specific users
const superadmin = credentialsHelper.getSuperadmin();
const tenantAdmin = credentialsHelper.getTenantAdmin("A");
const tenantUser = credentialsHelper.getTenantUser("A");

// Check permissions
const hasPermission = credentialsHelper.hasPermission("superadmin", "User Management", "User List", "canCreate");

// Generate test data
const testUser = credentialsHelper.generateTestUser();
```

## Best Practices

### 1. Test Organization
- Use `test.describe()` blocks to group related tests
- Use descriptive test names that explain the scenario
- Keep tests independent and idempotent

### 2. Selectors
- Prefer accessibility-focused selectors (`getByRole`, `getByLabelText`)
- Avoid CSS selectors when possible
- Use data-testid attributes for complex selectors

### 3. Assertions
- Use specific assertions for better error messages
- Test both positive and negative scenarios
- Verify UI state changes after actions

### 4. Data Management
- Use seeded test data from the database
- Clean up any test data created during tests
- Use unique identifiers to avoid conflicts

### 5. Error Handling
- Test error scenarios and edge cases
- Verify error messages are displayed correctly
- Test network failures and API errors

## Troubleshooting

### Common Issues

1. **Tests fail with "Connection refused"**
   - Ensure both backend and frontend servers are running
   - Check that ports 3000 and 3001 are available

2. **Tests fail with "Element not found"**
   - Verify the UI elements exist in the current implementation
   - Check that selectors match the actual DOM structure
   - Ensure the page has loaded completely

3. **Tests fail with "Permission denied"**
   - Verify test credentials are correct
   - Check that user permissions are properly set in the database
   - Ensure the user has the required role for the action

4. **Tests are flaky**
   - Add proper wait conditions for async operations
   - Use `waitForLoadState()` for page loads
   - Add retry logic for network-dependent operations

### Debug Mode

Run tests in debug mode to step through them:

```bash
npx playwright test --debug
```

This opens the Playwright Inspector where you can:
- Step through test execution
- Inspect elements
- Modify selectors
- View screenshots and videos

### Screenshots and Videos

Screenshots and videos are automatically captured on test failures and saved to:
- `test-results/` directory
- `playwright-report/` directory (HTML report)

## Continuous Integration

### GitHub Actions

Add this workflow to `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd client && npm ci
      - run: cd server && npm ci
      - run: cd client && npx playwright install
      - run: cd server && npm run db:setup
      - run: cd server && npm run dev &
      - run: cd client && npm run dev &
      - run: cd client && npx playwright test
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: client/playwright-report/
```

## Contributing

### Adding New Tests

1. Create a new test file following the naming convention: `{module}.spec.ts`
2. Import the necessary helpers
3. Use `test.describe()` to group related tests
4. Follow the existing patterns for authentication and assertions
5. Add tests for both success and failure scenarios

### Updating Test Data

1. Update the credentials in `tests/e2e/test-credentials.json`
2. Ensure the database seed file matches the test data
3. Update any hardcoded values in tests

### Test Maintenance

1. Keep tests up to date with UI changes
2. Update selectors when DOM structure changes
3. Add tests for new features
4. Remove tests for deprecated functionality

## Support

For issues related to:
- **Test failures**: Check the troubleshooting section
- **Configuration**: Review the setup instructions
- **New features**: Follow the contributing guidelines
- **CI/CD**: Check the GitHub Actions workflow

## Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Backend API Tests](../tests/api/)
- [Frontend Update PRD](../../Frontend_Update_PRD.txt)
