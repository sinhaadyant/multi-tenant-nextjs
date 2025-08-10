# Tenant API Test Suite

This directory contains comprehensive test files for all tenant APIs in the multi-tenant Next.js application. The test suite covers authentication, authorization, CRUD operations, edge cases, and performance testing.

## 📁 Test Files Structure

```
src/__tests__/api/tenant/
├── README.md                           # This documentation
├── tenant-auth-tests.ts               # Authentication & authorization tests
├── tenant-users-api.test.ts           # Users API tests
├── tenant-roles-api.test.ts           # Roles API tests
├── tenant-audit-logs-api.test.ts      # Audit logs API tests
├── tenant-dashboard-api.test.ts       # Dashboard API tests
├── tenant-support-api.test.ts         # Support API tests
├── tenant-notifications-api.test.ts   # Notifications API tests
├── tenant-settings-api.test.ts        # Settings API tests
├── tenant-profile-api.test.ts         # Profile API tests
├── tenant-permissions-api.test.ts     # Permissions API tests
├── run-tenant-tests.ts                # Test runner script
└── test-config.ts                     # Test configuration
```

## 🧪 Test Coverage

### Authentication & Authorization Tests
- **Valid credentials**: Test successful login with correct credentials
- **Invalid credentials**: Test failed login with wrong credentials
- **Expired tokens**: Test handling of expired authentication tokens
- **Missing tokens**: Test requests without authentication tokens
- **Malformed tokens**: Test requests with invalid token formats
- **Concurrent sessions**: Test multiple simultaneous user sessions
- **Role-based access**: Test different user roles and permissions
- **Cross-tenant access**: Test access restrictions between tenants
- **Inactive tenants**: Test access to suspended/inactive tenants

### Users API Tests
- **GET /users**: List users with pagination, filtering, and search
- **POST /users**: Create new users with validation
- **PUT /users/[id]**: Update existing users
- **DELETE /users/[id]**: Delete users (with safety checks)
- **Bulk operations**: Activate, deactivate, assign roles in bulk
- **Validation**: Email format, password strength, required fields
- **Edge cases**: Duplicate emails, self-deletion prevention

### Roles API Tests
- **GET /roles**: List roles with permissions
- **POST /roles**: Create new roles with permission assignments
- **PUT /roles/[id]**: Update roles and permissions
- **DELETE /roles/[id]**: Delete roles (with dependency checks)
- **Role assignment**: Assign/remove roles from users
- **Permission management**: Validate permission assignments
- **System roles**: Protection of system-defined roles

### Audit Logs API Tests
- **GET /audit-logs**: List audit logs with filters
- **Filters**: By action, date range, user, IP address
- **Search**: Text search in descriptions
- **Export**: CSV and JSON export functionality
- **Analytics**: Statistics and trends
- **Large datasets**: Performance with high volume data

### Dashboard API Tests
- **GET /dashboard**: Dashboard statistics and metrics
- **Charts**: User activity, role distribution, ticket status
- **Analytics**: Performance metrics and trends
- **Date ranges**: Filtering by time periods
- **Real-time data**: Current system status

### Support API Tests
- **GET /support**: List support tickets
- **POST /support**: Create new tickets
- **Status management**: Update ticket status
- **Comments**: Add internal/external comments
- **Escalation**: Escalate tickets to higher priority
- **Attachments**: File upload handling

## 🚀 Running Tests

### Prerequisites
1. Ensure the development server is running: `npm run dev`
2. Database should be seeded with test data
3. All dependencies installed: `npm install`

### Run All Tests
```bash
# Run all tenant API tests
npm run test:tenant

# Or run the test runner script directly
node scripts/run-tenant-tests.js
```

### Run Specific Test Categories
```bash
# Run only authentication tests
npm test -- --testPathPattern="tenant-auth-tests"

# Run only users API tests
npm test -- --testPathPattern="tenant-users-api"

# Run only roles API tests
npm test -- --testPathPattern="tenant-roles-api"

# Run only audit logs tests
npm test -- --testPathPattern="tenant-audit-logs-api"
```

### Run Tests with Coverage
```bash
# Run tests with coverage report
npm run test:coverage -- --testPathPattern="tenant"

# Run tests with watch mode
npm run test:watch -- --testPathPattern="tenant"
```

## 👥 Test User Credentials

The test suite uses predefined user accounts for different tenant types:

### TechCorp Solutions (`techcorp`)
- **Admin**: `admin@techcorp.com` / `AdminPass123`
- **Manager**: `manager@techcorp.com` / `AdminPass123`
- **User**: `user@techcorp.com` / `AdminPass123`
- **Viewer**: `viewer@techcorp.com` / `AdminPass123`

### Global Retail Inc (`globalretail`)
- **Admin**: `admin@globalretail.com` / `AdminPass123`
- **Manager**: `manager@globalretail.com` / `AdminPass123`
- **User**: `user@globalretail.com` / `AdminPass123`
- **Viewer**: `viewer@globalretail.com` / `AdminPass123`

## 🔧 Test Configuration

### Environment Variables
```bash
# Test environment
NODE_ENV=test
DATABASE_URL=mysql://user:password@localhost:3306/test_db
JWT_SECRET=test-secret-key
```

### Test Data Setup
The test suite automatically sets up test data including:
- Test tenants (TechCorp, Global Retail)
- User accounts with different roles
- Sample audit logs
- Support tickets
- Notifications

## 📊 Test Reports

### Console Output
Tests provide real-time feedback with:
- ✅ Passed tests
- ❌ Failed tests with error details
- 📊 Summary statistics
- ⏱️ Performance metrics

### Detailed Reports
After test completion, a detailed JSON report is generated at:
```
scripts/tenant-test-report.json
```

The report includes:
- Test execution summary
- Individual test results
- Performance metrics
- Error details
- Test configuration

## 🛡️ Security Testing

The test suite includes security-focused tests:

### Input Validation
- SQL injection attempts
- XSS attack vectors
- Path traversal attempts
- Malformed JSON payloads
- Oversized requests

### Authentication Security
- Token validation
- Session management
- Permission escalation attempts
- Cross-tenant access prevention

### Data Protection
- Sensitive data exposure
- Unauthorized data access
- Data integrity validation

## ⚡ Performance Testing

### Response Time Tests
- Fast responses (< 100ms)
- Acceptable responses (< 500ms)
- Slow response detection (> 2s)

### Throughput Tests
- Concurrent request handling
- Database query optimization
- Memory usage monitoring

### Load Testing
- Large dataset handling
- Bulk operation performance
- System resource utilization

## 🔍 Edge Cases

### Data Edge Cases
- Empty datasets
- Maximum field lengths
- Special characters
- Unicode support
- Null/undefined values

### System Edge Cases
- Database connection failures
- Network timeouts
- Concurrent modifications
- Resource exhaustion
- Invalid state transitions

## 🐛 Debugging Tests

### Enable Verbose Output
```bash
npm test -- --verbose --testPathPattern="tenant"
```

### Debug Specific Test
```bash
# Debug a specific test case
npm test -- --testNamePattern="should create a new user successfully"
```

### Mock Inspection
```bash
# Enable mock debugging
DEBUG=jest:mock npm test -- --testPathPattern="tenant"
```

## 📝 Adding New Tests

### Test File Structure
```typescript
import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/tenant/[tenantSlug]/endpoint/route';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/authMiddleware');
jest.mock('@/lib/apiResponse');

describe('Endpoint API Tests', () => {
  let mockRequest: NextRequest;
  const mockParams = { tenantSlug: 'techcorp' };

  beforeEach(() => {
    // Setup mocks and test data
  });

  describe('GET /api/tenant/[tenantSlug]/endpoint', () => {
    it('should return data successfully', async () => {
      // Test implementation
    });
  });
});
```

### Test Categories
1. **Happy Path**: Successful operations
2. **Validation**: Input validation and error handling
3. **Authorization**: Permission checks
4. **Edge Cases**: Boundary conditions and error scenarios
5. **Performance**: Response time and throughput
6. **Security**: Security vulnerability testing

## 🤝 Contributing

### Test Guidelines
1. **Descriptive names**: Use clear, descriptive test names
2. **Single responsibility**: Each test should test one specific behavior
3. **Proper setup/teardown**: Clean up test data after each test
4. **Mock external dependencies**: Don't rely on external services
5. **Assertion clarity**: Make assertions clear and specific

### Code Style
- Follow existing test patterns
- Use TypeScript for type safety
- Include proper JSDoc comments
- Follow Jest best practices

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW (Mock Service Worker)](https://mswjs.io/docs/)
- [Next.js Testing](https://nextjs.org/docs/testing)

## 🆘 Troubleshooting

### Common Issues

**Tests failing with database errors**
```bash
# Reset test database
npm run db:reset
npm run db:seed
```

**Authentication tests failing**
```bash
# Check JWT configuration
echo $JWT_SECRET
# Ensure test users exist in database
```

**Performance tests timing out**
```bash
# Increase timeout
npm test -- --testTimeout=30000
```

**Mock not working**
```bash
# Clear Jest cache
npm test -- --clearCache
```

For additional support, please check the project's main documentation or create an issue in the repository. 