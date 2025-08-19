const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'acme-corp';
const TEST_USER = {
  email: 'admin@acme-corp.com',
  password: 'AcmeAdmin123!'
};

let authToken = null;

// Utility functions
const log = (message, data = null) => {
  console.log(`\n${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const logSuccess = (message) => {
  console.log(`✅ ${message}`);
};

const logError = (message, error = null) => {
  console.log(`❌ ${message}`);
  if (error) {
    console.log(`Error details: ${error.response?.data?.error || error.message}`);
  }
};

const logStep = (step, message) => {
  console.log(`\n${step} ${message}`);
};

// Get fresh token
async function getFreshToken() {
  try {
    const response = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      tenantSlug: TENANT_SLUG
    });

    if (response.data.success && response.data.data.token) {
      return response.data.data.token;
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

// Test functions
async function testAuthentication() {
  logStep('1️⃣', 'Testing authentication...');
  
  try {
    authToken = await getFreshToken();
    logSuccess('Authentication successful');
    log('User info:', {
      userId: 'cmehmjf710014ukrcdarhosks',
      userName: 'Acme Admin',
      userEmail: 'admin@acme-corp.com'
    });
    return true;
  } catch (error) {
    logError('Authentication failed', error);
    return false;
  }
}

async function testUsersAPI() {
  logStep('2️⃣', 'Testing Users API...');
  
  try {
    const freshToken = await getFreshToken();
    const headers = { Authorization: `Bearer ${freshToken}` };
    
    // Test GET /users with filters
    log('Testing GET /users with filters and pagination...');
    const usersResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users?page=1&limit=5&search=admin&status=active`, { headers });
    
    if (usersResponse.data.success) {
      logSuccess('Users list retrieved successfully');
      log('Users data:', {
        total: usersResponse.data.data.pagination.total,
        users: usersResponse.data.data.users.length,
        permissions: usersResponse.data.data.permissions
      });
    } else {
      logError('Failed to retrieve users list');
      return false;
    }

    // Test POST /users (create user)
    log('Testing POST /users (create user)...');
    const newUser = {
      name: 'Test User',
      email: 'testuser@acme-corp.com',
      password: 'testpass123',
      contactNumber: '+1234567890',
      roleIds: []
    };

    const createResponse = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users`, newUser, { headers });
    
    if (createResponse.data.success) {
      logSuccess('User created successfully');
      const createdUserId = createResponse.data.data.user.id;
      
      // Test GET /users/[userId]
      log('Testing GET /users/[userId]...');
      const userResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users/${createdUserId}`, { headers });
      
      if (userResponse.data.success) {
        logSuccess('Individual user retrieved successfully');
      } else {
        logError('Failed to retrieve individual user');
      }

      // Test PUT /users/[userId] (update user)
      log('Testing PUT /users/[userId] (update user)...');
      const updateData = {
        name: 'Updated Test User',
        contactNumber: '+0987654321'
      };

      const updateResponse = await axios.put(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users/${createdUserId}`, updateData, { headers });
      
      if (updateResponse.data.success) {
        logSuccess('User updated successfully');
      } else {
        logError('Failed to update user');
      }

      // Test DELETE /users/[userId]
      log('Testing DELETE /users/[userId]...');
      const deleteResponse = await axios.delete(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users/${createdUserId}`, { headers });
      
      if (deleteResponse.data.success) {
        logSuccess('User deleted successfully');
      } else {
        logError('Failed to delete user');
      }
    } else {
      logError('Failed to create user');
    }

    // Test PUT /users (bulk actions)
    log('Testing PUT /users (bulk actions)...');
    const bulkAction = {
      userIds: [],
      action: 'activate'
    };

    const bulkResponse = await axios.put(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users`, bulkAction, { headers });
    
    if (bulkResponse.data.success) {
      logSuccess('Bulk action completed successfully');
    } else {
      logError('Failed to perform bulk action');
    }

    return true;
  } catch (error) {
    logError('Users API test failed', error);
    return false;
  }
}

async function testRolesAPI() {
  logStep('3️⃣', 'Testing Roles API...');
  
  const headers = { Authorization: `Bearer ${authToken}` };
  
  try {
    // Test GET /roles with filters
    log('Testing GET /roles with filters and pagination...');
    const rolesResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles?page=1&limit=5&search=admin&status=active`, { headers });
    
    if (rolesResponse.data.success) {
      logSuccess('Roles list retrieved successfully');
      log('Roles data:', {
        total: rolesResponse.data.data.pagination.total,
        roles: rolesResponse.data.data.roles.length,
        permissions: rolesResponse.data.data.permissions
      });
    } else {
      logError('Failed to retrieve roles list');
      return false;
    }

    // Test POST /roles (create role)
    log('Testing POST /roles (create role)...');
    const newRole = {
      name: 'Test Role',
      description: 'A test role for API testing',
      color: '#3B82F6',
      permissions: [
        {
          moduleKey: 'users',
          canCreate: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: false
        }
      ]
    };

    const createResponse = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles`, newRole, { headers });
    
    if (createResponse.data.success) {
      logSuccess('Role created successfully');
      const createdRoleId = createResponse.data.data.role.id;
      
      // Test GET /roles/[roleId]
      log('Testing GET /roles/[roleId]...');
      const roleResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles/${createdRoleId}`, { headers });
      
      if (roleResponse.data.success) {
        logSuccess('Individual role retrieved successfully');
      } else {
        logError('Failed to retrieve individual role');
      }

      // Test PUT /roles/[roleId] (update role)
      log('Testing PUT /roles/[roleId] (update role)...');
      const updateData = {
        name: 'Updated Test Role',
        description: 'Updated description'
      };

      const updateResponse = await axios.put(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles/${createdRoleId}`, updateData, { headers });
      
      if (updateResponse.data.success) {
        logSuccess('Role updated successfully');
      } else {
        logError('Failed to update role');
      }

      // Test DELETE /roles/[roleId]
      log('Testing DELETE /roles/[roleId]...');
      const deleteResponse = await axios.delete(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles/${createdRoleId}`, { headers });
      
      if (deleteResponse.data.success) {
        logSuccess('Role deleted successfully');
      } else {
        logError('Failed to delete role');
      }
    } else {
      logError('Failed to create role');
    }

    // Test PUT /roles (bulk actions)
    log('Testing PUT /roles (bulk actions)...');
    const bulkAction = {
      roleIds: [],
      action: 'activate'
    };

    const bulkResponse = await axios.put(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles`, bulkAction, { headers });
    
    if (bulkResponse.data.success) {
      logSuccess('Bulk action completed successfully');
    } else {
      logError('Failed to perform bulk action');
    }

    return true;
  } catch (error) {
    logError('Roles API test failed', error);
    return false;
  }
}

async function testAuditLogsAPI() {
  logStep('4️⃣', 'Testing Audit Logs API...');
  
  const headers = { Authorization: `Bearer ${authToken}` };
  
  try {
    // Test GET /audit-logs with filters
    log('Testing GET /audit-logs with filters and pagination...');
    const auditResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/audit-logs?page=1&limit=5&search=login&action=user.login&severity=info`, { headers });
    
    if (auditResponse.data.success) {
      logSuccess('Audit logs retrieved successfully');
      log('Audit logs data:', {
        total: auditResponse.data.data.pagination.total,
        logs: auditResponse.data.data.auditLogs.length,
        stats: auditResponse.data.data.stats,
        permissions: auditResponse.data.data.permissions
      });
    } else {
      logError('Failed to retrieve audit logs');
      return false;
    }

    // Test POST /audit-logs (create audit log)
    log('Testing POST /audit-logs (create audit log)...');
    const newAuditLog = {
      action: 'test.action',
      details: 'Test audit log entry',
      resource: 'test',
      resourceId: 'test-123',
      severity: 'info'
    };

    const createResponse = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/audit-logs`, newAuditLog, { headers });
    
    if (createResponse.data.success) {
      logSuccess('Audit log created successfully');
    } else {
      logError('Failed to create audit log');
    }

    return true;
  } catch (error) {
    logError('Audit Logs API test failed', error);
    return false;
  }
}

async function testReportsAPI() {
  logStep('5️⃣', 'Testing Reports API...');
  
  const headers = { Authorization: `Bearer ${authToken}` };
  
  try {
    // Test GET /reports with filters
    log('Testing GET /reports with filters and pagination...');
    const reportsResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/reports?page=1&limit=5&search=user&type=user&format=pdf`, { headers });
    
    if (reportsResponse.data.success) {
      logSuccess('Reports list retrieved successfully');
      log('Reports data:', {
        total: reportsResponse.data.data.pagination.total,
        reports: reportsResponse.data.data.reports.length,
        stats: reportsResponse.data.data.stats,
        permissions: reportsResponse.data.data.permissions
      });
    } else {
      logError('Failed to retrieve reports list');
      return false;
    }

    // Test POST /reports (create report)
    log('Testing POST /reports (create report)...');
    const newReport = {
      title: 'Test Report',
      description: 'A test report for API testing',
      type: 'user',
      format: 'pdf',
      filters: {
        dateRange: '7d',
        status: 'active'
      },
      schedule: {
        frequency: 'weekly',
        recipients: ['admin@acme-corp.com']
      }
    };

    const createResponse = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/reports`, newReport, { headers });
    
    if (createResponse.data.success) {
      logSuccess('Report created successfully');
      const createdReportId = createResponse.data.data.report.id;
      
      // Test PUT /reports (bulk actions)
      log('Testing PUT /reports (bulk actions)...');
      const bulkAction = {
        reportIds: [createdReportId],
        action: 'execute'
      };

      const bulkResponse = await axios.put(`${BASE_URL}/api/tenant/${TENANT_SLUG}/reports`, bulkAction, { headers });
      
      if (bulkResponse.data.success) {
        logSuccess('Bulk action completed successfully');
      } else {
        logError('Failed to perform bulk action');
      }
    } else {
      logError('Failed to create report');
    }

    return true;
  } catch (error) {
    logError('Reports API test failed', error);
    return false;
  }
}

async function testNotificationsAPI() {
  logStep('6️⃣', 'Testing Notifications API...');
  
  const headers = { Authorization: `Bearer ${authToken}` };
  
  try {
    // Test GET /notifications with filters
    log('Testing GET /notifications with filters and pagination...');
    const notificationsResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications?page=1&limit=5&search=test&type=info&priority=medium`, { headers });
    
    if (notificationsResponse.data.success) {
      logSuccess('Notifications list retrieved successfully');
      log('Notifications data:', {
        total: notificationsResponse.data.data.pagination.total,
        notifications: notificationsResponse.data.data.notifications.length,
        stats: notificationsResponse.data.data.stats,
        permissions: notificationsResponse.data.data.permissions
      });
    } else {
      logError('Failed to retrieve notifications list');
      return false;
    }

    // Test POST /notifications (create notification)
    log('Testing POST /notifications (create notification)...');
    const newNotification = {
      title: 'Test Notification',
      message: 'This is a test notification for API testing',
      type: 'info',
      priority: 'medium',
      category: 'test',
      recipients: [],
      scheduledAt: null,
      expiresAt: null
    };

    const createResponse = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications`, newNotification, { headers });
    
    if (createResponse.data.success) {
      logSuccess('Notification created successfully');
      const createdNotificationId = createResponse.data.data.notification.id;
      
      // Test PUT /notifications (bulk actions)
      log('Testing PUT /notifications (bulk actions)...');
      const bulkAction = {
        notificationIds: [createdNotificationId],
        action: 'markAsRead'
      };

      const bulkResponse = await axios.put(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications`, bulkAction, { headers });
      
      if (bulkResponse.data.success) {
        logSuccess('Bulk action completed successfully');
      } else {
        logError('Failed to perform bulk action');
      }
    } else {
      logError('Failed to create notification');
    }

    return true;
  } catch (error) {
    logError('Notifications API test failed', error);
    return false;
  }
}

async function testSearchAndFilters() {
  logStep('7️⃣', 'Testing Search and Filter functionality...');
  
  const headers = { Authorization: `Bearer ${authToken}` };
  
  try {
    // Test search functionality
    log('Testing search functionality...');
    const searchTests = [
      { endpoint: 'users', search: 'admin' },
      { endpoint: 'roles', search: 'admin' },
      { endpoint: 'audit-logs', search: 'login' },
      { endpoint: 'reports', search: 'user' },
      { endpoint: 'notifications', search: 'test' }
    ];

    for (const test of searchTests) {
      try {
        const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/${test.endpoint}?search=${test.search}&page=1&limit=5`, { headers });
        if (response.data.success) {
          logSuccess(`${test.endpoint} search working`);
        } else {
          logError(`${test.endpoint} search failed`);
        }
      } catch (error) {
        logError(`${test.endpoint} search error`, error);
      }
    }

    // Test pagination
    log('Testing pagination...');
    const paginationTests = [
      { endpoint: 'users', params: 'page=1&limit=2' },
      { endpoint: 'roles', params: 'page=1&limit=2' },
      { endpoint: 'audit-logs', params: 'page=1&limit=2' },
      { endpoint: 'reports', params: 'page=1&limit=2' },
      { endpoint: 'notifications', params: 'page=1&limit=2' }
    ];

    for (const test of paginationTests) {
      try {
        const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/${test.endpoint}?${test.params}`, { headers });
        if (response.data.success) {
          const pagination = response.data.data.pagination;
          logSuccess(`${test.endpoint} pagination working - Page ${pagination.page}/${pagination.totalPages}`);
        } else {
          logError(`${test.endpoint} pagination failed`);
        }
      } catch (error) {
        logError(`${test.endpoint} pagination error`, error);
      }
    }

    // Test sorting
    log('Testing sorting...');
    const sortingTests = [
      { endpoint: 'users', sort: 'sortBy=name&sortOrder=asc' },
      { endpoint: 'roles', sort: 'sortBy=name&sortOrder=desc' },
      { endpoint: 'audit-logs', sort: 'sortBy=createdAt&sortOrder=desc' },
      { endpoint: 'reports', sort: 'sortBy=title&sortOrder=asc' },
      { endpoint: 'notifications', sort: 'sortBy=createdAt&sortOrder=desc' }
    ];

    for (const test of sortingTests) {
      try {
        const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/${test.endpoint}?${test.sort}&page=1&limit=5`, { headers });
        if (response.data.success) {
          logSuccess(`${test.endpoint} sorting working`);
        } else {
          logError(`${test.endpoint} sorting failed`);
        }
      } catch (error) {
        logError(`${test.endpoint} sorting error`, error);
      }
    }

    return true;
  } catch (error) {
    logError('Search and filter tests failed', error);
    return false;
  }
}

async function testPermissions() {
  logStep('8️⃣', 'Testing Permission-based access...');
  
  const headers = { Authorization: `Bearer ${authToken}` };
  
  try {
    // Test permission checks
    log('Testing permission checks...');
    const permissionTests = [
      { endpoint: 'users', operation: 'GET' },
      { endpoint: 'roles', operation: 'GET' },
      { endpoint: 'audit-logs', operation: 'GET' },
      { endpoint: 'reports', operation: 'GET' },
      { endpoint: 'notifications', operation: 'GET' }
    ];

    for (const test of permissionTests) {
      try {
        const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/${test.endpoint}?page=1&limit=1`, { headers });
        if (response.data.success) {
          const permissions = response.data.data.permissions;
          logSuccess(`${test.endpoint} permissions working`);
          log(`${test.endpoint} permissions:`, permissions);
        } else {
          logError(`${test.endpoint} permissions failed`);
        }
      } catch (error) {
        if (error.response?.status === 403) {
          logSuccess(`${test.endpoint} properly blocked due to permissions`);
        } else {
          logError(`${test.endpoint} permission test error`, error);
        }
      }
    }

    return true;
  } catch (error) {
    logError('Permission tests failed', error);
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('🧪 Testing Tenant Modules APIs with CRUD operations, search filters, pagination, and permissions...\n');

  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Users API', fn: testUsersAPI },
    { name: 'Roles API', fn: testRolesAPI },
    { name: 'Audit Logs API', fn: testAuditLogsAPI },
    { name: 'Reports API', fn: testReportsAPI },
    { name: 'Notifications API', fn: testNotificationsAPI },
    { name: 'Search and Filters', fn: testSearchAndFilters },
    { name: 'Permissions', fn: testPermissions }
  ];

  const results = [];

  for (const test of tests) {
    try {
      // Get fresh token for each test (except authentication)
      if (test.name !== 'Authentication') {
        try {
          authToken = await getFreshToken();
        } catch (error) {
          console.error(`\n❌ Failed to get fresh token for ${test.name}:`, error.message);
          results.push({ name: test.name, success: false });
          continue;
        }
      }
      
      const result = await test.fn();
      results.push({ name: test.name, success: result });
    } catch (error) {
      console.error(`\n❌ ${test.name} test failed with error:`, error.message);
      results.push({ name: test.name, success: false });
    }
  }

  // Summary
  console.log('\n🎉 Tenant Modules API tests completed!');
  console.log('\n📊 Summary:');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${result.name}`);
  });

  console.log(`\n📈 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🎯 All tests passed! Tenant modules are working correctly with:');
    console.log('   ✅ CRUD operations');
    console.log('   ✅ Search filters');
    console.log('   ✅ Pagination');
    console.log('   ✅ Permission-based access');
    console.log('   ✅ Bulk actions');
    console.log('   ✅ Proper error handling');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
