# SuperAdmin Comprehensive Test Suite

This test suite provides comprehensive testing for all SuperAdmin modules including authentication, roles management, tenants management, users management, audit logs, and dashboard functionality.

## 📋 Test Coverage

### 🔐 Authentication Tests (`auth.test.js`)
- **Login functionality**: Valid credentials, invalid credentials, missing fields
- **Forgot password**: Email validation, token generation
- **Reset password**: Token validation, password strength validation
- **Logout**: Session termination
- **Token refresh**: Refresh token functionality
- **Remember me**: Extended session functionality

### 👥 Roles Management Tests (`roles.test.js`)
- **CRUD operations**: Create, Read, Update, Delete roles
- **Pagination**: Page-based results with customizable limits
- **Search & filtering**: By name, status, permissions
- **Sorting**: By various fields in ascending/descending order
- **Permission assignment**: Role-permission relationships
- **Validation**: Duplicate names, invalid data

### 🏢 Tenants Management Tests (`tenants.test.js`)
- **CRUD operations**: Create, Read, Update, Delete tenants
- **Admin user creation**: Tenant with admin user setup
- **Plan management**: Basic, premium, enterprise plans
- **Region support**: Multi-region tenant deployment
- **Settings management**: Tenant-specific configurations
- **Statistics**: Tenant metrics and analytics

### 👤 Users Management Tests (`users.test.js`)
- **CRUD operations**: Create, Read, Update, Delete users
- **Role assignment**: User-role relationships
- **Password management**: Reset, validation, security
- **Status management**: Active/inactive users
- **Search & filtering**: By email, role, status
- **Statistics**: User metrics and distribution

### 📋 Audit Logs Tests (`audit-logs.test.js`)
- **Log retrieval**: Paginated audit log access
- **Advanced filtering**: By action, user, date range, IP address
- **Export functionality**: CSV and JSON formats
- **Statistics**: Log analytics and metrics
- **Search**: Advanced search capabilities
- **Cleanup**: Automated log deletion

### 📊 Dashboard Tests (`dashboard.test.js`)
- **Overview data**: Key metrics and statistics
- **Charts & analytics**: Growth trends and visualizations
- **Recent activity**: Latest system activities
- **Alerts**: System notifications and warnings
- **Performance metrics**: System health monitoring
- **Quick actions**: Common administrative tasks
- **Report export**: PDF and Excel reports

### 🔄 Integration Tests (`run-all-tests.js`)
- **Cross-module workflows**: End-to-end testing
- **Authentication flow**: Token validation across modules
- **Performance testing**: Response time validation
- **Error handling**: Graceful error responses

## 🚀 Setup Instructions

### Prerequisites
- Node.js >= 16.0.0
- Running SuperAdmin application server
- Test database with sample data

### Installation

1. **Install dependencies**:
   ```bash
   cd tests/superadmin
   npm install
   ```

2. **Configure test environment**:
   ```bash
   # Set the base URL for your application
   export TEST_BASE_URL=http://localhost:3000
   
   # Or create a .env file
   echo "TEST_BASE_URL=http://localhost:3000" > .env
   ```

3. **Verify test data**:
   Ensure you have a test SuperAdmin account:
   - Email: `test.superadmin@example.com`
   - Password: `TestPassword123`

## 🧪 Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Module Tests
```bash
# Authentication tests only
npm run test:auth

# Roles management tests only
npm run test:roles

# Tenants management tests only
npm run test:tenants

# Users management tests only
npm run test:users

# Audit logs tests only
npm run test:audit-logs

# Dashboard tests only
npm run test:dashboard
```

### Run Integration Tests
```bash
npm run test:integration
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Watch Mode (Development)
```bash
npm run test:watch
```

## 📊 Test Structure

```
tests/superadmin/
├── auth.test.js           # Authentication tests
├── roles.test.js          # Roles management tests
├── tenants.test.js        # Tenants management tests
├── users.test.js          # Users management tests
├── audit-logs.test.js     # Audit logs tests
├── dashboard.test.js      # Dashboard tests
├── run-all-tests.js       # Integration and comprehensive tests
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables
- `TEST_BASE_URL`: Base URL of your application (default: http://localhost:3000)
- `NODE_ENV`: Environment (development/production)

### Test Data Requirements
The tests expect the following test data to be available:

1. **SuperAdmin Account**:
   - Email: `test.superadmin@example.com`
   - Password: `TestPassword123`

2. **Sample Permissions**:
   - `user.read`
   - `user.create`
   - `user.update`
   - `user.delete`

3. **Sample Roles**:
   - Basic user roles
   - Admin roles
   - System roles

## 📈 Test Results

### Expected Output
```
🚀 Starting SuperAdmin Comprehensive Test Suite
📍 Testing against: http://localhost:3000
✅ Server is running and healthy

🔐 Running Authentication Tests...
  ✓ should login with valid credentials
  ✓ should reject login with invalid credentials
  ✓ should handle forgot password
  ✓ should reset password with valid token

👥 Running Roles Management Tests...
  ✓ should fetch all global roles with pagination
  ✓ should create a new global role
  ✓ should update an existing role
  ✓ should delete an existing role

🏢 Running Tenants Management Tests...
  ✓ should fetch all tenants with pagination
  ✓ should create a new tenant
  ✓ should update an existing tenant
  ✓ should delete an existing tenant

👤 Running Users Management Tests...
  ✓ should fetch all users with pagination
  ✓ should create a new user
  ✓ should update an existing user
  ✓ should delete an existing user

📋 Running Audit Logs Tests...
  ✓ should fetch all audit logs with pagination
  ✓ should export audit logs as CSV
  ✓ should fetch audit log statistics

📊 Running Dashboard Tests...
  ✓ should fetch dashboard overview data
  ✓ should fetch dashboard statistics
  ✓ should fetch dashboard chart data

🔄 Running Integration Tests...
  ✓ should verify complete workflow from login to dashboard
  ✓ should verify authentication token works across all modules

⚡ Running Performance Tests...
  ✓ should test API response times

🚫 Running Error Handling Tests...
  ✓ should handle invalid authentication gracefully
  ✓ should handle malformed requests gracefully

🏁 SuperAdmin Comprehensive Test Suite completed
```

## 🐛 Troubleshooting

### Common Issues

1. **Server not running**:
   ```
   ❌ Server is not running or not accessible
   ```
   **Solution**: Start your application server before running tests

2. **Authentication failures**:
   ```
   ❌ Invalid credentials
   ```
   **Solution**: Verify test SuperAdmin account exists with correct credentials

3. **Database connection issues**:
   ```
   ❌ Database connection failed
   ```
   **Solution**: Ensure database is running and accessible

4. **Timeout errors**:
   ```
   ❌ Test timeout exceeded
   ```
   **Solution**: Increase timeout in package.json scripts or check server performance

### Debug Mode
Run tests with verbose output:
```bash
mocha --timeout 30000 --reporter spec --verbose tests/superadmin/**/*.test.js
```

## 📝 Contributing

When adding new tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Include both positive and negative test cases
4. Add proper error handling
5. Update this README with new test coverage

## 📄 License

MIT License - see LICENSE file for details
