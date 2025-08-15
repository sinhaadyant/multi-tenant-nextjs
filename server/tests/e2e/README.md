# E2E Test Suite for Multi-Tenant Admin API

This directory contains comprehensive end-to-end tests for the Multi-Tenant Admin API, testing all major functionality against a real database.

## Overview

The E2E test suite covers all major API endpoints and functionality:

- **Authentication API** - Login, logout, token refresh, password reset
- **User Management API** - CRUD operations, bulk operations, profile management
- **Role Management API** - Role creation, permissions, cloning
- **Tenant Management API** - Tenant operations, user management, statistics

## Test Structure

```
tests/e2e/
├── README.md                 # This file
├── auth.test.js             # Authentication API tests
├── user-management.test.js  # User Management API tests
├── role-management.test.js  # Role Management API tests
├── tenant-management.test.js # Tenant Management API tests
└── credentials.js           # Centralized test credentials
```

## Test Credentials

All tests use centralized credentials defined in `credentials.js`:

### Test Users

- **Superadmin**: `superadmin@test.com` / `SuperadminPassword123!`
- **Admin**: `admin@test.com` / `AdminPassword123!`
- **User**: `user@test.com` / `UserPassword123!`
- **Test User**: `testuser@test.com` / `TestUserPassword123!`

### Test Tenants

- **Primary**: `Test Tenant` / `test.com`
- **Secondary**: `Other Tenant` / `other.com`

### Test Roles

- **Admin Role**: Full permissions within tenant
- **User Role**: Limited permissions within tenant

## Running Tests

### Prerequisites

1. **Database**: MySQL server running with test database
2. **Redis**: Redis server running for session management
3. **Environment**: Node.js and npm installed
4. **Dependencies**: All npm packages installed

### Environment Setup

```bash
# Set up test environment variables
export DATABASE_URL="mysql://root:password@localhost:3306/multi_tenant_admin_test"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="test-jwt-secret-key-for-testing-only"
export JWT_REFRESH_SECRET="test-refresh-secret-key-for-testing-only"
export NODE_ENV="test"
```

### Running All Tests

```bash
# Run all E2E tests
npm run test:e2e

# Or use the test runner directly
node tests/run-e2e-tests.js
```

### Running Specific Test Files

```bash
# Run authentication tests only
npm run test:e2e:auth

# Run user management tests only
npm run test:e2e:users

# Run role management tests only
npm run test:e2e:roles

# Run tenant management tests only
npm run test:e2e:tenants

# Run specific test file
node tests/run-e2e-tests.js --file tests/e2e/auth.test.js
```

### Database Setup

```bash
# Set up test database
npm run db:test:setup

# Clean test database
npm run db:test:clean
```

## Test Categories

### 1. Authentication Tests (`auth.test.js`)

**Endpoints Tested:**

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/sessions` - Get user sessions
- `DELETE /api/auth/sessions/:id` - Delete session

**Test Scenarios:**

- ✅ Valid login with correct credentials
- ✅ Invalid login with wrong password
- ✅ Invalid login with non-existent user
- ✅ Login with inactive user
- ✅ Token refresh with valid refresh token
- ✅ Token refresh with expired refresh token
- ✅ Password reset flow
- ✅ Session management
- ✅ Rate limiting for failed attempts

### 2. User Management Tests (`user-management.test.js`)

**Endpoints Tested:**

- `GET /api/users` - Get all users (with pagination, search, filters)
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/bulk` - Bulk operations
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile

**Test Scenarios:**

- ✅ Create user with valid data
- ✅ Create user with duplicate email
- ✅ Create user with invalid data
- ✅ Update user profile
- ✅ Delete user (with and without permissions)
- ✅ Bulk activate/deactivate users
- ✅ User search and filtering
- ✅ Pagination
- ✅ Data scope filtering (tenant isolation)
- ✅ Permission-based access control

### 3. Role Management Tests (`role-management.test.js`)

**Endpoints Tested:**

- `GET /api/roles` - Get all roles (with pagination, search, filters)
- `POST /api/roles` - Create new role
- `GET /api/roles/:id` - Get role by ID
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `POST /api/roles/:id/clone` - Clone role

**Test Scenarios:**

- ✅ Create role with permissions
- ✅ Create role with duplicate name
- ✅ Update role details
- ✅ Delete role (when not assigned)
- ✅ Clone role with permissions
- ✅ Role search and filtering
- ✅ Pagination
- ✅ Data scope filtering (tenant isolation)
- ✅ Permission-based access control

### 4. Tenant Management Tests (`tenant-management.test.js`)

**Endpoints Tested:**

- `GET /api/tenants` - Get all tenants (with pagination, search, filters)
- `POST /api/tenants` - Create new tenant
- `GET /api/tenants/:id` - Get tenant by ID
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant
- `GET /api/tenants/:id/users` - Get tenant users
- `GET /api/tenants/stats` - Get tenant statistics
- `POST /api/tenants/bulk` - Bulk operations

**Test Scenarios:**

- ✅ Create tenant with valid domain
- ✅ Create tenant with duplicate domain
- ✅ Update tenant settings
- ✅ Delete tenant (when no users)
- ✅ Tenant user management
- ✅ Bulk tenant operations
- ✅ Tenant search and filtering
- ✅ Pagination
- ✅ Tenant statistics
- ✅ Superadmin-only access control

## Test Features

### 1. Real Database Testing

- All tests connect to a real MySQL database
- Tests verify both API responses and database state changes
- Proper cleanup between tests to ensure isolation

### 2. Authentication & Authorization

- JWT token-based authentication
- Role-based access control
- Permission-based data scope filtering
- Multi-tenant isolation

### 3. Comprehensive Coverage

- **Happy Path Tests**: Valid operations with expected results
- **Negative Tests**: Invalid inputs, missing data, wrong permissions
- **Edge Cases**: Boundary values, special characters, large payloads
- **Performance Tests**: Rapid requests, large datasets, pagination

### 4. Data Validation

- Input validation using Zod schemas
- Database constraint validation
- Business rule validation
- Error message validation

### 5. Security Testing

- Authentication bypass attempts
- Authorization bypass attempts
- Data scope bypass attempts
- Input sanitization

## Test Utilities

### Credentials Management

All test credentials are centralized in `credentials.js`:

```javascript
const credentials = require('../credentials');

// Use in tests
const loginData = {
  email: credentials.users.admin.email,
  password: credentials.users.admin.password,
};
```

### Test Data Generation

Utility functions for generating test data:

```javascript
// Generate test email
const email = credentials.utils.generateEmail('test', 1); // test1@test.com

// Generate test password
const password = credentials.utils.generatePassword('Admin'); // AdminPassword123!

// Generate test name
const name = credentials.utils.generateName('Test', 1); // Test User 1
```

### Error Message Validation

Centralized error messages for consistent validation:

```javascript
expect(response.body.message).toContain(
  credentials.errors.userManagement.userNotFound
);
```

## Test Configuration

### Jest Configuration

Tests use Jest with the following configuration:

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true,
  colors: true,
  // ... other config
};
```

### Environment Variables

Required environment variables for testing:

```env
NODE_ENV=test
DATABASE_URL=mysql://root:password@localhost:3306/multi_tenant_admin_test
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-jwt-secret-key-for-testing-only
JWT_REFRESH_SECRET=test-refresh-secret-key-for-testing-only
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   ```bash
   # Check database is running
   mysql -u root -p

   # Create test database if needed
   CREATE DATABASE multi_tenant_admin_test;
   ```

2. **Redis Connection Failed**

   ```bash
   # Check Redis is running
   redis-cli ping

   # Start Redis if needed
   redis-server
   ```

3. **Test Timeout**

   ```bash
   # Increase timeout in jest.config.js
   testTimeout: 60000
   ```

4. **Permission Denied**
   ```bash
   # Make test runner executable
   chmod +x tests/run-e2e-tests.js
   ```

### Debug Mode

Run tests with verbose output:

```bash
# Run with Jest verbose mode
npx jest tests/e2e/auth.test.js --verbose

# Run with custom timeout
npx jest tests/e2e/auth.test.js --testTimeout=60000
```

### Database Reset

If tests fail due to database state:

```bash
# Reset test database
npm run db:test:clean

# Re-run tests
npm run test:e2e
```

## Contributing

### Adding New Tests

1. **Create test file**: `tests/e2e/new-module.test.js`
2. **Import credentials**: `const credentials = require('../credentials');`
3. **Follow naming convention**: Use descriptive test names
4. **Add to test runner**: Update `tests/run-e2e-tests.js`
5. **Update package.json**: Add new test script

### Test Naming Convention

```javascript
describe('Module Name - E2E Tests', () => {
  describe('GET /api/endpoint', () => {
    test('should do something with valid data', async () => {
      // Test implementation
    });

    test('should fail with invalid data', async () => {
      // Test implementation
    });
  });
});
```

### Best Practices

1. **Use centralized credentials** from `credentials.js`
2. **Clean up test data** in `beforeEach` hooks
3. **Verify both API and database state** for state-changing operations
4. **Test edge cases** and error conditions
5. **Use descriptive test names** that explain the scenario
6. **Add performance tests** for critical operations
7. **Test security aspects** like authentication and authorization

## Performance Benchmarks

The test suite includes performance tests to ensure API responsiveness:

- **User Creation**: 10 concurrent requests < 10 seconds
- **User Listing**: 50 users with pagination < 2 seconds
- **Role Creation**: 10 concurrent requests < 10 seconds
- **Tenant Creation**: 10 concurrent requests < 10 seconds

## Security Testing

The test suite validates security aspects:

- **Authentication**: Valid/invalid credentials, token validation
- **Authorization**: Role-based access, permission checks
- **Data Scope**: Tenant isolation, cross-tenant access prevention
- **Input Validation**: SQL injection prevention, XSS protection
- **Rate Limiting**: API abuse prevention

## Continuous Integration

The test suite is designed for CI/CD integration:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: |
    npm run db:test:setup
    npm run test:e2e
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    REDIS_URL: ${{ secrets.REDIS_URL }}
```

## Support

For issues with the test suite:

1. Check the troubleshooting section above
2. Review test logs for specific error messages
3. Verify database and Redis connectivity
4. Ensure all dependencies are installed
5. Check environment variable configuration
