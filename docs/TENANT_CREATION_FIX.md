# Tenant Creation Prisma Query Fix - Documentation

## Issue Description
When creating a new tenant, the system was throwing a Prisma error:
```
Invalid `prisma.user.findUnique()` invocation:
Argument `where` of type UserWhereUniqueInput needs at least one of `id` or `email_tenantId` arguments.
```

## Root Cause
The User model in the Prisma schema has a compound unique constraint:
```prisma
model User {
  // ... other fields
  email    String
  tenantId String?
  
  @@unique([email, tenantId])
}
```

This means that the same email can exist in different tenants, but not within the same tenant. However, when creating a new tenant, the code was trying to check if the admin email already exists globally using `findUnique` with only the email field, which violates the unique constraint requirements.

## Problem Code
**Incorrect Query:**
```typescript
const existingUser = await prisma.user.findUnique({
  where: { email: admin.email }
});
```

**Issue:** `findUnique` requires a unique field or combination of fields that matches the database constraints. Since the User model has `@@unique([email, tenantId])`, you cannot query by email alone.

## Solution
Changed the query to use `findFirst` instead of `findUnique` to check if the email exists globally across all tenants:

**Correct Query:**
```typescript
const existingUser = await prisma.user.findFirst({
  where: { email: admin.email }
});
```

## Files Modified

### 1. `src/app/api/superadmin/tenants/route.ts`
**Change Made:**
- Fixed the user existence check during tenant creation
- Changed from `findUnique` to `findFirst` for email validation

**Before:**
```typescript
// Check if admin email already exists
const existingUser = await prisma.user.findUnique({
  where: { email: admin.email }
});
```

**After:**
```typescript
// Check if admin email already exists (globally across all tenants)
const existingUser = await prisma.user.findFirst({
  where: { email: admin.email }
});
```

### 2. `src/app/api/superadmin/users/route.ts`
**Change Made:**
- Fixed the user existence check during user creation
- Changed from `findUnique` to `findFirst` for email validation

**Before:**
```typescript
// Check if user already exists
const existingUser = await prisma.user.findUnique({
  where: { email: validatedData.email }
});
```

**After:**
```typescript
// Check if user already exists (globally across all tenants)
const existingUser = await prisma.user.findFirst({
  where: { email: validatedData.email }
});
```

## Why This Fix Works

### 1. Database Constraint Understanding
The `@@unique([email, tenantId])` constraint means:
- Same email can exist in different tenants
- Same email cannot exist twice within the same tenant
- When `tenantId` is null, it's treated as a unique case

### 2. Query Method Differences
- **`findUnique`**: Requires a unique field or combination that matches database constraints
- **`findFirst`**: Returns the first record matching the criteria, regardless of uniqueness

### 3. Use Case Analysis
During tenant creation, we need to check if an email exists globally (across all tenants), not within a specific tenant. This is a business logic validation, not a database constraint validation.

## Verification

### 1. Database Schema Check
Confirmed that the User model has the correct constraint:
```prisma
model User {
  email    String
  tenantId String?
  
  @@unique([email, tenantId])
}
```

### 2. Other Queries Check
Verified that other queries in the codebase are correct:
- Queries using `id` field: ✅ Correct (unique field)
- Queries using `id` + `tenantId`: ✅ Correct (matches constraint)
- Queries using `email` + `tenantId`: ✅ Correct (matches constraint)

### 3. Test Results
Created and ran a comprehensive test script (`scripts/test-tenant-creation.js`) that verified:
- ✅ Tenant creation works with unique data
- ✅ Duplicate email validation works correctly
- ✅ Duplicate slug validation works correctly
- ✅ User creation works with unique email
- ✅ Duplicate user email validation works correctly

## Impact
This fix resolves the Prisma query error that was preventing tenant creation. Users can now successfully create new tenants with admin users in the Superadmin interface.

## Prevention
To prevent similar issues in the future:
1. Always understand the database constraints when writing Prisma queries
2. Use `findUnique` only when querying by truly unique fields
3. Use `findFirst` when you need to check for existence across multiple records
4. Test database queries with various data scenarios
5. Document complex database relationships and constraints

## Related Files
- `prisma/schema.prisma` - User model definition
- `src/app/api/superadmin/tenants/route.ts` - Tenant creation API
- `src/app/api/superadmin/users/route.ts` - User creation API
- `scripts/test-tenant-creation.js` - Test script for verification
