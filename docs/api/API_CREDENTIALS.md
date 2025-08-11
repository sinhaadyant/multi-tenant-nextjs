# API Credentials Reference

## Multi-Tenant Next.js Application Login Credentials

This document provides all the login credentials for testing the Multi-Tenant Next.js application APIs.

## SuperAdmin Access

### Web Interface
- **URL**: http://localhost:3000/superadmin/login
- **Email**: admin@superadmin.com
- **Password**: AdminPass123

### API Endpoint
```bash
POST /api/superadmin/auth/login
{
  "email": "admin@superadmin.com",
  "password": "AdminPass123"
}
```

## Tenant Access

### TechCorp Solutions

#### Web Interface
- **URL**: http://localhost:3000/techcorp/login

#### Available Users
- **Admin**: admin@techcorp.com / AdminPass123
- **Manager**: manager@techcorp.com / AdminPass123
- **User**: user@techcorp.com / AdminPass123
- **Viewer**: viewer@techcorp.com / AdminPass123

#### API Endpoint
```bash
POST /api/auth/login
{
  "email": "admin@techcorp.com",
  "password": "AdminPass123",
  "tenantSlug": "techcorp"
}
```

### Global Retail Inc

#### Web Interface
- **URL**: http://localhost:3000/globalretail/login

#### Available Users
- **Admin**: admin@globalretail.com / AdminPass123
- **Manager**: manager@globalretail.com / AdminPass123
- **User**: user@globalretail.com / AdminPass123
- **Viewer**: viewer@globalretail.com / AdminPass123

#### API Endpoint
```bash
POST /api/auth/login
{
  "email": "admin@globalretail.com",
  "password": "AdminPass123",
  "tenantSlug": "globalretail"
}
```

## Postman Collection Variables

When using the Postman collection, set these environment variables:

```
baseUrl: http://localhost:3000/api
superadminToken: (leave empty initially)
tenantToken: (leave empty initially)
tenantSlug: techcorp
```

## Testing Scenarios

### 1. SuperAdmin Testing
1. Use SuperAdmin login to get access token
2. Test SuperAdmin-specific endpoints
3. Manage tenants and users

### 2. TechCorp Tenant Testing
1. Use TechCorp admin login with tenantSlug: "techcorp"
2. Test tenant-specific endpoints
3. Manage TechCorp users and settings

### 3. Global Retail Tenant Testing
1. Use Global Retail admin login with tenantSlug: "globalretail"
2. Test tenant-specific endpoints
3. Manage Global Retail users and settings

### 4. Multi-Role Testing
Test different user roles within each tenant:
- **Admin**: Full access to tenant management
- **Manager**: Limited administrative access
- **User**: Standard user access
- **Viewer**: Read-only access

## Security Notes

- All passwords are set to "AdminPass123" for testing purposes
- In production, use strong, unique passwords
- JWT tokens expire after 15 minutes (access token) and 7 days (refresh token)
- Always use HTTPS in production environments

## Troubleshooting

### Common Login Issues

1. **Invalid Credentials**:
   - Verify email and password are correct
   - Check for typos in tenant slug

2. **Tenant Not Found**:
   - Ensure tenant slug matches exactly: "techcorp" or "globalretail"
   - Verify tenant exists in the database

3. **Token Expired**:
   - Use refresh token endpoint to get new access token
   - Re-login if refresh token is expired

4. **Permission Denied**:
   - Verify user has correct role for the requested operation
   - Check tenant isolation rules

## API Response Examples

### Successful Login Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "admin@techcorp.com",
    "name": "Admin User",
    "role": "admin",
    "tenantId": "tenant-id"
  }
}
```

### Error Response
```json
{
  "error": {
    "message": "Invalid credentials",
    "code": "INVALID_CREDENTIALS",
    "status": 401
  }
}
```

## Quick Start Commands

### Start Development Server
```bash
npm run dev
```

### Access Swagger Documentation
```
http://localhost:3000/docs
```

### Test with Postman
1. Import `postman-collection.json`
2. Set environment variables
3. Execute "SuperAdmin Login" or "TechCorp Login"
4. Test other endpoints with automatic token management

This credentials reference provides everything needed to test the Multi-Tenant Next.js application APIs effectively. 