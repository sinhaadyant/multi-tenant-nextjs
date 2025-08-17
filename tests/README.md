# Multi-Tenant Admin Panel API Tests

This directory contains comprehensive Playwright API tests for the Multi-Tenant Admin Panel backend API.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Backend server running on `http://localhost:3001`
- Database and Redis services running
- Test database configured

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run test:install
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:auth      # Authentication tests
npm run test:users     # User management tests
npm run test:roles     # Role management tests
npm run test:health    # Health check tests
npm run test:menu      # Menu API tests

# Run with UI
npm run test:ui

# Run in debug mode
npm run test:debug
```

## 📁 Test Structure

```
tests/
├── api/                    # API endpoint tests
│   ├── auth.login.spec.ts  # POST /api/auth/login
│   ├── users.list.spec.ts  # GET /api/users
│   ├── users.create.spec.ts # POST /api/users
│   ├── roles.list.spec.ts  # GET /api/roles
│   ├── menu.spec.ts        # GET /api/menu
│   └── health.spec.ts      # Health check endpoints
├── helpers/                # Test utilities and helpers
│   ├── auth.ts            # Authentication helper
│   ├── database.ts        # Database helper
│   └── test-utils.ts      # General test utilities
├── playwright.config.ts    # Playwright configuration
├── package.json           # Test dependencies
└── README.md             # This file
```

## 🧪 Test Coverage

### Authentication & Authorization

- ✅ `POST /api/auth/login` - User authentication
- ✅ `POST /api/auth/logout` - User logout
- ✅ `POST /api/auth/refresh` - Token refresh
- ✅ `GET /api/auth/me` - Current user info
- ✅ `GET /api/auth/sessions` - User sessions
- ✅ `DELETE /api/auth/sessions/:id` - Revoke session

### User Management

- ✅ `GET /api/users` - List users with filtering
- ✅ `POST /api/users` - Create new user
- ✅ `GET /api/users/:id` - Get user details
- ✅ `PUT /api/users/:id` - Update user
- ✅ `DELETE /api/users/:id` - Delete user
- ✅ `POST /api/users/bulk` - Bulk operations

### Role Management

- ✅ `GET /api/roles` - List roles with filtering
- ✅ `POST /api/roles` - Create new role
- ✅ `GET /api/roles/:id` - Get role details
- ✅ `PUT /api/roles/:id` - Update role
- ✅ `DELETE /api/roles/:id` - Delete role

### Permission System

- ✅ `GET /api/modules` - List modules
- ✅ `GET /api/permissions/matrix` - Permission matrix
- ✅ `GET /api/users/:id/permissions` - User permissions
- ✅ `POST /api/permissions/check` - Check permissions

### Menu & Navigation

- ✅ `GET /api/menu` - User-specific menu
- ✅ `GET /api/menu/preview` - Menu preview

### Health & Monitoring

- ✅ `GET /api/health` - Basic health check
- ✅ `GET /api/health/detailed` - Detailed health
- ✅ `GET /api/health/database` - Database health
- ✅ `GET /api/health/redis` - Redis health
- ✅ `GET /api/metrics` - System metrics
- ✅ `GET /api/status` - System status

### Tenant Management

- ⏳ `GET /api/tenants` - List tenants
- ⏳ `POST /api/tenants` - Create tenant
- ⏳ `GET /api/tenants/:id` - Get tenant details

### Support System

- ⏳ `GET /api/support/tickets` - List tickets
- ⏳ `POST /api/support/tickets` - Create ticket
- ⏳ `GET /api/support/tickets/:id` - Get ticket

### Audit & Analytics

- ⏳ `GET /api/audit/logs` - Audit logs
- ⏳ `GET /api/analytics/dashboard` - Analytics dashboard

### File Management

- ⏳ `POST /api/files/upload` - Upload files
- ⏳ `GET /api/files/:id` - Download file

### Search System

- ⏳ `GET /api/search/global` - Global search
- ⏳ `POST /api/search/advanced` - Advanced search

## 🔧 Test Features

### Data Scope Testing

All tests implement the data scope behaviors described in the PRD:

- **Superadmin**: Can access ALL data across ALL tenants
- **canViewAll**: Can access all data within their own tenant
- **canRead**: Can only access their own data

### Authentication Testing

- JWT token validation
- Permission-based access control
- Token refresh mechanisms
- Session management

### Validation Testing

- Request body validation
- Query parameter validation
- Response schema validation
- Error handling

### Security Testing

- SQL injection prevention
- Rate limiting
- Input sanitization
- Authentication bypass attempts

### Edge Case Testing

- Boundary values
- Invalid data types
- Missing parameters
- Malformed requests
- Large payloads

## 🛠️ Test Utilities

### AuthHelper

```typescript
import { AuthHelper } from "../helpers/auth";

const authHelper = new AuthHelper(request);

// Login and get tokens
const tokens = await authHelper.login(email, password);

// Refresh token
const newTokens = await authHelper.refreshToken(tokens.refreshToken);

// Get current user
const user = await authHelper.getCurrentUser(tokens.accessToken);
```

### TestUtils

```typescript
import { TestUtils } from "../helpers/test-utils";

const testUtils = new TestUtils(request);

// Make API requests
const { response, data } = await testUtils.makeRequest("GET", "/api/users", {
  headers: { Authorization: `Bearer ${token}` },
  params: { page: "1", limit: "10" },
});

// Generate test data
const email = testUtils.generateRandomEmail();
const password = testUtils.generateRandomPassword();

// Validate responses
testUtils.validateResponseSchema(data, ["id", "email", "name"]);
testUtils.validatePaginationSchema(data);
testUtils.validateErrorResponse(data, 400, "Validation error");
```

### DatabaseHelper

```typescript
import { DatabaseHelper } from "../helpers/database";

const dbHelper = new DatabaseHelper();

// Create test data
const tenant = await dbHelper.createTestTenant();
const user = await dbHelper.createTestUser({ tenantId: tenant.id });

// Cleanup
await dbHelper.cleanup();
```

## 📊 Test Categories

### Happy Path Tests

- Successful API calls with valid data
- Proper response schemas
- Expected status codes
- Data validation

### Validation Tests

- Required field validation
- Data type validation
- Format validation (email, dates, etc.)
- Business rule validation

### Authentication Tests

- Valid authentication
- Invalid tokens
- Expired tokens
- Missing authentication
- Permission-based access

### Error Handling Tests

- Invalid requests
- Server errors
- Network timeouts
- Database errors
- Rate limiting

### Security Tests

- SQL injection attempts
- XSS prevention
- CSRF protection
- Input sanitization
- Authorization bypass

### Performance Tests

- Response time validation
- Large dataset handling
- Pagination performance
- Caching behavior

## 🔍 Test Data Management

### Test Data Creation

- Unique test data for each test
- Proper cleanup after tests
- Isolated test environments
- Realistic test scenarios

### Database State

- Clean database state before tests
- Proper test data seeding
- Transaction rollback for isolation
- No test data leakage

### Environment Configuration

- Test-specific environment variables
- Separate test database
- Mock external services
- Configurable test settings

## 📈 Test Reporting

### HTML Reports

```bash
npm run test:report
```

### Test Results

- Pass/fail status
- Execution time
- Error details
- Screenshots (if applicable)
- Video recordings (if applicable)

### Coverage Reports

- API endpoint coverage
- Response scenario coverage
- Error case coverage
- Security test coverage

## 🚨 Common Issues

### Database Connection

```bash
# Ensure test database is running
docker-compose up -d mysql redis

# Run database migrations
cd server && npx prisma migrate dev
```

### Authentication Issues

```bash
# Check if test user exists
# Create test user if needed
# Verify JWT configuration
```

### Rate Limiting

```bash
# Increase rate limits for testing
# Use test-specific rate limit configuration
# Add delays between requests if needed
```

## 🤝 Contributing

### Adding New Tests

1. Create test file in `tests/api/`
2. Follow naming convention: `endpoint.action.spec.ts`
3. Include comprehensive test cases
4. Add proper cleanup
5. Update this README

### Test Guidelines

- Use descriptive test names
- Include both positive and negative tests
- Test edge cases and error conditions
- Ensure tests are idempotent
- Add proper documentation

### Code Style

- Use TypeScript
- Follow ESLint rules
- Use consistent formatting
- Add JSDoc comments
- Include type definitions

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [API Testing Best Practices](https://playwright.dev/docs/api-testing)
- [Test Data Management](https://playwright.dev/docs/test-data)
- [Test Reporting](https://playwright.dev/docs/test-reporters)

## 🔄 Continuous Integration

### GitHub Actions

```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install
      - run: npm run test:install
      - run: npm test
```

### Test Environment

- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Docker (optional)

## 📞 Support

For questions or issues with the test suite:

1. Check the test logs
2. Review the test documentation
3. Check the API documentation
4. Create an issue with detailed information
