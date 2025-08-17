// Base Entity Interface
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// User Entity
export interface User extends BaseEntity {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  is_active: boolean;
  is_superadmin: boolean;
  email_verified_at?: string;
  last_login_at?: string;
  tenant_id?: string;
  role_id?: string;
  role?: Role;
  tenant?: Tenant;
  permissions?: Permission[];
}

// Auth User (subset of User for authentication)
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  is_active: boolean;
  is_superadmin: boolean;
  tenant_id?: string;
  role_id?: string;
  role?: Role;
  tenant?: Tenant;
  permissions?: Permission[];
}

// Tenant Entity
export interface Tenant extends BaseEntity {
  name: string;
  domain?: string;
  subdomain?: string;
  logo?: string;
  settings?: TenantSettings;
  is_active: boolean;
  subscription_plan?: string;
  subscription_expires_at?: string;
  max_users?: number;
  max_storage_gb?: number;
  features?: string[];
}

export interface TenantSettings {
  theme?: {
    primary_color?: string;
    logo_url?: string;
    favicon_url?: string;
  };
  features?: {
    [key: string]: boolean;
  };
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
}

// Role Entity
export interface Role extends BaseEntity {
  name: string;
  description?: string;
  is_system: boolean;
  tenant_id?: string;
  permissions?: Permission[];
  users_count?: number;
}

// Module Entity
export interface Module extends BaseEntity {
  name: string;
  key: string;
  description?: string;
  icon?: string;
  route?: string;
  is_active: boolean;
  order: number;
  parent_id?: string;
  parent?: Module;
  children?: Module[];
  permissions?: Permission[];
}

// Permission Entity
export interface Permission extends BaseEntity {
  role_id: string;
  module_id: string;
  submodule_id?: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_view_all: boolean; // Key permission for data scope
  role?: Role;
  module?: Module;
  submodule?: Module;
}

// User Permissions (flattened for easy access)
export interface UserPermissions {
  [moduleKey: string]: {
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
    can_view_all: boolean;
  };
}

// Support Ticket Entity
export interface SupportTicket extends BaseEntity {
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  assigned_to_id?: string;
  created_by_id: string;
  tenant_id: string;
  attachments?: TicketAttachment[];
  replies?: TicketReply[];
  assigned_to?: User;
  created_by?: User;
  tenant?: Tenant;
}

export interface TicketAttachment extends BaseEntity {
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  ticket_id: string;
}

export interface TicketReply extends BaseEntity {
  content: string;
  ticket_id: string;
  user_id: string;
  is_internal: boolean;
  attachments?: TicketAttachment[];
  user?: User;
}

// Audit Log Entity
export interface AuditLog extends BaseEntity {
  user_id?: string;
  tenant_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  url?: string;
  method?: string;
  user?: User;
  tenant?: Tenant;
}

// Device Management Entity
export interface LoginDevice extends BaseEntity {
  user_id: string;
  device_name: string;
  device_type: string;
  browser?: string;
  os?: string;
  ip_address: string;
  user_agent: string;
  last_used_at: string;
  is_current: boolean;
  is_revoked: boolean;
  user?: User;
}

// Token Entity
export interface Token extends BaseEntity {
  user_id: string;
  type: "access" | "refresh" | "reset" | "verification";
  token: string;
  expires_at: string;
  is_revoked: boolean;
  user?: User;
}

// Reset Token Entity
export interface ResetToken extends BaseEntity {
  email: string;
  token: string;
  expires_at: string;
  is_used: boolean;
  used_at?: string;
}
