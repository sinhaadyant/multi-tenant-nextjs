import { http, HttpResponse } from 'msw'

// Mock API responses
export const mockDashboardData = {
  success: true,
  data: {
    summary: {
      totalTenants: 100,
      activeTenants: 95,
      totalUsers: 2500,
      totalSuperAdmins: 5,
      growthMetrics: {
        tenantGrowth: 15,
        userGrowth: 25,
        revenueGrowth: 30,
      },
    },
    charts: {
      userSignups: [
        { date: '2024-01-01', count: 10 },
        { date: '2024-01-02', count: 15 },
      ],
      tenantActivity: [
        { date: '2024-01-01', count: 5 },
        { date: '2024-01-02', count: 8 },
      ],
      roleDistribution: [
        { role: 'admin', count: 50 },
        { role: 'user', count: 200 },
      ],
      tenantPlanDistribution: [
        { plan: 'starter', count: 30 },
        { plan: 'professional', count: 45 },
        { plan: 'enterprise', count: 25 },
      ],
    },
    systemHealth: {
      databaseConnections: 150,
      activeSessions: 75,
      cpuUsage: 45,
      memoryUsage: 60,
      uptime: 99.9,
    },
    recentActivity: {
      auditLogs: [
        {
          id: 'audit-1',
          action: 'USER_LOGIN',
          createdAt: '2024-01-01T00:00:00Z',
          tenant: { name: 'Test Tenant', slug: 'test-tenant' },
          user: { email: 'test@example.com', name: 'Test User' },
          superAdmin: null,
        },
      ],
    },
    topTenants: [
      {
        id: 'tenant-1',
        name: 'Test Tenant',
        slug: 'test-tenant',
        userCount: 100,
        plan: 'enterprise',
      },
    ],
  },
}

export const mockTenantsData = {
  success: true,
  data: {
    tenants: [
      {
        id: 'tenant-1',
        name: 'Test Tenant 1',
        slug: 'test-tenant-1',
        domain: 'test-tenant-1.example.com',
        isActive: true,
        plan: 'professional',
        userCount: 25,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'tenant-2',
        name: 'Test Tenant 2',
        slug: 'test-tenant-2',
        domain: 'test-tenant-2.example.com',
        isActive: false,
        plan: 'starter',
        userCount: 10,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
    ],
    pagination: {
      currentPage: 1,
      totalPages: 5,
      totalRecords: 100,
      pageSize: 10,
    },
  },
}

export const mockUsersData = {
  success: true,
  data: {
    users: [
      {
        id: 'user-1',
        email: 'admin@test-tenant-1.com',
        name: 'Admin User',
        role: 'admin',
        isActive: true,
        tenantId: 'tenant-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'user-2',
        email: 'user@test-tenant-1.com',
        name: 'Regular User',
        role: 'user',
        isActive: true,
        tenantId: 'tenant-1',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
    ],
    pagination: {
      currentPage: 1,
      totalPages: 3,
      totalRecords: 50,
      pageSize: 20,
    },
  },
}

export const mockAuditLogsData = {
  success: true,
  data: {
    auditLogs: [
      {
        id: 'audit-1',
        action: 'USER_LOGIN',
        description: 'User logged in successfully',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        userId: 'user-1',
        tenantId: 'tenant-1',
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'audit-2',
        action: 'TENANT_CREATED',
        description: 'New tenant created',
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0...',
        userId: 'user-2',
        tenantId: 'tenant-2',
        createdAt: '2024-01-02T00:00:00Z',
      },
    ],
    pagination: {
      currentPage: 1,
      totalPages: 10,
      totalRecords: 200,
      pageSize: 20,
    },
  },
}

// MSW handlers
export const handlers = [
  // Dashboard API
  http.get('/api/superadmin/dashboard', () => {
    return HttpResponse.json(mockDashboardData)
  }),

  http.get('/api/superadmin/dashboard/stats', () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalTenants: 100,
        activeTenants: 95,
        totalUsers: 2500,
        totalSuperAdmins: 5,
      },
    })
  }),

  // Tenants API
  http.get('/api/superadmin/tenants', () => {
    return HttpResponse.json(mockTenantsData)
  }),

  http.post('/api/superadmin/tenants', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'new-tenant-id',
        name: 'New Tenant',
        slug: 'new-tenant',
      },
    })
  }),

  http.put('/api/superadmin/tenants/:id', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'tenant-1',
        name: 'Updated Tenant',
      },
    })
  }),

  http.delete('/api/superadmin/tenants/:id', () => {
    return HttpResponse.json({
      success: true,
      message: 'Tenant deleted successfully',
    })
  }),

  // Users API
  http.get('/api/superadmin/users', () => {
    return HttpResponse.json(mockUsersData)
  }),

  http.post('/api/superadmin/users', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'new-user-id',
        email: 'newuser@example.com',
        name: 'New User',
      },
    })
  }),

  http.put('/api/superadmin/users/:id', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'user-1',
        name: 'Updated User',
      },
    })
  }),

  http.delete('/api/superadmin/users/:id', () => {
    return HttpResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  }),

  // Audit Logs API
  http.get('/api/superadmin/audit-logs', () => {
    return HttpResponse.json(mockAuditLogsData)
  }),

  // Reports API
  http.get('/api/superadmin/reports', () => {
    return HttpResponse.json({
      success: true,
      data: {
        reports: [
          {
            id: 'report-1',
            name: 'Monthly Report',
            type: 'monthly',
            status: 'completed',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalRecords: 1,
          pageSize: 10,
        },
      },
    })
  }),

  // Notifications API
  http.get('/api/superadmin/notifications', () => {
    return HttpResponse.json({
      success: true,
      data: {
        notifications: [
          {
            id: 'notification-1',
            title: 'System Alert',
            message: 'System maintenance scheduled',
            type: 'info',
            isRead: false,
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalRecords: 1,
          pageSize: 10,
        },
      },
    })
  }),

  // Support Tickets API
  http.get('/api/superadmin/support-tickets', () => {
    return HttpResponse.json({
      success: true,
      data: {
        tickets: [
          {
            id: 'ticket-1',
            title: 'Technical Issue',
            description: 'Unable to access dashboard',
            status: 'open',
            priority: 'high',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalRecords: 1,
          pageSize: 10,
        },
      },
    })
  }),

  // Roles API
  http.get('/api/superadmin/roles', () => {
    return HttpResponse.json({
      success: true,
      data: {
        roles: [
          {
            id: 'role-1',
            name: 'Admin',
            description: 'Administrator role',
            permissions: ['read', 'write', 'delete'],
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalRecords: 1,
          pageSize: 10,
        },
      },
    })
  }),

  // Auth API
  http.post('/api/superadmin/auth/login', ({ request }) => {
    return HttpResponse.json({
      success: true,
      data: {
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes from now
        user: {
          id: 'superadmin-1',
          email: 'admin@superadmin.com',
          name: 'Super Admin',
          role: 'superadmin',
          avatar: null,
        },
      },
      message: 'Login successful',
    })
  }),

  // Forgot Password API
  http.post('/api/superadmin/auth/forgot-password', async ({ request }) => {
    const { email } = await request.json()
    
    if (email === 'admin@example.com') {
      return HttpResponse.json({
        success: true,
        data: {
          message: 'If an account with this email exists, password reset instructions have been sent.',
          token: 'mock-reset-token-12345'
        }
      })
    } else {
      return HttpResponse.json({
        success: true,
        data: {
          message: 'If an account with this email exists, password reset instructions have been sent.'
        }
      })
    }
  }),

  // Reset Password API
  http.post('/api/superadmin/auth/reset-password', async ({ request }) => {
    const { token, newPassword, confirmPassword } = await request.json()
    
    if (token === 'mock-reset-token-12345' && newPassword === confirmPassword) {
      return HttpResponse.json({
        success: true,
        data: {
          message: 'Password has been successfully updated.'
        }
      })
    } else {
      return HttpResponse.json({
        success: false,
        error: 'Invalid or expired reset token'
      }, { status: 400 })
    }
  }),

  // Profile API
  http.get('/api/superadmin/profile', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'superadmin-1',
        email: 'superadmin@example.com',
        name: 'Super Admin',
        avatar: null,
        preferences: {
          theme: 'light',
          notifications: true,
        },
      },
    })
  }),

  http.put('/api/superadmin/profile', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'superadmin-1',
        name: 'Updated Super Admin',
      },
    })
  }),
] 