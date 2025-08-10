// Comprehensive test configuration for tenant APIs
export const TEST_CONFIG = {
  // Test environments
  environments: {
    development: {
      baseUrl: 'http://localhost:3000',
      database: 'test_db',
      timeout: 30000
    },
    staging: {
      baseUrl: 'https://staging.example.com',
      database: 'staging_db',
      timeout: 60000
    },
    production: {
      baseUrl: 'https://production.example.com',
      database: 'production_db',
      timeout: 120000
    }
  },

  // Test tenants
  tenants: {
    techcorp: {
      slug: 'techcorp',
      name: 'TechCorp Solutions',
      domain: 'techcorp.example.com',
      isActive: true,
      plan: 'enterprise',
      users: {
        admin: {
          email: 'admin@techcorp.com',
          password: 'AdminPass123',
          name: 'Admin User',
          roles: ['admin'],
          permissions: [
            'users:view', 'users:create', 'users:edit', 'users:delete',
            'roles:view', 'roles:create', 'roles:edit', 'roles:delete',
            'audit:view', 'dashboard:view', 'support:view', 'support:create',
            'notifications:view', 'settings:view', 'profile:view', 'profile:edit'
          ]
        },
        manager: {
          email: 'manager@techcorp.com',
          password: 'AdminPass123',
          name: 'Manager User',
          roles: ['manager'],
          permissions: [
            'users:view', 'users:create', 'users:edit',
            'roles:view', 'audit:view', 'dashboard:view',
            'support:view', 'support:create', 'notifications:view',
            'profile:view', 'profile:edit'
          ]
        },
        user: {
          email: 'user@techcorp.com',
          password: 'AdminPass123',
          name: 'Regular User',
          roles: ['user'],
          permissions: [
            'users:view', 'dashboard:view', 'support:view', 'support:create',
            'notifications:view', 'profile:view', 'profile:edit'
          ]
        },
        viewer: {
          email: 'viewer@techcorp.com',
          password: 'AdminPass123',
          name: 'Viewer User',
          roles: ['viewer'],
          permissions: [
            'dashboard:view', 'profile:view'
          ]
        }
      }
    },
    globalretail: {
      slug: 'globalretail',
      name: 'Global Retail Inc',
      domain: 'globalretail.example.com',
      isActive: true,
      plan: 'professional',
      users: {
        admin: {
          email: 'admin@globalretail.com',
          password: 'AdminPass123',
          name: 'Admin User',
          roles: ['admin'],
          permissions: [
            'users:view', 'users:create', 'users:edit', 'users:delete',
            'roles:view', 'roles:create', 'roles:edit', 'roles:delete',
            'audit:view', 'dashboard:view', 'support:view', 'support:create',
            'notifications:view', 'settings:view', 'profile:view', 'profile:edit'
          ]
        },
        manager: {
          email: 'manager@globalretail.com',
          password: 'AdminPass123',
          name: 'Manager User',
          roles: ['manager'],
          permissions: [
            'users:view', 'users:create', 'users:edit',
            'roles:view', 'audit:view', 'dashboard:view',
            'support:view', 'support:create', 'notifications:view',
            'profile:view', 'profile:edit'
          ]
        },
        user: {
          email: 'user@globalretail.com',
          password: 'AdminPass123',
          name: 'Regular User',
          roles: ['user'],
          permissions: [
            'users:view', 'dashboard:view', 'support:view', 'support:create',
            'notifications:view', 'profile:view', 'profile:edit'
          ]
        },
        viewer: {
          email: 'viewer@globalretail.com',
          password: 'AdminPass123',
          name: 'Viewer User',
          roles: ['viewer'],
          permissions: [
            'dashboard:view', 'profile:view'
          ]
        }
      }
    }
  },

  // API endpoints configuration
  endpoints: {
    users: {
      path: '/api/tenant/[tenantSlug]/users',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      requiredPermissions: {
        GET: ['users:view'],
        POST: ['users:create'],
        PUT: ['users:edit'],
        DELETE: ['users:delete']
      },
      testCases: {
        get_list: {
          description: 'Get users list with pagination',
          params: ['page', 'limit', 'search', 'status', 'role', 'sortBy', 'sortOrder'],
          expectedStatus: 200
        },
        get_by_id: {
          description: 'Get user by ID',
          params: ['id'],
          expectedStatus: 200
        },
        create: {
          description: 'Create new user',
          body: ['name', 'email', 'password', 'roleIds'],
          expectedStatus: 200
        },
        update: {
          description: 'Update user',
          body: ['name', 'email', 'roleIds', 'isActive'],
          expectedStatus: 200
        },
        delete: {
          description: 'Delete user',
          params: ['id'],
          expectedStatus: 200
        },
        bulk_operations: {
          description: 'Bulk user operations',
          body: ['userIds', 'action', 'roleIds'],
          expectedStatus: 200
        }
      }
    },
    roles: {
      path: '/api/tenant/[tenantSlug]/roles',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      requiredPermissions: {
        GET: ['roles:view'],
        POST: ['roles:create'],
        PUT: ['roles:edit'],
        DELETE: ['roles:delete']
      },
      testCases: {
        get_list: {
          description: 'Get roles list with permissions',
          params: ['page', 'limit', 'search', 'status', 'isSystem', 'sortBy', 'sortOrder'],
          expectedStatus: 200
        },
        get_by_id: {
          description: 'Get role by ID',
          params: ['id'],
          expectedStatus: 200
        },
        create: {
          description: 'Create new role',
          body: ['name', 'description', 'permissions', 'color', 'priority'],
          expectedStatus: 200
        },
        update: {
          description: 'Update role',
          body: ['name', 'description', 'permissions', 'color', 'priority'],
          expectedStatus: 200
        },
        delete: {
          description: 'Delete role',
          params: ['id'],
          expectedStatus: 200
        }
      }
    },
    audit_logs: {
      path: '/api/tenant/[tenantSlug]/audit-logs',
      methods: ['GET'],
      requiredPermissions: {
        GET: ['audit:view']
      },
      testCases: {
        get_list: {
          description: 'Get audit logs with filters',
          params: ['page', 'limit', 'action', 'startDate', 'endDate', 'userId', 'ipAddress', 'search', 'sortBy', 'sortOrder'],
          expectedStatus: 200
        },
        export_csv: {
          description: 'Export audit logs as CSV',
          params: ['export=csv'],
          expectedStatus: 200
        },
        export_json: {
          description: 'Export audit logs as JSON',
          params: ['export=json'],
          expectedStatus: 200
        },
        include_stats: {
          description: 'Include audit log statistics',
          params: ['include=stats'],
          expectedStatus: 200
        },
        include_trends: {
          description: 'Include activity trends',
          params: ['include=trends'],
          expectedStatus: 200
        }
      }
    },
    dashboard: {
      path: '/api/tenant/[tenantSlug]/dashboard',
      methods: ['GET'],
      requiredPermissions: {
        GET: ['dashboard:view']
      },
      testCases: {
        get_stats: {
          description: 'Get dashboard statistics',
          params: [],
          expectedStatus: 200
        },
        get_charts: {
          description: 'Get dashboard charts',
          params: ['type', 'startDate', 'endDate'],
          expectedStatus: 200
        },
        get_analytics: {
          description: 'Get performance analytics',
          params: ['include=trends'],
          expectedStatus: 200
        }
      }
    },
    support: {
      path: '/api/tenant/[tenantSlug]/support',
      methods: ['GET', 'POST'],
      requiredPermissions: {
        GET: ['support:view'],
        POST: ['support:create']
      },
      testCases: {
        get_list: {
          description: 'Get support tickets',
          params: ['page', 'limit', 'status', 'priority', 'category', 'assignedTo', 'search', 'sortBy', 'sortOrder'],
          expectedStatus: 200
        },
        create: {
          description: 'Create support ticket',
          body: ['title', 'description', 'priority', 'category', 'attachments'],
          expectedStatus: 200
        },
        update_status: {
          description: 'Update ticket status',
          body: ['status', 'assignedTo'],
          expectedStatus: 200
        },
        add_comment: {
          description: 'Add comment to ticket',
          body: ['content', 'isInternal'],
          expectedStatus: 200
        },
        escalate: {
          description: 'Escalate ticket',
          body: ['reason', 'escalatedTo'],
          expectedStatus: 200
        }
      }
    },
    notifications: {
      path: '/api/tenant/[tenantSlug]/notifications',
      methods: ['GET'],
      requiredPermissions: {
        GET: ['notifications:view']
      },
      testCases: {
        get_list: {
          description: 'Get user notifications',
          params: ['page', 'limit', 'type', 'isRead', 'sortBy', 'sortOrder'],
          expectedStatus: 200
        }
      }
    },
    settings: {
      path: '/api/tenant/[tenantSlug]/settings',
      methods: ['GET'],
      requiredPermissions: {
        GET: ['settings:view']
      },
      testCases: {
        get_settings: {
          description: 'Get tenant settings',
          params: [],
          expectedStatus: 200
        }
      }
    },
    profile: {
      path: '/api/tenant/[tenantSlug]/profile',
      methods: ['GET', 'PUT'],
      requiredPermissions: {
        GET: ['profile:view'],
        PUT: ['profile:edit']
      },
      testCases: {
        get_profile: {
          description: 'Get user profile',
          params: [],
          expectedStatus: 200
        },
        update_profile: {
          description: 'Update user profile',
          body: ['name', 'contactNumber'],
          expectedStatus: 200
        }
      }
    },
    permissions: {
      path: '/api/tenant/[tenantSlug]/permissions/current-user',
      methods: ['GET'],
      requiredPermissions: {
        GET: []
      },
      testCases: {
        get_permissions: {
          description: 'Get current user permissions',
          params: [],
          expectedStatus: 200
        }
      }
    }
  },

  // Test scenarios
  scenarios: {
    authentication: {
      description: 'Authentication and session management tests',
      testCases: [
        'valid_credentials',
        'invalid_credentials',
        'expired_token',
        'missing_token',
        'malformed_token',
        'concurrent_sessions',
        'session_timeout',
        'token_refresh'
      ]
    },
    authorization: {
      description: 'Authorization and permission tests',
      testCases: [
        'admin_permissions',
        'manager_permissions',
        'user_permissions',
        'viewer_permissions',
        'cross_tenant_access',
        'inactive_tenant',
        'role_based_access',
        'permission_denied'
      ]
    },
    crud_operations: {
      description: 'CRUD operation tests',
      testCases: [
        'create_success',
        'create_validation_error',
        'create_duplicate_error',
        'read_success',
        'read_not_found',
        'update_success',
        'update_not_found',
        'delete_success',
        'delete_not_found',
        'delete_constraint_error'
      ]
    },
    bulk_operations: {
      description: 'Bulk operation tests',
      testCases: [
        'bulk_create',
        'bulk_update',
        'bulk_delete',
        'bulk_assign_roles',
        'bulk_activate',
        'bulk_deactivate'
      ]
    },
    filters_and_search: {
      description: 'Filtering and search tests',
      testCases: [
        'text_search',
        'date_range_filter',
        'status_filter',
        'role_filter',
        'category_filter',
        'priority_filter',
        'multiple_filters',
        'case_insensitive_search'
      ]
    },
    pagination: {
      description: 'Pagination tests',
      testCases: [
        'first_page',
        'middle_page',
        'last_page',
        'invalid_page',
        'custom_limit',
        'sorting',
        'empty_results'
      ]
    },
    validation: {
      description: 'Input validation tests',
      testCases: [
        'required_fields',
        'email_format',
        'password_strength',
        'field_length',
        'enum_values',
        'date_format',
        'url_format',
        'phone_format'
      ]
    },
    error_handling: {
      description: 'Error handling tests',
      testCases: [
        'database_connection_error',
        'validation_error',
        'permission_error',
        'not_found_error',
        'conflict_error',
        'timeout_error',
        'malformed_request'
      ]
    },
    edge_cases: {
      description: 'Edge case tests',
      testCases: [
        'large_datasets',
        'concurrent_requests',
        'malformed_data',
        'sql_injection',
        'xss_attacks',
        'rate_limiting',
        'timeout_handling',
        'special_characters',
        'unicode_support'
      ]
    },
    performance: {
      description: 'Performance tests',
      testCases: [
        'response_time',
        'throughput',
        'memory_usage',
        'database_queries',
        'concurrent_users',
        'large_payloads',
        'caching_effectiveness'
      ]
    }
  },

  // Test data generators
  testData: {
    users: {
      valid: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123',
        contactNumber: '+1234567890',
        roleIds: ['role-1']
      },
      invalid: {
        name: '',
        email: 'invalid-email',
        password: '123',
        contactNumber: 'invalid-phone'
      }
    },
    roles: {
      valid: {
        name: 'Test Role',
        description: 'Test role description',
        permissions: ['users:view', 'users:edit'],
        color: '#3B82F6',
        priority: 1
      },
      invalid: {
        name: '',
        description: 'A'.repeat(1001), // Too long
        permissions: ['invalid:permission']
      }
    },
    support_tickets: {
      valid: {
        title: 'Test Ticket',
        description: 'Test ticket description',
        priority: 'medium',
        category: 'technical'
      },
      invalid: {
        title: '',
        description: '',
        priority: 'invalid_priority',
        category: 'invalid_category'
      }
    }
  },

  // Performance thresholds
  performance: {
    responseTime: {
      fast: 100, // ms
      acceptable: 500, // ms
      slow: 2000 // ms
    },
    throughput: {
      min: 100, // requests per second
      target: 1000 // requests per second
    },
    memoryUsage: {
      max: 100 * 1024 * 1024 // 100MB
    },
    concurrentUsers: {
      min: 10,
      target: 100
    }
  },

  // Security test patterns
  security: {
    sqlInjection: [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; INSERT INTO users VALUES ('hacker', 'hacker@evil.com'); --"
    ],
    xssAttacks: [
      "<script>alert('xss')</script>",
      "<img src=x onerror=alert('xss')>",
      "javascript:alert('xss')"
    ],
    pathTraversal: [
      "../../../etc/passwd",
      "..\\..\\..\\windows\\system32\\config\\sam"
    ]
  },

  // Mock data
  mocks: {
    database: {
      users: [
        {
          id: 'user-1',
          name: 'Admin User',
          email: 'admin@techcorp.com',
          isActive: true,
          createdAt: new Date(),
          userRoles: [{ role: { name: 'Admin' } }]
        }
      ],
      roles: [
        {
          id: 'role-1',
          name: 'Admin',
          description: 'Administrator role',
          isActive: true,
          permissions: [{ permission: { name: 'users:view' } }]
        }
      ],
      auditLogs: [
        {
          id: 'audit-1',
          action: 'USER_LOGIN',
          description: 'User logged in',
          ipAddress: '192.168.1.1',
          createdAt: new Date(),
          user: { name: 'Admin User', email: 'admin@techcorp.com' }
        }
      ]
    }
  }
};

export default TEST_CONFIG; 