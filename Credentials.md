# Test Credentials for Multi-Tenant Admin Panel

## Default Login Credentials

### Superadmin Users

- **Superadmin**: `superadmin@example.com` / `password123`
  - Full access to all modules and tenants
  - Can manage global roles and permissions
  - Can view all tenant data

### Tenant Admin Users

- **Tenant A Admin**: `admin@tenant-a.com` / `password123`
  - Manages Tenant A users and roles
  - Limited to Tenant A data scope
- **Tenant B Admin**: `admin@tenant-b.com` / `password123`
  - Manages Tenant B users and roles
  - Limited to Tenant B data scope

### Tenant Users

- **Tenant A User 1**: `john@tenant-a.com` / `password123`
  - Regular user in Tenant A
  - Limited permissions
- **Tenant A User 2**: `jane@tenant-a.com` / `password123`
  - Regular user in Tenant A
  - Limited permissions
- **Tenant B User**: `bob@tenant-b.com` / `password123`
  - Regular user in Tenant B
  - Limited permissions

## Tenant Information

### Tenant A

- **Name**: Tenant A
- **Domain**: tenant-a.example.com
- **Slug**: tenant-a
- **Max Users**: 100
- **Allowed Domains**: tenant-a.com
- **Status**: Active

### Tenant B

- **Name**: Tenant B
- **Domain**: tenant-b.example.com
- **Slug**: tenant-b
- **Max Users**: 50
- **Allowed Domains**: tenant-b.com
- **Status**: Active

## Role Hierarchy

### Global Roles

1. **Superadmin** - Full system access
2. **Global Support** - Support-only access

### Tenant Roles

1. **Tenant Admin** - Tenant-level administration
2. **Tenant User** - Regular tenant user

## Module Permissions

### Dashboard

- **Overview**: Read access for all users
- **Analytics**: Read access for all users

### User Management

- **User List**:
  - Superadmin: Full access
  - Tenant Admin: Create, Read, Update (own tenant)
  - Tenant User: No access
- **User Profile**:
  - All users: Read, Update (own profile)

### Role Management

- **Role List**:
  - Superadmin: Full access
  - Tenant Admin: Create, Read, Update (own tenant)
  - Tenant User: No access
- **Permissions**:
  - Superadmin: Full access
  - Others: Read only

### Tenant Management

- **Tenants**:
  - Superadmin: Full access
  - Others: No access

### Support

- **Tickets**:
  - Superadmin: Full access
  - Tenant Admin: Create, Read, Update (own tenant)
  - Tenant User: Create, Read (own tickets)
- **Knowledge Base**:
  - All users: Read access

### Notifications

- **Notifications**:
  - Superadmin: Full access
  - Others: Read access

## Test Data

### Support Tickets

1. **Login Issue** (Tenant A)

   - Status: Open
   - Priority: Medium
   - Created by: john@tenant-a.com

2. **Feature Request** (Tenant B)
   - Status: In Progress
   - Priority: Low
   - Created by: bob@tenant-b.com

### Invalid Credentials for Testing

- **Non-existent User**: `nonexistent@example.com` / `TestPassword123!`
- **Wrong Password**: `admin@tenant-a.com` / `WrongPassword123!`
- **Invalid Email**: `invalid-email` / `TestPassword123!`
- **Empty Email**: ``/`TestPassword123!`
- **Empty Password**: `admin@tenant-a.com` / ``
- **SQL Injection**: `'; DROP TABLE users; --` / `'; DROP TABLE users; --`
- **Very Long Email**: `a...a@example.com` (100 chars) / `TestPassword123!`
- **Very Long Password**: `admin@tenant-a.com` / `a...a` (1000 chars)

## Test Files

### API Tests

- **Credentials File**: `tests/api-credentials.json`
- **Test Directory**: `tests/api/`
- **Configuration**: `tests/playwright.config.ts`

### E2E Tests

- **Credentials File**: `tests/e2e/test-credentials.json`
- **Test Directory**: `tests/e2e/`
- **Configuration**: `tests/playwright.config.ts`

## Running Tests

### API Tests Only

```bash
npm run test:api
```

### E2E Tests Only

```bash
npm run test:e2e
```

### All Tests

```bash
npm run test
```

### Specific Test Files

```bash
# Login tests
npx playwright test tests/e2e/login.spec.ts

# API auth tests
npx playwright test tests/api/auth.login.spec.ts
```

## Environment Setup

### Required Environment Variables

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/multi_tenant_db"

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### Database Seeding

```bash
# Seed the database with test data
cd server
npx prisma db seed
```

## Notes

- All passwords are hashed using bcrypt with salt rounds of 12
- Test data is idempotent and can be re-run multiple times
- Credentials are based on the seed file in `server/prisma/seed.ts`
- Permission matrix reflects the actual seeded permissions
- Support tickets include sample replies for testing
- All edge cases from backend API tests are covered in E2E tests
