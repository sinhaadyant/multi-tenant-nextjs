# API Documentation Guide

## Multi-Tenant Next.js Application API Documentation

This guide explains how to use the API documentation and testing tools for the Multi-Tenant Next.js application.

## Table of Contents

1. [Swagger Documentation](#swagger-documentation)
2. [Postman Collection](#postman-collection)
3. [API Features](#api-features)
4. [Getting Started](#getting-started)
5. [Authentication](#authentication)
6. [Testing APIs](#testing-apis)

## API Documentation

### Accessing API Documentation

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Available Documentation Pages**:
   - **Simple Documentation**: `http://localhost:3000/docs-simple` (Recommended - no SSR issues)
   - **Interactive Swagger UI**: `http://localhost:3000/docs` (May have SSR issues)
   - **Raw API Spec**: `http://localhost:3000/api-docs` (Formatted JSON)
   - **API Endpoint**: `http://localhost:3000/api/docs` (Raw JSON)

### Features of Swagger UI

- **Interactive API Explorer**: Test endpoints directly from the browser
- **Request/Response Examples**: See example requests and responses
- **Authentication Support**: JWT token authentication
- **Schema Documentation**: Complete data model documentation
- **Try It Out**: Execute API calls directly from the documentation

### Swagger UI Components

- **API Endpoints**: Organized by tags (Authentication, SuperAdmin, Tenant, etc.)
- **Request Parameters**: Query parameters, path parameters, and request bodies
- **Response Schemas**: Detailed response structure documentation
- **Authentication**: Bearer token authentication setup
- **Error Codes**: Standardized error response documentation

## Postman Collection

### Importing the Collection

1. **Download the collection**:
   - File: `postman-collection.json`
   - This contains all SuperAdmin and Tenant API endpoints

2. **Import into Postman**:
   - Open Postman
   - Click "Import" button
   - Select the `postman-collection.json` file
   - The collection will be imported with all endpoints

### Collection Structure

```
Multi-Tenant NextJS API/
├── Authentication/
│   ├── SuperAdmin Login
│   ├── Tenant Login
│   ├── Refresh Token
│   ├── Logout
│   └── Verify Token
├── SuperAdmin APIs/
│   ├── Dashboard/
│   ├── Tenants/
│   ├── Users/
│   ├── Audit Logs/
│   ├── Support Tickets/
│   ├── Reports/
│   └── Backup & Import/
├── Tenant APIs/
│   ├── Dashboard/
│   ├── Users/
│   ├── Audit Logs/
│   ├── Support/
│   ├── Settings/
│   └── Profile/
└── Search/
    └── Global Search
```

### Environment Variables

The collection uses the following environment variables:

- `baseUrl`: API base URL (default: `http://localhost:3000/api`)
- `superadminToken`: JWT token for SuperAdmin authentication
- `tenantToken`: JWT token for Tenant authentication
- `tenantSlug`: Tenant slug for tenant-specific requests

### Setting Up Environment Variables

1. **Create a new environment in Postman**:
   - Click "Environments" in the sidebar
   - Click "Add" to create a new environment
   - Add the variables listed above

2. **Set initial values**:
   ```
   baseUrl: http://localhost:3000/api
   superadminToken: (leave empty initially)
   tenantToken: (leave empty initially)
   tenantSlug: techcorp
   ```

### Automatic Token Management

The collection includes scripts that automatically:
- Set authentication headers based on the endpoint type
- Save tokens from login responses
- Log response status and timing

## API Features

### 1. Authentication & Authorization

- **JWT Token Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different permissions for SuperAdmin and Tenant users
- **Multi-Tenant Isolation**: Complete data separation between tenants
- **Token Refresh**: Automatic token refresh mechanism

### 2. Pagination

All list endpoints support pagination:
```
GET /api/users?page=1&limit=10&search=&role=
```

Response format:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 3. Search & Filtering

- **Global Search**: Search across multiple entities
- **Entity-Specific Search**: Search within specific entities
- **Advanced Filtering**: Multiple filter criteria
- **Date Range Filtering**: Filter by date ranges

### 4. Audit Logging

- **Comprehensive Logging**: All user actions are logged
- **Search & Filter**: Advanced audit log querying
- **Export Functionality**: CSV/JSON export capabilities

### 5. Error Handling

Standardized error responses:
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "status": 400,
    "details": {}
  }
}
```

## Getting Started

### 1. Prerequisites

- Node.js 18+ installed
- Database setup (MySQL/PostgreSQL)
- Environment variables configured

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd multi-tenant-nextjs

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Start the development server
npm run dev
```

### 3. Initial Setup

1. **Create SuperAdmin account**:
   ```bash
   npm run update-password
   ```

2. **Create test tenants**:
   ```bash
   npm run db:seed-tenants
   ```

3. **Create test users**:
   ```bash
   npm run db:seed-users
   ```

### 4. Available Credentials

#### SuperAdmin Access
- **URL**: http://localhost:3000/superadmin/login
- **Email**: admin@superadmin.com
- **Password**: AdminPass123

#### Tenant Access

##### TechCorp Solutions
- **URL**: http://localhost:3000/techcorp/login
- **Admin**: admin@techcorp.com / AdminPass123
- **Manager**: manager@techcorp.com / AdminPass123
- **User**: user@techcorp.com / AdminPass123
- **Viewer**: viewer@techcorp.com / AdminPass123

##### Global Retail Inc
- **URL**: http://localhost:3000/globalretail/login
- **Admin**: admin@globalretail.com / AdminPass123
- **Manager**: manager@globalretail.com / AdminPass123
- **User**: user@globalretail.com / AdminPass123
- **Viewer**: viewer@globalretail.com / AdminPass123

## Authentication

### SuperAdmin Authentication

1. **Login**:
   ```bash
   POST /api/superadmin/auth/login
   {
     "email": "admin@superadmin.com",
     "password": "AdminPass123"
   }
   ```

2. **Response**:
   ```json
   {
     "token": "jwt-access-token",
     "refreshToken": "jwt-refresh-token",
     "user": {
       "id": "user-id",
       "email": "admin@superadmin.com",
       "role": "superadmin"
     }
   }
   ```

### Tenant Authentication

#### TechCorp Solutions
1. **Login**:
   ```bash
   POST /api/auth/login
   {
     "email": "admin@techcorp.com",
     "password": "AdminPass123",
     "tenantSlug": "techcorp"
   }
   ```

#### Global Retail Inc
1. **Login**:
   ```bash
   POST /api/auth/login
   {
     "email": "admin@globalretail.com",
     "password": "AdminPass123",
     "tenantSlug": "globalretail"
   }
   ```

2. **Response**:
   ```json
   {
     "token": "jwt-access-token",
     "refreshToken": "jwt-refresh-token",
     "user": {
       "id": "user-id",
       "email": "user@tenant.com",
       "role": "admin",
       "tenantId": "tenant-id"
     }
   }
   ```

### Using Tokens

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Testing APIs

### Using Swagger UI

1. **Navigate to Swagger UI**: `http://localhost:3000/docs`
2. **Authenticate**: Click "Authorize" and enter your JWT token
3. **Test Endpoints**: Click on any endpoint and use "Try it out"
4. **View Responses**: See real-time responses and schemas

### Using Postman

1. **Import Collection**: Import `postman-collection.json`
2. **Set Environment**: Configure environment variables
3. **Login First**: Execute SuperAdmin or Tenant login
4. **Test Endpoints**: Tokens are automatically managed

### Example API Tests

#### SuperAdmin Tests

1. **Login as SuperAdmin**:
   ```bash
   POST /api/superadmin/auth/login
   {
     "email": "admin@superadmin.com",
     "password": "AdminPass123"
   }
   ```

2. **Get Dashboard Stats**:
   ```bash
   GET /api/superadmin/dashboard/stats
   ```

3. **List Tenants**:
   ```bash
   GET /api/superadmin/tenants?page=1&limit=10
   ```

4. **Create Tenant**:
   ```bash
   POST /api/superadmin/tenants
   {
     "name": "New Tenant",
     "slug": "new-tenant",
     "domain": "newtenant.com",
     "email": "admin@newtenant.com",
     "password": "AdminPass123"
   }
   ```

#### Tenant Tests

##### TechCorp Solutions
1. **Login as TechCorp Admin**:
   ```bash
   POST /api/auth/login
   {
     "email": "admin@techcorp.com",
     "password": "AdminPass123",
     "tenantSlug": "techcorp"
   }
   ```

2. **Get Tenant Dashboard**:
   ```bash
   GET /api/tenant/dashboard
   ```

3. **List Tenant Users**:
   ```bash
   GET /api/tenant/users?page=1&limit=10
   ```

4. **Create Support Ticket**:
   ```bash
   POST /api/tenant/support
   {
     "subject": "Technical Issue",
     "description": "I am experiencing a technical issue",
     "priority": "medium",
     "category": "technical"
   }
   ```

##### Global Retail Inc
1. **Login as Global Retail Admin**:
   ```bash
   POST /api/auth/login
   {
     "email": "admin@globalretail.com",
     "password": "AdminPass123",
     "tenantSlug": "globalretail"
   }
   ```

## Common API Patterns

### Pagination
```bash
GET /api/users?page=1&limit=10&search=john&role=admin
```

### Search
```bash
GET /api/search?q=search-term&type=all&page=1&limit=10
```

### Filtering
```bash
GET /api/audit-logs?action=create&entity=user&startDate=2024-01-01&endDate=2024-12-31
```

### Error Handling
```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "status": 404
  }
}
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Ensure JWT token is valid and not expired
   - Check if token is properly set in Authorization header
   - Verify user has correct permissions

2. **CORS Errors**:
   - Ensure server is running on correct port
   - Check CORS configuration in server settings

3. **Database Connection**:
   - Verify database is running and accessible
   - Check database connection string in environment variables

4. **Rate Limiting**:
   - Check if you've exceeded rate limits
   - Wait before making additional requests

### Debug Mode

Enable debug mode for detailed logging:
```bash
DEBUG=* npm run dev
```

### API Health Check

Check if the API is running:
```bash
GET /api/health
```

## Support

For additional support:

1. **Check API Documentation**: Use Swagger UI for detailed endpoint documentation
2. **Review Error Logs**: Check server logs for detailed error information
3. **Test with Postman**: Use the provided Postman collection for testing
4. **Create Support Ticket**: Use the support ticket system for issues

## Additional Resources

- [API Enhancement Documentation](./API_ENHANCEMENT.md)
- [Database Schema](./prisma/schema.prisma)
- [Environment Variables](./.env.example)
- [Testing Guide](./tests/README.md)

This comprehensive API documentation provides everything needed to understand, test, and integrate with the Multi-Tenant Next.js application APIs. 