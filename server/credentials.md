# Test Credentials for Multi-Tenant Admin API

This file contains all test credentials used in the E2E test suite.

## Database Configuration

```env
# Test Database Configuration
DATABASE_URL=mysql://root:password@localhost:3306/multi_tenant_admin_test
REDIS_URL=redis://localhost:6379
```

## Test Users

### Superadmin User

- **Email**: `superadmin@test.com`
- **Password**: `SuperadminPassword123!`
- **Name**: `Superadmin User`
- **Role**: Superadmin
- **Tenant**: Test Tenant
- **Permissions**: Full access to all tenants and features

### Admin User

- **Email**: `admin@test.com`
- **Password**: `AdminPassword123!`
- **Name**: `Admin User`
- **Role**: Admin
- **Tenant**: Test Tenant
- **Permissions**: Full access within tenant

### Regular User

- **Email**: `user@test.com`
- **Password**: `UserPassword123!`
- **Name**: `Regular User`
- **Role**: User
- **Tenant**: Test Tenant
- **Permissions**: Limited access within tenant

### Test User (for specific tests)

- **Email**: `testuser@test.com`
- **Password**: `TestUserPassword123!`
- **Name**: `Test User`
- **Role**: User
- **Tenant**: Test Tenant

## Test Tenants

### Primary Test Tenant

- **Name**: `Test Tenant`
- **Domain**: `test.com`
- **Status**: Active
- **Settings**: Default configuration

### Secondary Test Tenant

- **Name**: `Other Tenant`
- **Domain**: `other.com`
- **Status**: Active
- **Settings**: Default configuration

## Test Roles

### Admin Role

- **Name**: `Admin Role`
- **Description**: `Administrator role with full permissions`
- **Type**: Tenant-specific
- **Permissions**: Full CRUD access to all modules

### User Role

- **Name**: `User Role`
- **Description**: `Regular user role`
- **Type**: Tenant-specific
- **Permissions**: Read access to user management, limited other access

## Test Modules

### User Management Module

- **Name**: `User Management`
- **Description**: `User management module`
- **Order Index**: 1
- **Status**: Active

### Role Management Module

- **Name**: `Role Management`
- **Description**: `Role management module`
- **Order Index**: 2
- **Status**: Active

## JWT Configuration

```env
# JWT Secrets (for testing only)
JWT_SECRET=test-jwt-secret-key-for-testing-only
JWT_REFRESH_SECRET=test-refresh-secret-key-for-testing-only
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

## Test Data Patterns

### Email Patterns

- `{role}@test.com` - Main test users
- `{action}{index}@test.com` - Dynamic test users
- `{prefix}{index}@test.com` - Bulk test users

### Password Pattern

- All test passwords follow: `{Role}Password123!`
- Minimum 8 characters
- Contains uppercase, lowercase, number, and special character

### Name Patterns

- `{Role} User` - Main test users
- `{Action} User {index}` - Dynamic test users
- `{Prefix} User {index}` - Bulk test users

## Test Scenarios

### Authentication Tests

- Valid login with correct credentials
- Invalid login with wrong password
- Invalid login with non-existent user
- Login with inactive user
- Rate limiting for failed attempts

### User Management Tests

- Create user with valid data
- Create user with duplicate email
- Create user with invalid data
- Update user profile
- Delete user
- Bulk operations

### Role Management Tests

- Create role with permissions
- Update role details
- Delete role (when not assigned)
- Clone role with permissions
- Role assignment to users

### Tenant Management Tests

- Create tenant with valid domain
- Update tenant settings
- Delete tenant (when no users)
- Tenant user management
- Bulk tenant operations

### Permission Tests

- Data scope filtering
- Tenant isolation
- Permission-based access control
- Cross-tenant access prevention

## Security Notes

⚠️ **IMPORTANT**: These credentials are for testing purposes only and should never be used in production.

- All passwords are test passwords only
- JWT secrets are test-only secrets
- Database should be isolated test database
- Redis should be test instance
- All test data should be cleaned up after tests

## Test Environment Setup

1. **Database**: Use isolated test database
2. **Redis**: Use test Redis instance
3. **Environment**: Set NODE_ENV=test
4. **Cleanup**: Ensure all test data is cleaned after each test
5. **Isolation**: Tests should not interfere with each other

## Usage in Tests

```javascript
// Import credentials
const credentials = require('./credentials');

// Use in tests
const loginData = {
  email: credentials.users.admin.email,
  password: credentials.users.admin.password,
};
```

## Maintenance

- Update this file when adding new test users
- Keep credentials consistent across all test files
- Document any changes to test data patterns
- Ensure all test files reference this centralized credential file
