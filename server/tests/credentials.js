/**
 * Test Credentials for Multi-Tenant Admin API
 *
 * This file contains all test credentials used in the E2E test suite.
 * All test files should import and use these centralized credentials.
 */

module.exports = {
  // Database Configuration
  database: {
    url:
      process.env.DATABASE_URL ||
      'mysql://root:@localhost:3306/multi-tenant-scale',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'test-refresh-secret-key-for-testing-only',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Test Users
  users: {
    superadmin: {
      email: 'superadmin@test.com',
      password: 'SuperadminPassword123!',
      name: 'Superadmin User',
      role: 'superadmin',
      isSuperadmin: true,
      isActive: true,
    },
    admin: {
      email: 'admin@test.com',
      password: 'AdminPassword123!',
      name: 'Admin User',
      role: 'admin',
      isSuperadmin: false,
      isActive: true,
    },
    user: {
      email: 'user@test.com',
      password: 'UserPassword123!',
      name: 'Regular User',
      role: 'user',
      isSuperadmin: false,
      isActive: true,
    },
    testuser: {
      email: 'testuser@test.com',
      password: 'TestUserPassword123!',
      name: 'Test User',
      role: 'user',
      isSuperadmin: false,
      isActive: true,
    },
  },

  // Test Tenants
  tenants: {
    primary: {
      name: 'Test Tenant',
      domain: 'test.com',
      isActive: true,
      settings: {
        maxUsers: 100,
        features: ['user-management', 'role-management'],
      },
    },
    secondary: {
      name: 'Other Tenant',
      domain: 'other.com',
      isActive: true,
      settings: {
        maxUsers: 50,
        features: ['user-management'],
      },
    },
  },

  // Test Roles
  roles: {
    admin: {
      name: 'Admin Role',
      description: 'Administrator role with full permissions',
      isGlobal: false,
      permissions: {
        userManagement: {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canViewAll: true,
        },
        roleManagement: {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canViewAll: true,
        },
      },
    },
    user: {
      name: 'User Role',
      description: 'Regular user role',
      isGlobal: false,
      permissions: {
        userManagement: {
          canCreate: false,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: false,
        },
        roleManagement: {
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
          canViewAll: false,
        },
      },
    },
  },

  // Test Modules
  modules: {
    userManagement: {
      name: 'User Management',
      description: 'User management module',
      orderIndex: 1,
      isActive: true,
    },
    roleManagement: {
      name: 'Role Management',
      description: 'Role management module',
      orderIndex: 2,
      isActive: true,
    },
    sessionManagement: {
      name: 'Session Management',
      description: 'Session management module',
      orderIndex: 3,
      isActive: true,
    },
    search: {
      name: 'Search',
      description: 'Search functionality module',
      orderIndex: 4,
      isActive: true,
    },
    analytics: {
      name: 'Analytics',
      description: 'Analytics and reporting module',
      orderIndex: 5,
      isActive: true,
    },
    notifications: {
      name: 'Notifications',
      description: 'Notification management module',
      orderIndex: 6,
      isActive: true,
    },
  },

  // Test Data Patterns
  patterns: {
    email: {
      main: '{role}@test.com',
      dynamic: '{action}{index}@test.com',
      bulk: '{prefix}{index}@test.com',
    },
    password: '{Role}Password123!',
    name: {
      main: '{Role} User',
      dynamic: '{Action} User {index}',
      bulk: '{Prefix} User {index}',
    },
  },

  // Test Scenarios
  scenarios: {
    authentication: {
      validLogin: {
        email: 'admin@test.com',
        password: 'AdminPassword123!',
      },
      invalidPassword: {
        email: 'admin@test.com',
        password: 'WrongPassword123!',
      },
      nonExistentUser: {
        email: 'nonexistent@test.com',
        password: 'Password123!',
      },
      inactiveUser: {
        email: 'inactive@test.com',
        password: 'Password123!',
      },
    },
    userManagement: {
      newUser: {
        email: 'newuser@test.com',
        password: 'NewUserPassword123!',
        firstName: 'New',
        lastName: 'User',
        phone: '+1234567890',
      },
      duplicateUser: {
        email: 'admin@test.com', // Already exists
        password: 'NewUserPassword123!',
        firstName: 'Duplicate',
        lastName: 'User',
      },
      invalidUser: {
        email: 'invalid-email',
        password: 'weak',
        firstName: '',
        lastName: '',
      },
    },
    roleManagement: {
      newRole: {
        name: 'New Role',
        description: 'A new test role',
        isGlobal: false,
      },
      duplicateRole: {
        name: 'Admin Role', // Already exists
        description: 'Duplicate role',
        isGlobal: false,
      },
      invalidRole: {
        name: '',
        description: 'Invalid role',
        isGlobal: false,
      },
    },
    tenantManagement: {
      newTenant: {
        name: 'New Tenant',
        domain: 'newtenant.com',
        isActive: true,
      },
      duplicateTenant: {
        name: 'Duplicate Tenant',
        domain: 'test.com', // Already exists
        isActive: true,
      },
      invalidTenant: {
        name: '',
        domain: 'invalid-domain',
        isActive: true,
      },
    },
  },

  // Error Messages
  errors: {
    authentication: {
      invalidCredentials: 'Invalid credentials',
      accountInactive: 'Account is inactive',
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      invalidEmailFormat: 'Invalid email format',
      tooManyRequests: 'Too many requests',
      accessTokenRequired: 'Access token required',
      invalidToken: 'Invalid token',
      refreshTokenRequired: 'Refresh token is required',
      refreshTokenExpired: 'Refresh token expired',
    },
    userManagement: {
      userNotFound: 'User not found',
      emailAlreadyExists: 'User with this email already exists',
      emailAlreadyExistsUpdate: 'Email already exists',
      weakPassword: 'Password must be at least 8 characters',
      validationFailed: 'Validation failed',
      insufficientPermissions: 'Insufficient permissions',
      cannotDeleteSuperadmin: 'Cannot delete superadmin user',
    },
    roleManagement: {
      roleNotFound: 'Role not found',
      nameAlreadyExists: 'Role with this name already exists in this tenant',
      nameAlreadyExistsUpdate: 'Role name already exists in this tenant',
      cannotDeleteAssigned: 'Cannot delete role that is assigned to users',
      sourceRoleNotFound: 'Source role not found',
    },
    tenantManagement: {
      tenantNotFound: 'Tenant not found',
      domainAlreadyExists: 'Tenant with this domain already exists',
      domainAlreadyExistsUpdate: 'Domain already exists',
      invalidDomainFormat: 'Invalid domain format',
      cannotDeleteWithUsers: 'Cannot delete tenant with associated users',
    },
  },

  // Success Messages
  success: {
    authentication: {
      loginSuccess: 'Login successful',
      logoutSuccess: 'Logged out successfully',
      tokenRefreshSuccess: 'Token refresh successful',
      passwordResetEmailSent: 'Password reset email sent',
      passwordResetSuccess: 'Password reset successfully',
    },
    userManagement: {
      userCreated: 'User created successfully',
      userUpdated: 'User updated successfully',
      userDeleted: 'User deleted successfully',
      usersActivated: 'users activated successfully',
      usersDeactivated: 'users deactivated successfully',
    },
    roleManagement: {
      roleCreated: 'Role created successfully',
      roleUpdated: 'Role updated successfully',
      roleDeleted: 'Role deleted successfully',
      roleCloned: 'Role cloned successfully',
    },
    tenantManagement: {
      tenantCreated: 'Tenant created successfully',
      tenantUpdated: 'Tenant updated successfully',
      tenantDeleted: 'Tenant deleted successfully',
      tenantsActivated: 'tenants activated successfully',
      tenantsDeactivated: 'tenants deactivated successfully',
    },
  },

  // Test Utilities
  utils: {
    // Generate test email
    generateEmail: (prefix, index = 0) => {
      return index > 0 ? `${prefix}${index}@test.com` : `${prefix}@test.com`;
    },

    // Generate test password
    generatePassword: (role = 'Test') => {
      return `${role}Password123!`;
    },

    // Generate test name
    generateName: (role = 'Test', index = 0) => {
      return index > 0 ? `${role} User ${index}` : `${role} User`;
    },

    // Generate test domain
    generateDomain: (prefix, index = 0) => {
      return index > 0 ? `${prefix}${index}.com` : `${prefix}.com`;
    },

    // Generate test tenant name
    generateTenantName: (prefix, index = 0) => {
      return index > 0 ? `${prefix} Tenant ${index}` : `${prefix} Tenant`;
    },
  },
};
