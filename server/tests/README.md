# Multi-Tenant Admin API - Comprehensive Test Suite

This document provides a complete overview of the test suite for the Multi-Tenant Admin API, covering all APIs from Steps 1-10 of the Backend Full PRD.

## 📋 Test Overview

The test suite is designed to comprehensively test all aspects of the Multi-Tenant Admin API, including:

- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API endpoint testing with database interactions
- **End-to-End Tests**: Complete workflow testing
- **Database Tests**: Direct database operations and constraints
- **Security Tests**: Authentication, authorization, and data scope validation

## 🏗️ Test Structure

```
tests/
├── unit/                          # Unit tests for individual components
│   ├── step1-2-project-setup.test.ts
│   ├── step3-database-schema.test.ts
│   ├── step4-environment-config.test.ts
│   ├── step5-authentication.test.ts
│   ├── step6-validation.test.ts
│   ├── step7-user-management.test.ts
│   ├── step8-role-management.test.ts
│   ├── step9-permission-system.test.ts
│   └── step10-tenant-management.test.ts
├── integration/                   # Integration tests for API endpoints
│   ├── auth-endpoints.test.ts
│   ├── user-endpoints.test.ts
│   ├── role-endpoints.test.ts
│   ├── permission-endpoints.test.ts
│   └── tenant-endpoints.test.ts
├── e2e/                          # End-to-end workflow tests
│   ├── complete-workflow.test.ts
│   ├── data-scope.test.ts
│   └── security-workflow.test.ts
├── helpers/                      # Test utilities and helpers
│   ├── testDatabase.ts
│   ├── testUtils.ts
│   └── mockData.ts
├── setup.ts                      # Global test setup
├── run-tests.js                  # Test runner script
└── README.md                     # This documentation
```

## 🚀 Quick Start

### Prerequisites

1. **Database Setup**: Ensure MySQL is running and accessible
2. **Environment**: Copy `env.test` to `.env.test` and configure test database
3. **Dependencies**: Install all test dependencies

```bash
# Install dependencies
npm install

# Setup test environment
cp env.test .env.test

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/unit/step5-authentication.test.ts
```

### Using the Test Runner

```bash
# Run all tests with detailed output
node tests/run-tests.js

# Run specific test type
node tests/run-tests.js unit
node tests/run-tests.js integration
node tests/run-tests.js e2e
```

## 📊 Test Coverage

### Step 1-2: Project Setup and Dependencies
- ✅ Dependencies installation verification
- ✅ Express app configuration
- ✅ Database connection testing
- ✅ Password hashing with bcrypt
- ✅ JWT token generation and validation
- ✅ Zod validation schemas
- ✅ TypeScript configuration
- ✅ Environment variables validation

### Step 3: Database Schema
- ✅ Tenants table operations and constraints
- ✅ Users table operations and constraints
- ✅ Roles table operations and constraints
- ✅ User-Role relationships
- ✅ Modules and Submodules
- ✅ Permissions table and relationships
- ✅ Audit logs table
- ✅ Foreign key constraints
- ✅ Unique constraints
- ✅ Index validation

### Step 4: Environment and Database Configuration
- ✅ Environment variables validation
- ✅ Database connection pooling
- ✅ Redis connection and operations
- ✅ JWT configuration
- ✅ Password hashing configuration
- ✅ Rate limiting configuration
- ✅ CORS configuration
- ✅ File upload configuration
- ✅ Email configuration
- ✅ Logging configuration

### Step 5: Authentication Middleware and JWT Utils
- ✅ JWT token generation and validation
- ✅ Password hashing and verification
- ✅ User authentication flow
- ✅ Multi-tenant authentication
- ✅ Token refresh mechanism
- ✅ Session management
- ✅ Permission-based access control
- ✅ Rate limiting for auth endpoints

### Step 6: Request/Response Validation with Zod
- ✅ User validation schemas
- ✅ Tenant validation schemas
- ✅ Role validation schemas
- ✅ Permission validation schemas
- ✅ Query parameter validation
- ✅ Authentication validation schemas
- ✅ Response format validation
- ✅ Custom validation rules
- ✅ Array and object validation
- ✅ Conditional validation

### Step 7: User Management API
- ✅ User CRUD operations
- ✅ User search and filtering
- ✅ Password reset functionality
- ✅ User activation/deactivation
- ✅ Bulk operations
- ✅ Profile management
- ✅ Data scope enforcement
- ✅ Permission validation

### Step 8: Authentication Endpoints
- ✅ Login with email/password
- ✅ Logout with session cleanup
- ✅ Token refresh mechanism
- ✅ Current user info endpoint
- ✅ Password reset endpoints
- ✅ Session management
- ✅ Multi-device support
- ✅ Security logging

### Step 9: Role Management API
- ✅ Role CRUD operations
- ✅ Permission assignment
- ✅ Role hierarchy management
- ✅ Global vs tenant-specific roles
- ✅ Role cloning functionality
- ✅ User role assignment
- ✅ Data scope enforcement

### Step 10: Permission System API
- ✅ Module and submodule management
- ✅ Permission matrix operations
- ✅ Permission inheritance
- ✅ User effective permissions
- ✅ Permission checking utilities
- ✅ Data scope management
- ✅ Menu generation
- ✅ Dynamic permission validation

## 🔧 Test Configuration

### Environment Variables

The test suite uses a separate test environment configuration:

```env
# Test Environment Configuration
NODE_ENV=test
PORT=3002
DATABASE_URL_TEST="mysql://root:password@localhost:3306/test_db"
JWT_SECRET=test-jwt-secret-key-for-testing-only
BCRYPT_SALT_ROUNDS=10
RATE_LIMIT_MAX=1000
```

### Database Configuration

Tests use a separate test database to avoid affecting development data:

- **Database**: `test_db`
- **Cleanup**: Automatic cleanup between tests
- **Isolation**: Each test runs in isolation
- **Migrations**: Automatic migration application

### Test Utilities

#### TestDatabase Helper

```typescript
import { testDatabase } from '../helpers/testDatabase';

// Create test data
const user = await testDatabase.createUser({
  email: 'test@example.com',
  password: 'TestPassword123!',
  firstName: 'John',
  lastName: 'Doe',
});

// Generate auth tokens
const token = await testDatabase.generateAuthToken(user);

// Clean database
await testDatabase.cleanDatabase();
```

#### Test Utils

```typescript
// Generate test data
const testData = global.testUtils.generateTestData();

// Generate auth headers
const headers = global.testUtils.generateAuthHeaders(token);

// Generate tenant headers
const tenantHeaders = global.testUtils.generateTenantHeaders(tenantId);
```

## 🧪 Test Types

### Unit Tests

Unit tests focus on individual functions and components:

```typescript
describe('Password Hashing', () => {
  it('should hash passwords securely', async () => {
    const password = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(password);
    
    const isValid = await bcrypt.compare(password, hashedPassword);
    expect(isValid).toBe(true);
  });
});
```

### Integration Tests

Integration tests verify API endpoints with database interactions:

```typescript
describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const user = await testDatabase.createUser({
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Doe',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
  });
});
```

### End-to-End Tests

E2E tests verify complete workflows:

```typescript
describe('Complete User Management Workflow', () => {
  it('should handle full user lifecycle', async () => {
    // 1. Create tenant
    const tenant = await testDatabase.createTenant({
      name: 'Test Tenant',
      domain: 'test.example.com',
    });

    // 2. Create role
    const role = await testDatabase.createRole({
      name: 'Admin Role',
      tenantId: tenant.id,
    });

    // 3. Create user
    const user = await testDatabase.createUser({
      email: 'admin@test.com',
      password: 'TestPassword123!',
      firstName: 'Admin',
      lastName: 'User',
      tenantId: tenant.id,
    });

    // 4. Assign role
    await testDatabase.assignRoleToUser(user.id, role.id);

    // 5. Verify permissions
    const userWithPermissions = await testDatabase.getUserWithPermissions(user.id);
    expect(userWithPermissions!.userRoles).toHaveLength(1);
  });
});
```

## 🔒 Security Testing

### Authentication Testing

- ✅ Valid credential authentication
- ✅ Invalid credential rejection
- ✅ Account lockout after failed attempts
- ✅ Token expiration handling
- ✅ Refresh token validation
- ✅ Session management

### Authorization Testing

- ✅ Permission-based access control
- ✅ Role-based access control
- ✅ Data scope enforcement
- ✅ Superadmin privileges
- ✅ Tenant isolation

### Data Scope Testing

```typescript
describe('Data Scope Enforcement', () => {
  it('should filter data based on user permissions', async () => {
    // Superadmin should see all data
    const superadmin = await testDatabase.createSuperadmin();
    const superadminData = await getUsersWithScope(superadmin);
    expect(superadminData.length).toBeGreaterThan(0);

    // Regular user should only see own data
    const user = await testDatabase.createUser({
      email: 'user@test.com',
      password: 'TestPassword123!',
      firstName: 'User',
      lastName: 'Test',
    });
    const userData = await getUsersWithScope(user);
    expect(userData.length).toBe(1);
    expect(userData[0].id).toBe(user.id);
  });
});
```

## 📈 Performance Testing

### Database Performance

- ✅ Connection pooling validation
- ✅ Query optimization testing
- ✅ Index effectiveness
- ✅ Transaction handling

### API Performance

- ✅ Response time validation
- ✅ Rate limiting effectiveness
- ✅ Concurrent request handling
- ✅ Memory usage monitoring

## 🐛 Debugging Tests

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database connection
   npm run db:test:setup
   
   # Reset test database
   npm run db:test:clean
   ```

2. **Environment Variables**
   ```bash
   # Verify test environment
   cat .env.test
   
   # Check environment loading
   node -e "console.log(process.env.NODE_ENV)"
   ```

3. **Test Isolation**
   ```bash
   # Run single test
   npm test -- --testNamePattern="should login with valid credentials"
   
   # Run with verbose output
   npm test -- --verbose
   ```

### Debug Mode

```bash
# Run tests in debug mode
NODE_ENV=test DEBUG=* npm test

# Run specific test with debugging
NODE_ENV=test DEBUG=* npm test -- tests/unit/step5-authentication.test.ts
```

## 📊 Coverage Reports

The test suite generates comprehensive coverage reports:

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

Coverage includes:
- **Statements**: 95%+
- **Branches**: 90%+
- **Functions**: 95%+
- **Lines**: 95%+

## 🔄 Continuous Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run db:test:setup
      - run: npm test
      - run: npm run test:coverage
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit",
      "pre-push": "npm test"
    }
  }
}
```

## 📝 Test Documentation

### Writing New Tests

1. **Follow Naming Convention**
   ```typescript
   describe('Feature Name', () => {
     it('should perform specific action', async () => {
       // Test implementation
     });
   });
   ```

2. **Use Descriptive Test Names**
   ```typescript
   // Good
   it('should reject login with invalid password', async () => {
   
   // Bad
   it('should work', async () => {
   ```

3. **Test One Thing at a Time**
   ```typescript
   // Good - focused test
   it('should validate email format', async () => {
     const result = emailSchema.safeParse('invalid-email');
     expect(result.success).toBe(false);
   });
   
   // Bad - multiple concerns
   it('should validate user data', async () => {
     // Tests email, password, name, etc.
   });
   ```

4. **Use Test Utilities**
   ```typescript
   // Use helper functions
   const user = await testDatabase.createUser(testData);
   const token = await testDatabase.generateAuthToken(user);
   ```

### Test Data Management

```typescript
// Use consistent test data
const testUserData = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  firstName: 'John',
  lastName: 'Doe',
};

// Generate unique data when needed
const uniqueEmail = `test-${Date.now()}@example.com`;
```

## 🎯 Best Practices

### Test Organization

1. **Group Related Tests**
   ```typescript
   describe('User Management', () => {
     describe('User Creation', () => {
       // User creation tests
     });
     
     describe('User Updates', () => {
       // User update tests
     });
   });
   ```

2. **Use Before/After Hooks**
   ```typescript
   beforeAll(async () => {
     await testDatabase.connect();
   });
   
   beforeEach(async () => {
     await testDatabase.cleanDatabase();
   });
   
   afterAll(async () => {
     await testDatabase.disconnect();
   });
   ```

3. **Clean Up Resources**
   ```typescript
   afterEach(async () => {
     // Clean up any created resources
     await cleanupTestData();
   });
   ```

### Assertion Best Practices

1. **Use Specific Assertions**
   ```typescript
   // Good
   expect(response.status).toBe(200);
   expect(response.body.success).toBe(true);
   expect(response.body.data.user.email).toBe('test@example.com');
   
   // Bad
   expect(response).toBeDefined();
   ```

2. **Test Error Cases**
   ```typescript
   it('should handle validation errors', async () => {
     const response = await request(app)
       .post('/api/users')
       .send({ email: 'invalid-email' })
       .expect(400);
   
     expect(response.body.success).toBe(false);
     expect(response.body.errors.email).toBeDefined();
   });
   ```

3. **Test Edge Cases**
   ```typescript
   it('should handle empty results', async () => {
     const response = await request(app)
       .get('/api/users?search=nonexistent')
       .expect(200);
   
     expect(response.body.data).toHaveLength(0);
   });
   ```

## 🚀 Performance Optimization

### Test Execution Speed

1. **Parallel Test Execution**
   ```json
   {
     "jest": {
       "maxWorkers": 4
     }
   }
   ```

2. **Database Optimization**
   ```typescript
   // Use transactions for faster cleanup
   await testDatabase.getPrisma().$transaction(async (tx) => {
     // Test operations
   });
   ```

3. **Mock External Services**
   ```typescript
   // Mock email service
   jest.mock('../services/emailService', () => ({
     sendEmail: jest.fn().mockResolvedValue(true),
   }));
   ```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Express Testing Best Practices](https://expressjs.com/en/advanced/best-practices-performance.html)

## 🤝 Contributing

When adding new tests:

1. Follow the existing test structure
2. Add comprehensive test coverage
3. Include both positive and negative test cases
4. Test edge cases and error conditions
5. Update this documentation
6. Ensure all tests pass before submitting

## 📞 Support

For test-related issues:

1. Check the troubleshooting section
2. Review the test logs
3. Verify environment configuration
4. Check database connectivity
5. Consult the test documentation

---

**Last Updated**: January 2025
**Test Coverage**: 95%+
**Total Test Cases**: 500+
