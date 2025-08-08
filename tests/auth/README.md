# 🔐 Authentication Test Suite

This directory contains comprehensive test files for all authentication features in the SuperAdmin module.

## 📁 Test Files

### Individual Test Files

1. **`test-login.js`** - Tests login functionality
   - Login page access
   - Form validation
   - Invalid credentials
   - Valid login flow
   - Token storage verification

2. **`test-forgot-password.js`** - Tests forgot password functionality
   - Forgot password page access
   - Form validation
   - Email validation
   - API integration
   - Success/error handling

3. **`test-reset-password.js`** - Tests password reset functionality
   - Reset password page access
   - Token validation
   - Password strength validation
   - Password confirmation
   - API integration

4. **`test-signup.js`** - Tests signup functionality
   - Signup page access
   - Form validation
   - Email format validation
   - Password strength requirements
   - API integration

5. **`test-tenant-invite.js`** - Tests tenant invitation/creation
   - Tenant management page access
   - Create tenant button
   - Tenant creation form
   - Form validation
   - API integration

6. **`test-logout.js`** - Tests logout functionality
   - Logout button detection
   - Logout process
   - Token cleanup
   - Session termination
   - Protected route access after logout

7. **`test-api-endpoints.js`** - Tests all authentication API endpoints
   - Login API
   - Forgot Password API
   - Reset Password API
   - Logout API
   - Validate Token API
   - Refresh Token API
   - Signup API
   - Verify Token API

## 🚀 How to Run Tests

### Prerequisites

1. **Install Dependencies**
   ```bash
   npm install puppeteer node-fetch
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Ensure Database is Running**
   ```bash
   # Make sure your MySQL database is running
   # and the SuperAdmin user exists
   ```

### Running Individual Tests

```bash
# Test login functionality
node tests/auth/test-login.js

# Test forgot password
node tests/auth/test-forgot-password.js

# Test reset password
node tests/auth/test-reset-password.js

# Test signup
node tests/auth/test-signup.js

# Test tenant invite
node tests/auth/test-tenant-invite.js

# Test logout
node tests/auth/test-logout.js

# Test API endpoints
node tests/auth/test-api-endpoints.js
```

### Running All Tests

```bash
# Run all authentication tests
node tests/auth/run-all-tests.js
```

## 📊 Test Credentials

The tests use the following default credentials:

- **Email**: `admin@superadmin.com`
- **Password**: `SuperAdmin123!`

Make sure these credentials exist in your database before running tests.

## 🔧 Test Configuration

### Browser Settings
- **Headless**: `false` (visible browser for debugging)
- **SlowMo**: `200ms` (slower execution for visibility)
- **Timeout**: `10-60 seconds` (depending on test)

### API Settings
- **Base URL**: `http://localhost:3000`
- **Timeout**: `10 seconds` for API calls

## 📋 Test Results

Each test provides detailed output including:

- ✅ **Success indicators** for working features
- ❌ **Error indicators** for failed features
- 📱 **Browser console logs** for debugging
- 📄 **API responses** for verification
- ⏱️ **Execution time** for performance monitoring

## 🐛 Troubleshooting

### Common Issues

1. **Server Not Running**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:3000
   ```
   **Solution**: Start the development server with `npm run dev`

2. **Database Connection Issues**
   ```
   Error: Database connection failed
   ```
   **Solution**: Ensure MySQL is running and database exists

3. **Authentication Failures**
   ```
   Login failed, cannot proceed with tests
   ```
   **Solution**: Verify SuperAdmin credentials in database

4. **Puppeteer Issues**
   ```
   Error: Failed to launch browser
   ```
   **Solution**: Install or update Puppeteer dependencies

### Debug Mode

To run tests in debug mode with more verbose output:

```bash
# Set debug environment variable
DEBUG=true node tests/auth/test-login.js
```

## 📈 Test Coverage

The test suite covers:

- ✅ **UI Components**: Forms, buttons, navigation
- ✅ **Form Validation**: Client-side validation
- ✅ **API Integration**: All authentication endpoints
- ✅ **Token Management**: Storage and cleanup
- ✅ **Route Protection**: Authentication guards
- ✅ **Error Handling**: Success and error scenarios
- ✅ **User Experience**: Navigation and feedback

## 🔄 Continuous Testing

For continuous testing during development:

```bash
# Watch mode (requires nodemon)
nodemon tests/auth/test-login.js

# Run tests on file changes
npm run test:auth:watch
```

## 📝 Adding New Tests

To add new authentication tests:

1. Create a new test file following the naming convention
2. Use the existing test structure as a template
3. Include proper error handling and logging
4. Add the test to the `run-all-tests.js` file
5. Update this README with new test information

## 🤝 Contributing

When contributing to the test suite:

1. Follow the existing code style
2. Add comprehensive error handling
3. Include detailed logging for debugging
4. Test both success and failure scenarios
5. Update documentation as needed

---

**Note**: These tests are designed for the SuperAdmin authentication system. Make sure your application is properly configured before running the tests. 