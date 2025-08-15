import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Multi-Tenant Platform API',
      version: '1.0.0',
      description:
        'A comprehensive multi-tenant platform API with user management, role-based access control, and tenant isolation.',
      contact: {
        name: 'API Support',
        email: 'support@multitenant-platform.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.multitenant-platform.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication',
        },
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890abcdef' },
            name: { type: 'string', example: 'John Doe' },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            isActive: { type: 'boolean', example: true },
            isSuperadmin: { type: 'boolean', example: false },
            tenantId: {
              type: 'string',
              nullable: true,
              example: 'clx1234567890abcdef',
            },
            lastLoginAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'name', 'email', 'isActive', 'isSuperadmin'],
        },
        CreateUserRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: { type: 'string', example: 'securePassword123' },
            tenantId: { type: 'string', nullable: true },
            isSuperadmin: { type: 'boolean', default: false },
            isActive: { type: 'boolean', default: true },
          },
          required: ['name', 'email', 'password'],
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: { type: 'string', example: 'newPassword123' },
            tenantId: { type: 'string', nullable: true },
            isSuperadmin: { type: 'boolean' },
            isActive: { type: 'boolean' },
          },
        },
        LoginRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: { type: 'string', example: 'password123' },
            tenantSlug: { type: 'string', nullable: true, example: 'tenant-a' },
          },
          required: ['email', 'password'],
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                accessToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                refreshToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },

        // Tenant schemas
        Tenant: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890abcdef' },
            name: { type: 'string', example: 'Acme Corporation' },
            domain: {
              type: 'string',
              nullable: true,
              example: 'acme.example.com',
            },
            isActive: { type: 'boolean', example: true },
            loginRestrictions: { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'name', 'isActive'],
        },
        CreateTenantRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Acme Corporation' },
            domain: {
              type: 'string',
              nullable: true,
              example: 'acme.example.com',
            },
            isActive: { type: 'boolean', default: true },
            loginRestrictions: {
              type: 'object',
              properties: {
                allowedDomains: { type: 'array', items: { type: 'string' } },
                maxUsers: { type: 'number', example: 100 },
                allowedIpRanges: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          required: ['name'],
        },

        // Role schemas
        Role: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890abcdef' },
            name: { type: 'string', example: 'Admin' },
            description: {
              type: 'string',
              nullable: true,
              example: 'Administrator role',
            },
            tenantId: { type: 'string', nullable: true },
            isGlobal: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'name', 'isGlobal'],
        },
        CreateRoleRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Admin' },
            description: {
              type: 'string',
              nullable: true,
              example: 'Administrator role',
            },
            tenantId: { type: 'string', nullable: true },
            isGlobal: { type: 'boolean', default: false },
          },
          required: ['name'],
        },

        // Module schemas
        Module: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890abcdef' },
            name: { type: 'string', example: 'User Management' },
            description: {
              type: 'string',
              nullable: true,
              example: 'Manage users and permissions',
            },
            isActive: { type: 'boolean', example: true },
            orderIndex: { type: 'number', example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'name', 'isActive', 'orderIndex'],
        },
        CreateModuleRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'User Management' },
            description: {
              type: 'string',
              nullable: true,
              example: 'Manage users and permissions',
            },
            isActive: { type: 'boolean', default: true },
            orderIndex: { type: 'number', default: 0 },
          },
          required: ['name'],
        },

        // Permission schemas
        Permission: {
          type: 'object',
          properties: {
            moduleId: { type: 'string', example: 'clx1234567890abcdef' },
            submoduleId: { type: 'string', nullable: true },
            canCreate: { type: 'boolean', example: true },
            canRead: { type: 'boolean', example: true },
            canUpdate: { type: 'boolean', example: true },
            canDelete: { type: 'boolean', example: false },
            canViewAll: { type: 'boolean', example: true },
          },
          required: [
            'moduleId',
            'canCreate',
            'canRead',
            'canUpdate',
            'canDelete',
            'canViewAll',
          ],
        },

        // Device schemas
        DeviceRecord: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890abcdef' },
            userId: { type: 'string', example: 'clx1234567890abcdef' },
            deviceId: { type: 'string', example: 'uuid-device-123' },
            userAgent: { type: 'string', example: 'Mozilla/5.0...' },
            ipAddress: { type: 'string', example: '192.168.1.1' },
            deviceType: { type: 'string', example: 'desktop' },
            browser: { type: 'string', example: 'Chrome' },
            os: { type: 'string', example: 'Windows' },
            platform: { type: 'string', example: 'Desktop' },
            isActive: { type: 'boolean', example: true },
            lastUsedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // Common response schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: {
              type: 'string',
              example: 'Operation completed successfully',
            },
            data: { type: 'object' },
          },
          required: ['success', 'message'],
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'An error occurred' },
            errorType: {
              type: 'string',
              enum: [
                'VALIDATION',
                'AUTHENTICATION',
                'AUTHORIZATION',
                'NOT_FOUND',
                'CONFLICT',
                'INTERNAL',
                'BAD_REQUEST',
                'RATE_LIMIT',
              ],
              example: 'VALIDATION',
            },
            errorCode: { type: 'string', example: 'VALIDATION_ERROR' },
            details: { type: 'object' },
            requestId: { type: 'string', example: 'uuid-request-id' },
          },
          required: ['success', 'message', 'errorType'],
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Data retrieved successfully' },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array' },
                total: { type: 'number', example: 100 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 10 },
              },
            },
          },
          required: ['success', 'message', 'data'],
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Users',
        description: 'User management operations',
      },
      {
        name: 'Tenants',
        description: 'Multi-tenant organization management',
      },
      {
        name: 'Roles',
        description: 'Role-based access control management',
      },
      {
        name: 'Modules',
        description: 'Dynamic module and submodule management',
      },
      {
        name: 'Permissions',
        description: 'Granular permission management',
      },
      {
        name: 'Support',
        description: 'Support ticket management',
      },
      {
        name: 'System',
        description: 'System health and configuration endpoints',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/middleware/*.ts',
  ],
};

export const specs = swaggerJsdoc(options);
