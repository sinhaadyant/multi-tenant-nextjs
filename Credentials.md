# Multi-Tenant NextJS Application Credentials

## SuperAdmin Access
**Email:** superadmin@example.com  
**Password:** SuperAdmin123!
**Login URL:** `http://localhost:3000/superadmin/login`

## Tenant Users

### Acme Corporation (`acme-corp`)
- **Admin:** admin@acme-corp.com / AcmeAdmin123!
- **Manager:** manager@acme-corp.com / AcmeManager123!
- **User:** user@acme-corp.com / AcmeUser123!
- **Viewer:** viewer@acme-corp.com / AcmeViewer123!
- **Content Manager:** content@acme-corp.com / AcmeContent123!
- **Reports Analyst:** analyst@acme-corp.com / AcmeAnalyst123!
- **Login URL:** `http://localhost:3000/acme-corp/login`

### TechStart Inc (`techstart`)
- **Admin:** admin@techstart.com / TechStart123!
- **Login URL:** `http://localhost:3000/techstart/login`

### Global Solutions (`global-solutions`)
- **Admin:** admin@global-solutions.com / GlobalAdmin123!
- **Login URL:** `http://localhost:3000/global-solutions/login`

## Database Structure

### Global Roles Created:
1. **Super Admin** - Full system access with all permissions
2. **Tenant Admin** - Full tenant access with limited system permissions  
3. **User** - Basic user with limited permissions

### Modules Available:
1. **Dashboard** - Available to all logged-in users
2. **Profile** - Available to all logged-in users  
3. **Support** - Available to all logged-in users
4. User Management
5. Roles & Permissions
6. Reports & Analytics
7. Audit Logs
8. Notifications
9. Settings
10. Data Management
11. Utilities (Admin only)
12. Content Management

### Module Access Rules:
- **Dashboard, Profile, Support**: Available to all logged-in users regardless of permissions
- **Other modules**: Require specific permissions based on user roles
- **Tenant Management**: Only available to SuperAdmin (not shown in tenant sidebar)

### Sample Tenants:
1. **Acme Corporation** (`acme-corp`) - Enterprise plan
2. **TechStart Inc** (`techstart`) - Starter plan  
3. **Global Solutions** (`global-solutions`) - Professional plan

## Access URLs
- **SuperAdmin Dashboard:** `/superadmin/dashboard`
- **SuperAdmin Login:** `/superadmin/login`
- **Tenant Dashboard:** `/{tenantSlug}/dashboard`
- **Tenant Login:** `/{tenantSlug}/login`

## Quick Access Links
- **SuperAdmin Portal:** `http://localhost:3000/superadmin/login`
- **Acme Corp Login:** `http://localhost:3000/acme-corp/login`
- **TechStart Login:** `http://localhost:3000/techstart/login`
- **Global Solutions Login:** `http://localhost:3000/global-solutions/login`

## Login Route Structure
- **SuperAdmin:** `/superadmin/login` → SuperAdmin dashboard access
- **Tenant Login:** `/[tenantSlug]/login` → Tenant-specific branded login
- **Invalid Tenant:** `/invalid-slug/login` → Custom 404 page with tenant validation

## Features
- ✅ Tenant slug validation with custom 404 for invalid tenants
- ✅ Beautiful tenant-branded login pages with company details
- ✅ Responsive design (mobile & desktop)
- ✅ Real-time tenant information display
- ✅ Proper error handling and user feedback
