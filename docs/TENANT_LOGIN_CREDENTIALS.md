# Tenant Login Credentials

## Available Tenants and Login Information

### 1. Acme Corporation
- **Tenant Slug:** `acme-corp`
- **Admin Email:** `admin@acme-corp.com`
- **Admin Password:** `AcmeAdmin123!`
- **User Email:** `user@acme-corp.com`
- **User Password:** `AcmeAdmin123!`
- **Plan:** Enterprise
- **Status:** ✅ Active

### 2. TechStart Inc
- **Tenant Slug:** `techstart`
- **Admin Email:** `admin@techstart.com`
- **Admin Password:** `TechStart123!`
- **Manager Email:** `manager@techstart.com`
- **Manager Password:** `TechStart123!`
- **User Email:** `user@techstart.com`
- **User Password:** `TechStart123!`
- **Viewer Email:** `viewer@techstart.com`
- **Viewer Password:** `TechStart123!`
- **Plan:** Starter
- **Status:** ✅ Active

### 3. Global Solutions 2
- **Tenant Slug:** `global-solutions`
- **Admin Email:** `admin@global-solutions.com`
- **Admin Password:** `GlobalAdmin123!`
- **Plan:** Professional
- **Status:** ✅ Active

### 4. Thaddeus Garrett
- **Tenant Slug:** `officiis`
- **User Email:** `kikoha@mailinator.com`
- **User Password:** `AcmeAdmin123!`
- **Plan:** Professional
- **Status:** ✅ Active

### 5. Cole Rios 2
- **Tenant Slug:** `voluptatem`
- **User Email:** `zexifyn@mailinator.com`
- **User Password:** `AcmeAdmin123!`
- **Plan:** Enterprise
- **Status:** ❌ Inactive

## Login API Endpoint

```
POST /api/tenant/auth/login
```

### Request Body
```json
{
  "email": "admin@acme-corp.com",
  "password": "AcmeAdmin123!",
  "tenantSlug": "acme-corp",
  "rememberMe": false
}
```

### Example cURL Commands

#### Acme Corporation Login
```bash
curl -X POST http://localhost:3000/api/tenant/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme-corp.com",
    "password": "AcmeAdmin123!",
    "tenantSlug": "acme-corp",
    "rememberMe": false
  }'
```

#### TechStart Inc Login
```bash
curl -X POST http://localhost:3000/api/tenant/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@techstart.com",
    "password": "TechStart123!",
    "tenantSlug": "techstart",
    "rememberMe": false
  }'
```

## Common Issues and Solutions

### 1. "Invalid tenant or tenant is inactive"
- **Cause:** Wrong tenant slug
- **Solution:** Use the exact tenant slug from the list above
- **Example:** Use `acme-corp` instead of `acme`

### 2. "Invalid email or password"
- **Cause:** Wrong email or password combination
- **Solution:** Use the exact credentials from the list above
- **Note:** Passwords are case-sensitive

### 3. "User not found in tenant"
- **Cause:** Email doesn't exist in the specified tenant
- **Solution:** Make sure the email belongs to the correct tenant

## Testing Different User Roles

Each tenant has different user roles with varying permissions:

- **Admin:** Full access to all modules
- **Manager:** Limited administrative access
- **User:** Basic user access
- **Viewer:** Read-only access

## Notes

- All passwords follow the pattern: `[TenantName]123!`
- Tenant slugs are URL-friendly versions of tenant names
- Only active tenants can be accessed
- Each tenant has its own isolated data and permissions
