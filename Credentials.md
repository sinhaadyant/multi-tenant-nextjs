# Database Credentials

## SuperAdmin Access
**Email:** superadmin@example.com  
**Password:** SuperAdmin123!

## Tenant Users

### Acme Corporation (acme-corp)
- **Admin:** admin@acme-corp.com / AcmeAdmin123!
- **User:** user@acme-corp.com / AcmeUser123!

### TechStart Inc (techstart)
- **Admin:** admin@techstart.com / TechStart123!

### Global Solutions (global-solutions)
- **Admin:** admin@global-solutions.com / GlobalAdmin123!

## Database Structure

### Global Roles Created:
1. **Super Admin** - Full system access with all permissions
2. **Tenant Admin** - Full tenant access with limited system permissions  
3. **User** - Basic user with limited permissions

### Modules Available:
1. Dashboard
2. User Management
3. Roles & Permissions
4. Module Management
5. Tenant Management
6. Audit Logs
7. Notifications
8. Support Tickets
9. Reports
10. Settings

### Sample Tenants:
1. **Acme Corporation** - Enterprise plan
2. **TechStart Inc** - Starter plan
3. **Global Solutions** - Professional plan

## Access URLs
- **SuperAdmin Dashboard:** `/superadmin/dashboard`
- **Tenant Dashboard:** `/{tenantSlug}/dashboard`
- **Login:** `/superadmin/login` or `/{tenantSlug}/login`
