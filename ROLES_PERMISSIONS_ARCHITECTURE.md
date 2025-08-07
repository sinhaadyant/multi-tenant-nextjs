# 🏗️ Roles & Permissions Architecture

## 📋 **System Overview**

The Roles & Permissions system is designed with a **hierarchical access control** model where different user types have different levels of access:

### **🔐 Access Levels**

#### **1. SuperAdmin (Full Access)**
- **No permissions required** - has full system access
- Can manage all tenants, users, roles, and permissions
- Can create, edit, delete any resource across the platform
- Has access to all system features and settings
- **Bypasses all permission checks**

#### **2. Tenant Administrators**
- **Can create and manage roles** for their tenant
- **Can assign permissions** to roles within their tenant
- **Can assign roles** to users within their tenant
- Have full access to their tenant's resources
- **Permission system applies to their actions**

#### **3. Tenant Users**
- **Assigned specific roles** with defined permissions
- **Access controlled by permissions** in their assigned role
- Can only perform actions allowed by their role's permissions
- **Permission checks enforced** for all actions

---

## 🎯 **Permission System Scope**

### **✅ What Permissions Control**
- **Tenant-specific features** (content, files, analytics)
- **User management within tenant** (create, edit, delete users)
- **Tenant settings** (billing, configuration)
- **Communication features** (notifications, announcements)
- **Support system** (tickets, responses)
- **API access** (tenant-specific endpoints)

### **❌ What Permissions DON'T Control**
- **SuperAdmin access** (always has full access)
- **Cross-tenant operations** (only SuperAdmin can do this)
- **System-level settings** (only SuperAdmin can modify)
- **Platform-wide features** (audit logs, system reports)

---

## 🏢 **Tenant Isolation**

### **Role Management**
- Each tenant can have their own set of roles
- Roles are **tenant-specific** (not global across platform)
- Tenant administrators can create custom roles
- Roles can be **active/inactive** within the tenant

### **Permission Assignment**
- Permissions are **scoped to tenant resources**
- Users can only access resources within their tenant
- Permission checks include tenant context
- **No cross-tenant permission inheritance**

---

## 🔧 **Technical Implementation**

### **Database Schema**
```sql
-- SuperAdmin (no role/permission relationship)
super_admins (id, email, name, password, ...)

-- Tenants
tenants (id, name, slug, ...)

-- Users (belong to tenants, have roles)
users (id, email, name, tenantId, roleId, ...)

-- Roles (tenant-specific)
roles (id, name, description, isGlobal, isActive, ...)

-- Permissions (system-wide definitions)
permissions (id, name, description, module, action, ...)

-- Role-Permission relationships
role_permissions (roleId, permissionId, ...)
```

### **Access Control Flow**
```
1. User Authentication
   ↓
2. Check User Type
   ├─ SuperAdmin → Full Access (no permission checks)
   ├─ Tenant Admin → Check tenant-specific permissions
   └─ Tenant User → Check role-based permissions
   ↓
3. Permission Validation
   ├─ Has required permission → Allow action
   └─ Missing permission → Deny action
```

---

## 📊 **Permission Categories**

### **User Management (within tenant)**
- `can_view_users` - View user list and details
- `can_create_users` - Create new users
- `can_edit_users` - Edit user information
- `can_delete_users` - Delete users
- `can_assign_roles` - Assign roles to users

### **Content Management**
- `can_view_content` - View tenant content
- `can_create_content` - Create new content
- `can_edit_content` - Edit existing content
- `can_delete_content` - Delete content
- `can_publish_content` - Publish content

### **Analytics & Reports**
- `can_view_analytics` - View analytics and reports
- `can_export_reports` - Export data and reports
- `can_manage_dashboards` - Create and manage dashboards

### **Communication**
- `can_send_notifications` - Send notifications to users
- `can_manage_announcements` - Create and manage announcements
- `can_view_communication_logs` - View communication history

### **File Management**
- `can_upload_files` - Upload files to tenant storage
- `can_view_files` - View files in tenant storage
- `can_delete_files` - Delete files from tenant storage
- `can_share_files` - Share files with other users

### **Support System**
- `can_create_support_tickets` - Create support tickets
- `can_view_support_tickets` - View support tickets
- `can_respond_to_tickets` - Respond to support tickets
- `can_close_tickets` - Close support tickets

### **API Access**
- `can_access_api` - Access tenant API endpoints
- `can_manage_api_keys` - Manage API keys for tenant

---

## 🎭 **Default Roles**

### **Tenant Administrator**
- **Full access** to all tenant features
- Can manage users, content, settings
- Can create and assign roles
- **28 permissions** across all modules

### **Content Manager**
- **Content and file management**
- Communication features
- Basic user viewing
- **15 permissions** focused on content

### **User Manager**
- **User management** within tenant
- Role assignment capabilities
- Basic content and analytics viewing
- **8 permissions** focused on users

### **Analyst**
- **Analytics and reporting**
- Dashboard management
- Basic content and user viewing
- **5 permissions** focused on analytics

### **Support Agent**
- **Support ticket management**
- Communication features
- Basic content and user viewing
- **8 permissions** focused on support

### **Viewer**
- **Read-only access** to tenant content
- Basic support ticket creation
- **6 permissions** for viewing only

---

## 🔒 **Security Considerations**

### **SuperAdmin Security**
- **No permission bypass** for critical operations
- **Audit logging** for all SuperAdmin actions
- **Session management** with proper timeouts
- **Two-factor authentication** recommended

### **Tenant Isolation**
- **Strict tenant boundaries** enforced at database level
- **No cross-tenant data access** possible
- **Tenant-specific API endpoints** with validation
- **Resource ownership** clearly defined

### **Permission Validation**
- **Server-side validation** for all permission checks
- **Client-side indicators** for UI state
- **Graceful degradation** when permissions are missing
- **Clear error messages** for permission denials

---

## 🚀 **Usage Examples**

### **SuperAdmin Operations**
```typescript
// SuperAdmin can do anything without permission checks
const superAdmin = await getSuperAdmin(req);
if (superAdmin) {
  // Full access - no permission validation needed
  return await performAnyOperation();
}
```

### **Tenant User Operations**
```typescript
// Tenant users need permission validation
const user = await getTenantUser(req);
const hasPermission = await checkUserPermission(user, 'can_create_content');

if (hasPermission) {
  return await createContent(data);
} else {
  return createErrorResponse('Insufficient permissions', 403);
}
```

### **Role Assignment**
```typescript
// Only Tenant Admins can assign roles
const tenantAdmin = await getTenantAdmin(req);
if (tenantAdmin && await hasPermission(tenantAdmin, 'can_assign_roles')) {
  await assignRoleToUser(userId, roleId);
}
```

---

## 📈 **Benefits of This Architecture**

### **Security**
- **Clear separation** of concerns
- **No permission escalation** possible
- **Audit trail** for all actions
- **Tenant isolation** prevents data leaks

### **Scalability**
- **Modular permission system** easy to extend
- **Role-based access** reduces complexity
- **Tenant-specific customization** possible
- **Performance optimized** queries

### **Maintainability**
- **Clear permission definitions** in code
- **Consistent validation** patterns
- **Easy to add new permissions** and roles
- **Comprehensive documentation**

---

## 🎯 **Implementation Notes**

1. **SuperAdmin bypass**: All API endpoints check for SuperAdmin first
2. **Tenant context**: All user operations include tenant validation
3. **Permission caching**: Frequently checked permissions are cached
4. **Audit logging**: All permission-related actions are logged
5. **Error handling**: Graceful handling of permission denials

This architecture ensures that **SuperAdmin has full control** while providing **granular permissions** for tenant users, creating a **secure and scalable** multi-tenant platform. 