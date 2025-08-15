import { Request, Response } from 'express';
import { successResponse, errorResponse } from '@/utils/apiResponse';
import { logger } from '@/config/logger';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Interactive API documentation
 *     description: Get interactive API documentation interface
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Documentation interface
 */
export const getInteractiveDocs = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const docsData = {
      title: 'Multi-Tenant Admin API Documentation',
      version: '1.0.0',
      description:
        'Comprehensive API documentation for the Multi-Tenant Admin Panel',
      baseUrl: '/api',
      swaggerUrl: '/api/docs/openapi.json',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    };

    successResponse(res, docsData, 'Interactive documentation available');
  } catch (error) {
    logger.error('Documentation error:', error);
    errorResponse(res, 'Failed to load documentation', 500);
  }
};

/**
 * @swagger
 * /api/docs/openapi.json:
 *   get:
 *     summary: OpenAPI specification
 *     description: Get OpenAPI/Swagger specification in JSON format
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: OpenAPI specification
 */
export const getOpenAPISpec = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // This would typically be generated from route definitions
    const openAPISpec = {
      openapi: '3.0.0',
      info: {
        title: 'Multi-Tenant Admin API',
        version: '1.0.0',
        description: 'Comprehensive API for Multi-Tenant Admin Panel',
        contact: {
          name: 'API Support',
          email: 'support@example.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: 'http://localhost:3001/api',
          description: 'Development server',
        },
        {
          url: 'https://api.example.com/api',
          description: 'Production server',
        },
      ],
      paths: {
        '/auth/login': {
          post: {
            summary: 'User authentication',
            description: 'Authenticate user with email and password',
            tags: ['Authentication'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      email: {
                        type: 'string',
                        format: 'email',
                      },
                      password: {
                        type: 'string',
                        minLength: 6,
                      },
                      tenantSlug: {
                        type: 'string',
                        description:
                          'Optional tenant slug for multi-tenant login',
                      },
                    },
                    required: ['email', 'password'],
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Authentication successful',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: {
                          type: 'boolean',
                        },
                        message: {
                          type: 'string',
                        },
                        data: {
                          type: 'object',
                          properties: {
                            accessToken: {
                              type: 'string',
                            },
                            refreshToken: {
                              type: 'string',
                            },
                            user: {
                              type: 'object',
                              properties: {
                                id: {
                                  type: 'string',
                                },
                                email: {
                                  type: 'string',
                                },
                                name: {
                                  type: 'string',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              '401': {
                description: 'Authentication failed',
              },
              '400': {
                description: 'Invalid request data',
              },
            },
          },
        },
        '/users': {
          get: {
            summary: 'List users',
            description: 'Get list of users with pagination and filtering',
            tags: ['Users'],
            security: [
              {
                bearerAuth: [],
              },
            ],
            parameters: [
              {
                name: 'page',
                in: 'query',
                description: 'Page number',
                schema: {
                  type: 'integer',
                  default: 1,
                },
              },
              {
                name: 'limit',
                in: 'query',
                description: 'Items per page',
                schema: {
                  type: 'integer',
                  default: 20,
                },
              },
              {
                name: 'search',
                in: 'query',
                description: 'Search term',
                schema: {
                  type: 'string',
                },
              },
            ],
            responses: {
              '200': {
                description: 'Users retrieved successfully',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: {
                          type: 'boolean',
                        },
                        message: {
                          type: 'string',
                        },
                        data: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: {
                                type: 'string',
                              },
                              email: {
                                type: 'string',
                              },
                              name: {
                                type: 'string',
                              },
                              isActive: {
                                type: 'boolean',
                              },
                              createdAt: {
                                type: 'string',
                                format: 'date-time',
                              },
                            },
                          },
                        },
                        meta: {
                          type: 'object',
                          properties: {
                            page: {
                              type: 'integer',
                            },
                            limit: {
                              type: 'integer',
                            },
                            total: {
                              type: 'integer',
                            },
                            totalPages: {
                              type: 'integer',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              '401': {
                description: 'Unauthorized',
              },
              '403': {
                description: 'Forbidden',
              },
            },
          },
          post: {
            summary: 'Create user',
            description: 'Create a new user',
            tags: ['Users'],
            security: [
              {
                bearerAuth: [],
              },
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      email: {
                        type: 'string',
                        format: 'email',
                      },
                      password: {
                        type: 'string',
                        minLength: 6,
                      },
                      name: {
                        type: 'string',
                      },
                      roleIds: {
                        type: 'array',
                        items: {
                          type: 'string',
                        },
                      },
                    },
                    required: ['email', 'password', 'name'],
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'User created successfully',
              },
              '400': {
                description: 'Invalid request data',
              },
              '401': {
                description: 'Unauthorized',
              },
              '403': {
                description: 'Forbidden',
              },
            },
          },
        },
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                example: false,
              },
              message: {
                type: 'string',
                example: 'Error message',
              },
              errors: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
          User: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              email: {
                type: 'string',
                format: 'email',
              },
              name: {
                type: 'string',
              },
              isActive: {
                type: 'boolean',
              },
              tenantId: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
        },
      },
      tags: [
        {
          name: 'Authentication',
          description: 'Authentication and authorization endpoints',
        },
        {
          name: 'Users',
          description: 'User management endpoints',
        },
        {
          name: 'Roles',
          description: 'Role management endpoints',
        },
        {
          name: 'Tenants',
          description: 'Tenant management endpoints',
        },
        {
          name: 'Support',
          description: 'Support ticket management endpoints',
        },
        {
          name: 'Audit',
          description: 'Audit logging endpoints',
        },
        {
          name: 'Files',
          description: 'File upload and management endpoints',
        },
        {
          name: 'Sessions',
          description: 'Session management endpoints',
        },
        {
          name: 'Analytics',
          description: 'Analytics and reporting endpoints',
        },
        {
          name: 'Health',
          description: 'Health check and monitoring endpoints',
        },
      ],
    };

    successResponse(
      res,
      openAPISpec,
      'OpenAPI specification retrieved successfully'
    );
  } catch (error) {
    logger.error('OpenAPI spec error:', error);
    errorResponse(res, 'Failed to generate OpenAPI specification', 500);
  }
};

/**
 * @swagger
 * /api/docs/postman:
 *   get:
 *     summary: Postman collection
 *     description: Get Postman collection for API testing
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Postman collection
 */
export const getPostmanCollection = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const postmanCollection = {
      info: {
        name: 'Multi-Tenant Admin API',
        description: 'Postman collection for Multi-Tenant Admin API',
        version: '1.0.0',
        schema:
          'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      variable: [
        {
          key: 'baseUrl',
          value: 'http://localhost:3001/api',
          type: 'string',
        },
        {
          key: 'accessToken',
          value: '',
          type: 'string',
        },
        {
          key: 'refreshToken',
          value: '',
          type: 'string',
        },
      ],
      item: [
        {
          name: 'Authentication',
          item: [
            {
              name: 'Login',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/json',
                  },
                ],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify(
                    {
                      email: 'admin@example.com',
                      password: 'password123',
                    },
                    null,
                    2
                  ),
                },
                url: {
                  raw: '{{baseUrl}}/auth/login',
                  host: ['{{baseUrl}}'],
                  path: ['auth', 'login'],
                },
              },
            },
            {
              name: 'Refresh Token',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/json',
                  },
                ],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify(
                    {
                      refreshToken: '{{refreshToken}}',
                    },
                    null,
                    2
                  ),
                },
                url: {
                  raw: '{{baseUrl}}/auth/refresh',
                  host: ['{{baseUrl}}'],
                  path: ['auth', 'refresh'],
                },
              },
            },
          ],
        },
        {
          name: 'Users',
          item: [
            {
              name: 'List Users',
              request: {
                method: 'GET',
                header: [
                  {
                    key: 'Authorization',
                    value: 'Bearer {{accessToken}}',
                  },
                ],
                url: {
                  raw: '{{baseUrl}}/users?page=1&limit=20',
                  host: ['{{baseUrl}}'],
                  path: ['users'],
                  query: [
                    {
                      key: 'page',
                      value: '1',
                    },
                    {
                      key: 'limit',
                      value: '20',
                    },
                  ],
                },
              },
            },
            {
              name: 'Create User',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Authorization',
                    value: 'Bearer {{accessToken}}',
                  },
                  {
                    key: 'Content-Type',
                    value: 'application/json',
                  },
                ],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify(
                    {
                      email: 'newuser@example.com',
                      password: 'password123',
                      name: 'New User',
                      roleIds: ['role-id-here'],
                    },
                    null,
                    2
                  ),
                },
                url: {
                  raw: '{{baseUrl}}/users',
                  host: ['{{baseUrl}}'],
                  path: ['users'],
                },
              },
            },
          ],
        },
      ],
    };

    successResponse(
      res,
      postmanCollection,
      'Postman collection retrieved successfully'
    );
  } catch (error) {
    logger.error('Postman collection error:', error);
    errorResponse(res, 'Failed to generate Postman collection', 500);
  }
};

/**
 * @swagger
 * /api/docs/changelog:
 *   get:
 *     summary: API changelog
 *     description: Get API version changelog and migration guides
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: API changelog
 */
export const getChangelog = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const changelog = {
      version: '1.0.0',
      date: '2024-01-15',
      changes: [
        {
          type: 'feature',
          description: 'Initial API release',
          details: [
            'Complete authentication system with JWT tokens',
            'Multi-tenant user management',
            'Role-based access control',
            'Support ticket system',
            'File upload and management',
            'Session management',
            'Audit logging',
            'Analytics and reporting',
            'Health monitoring',
          ],
        },
      ],
      breakingChanges: [],
      migrationGuide: {
        from: null,
        to: '1.0.0',
        steps: ['No migration required for initial release'],
      },
      deprecations: [],
      upcoming: [
        {
          version: '1.1.0',
          planned: '2024-02-15',
          features: [
            'Enhanced caching system',
            'Advanced analytics',
            'Webhook support',
            'API rate limiting improvements',
          ],
        },
      ],
    };

    successResponse(res, changelog, 'Changelog retrieved successfully');
  } catch (error) {
    logger.error('Changelog error:', error);
    errorResponse(res, 'Failed to retrieve changelog', 500);
  }
};

/**
 * @swagger
 * /api/docs/examples:
 *   get:
 *     summary: Code examples
 *     description: Get code examples in multiple languages
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Code examples
 */
export const getCodeExamples = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const examples = {
      languages: {
        javascript: {
          name: 'JavaScript (Node.js)',
          examples: {
            authentication: {
              title: 'User Authentication',
              code: `const axios = require('axios');

const login = async (email, password) => {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email,
      password,
    });
    
    const { accessToken, refreshToken, user } = response.data.data;
    
    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return user;
  } catch (error) {
    console.error('Login failed:', error.response.data);
    throw error;
  }
};

// Usage
login('admin@example.com', 'password123')
  .then(user => console.log('Logged in:', user))
  .catch(error => console.error('Error:', error));`,
            },
            users: {
              title: 'List Users',
              code: `const getUsers = async (page = 1, limit = 20) => {
  try {
    const response = await axios.get(\`http://localhost:3001/api/users?page=\${page}&limit=\${limit}\`, {
      headers: {
        'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`,
      },
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to get users:', error.response.data);
    throw error;
  }
};`,
            },
          },
        },
        python: {
          name: 'Python',
          examples: {
            authentication: {
              title: 'User Authentication',
              code: `import requests

def login(email, password):
    try:
        response = requests.post('http://localhost:3001/api/auth/login', json={
            'email': email,
            'password': password,
        })
        
        data = response.json()
        access_token = data['data']['accessToken']
        refresh_token = data['data']['refreshToken']
        user = data['data']['user']
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user,
        }
    except requests.exceptions.RequestException as e:
        print(f'Login failed: {e}')
        raise

# Usage
try:
    result = login('admin@example.com', 'password123')
    print(f'Logged in: {result["user"]}')
except Exception as e:
    print(f'Error: {e}')`,
            },
            users: {
              title: 'List Users',
              code: `def get_users(page=1, limit=20, access_token=None):
    headers = {
        'Authorization': f'Bearer {access_token}',
    }
    
    params = {
        'page': page,
        'limit': limit,
    }
    
    try:
        response = requests.get('http://localhost:3001/api/users', 
                              headers=headers, params=params)
        return response.json()['data']
    except requests.exceptions.RequestException as e:
        print(f'Failed to get users: {e}')
        raise`,
            },
          },
        },
        curl: {
          name: 'cURL',
          examples: {
            authentication: {
              title: 'User Authentication',
              code: `# Login
curl -X POST http://localhost:3001/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Response will include accessToken and refreshToken`,
            },
            users: {
              title: 'List Users',
              code: `# Get users (replace YOUR_ACCESS_TOKEN with actual token)
curl -X GET http://localhost:3001/api/users \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json"

# With pagination
curl -X GET "http://localhost:3001/api/users?page=1&limit=20" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json"`,
            },
          },
        },
      },
    };

    successResponse(res, examples, 'Code examples retrieved successfully');
  } catch (error) {
    logger.error('Code examples error:', error);
    errorResponse(res, 'Failed to retrieve code examples', 500);
  }
};

// Export individual functions for routes
export const interactiveDocs = getInteractiveDocs;
export const openAPISpec = getOpenAPISpec;
export const postmanCollection = getPostmanCollection;
export const changelog = getChangelog;
export const codeExamples = getCodeExamples;
