import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Multi-Tenant Next.js API',
      version: '1.0.0',
      description: `API documentation for Multi-Tenant Next.js application with SuperAdmin and Tenant management

## Available Credentials

### SuperAdmin
- **Email**: admin@superadmin.com
- **Password**: AdminPass123
- **URL**: http://localhost:3000/superadmin/login

### Tenants

#### TechCorp Solutions
- **URL**: http://localhost:3000/techcorp/login
- **Admin**: admin@techcorp.com / AdminPass123
- **Manager**: manager@techcorp.com / AdminPass123
- **User**: user@techcorp.com / AdminPass123
- **Viewer**: viewer@techcorp.com / AdminPass123

#### Global Retail Inc
- **URL**: http://localhost:3000/globalretail/login
- **Admin**: admin@globalretail.com / AdminPass123
- **Manager**: manager@globalretail.com / AdminPass123
- **User**: user@globalretail.com / AdminPass123
- **Viewer**: viewer@globalretail.com / AdminPass123`,
      contact: {
        name: 'API Support',
        email: 'support@multitenant.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://your-domain.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'auth-token',
          description: 'Cookie-based authentication'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            status: {
              type: 'number',
              description: 'HTTP status code'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              description: 'Current page number'
            },
            limit: {
              type: 'number',
              description: 'Number of items per page'
            },
            total: {
              type: 'number',
              description: 'Total number of items'
            },
            totalPages: {
              type: 'number',
              description: 'Total number of pages'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID'
            },
            email: {
              type: 'string',
              description: 'User email'
            },
            name: {
              type: 'string',
              description: 'User name'
            },
            role: {
              type: 'string',
              description: 'User role'
            },
            tenantId: {
              type: 'string',
              description: 'Tenant ID'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Tenant: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Tenant ID'
            },
            name: {
              type: 'string',
              description: 'Tenant name'
            },
            slug: {
              type: 'string',
              description: 'Tenant slug'
            },
            domain: {
              type: 'string',
              description: 'Tenant domain'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'suspended'],
              description: 'Tenant status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Audit log ID'
            },
            action: {
              type: 'string',
              description: 'Action performed'
            },
            entity: {
              type: 'string',
              description: 'Entity affected'
            },
            entityId: {
              type: 'string',
              description: 'Entity ID'
            },
            userId: {
              type: 'string',
              description: 'User who performed the action'
            },
            tenantId: {
              type: 'string',
              description: 'Tenant ID'
            },
            details: {
              type: 'object',
              description: 'Additional details'
            },
            ipAddress: {
              type: 'string',
              description: 'IP address'
            },
            userAgent: {
              type: 'string',
              description: 'User agent'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication endpoints'
      },
      {
        name: 'SuperAdmin',
        description: 'SuperAdmin specific endpoints'
      },
      {
        name: 'Tenant',
        description: 'Tenant specific endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Audit Logs',
        description: 'Audit logging endpoints'
      },
      {
        name: 'Support',
        description: 'Support ticket endpoints'
      },
      {
        name: 'Notifications',
        description: 'Notification endpoints'
      },
      {
        name: 'Reports',
        description: 'Reporting endpoints'
      }
    ]
  },
  apis: [
    './src/app/api/**/*.ts',
    './src/app/api/**/*.js',
    './src/lib/**/*.ts',
    './src/lib/**/*.js'
  ]
};

export const specs = swaggerJsdoc(options); 