# Backend E2E Tests

This directory contains comprehensive End-to-End (E2E) tests for the Node.js/Express multi-tenant admin panel backend API using Playwright.

## Overview

These tests validate the backend API endpoints directly, ensuring that all API functionality works correctly, handles errors appropriately, and maintains security standards. They complement the frontend E2E tests by testing the API layer independently.

## Test Structure

```
tests/e2e/
├── helpers/
│   ├── auth.ts              # Backend authentication helper functions
│   ├── test-utils.ts        # Backend test utilities and data generators
│   └── credentials.ts       # Backend test credentials management
├── auth.spec.ts             # Authentication API tests
└── README.md               # This file
```

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Backend server** running on `http://localhost:3001`
4. **Database** with seeded test data
5. **Playwright** installed globally or locally

## Environment Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Install Playwright

```bash
npx playwright install
```

### 3. Environment Variables

Create a `.env` file in the `server` directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/multi_tenant_db"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
PORT=3001
NODE_ENV=test
```

### 4. Database Setup

```bash
cd server
npm run db:migrate
npm run db:seed
```

### 5. Start Backend Server

```bash
cd server
npm run dev
```

## Running Tests

### Run All Backend E2E Tests

```bash
cd tests
npx playwright test e2e/
```

### Run Specific Test File

```bash
cd tests
npx playwright test e2e/auth.spec.ts
```

### Run Tests in UI Mode

```bash
cd tests
npx playwright test e2e/ --ui
```

### Run Tests in Debug Mode

```bash
cd tests
npx playwright test e2e/ --debug
```

### Run Tests with Specific Browser

```bash
cd tests
npx playwright test e2e/ --project=chromium
```

## Test Configuration

The tests are configured in `tests/playwright.config.ts` with the following settings:

- **Base URL**: `http://localhost:3001` (backend API)
- **Browsers**: Chrome (for API testing)
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Auto-start**: Backend server

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

### Authentication API (`auth.spec.ts`)

#### Login Endpoint

- ✅ Successful login with valid credentials
- ✅ Successful login with tenant slug
- ✅ Failed login with invalid email
- ✅ Failed login with wrong password
- ✅ Failed login with invalid tenant slug
- ✅ Failed login with missing email
- ✅ Failed login with missing password
- ✅ SQL injection attempt handling
- ✅ XSS attempt handling
- ✅ Rate limiting

#### Logout Endpoint

- ✅ Successful logout with valid token
- ✅ Failed logout without token
- ✅ Failed logout with invalid token

#### Token Refresh Endpoint

- ✅ Successful token refresh
- ✅ Failed refresh with invalid token
- ✅ Failed refresh without token

#### Password Reset Endpoint

- ✅ Successful password reset request
- ✅ Failed password reset with non-existent email
- ✅ Failed password reset without email

#### Password Reset Confirm Endpoint

- ✅ Successful password reset with valid token
- ✅ Failed password reset with invalid token
- ✅ Failed password reset with weak password

#### Change Password Endpoint

- ✅ Successful password change
- ✅ Failed password change with wrong current password
- ✅ Failed password change without authentication

#### Profile Endpoint

- ✅ Successful profile retrieval
- ✅ Failed profile retrieval without authentication
- ✅ Successful profile update

#### Session Management

- ✅ Concurrent login handling
- ✅ Token expiration handling

## Test Helpers

### BackendE2EAuthHelper

Provides backend authentication-related functions:

```typescript
// Login via API
const tokens = await authHelper.loginViaAPI(email, password, tenantSlug);

// Logout via API
await authHelper.logoutViaAPI(accessToken);

// Refresh token
const newTokens = await authHelper.refreshToken(refreshToken);

// Create test user
const testUser = await authHelper.createTestUser(userData, accessToken);

// Cleanup test user
await authHelper.cleanupTestUser(userId, accessToken);

// Make authenticated requests
const response = await authHelper.makeAuthenticatedRequest(
  "GET",
  "/api/users",
  accessToken
);

// Assertions
await authHelper.expectSuccessfulResponse(response);
await authHelper.expectErrorResponse(response, 400);
await authHelper.expectPermissionDenied(response);
await authHelper.expectUnauthorized(response);
await authHelper.expectValidationError(response);
await authHelper.expectNotFound(response);
```

### BackendE2ETestUtils

Provides backend test utilities and data generators:

```typescript
// Data generation
const email = testUtils.generateRandomEmail();
const password = testUtils.generateRandomPassword();
const userData = testUtils.generateValidUserData();
const tenantData = testUtils.generateValidTenantData();

// Invalid data generation
const invalidUserData = testUtils.generateInvalidUserData("emptyName");
const invalidTenantData = testUtils.generateInvalidTenantData("emptyDomain");

// Security test data
const sqlInjectionAttempts = testUtils.generateSQLInjectionAttempts();
const xssAttempts = testUtils.generateXSSAttempts();
const rateLimitData = testUtils.generateRateLimitTestData();

// Bulk test data
const bulkUsers = testUtils.generateBulkUserData(10);
const bulkTenants = testUtils.generateBulkTenantData(5);

// Performance test data
const performanceData = testUtils.generatePerformanceTestData(1000);
const concurrentData = testUtils.generateConcurrentTestData(10);
const stressData = testUtils.generateStressTestData(100);

// Edge case data
const edgeCaseData = testUtils.generateEdgeCaseData();
const boundaryData = testUtils.generateBoundaryTestData();
```

### BackendCredentialsHelper

Provides access to test credentials:

```typescript
// Get specific users
const superadmin = backendCredentialsHelper.getSuperadmin();
const tenantAdmin = backendCredentialsHelper.getTenantAdmin("A");
const tenantUser = backendCredentialsHelper.getTenantUser("A");

// Check permissions
const hasPermission = backendCredentialsHelper.hasPermission(
  "superadmin",
  "User Management",
  "User List",
  "canCreate"
);

// Generate API test data
const apiUserData = backendCredentialsHelper.generateAPIUserData();
const apiTenantData = backendCredentialsHelper.generateAPITenantData();
const apiLoginData = backendCredentialsHelper.generateAPILoginData();

// Generate error test data
const errorTestData = backendCredentialsHelper.generateAPIErrorTestData();
const performanceTestData =
  backendCredentialsHelper.generateAPIPerformanceTestData();
const concurrentTestData =
  backendCredentialsHelper.generateAPIConcurrentTestData();
const bulkTestData = backendCredentialsHelper.generateAPIBulkTestData();
```

## Best Practices

### 1. Test Organization

- Use `test.describe()` blocks to group related tests
- Use descriptive test names that explain the scenario
- Keep tests independent and idempotent

### 2. API Testing

- Test all HTTP methods (GET, POST, PUT, DELETE)
- Test both success and failure scenarios
- Test authentication and authorization
- Test validation and error handling

### 3. Data Management

- Use seeded test data from the database
- Clean up any test data created during tests
- Use unique identifiers to avoid conflicts
- Generate test data dynamically when needed

### 4. Security Testing

- Test SQL injection attempts
- Test XSS attempts
- Test authentication bypass attempts
- Test rate limiting
- Test input validation

### 5. Performance Testing

- Test concurrent requests
- Test large data sets
- Test memory usage
- Test response times

### 6. Error Handling

- Test all error scenarios
- Verify error response formats
- Test edge cases and boundary conditions
- Test network failures

## API Endpoints Covered

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Planned Endpoints

- `GET /api/users` - Get users list
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/tenants` - Get tenants list
- `POST /api/tenants` - Create tenant
- `GET /api/tenants/:id` - Get tenant by ID
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant
- `GET /api/roles` - Get roles list
- `POST /api/roles` - Create role
- `GET /api/modules` - Get modules list
- `GET /api/audit-logs` - Get audit logs
- `GET /api/analytics` - Get analytics data

## Troubleshooting

### Common Issues

1. **Tests fail with "Connection refused"**

   - Ensure the backend server is running on port 3001
   - Check that the database is accessible
   - Verify environment variables are set correctly

2. **Tests fail with "Database connection error"**

   - Check database connection string
   - Ensure database is running
   - Run database migrations and seeds

3. **Tests fail with "Authentication failed"**

   - Verify test credentials are correct
   - Check that users exist in the database
   - Ensure JWT secrets are configured

4. **Tests are flaky**
   - Add proper wait conditions for async operations
   - Use database transactions for test isolation
   - Add retry logic for network-dependent operations

### Debug Mode

Run tests in debug mode to step through them:

```bash
npx playwright test e2e/ --debug
```

This opens the Playwright Inspector where you can:

- Step through test execution
- Inspect API responses
- Modify request parameters
- View screenshots and videos

### API Response Inspection

Add logging to inspect API responses:

```typescript
const response = await request.post("http://localhost:3001/api/auth/login", {
  data: { email, password },
});

console.log("Response status:", response.status());
console.log("Response body:", await response.json());
```

## Continuous Integration

### GitHub Actions

Add this workflow to `.github/workflows/backend-e2e-tests.yml`:

```yaml
name: Backend E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: multi_tenant_db_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: cd server && npm ci
      - run: cd tests && npm ci
      - run: cd tests && npx playwright install
      - run: cd server && npm run db:migrate
      - run: cd server && npm run db:seed
      - run: cd server && npm run dev &
      - run: cd tests && npx playwright test e2e/
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: tests/playwright-report/
```

## Contributing

### Adding New Tests

1. Create a new test file following the naming convention: `{module}.spec.ts`
2. Import the necessary helpers
3. Use `test.describe()` to group related tests
4. Follow the existing patterns for API testing
5. Add tests for both success and failure scenarios

### Updating Test Data

1. Update the credentials in `tests/e2e/test-credentials.json`
2. Ensure the database seed file matches the test data
3. Update any hardcoded values in tests

### Test Maintenance

1. Keep tests up to date with API changes
2. Update endpoint URLs when they change
3. Add tests for new API endpoints
4. Remove tests for deprecated endpoints

## Support

For issues related to:

- **Test failures**: Check the troubleshooting section
- **Configuration**: Review the setup instructions
- **New endpoints**: Follow the contributing guidelines
- **CI/CD**: Check the GitHub Actions workflow

## Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Express.js Testing](https://expressjs.com/en/advanced/best-practices-performance.html#testing)
- [Frontend E2E Tests](../client/tests/e2e/)
- [Backend API Documentation](../server/docs/)
- [Database Schema](../server/prisma/schema.prisma)
