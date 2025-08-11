/**
 * Complete Modules Menu for Multi-Tenant NextJS Application
 * This file contains all available modules organized by user type (Superadmin/Tenant)
 */

export const MODULES_MENU = {
  // ========================================
  // SUPERADMIN MODULES
  // ========================================
  superadmin: {
    // Authentication & Access
    auth: {
      login: "Login",  
      forgotPassword: "Forgot Password",
      resetPassword: "Reset Password",
      invite: "Invite Superadmin",
      profile: "Profile Management"
    },

    // Core Management
    dashboard: "Dashboard",
    
    tenantManagement: {
      main: "Tenant Management",
      allTenants: "All Tenants",
      createTenant: "Create Tenant",
      tenantDetails: "Tenant Details",
      tenantSettings: "Tenant Settings"
    },

    userManagement: {
      main: "User Management",
      allUsers: "All Users",
      createUser: "Create User",
      searchUsers: "Search Users",
      userDetails: "User Details",
      userSettings: "User Settings"
    },

    rolesPermissions: {
      main: "Roles & Permissions",
      rolesManagement: "Roles Management",
      permissionGroups: "Permission Groups", 
      roleAssignment: "Role Assignment",
      createRole: "Create Role",
      editRole: "Edit Role"
    },

    // System Management
    backupImport: {
      main: "Backup & Import",
      backupData: "Backup Data",
      importData: "Import Data", 
      backupHistory: "Backup History",
      restoreData: "Restore Data"
    },

    audit: "Audit Logs",
    reports: "Reports & Analytics",
    notifications: "Notifications",
    support: "Support / Logs",

    // Settings & Configuration
    settings: {
      main: "System Settings",
      generalSettings: "General Settings",
      securitySettings: "Security Settings",
      emailSettings: "Email Settings",
      apiSettings: "API Settings"
    }
  },

  // ========================================
  // TENANT MODULES  
  // ========================================
  tenant: {
    // Authentication & Access
    auth: {
      login: "Login",
      signup: "Sign Up",
      forgotPassword: "Forgot Password", 
      resetPassword: "Reset Password",
      profile: "Profile Management"
    },

    // Core Features
    dashboard: "Dashboard",
    
    userManagement: {
      main: "User Management",
      allUsers: "All Users",
      createUser: "Create User",
      searchUsers: "Search Users", 
      userDetails: "User Details",
      userSettings: "User Settings",
      userRoles: "User Roles"
    },

    rolesPermissions: {
      main: "Roles & Permissions",
      rolesManagement: "Role Management",
      permissionManagement: "Permission Management",
      createRole: "Create Role",
      editRole: "Edit Role",
      assignRoles: "Assign Roles"
    },

    moduleManagement: {
      main: "Module Management",
      enabledModules: "Enabled Modules",
      moduleSettings: "Module Settings",
      modulePermissions: "Module Permissions"
    },

    // Content & Data
    contentManagement: {
      main: "Content Management",
      documents: "Documents",
      files: "Files",
      media: "Media Library",
      templates: "Templates"
    },

    // Monitoring & Analytics
    audit: "Audit Logs",
    reports: "Reports & Analytics",
    analytics: "Analytics",
    
    // Communication
    notifications: "Notifications",
    support: "Support",
    
    // Settings
    settings: {
      main: "Settings",
      tenantSettings: "Tenant Settings",
      userSettings: "User Settings",
      securitySettings: "Security Settings",
      notificationSettings: "Notification Settings"
    },

    // Utilities
    utilities: {
      main: "Utilities",
      debugPermissions: "Debug Permissions",
      testRole: "Test Role",
      systemInfo: "System Information"
    }
  }
};

/**
 * Module Categories for Organization
 */
export const MODULE_CATEGORIES = {
  superadmin: {
    authentication: ["login", "signup", "forgotPassword", "resetPassword", "invite", "profile"],
    management: ["dashboard", "tenantManagement", "userManagement", "rolesPermissions"],
    system: ["backupImport", "audit", "reports", "notifications", "support", "settings"]
  },
  
  tenant: {
    authentication: ["login", "signup", "forgotPassword", "resetPassword", "profile"],
    management: ["dashboard", "userManagement", "rolesPermissions", "moduleManagement"],
    content: ["contentManagement", "audit", "reports", "analytics"],
    communication: ["notifications", "support"],
    settings: ["settings", "utilities"]
  }
};

/**
 * Module Permissions Mapping
 */
export const MODULE_PERMISSIONS = {
  // Superadmin permissions
  superadmin: {
    dashboard: ["dashboard:view"],
    tenantManagement: ["tenants:view", "tenants:create", "tenants:edit", "tenants:delete"],
    userManagement: ["users:view", "users:create", "users:edit", "users:delete"],
    rolesPermissions: ["roles:view", "roles:create", "roles:edit", "roles:delete"],
    backupImport: ["backup:view", "backup:create", "backup:restore"],
    audit: ["audit:view", "audit:export"],
    reports: ["reports:view", "reports:create", "reports:export"],
    notifications: ["notifications:view", "notifications:create", "notifications:manage"],
    support: ["support:view", "support:manage"],
    settings: ["settings:view", "settings:edit"]
  },

  // Tenant permissions  
  tenant: {
    dashboard: ["dashboard:view"],
    userManagement: ["users:view", "users:create", "users:edit", "users:delete"],
    rolesPermissions: ["roles:view", "roles:create", "roles:edit", "roles:delete"],
    moduleManagement: ["modules:view", "modules:enable", "modules:disable"],
    contentManagement: ["content:view", "content:create", "content:edit", "content:delete"],
    audit: ["audit:view", "audit:export"],
    reports: ["reports:view", "reports:create", "reports:export"],
    analytics: ["analytics:view", "analytics:create"],
    notifications: ["notifications:view", "notifications:create"],
    support: ["support:view", "support:create", "support:manage"],
    settings: ["settings:view", "settings:edit"],
    utilities: ["utilities:view", "utilities:debug"]
  }
};

/**
 * Module Icons Mapping
 */
export const MODULE_ICONS = {
  // Common icons
  dashboard: "LayoutDashboard",
  users: "Users", 
  roles: "Shield",
  audit: "ClipboardList",
  reports: "BarChart3",
  notifications: "Bell",
  support: "LifeBuoy",
  settings: "Settings",
  profile: "User",
  login: "LogIn",
  signup: "UserPlus",
  forgotPassword: "Key",
  resetPassword: "RefreshCw",
  invite: "Mail",
  
  // Superadmin specific
  tenantManagement: "Building2",
  backupImport: "Database",
  
  // Tenant specific
  moduleManagement: "Cog",
  contentManagement: "FileText",
  analytics: "Activity",
  utilities: "Wrench",
  debugPermissions: "Bug",
  testRole: "TestTube",
  systemInfo: "Info"
};

/**
 * Get all module names for a specific user type
 */
export const getAllModuleNames = (userType: 'superadmin' | 'tenant'): string[] => {
  const modules = MODULES_MENU[userType];
  const moduleNames: string[] = [];

  const extractNames = (obj: any): void => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        moduleNames.push(obj[key]);
      } else if (typeof obj[key] === 'object') {
        extractNames(obj[key]);
      }
    }
  };

  extractNames(modules);
  return moduleNames;
};

/**
 * Get module structure for a specific user type
 */
export const getModuleStructure = (userType: 'superadmin' | 'tenant') => {
  return MODULES_MENU[userType];
};

/**
 * Check if a module exists for a user type
 */
export const moduleExists = (userType: 'superadmin' | 'tenant', moduleName: string): boolean => {
  const allModules = getAllModuleNames(userType);
  return allModules.includes(moduleName);
};

export default MODULES_MENU; 