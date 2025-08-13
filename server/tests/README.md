# Testing Documentation

This document provides comprehensive information about the testing setup and implementation for the Multi-Tenant SaaS API.

## Overview

The testing suite is built with Jest and includes both unit tests and end-to-end (E2E) tests with Supabase integration for realistic database testing.

## Test Structure

```
tests/
├── setup.ts                 # Unit test setup and utilities
├── e2e/
│   ├── setup.ts            # E2E test setup with Supabase
│   ├── sequencer.js        # Test execution order
│   ├── auth.e2e.test.ts    # Authentication E2E tests
│   ├── tenants.e2e.test.ts # Tenant management E2E tests
│   ├── users.e2e.test.ts   # User management E2E tests
│   └── support.e2e.test.ts # Support system E2E tests
└── README.md               # This documentation
```

## Test Configuration

### Jest Configuration Files

- **`jest.config.js`** - Unit test configuration
- **`jest.e2e.config.js`** - E2E test configuration with Supabase

### Environment Files

- **`env.test`** - Test environment variables
- **`.env.test`** - Local test environment (gitignored)

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in watch mode
npm run test:e2e:watch

# Run E2E tests with coverage
npm run test:e2e:coverage
```

### All Tests

```bash
# Run both unit and E2E tests
npm run test:all
```

## Test Utilities

### Global Test Utilities

The test setup provides global utilities accessible via `global.testUtils` (unit tests) and `global.e2eUtils` (E2E tests).

#### Unit Test Utilities (`global.testUtils`)

```typescript
// Create test data
const user = global.testUtils.createTestUser();
const tenant = global.testUtils.createTestTenant();
const role = global.testUtils.createTestRole();

// API response helpers
const response = global.testUtils.createApiResponse(data, message, meta);
const errorResponse = global.testUtils.createErrorResponse(
  message,
  statusCode,
  errors
);

// Pagination helpers
const paginationMeta = global.testUtils.createPaginationMeta(
  total,
  page,
  limit
);

// Utility functions
const randomString = global.testUtils.randomString(length);
const randomEmail = global.testUtils.randomEmail();
await global.testUtils.wait(ms);
const jwtPayload = global.testUtils.createJwtPayload(overrides);
```

#### E2E Test Utilities (`global.e2eUtils`)

```typescript
// Database helpers
await global.e2eUtils.setupTestDatabase();
await global.e2eUtils.teardownTestDatabase();
await global.e2eUtils.cleanupTestData();

// Test data creation
const tenant = await global.e2eUtils.createTestTenant(overrides);
const user = await global.e2eUtils.createTestUser(tenantId, overrides);
const role = await global.e2eUtils.createTestRole(tenantId, overrides);

// Authentication helpers
const token = await global.e2eUtils.createAuthToken(user);

// API request helpers
const response = await global.e2eUtils.makeRequest(method, url, data, token);

// Assertion helpers
global.e2eUtils.expectApiResponse(response, expectedStatus);
global.e2eUtils.expectSuccessResponse(response, expectedStatus);
global.e2eUtils.expectErrorResponse(response, expectedStatus);

// Utility functions
const randomString = global.e2eUtils.randomString(length);
const randomEmail = global.e2eUtils.randomEmail();
await global.e2eUtils.wait(ms);
```

## Test Categories

### 1. Authentication Tests (`auth.e2e.test.ts`)

Tests all authentication-related endpoints:

- **Login** - Valid/invalid credentials, missing fields
- **Token Refresh** - Valid/invalid/expired refresh tokens
- **Logout** - Token invalidation
- **Password Reset** - Request and confirmation flows
- **Device Management** - Device revocation

### 2. Tenant Management Tests (`tenants.e2e.test.ts`)

Tests tenant CRUD operations:

- **List Tenants** - Pagination, search, filters
- **Create Tenant** - Valid/invalid data, duplicates
- **Get Tenant** - By ID, non-existent
- **Update Tenant** - Valid/invalid updates
- **Delete Tenant** - Soft delete, permissions
- **Tenant Users** - List users by tenant
- **Tenant Settings** - Login restrictions

### 3. User Management Tests (`users.e2e.test.ts`)

Tests user CRUD operations:

- **List Users** - Pagination, search, filters, tenant scoping
- **Create User** - Valid/invalid data, duplicates
- **Get User** - By ID, non-existent
- **Update User** - Valid/invalid updates, password changes
- **Delete User** - Soft delete
- **User Devices** - List user devices
- **User Audit Logs** - Activity tracking
- **Password Reset** - Admin-initiated reset

### 4. Support System Tests (`support.e2e.test.ts`)

Tests support ticket management:

- **List Tickets** - Pagination, search, filters
- **Create Ticket** - Valid/invalid data
- **Get Ticket** - By ID, non-existent
- **Update Ticket** - Status, priority changes
- **Ticket Replies** - Add replies, list replies
- **File Attachments** - Upload, validation
- **Delete Ticket** - Soft delete
- **Statistics** - Support metrics

## Test Data Management

### Database Setup

E2E tests use a separate test database with automatic setup and teardown:

```typescript
// Automatic setup before all tests
beforeAll(async () => {
  await global.e2eUtils.setupTestDatabase();
});

// Automatic cleanup after each test
afterEach(async () => {
  await global.e2eUtils.cleanupTestData();
});

// Automatic teardown after all tests
afterAll(async () => {
  await global.e2eUtils.teardownTestDatabase();
});
```

### Test Data Isolation

Each test creates its own test data and cleans up after execution to ensure test isolation:

```typescript
describe("User Management", () => {
  let testTenant: any;
  let testUser: any;

  beforeAll(async () => {
    // Create test data for this test suite
    testTenant = await global.e2eUtils.createTestTenant();
    testUser = await global.e2eUtils.createTestUser(testTenant.id);
  });

  // Tests run here...

  // Cleanup happens automatically in afterEach
});
```

## Mocking Strategy

### Logger Mocking

The logger is mocked in unit tests to prevent console output during testing:

```typescript
jest.mock("@/libraries/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    // ... other methods
  },
}));
```

### Database Mocking

Unit tests use mocked database operations, while E2E tests use real Supabase database:

```typescript
// Unit test - mocked
jest.mock("@/models", () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

// E2E test - real database
const user = await global.e2eUtils.createTestUser(tenantId);
```

## Test Execution Order

E2E tests are executed in a specific order to ensure dependencies are met:

1. **Database & Setup** - Database initialization
2. **Authentication** - Login, logout, token management
3. **Core Entities** - Tenants, users, roles, permissions
4. **Support System** - Tickets, replies, attachments
5. **Audit & Devices** - Logging and device management
6. **Integration** - End-to-end workflows

## Coverage Requirements

The test suite aims for comprehensive coverage:

- **Unit Tests**: 80%+ coverage
- **E2E Tests**: Critical user journeys
- **Integration Tests**: API workflows

### Coverage Areas

- ✅ Authentication flows
- ✅ CRUD operations
- ✅ Validation logic
- ✅ Error handling
- ✅ Authorization checks
- ✅ Database operations
- ✅ File uploads
- ✅ Audit logging

## Best Practices

### Test Naming

Use descriptive test names that explain the scenario:

```typescript
it("should create user successfully with valid data", async () => {
  // Test implementation
});

it("should fail to create user with duplicate email", async () => {
  // Test implementation
});
```

### Test Structure

Follow the AAA pattern (Arrange, Act, Assert):

```typescript
it("should update user successfully", async () => {
  // Arrange
  const user = await createTestUser();
  const updateData = { first_name: "Updated" };

  // Act
  const response = await makeRequest(
    "PUT",
    `/users/${user.id}`,
    updateData,
    token
  );

  // Assert
  expect(response.status).toBe(200);
  expect(response.data.data.first_name).toBe(updateData.first_name);
});
```

### Error Testing

Always test both success and failure scenarios:

```typescript
describe("User Creation", () => {
  it("should create user successfully", async () => {
    // Success test
  });

  it("should fail with invalid email", async () => {
    // Error test
  });

  it("should fail with missing required fields", async () => {
    // Error test
  });
});
```

### Data Cleanup

Ensure proper cleanup to prevent test interference:

```typescript
afterEach(async () => {
  await global.e2eUtils.cleanupTestData();
});
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**

   - Check Supabase configuration in `env.test`
   - Ensure test database exists
   - Verify network connectivity

2. **Test Timeout Errors**

   - Increase timeout in Jest config
   - Check for hanging database connections
   - Review async/await usage

3. **Authentication Errors**
   - Verify JWT configuration
   - Check token expiration
   - Ensure proper user setup

### Debug Mode

Run tests in debug mode for detailed output:

```bash
# Debug unit tests
npm test -- --verbose

# Debug E2E tests
npm run test:e2e -- --verbose --detectOpenHandles
```

### Test Isolation

If tests are interfering with each other:

1. Check for shared state
2. Ensure proper cleanup
3. Use unique test data
4. Review test execution order

## Continuous Integration

The test suite is designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm install
    npm run test:all
    npm run test:coverage
```

## Performance Considerations

- E2E tests run sequentially to avoid database conflicts
- Test data is cleaned up after each test
- Database connections are pooled
- Timeouts are set appropriately for each test type

## Future Enhancements

- [ ] Add performance tests
- [ ] Implement load testing
- [ ] Add visual regression tests
- [ ] Expand API contract testing
- [ ] Add security testing
- [ ] Implement chaos engineering tests
