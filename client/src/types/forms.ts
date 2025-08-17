// Import entity types
import type { TenantSettings } from "./entities";

// Form Types for Create/Update Operations

// User Forms
export interface CreateUserForm {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  role_id?: string;
  tenant_id?: string;
  is_active?: boolean;
  is_superadmin?: boolean;
}

export interface UpdateUserForm {
  name?: string;
  email?: string;
  phone?: string;
  role_id?: string;
  tenant_id?: string;
  is_active?: boolean;
  is_superadmin?: boolean;
}

export interface ChangePasswordForm {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

// Tenant Forms
export interface CreateTenantForm {
  name: string;
  domain?: string;
  subdomain?: string;
  subscription_plan?: string;
  max_users?: number;
  max_storage_gb?: number;
  features?: string[];
  settings?: Partial<TenantSettings>;
}

export interface UpdateTenantForm {
  name?: string;
  domain?: string;
  subdomain?: string;
  logo?: string;
  subscription_plan?: string;
  max_users?: number;
  max_storage_gb?: number;
  features?: string[];
  settings?: Partial<TenantSettings>;
  is_active?: boolean;
}

// Role Forms
export interface CreateRoleForm {
  name: string;
  description?: string;
  tenant_id?: string;
  permissions?: PermissionForm[];
}

export interface UpdateRoleForm {
  name?: string;
  description?: string;
  permissions?: PermissionForm[];
}

export interface PermissionForm {
  module_id: string;
  submodule_id?: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_view_all: boolean;
}

// Module Forms
export interface CreateModuleForm {
  name: string;
  key: string;
  description?: string;
  icon?: string;
  route?: string;
  parent_id?: string;
  order?: number;
  is_active?: boolean;
}

export interface UpdateModuleForm {
  name?: string;
  description?: string;
  icon?: string;
  route?: string;
  parent_id?: string;
  order?: number;
  is_active?: boolean;
}

// Authentication Forms
export interface LoginForm {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  terms_accepted: boolean;
}

export interface ForgotPasswordForm {
  email: string;
}

export interface ResetPasswordForm {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface VerifyEmailForm {
  token: string;
}

// Support Ticket Forms
export interface CreateTicketForm {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  assigned_to_id?: string;
  attachments?: File[];
}

export interface UpdateTicketForm {
  title?: string;
  description?: string;
  status?: "open" | "in_progress" | "resolved" | "closed";
  priority?: "low" | "medium" | "high" | "urgent";
  category?: string;
  assigned_to_id?: string;
}

export interface TicketReplyForm {
  content: string;
  is_internal?: boolean;
  attachments?: File[];
}

// Profile Forms
export interface UpdateProfileForm {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: File;
}

export interface UpdateProfileSettingsForm {
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  theme?: {
    mode?: "light" | "dark" | "system";
    primary_color?: string;
  };
  language?: string;
  timezone?: string;
}

// Search and Filter Forms
export interface SearchForm {
  query: string;
  filters?: Record<string, any>;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface DateRangeForm {
  start_date: string;
  end_date: string;
}

export interface PaginationForm {
  page: number;
  per_page: number;
}

// Bulk Operations
export interface BulkActionForm {
  ids: string[];
  action: "delete" | "activate" | "deactivate" | "export";
  confirm?: boolean;
}

// Import/Export Forms
export interface ImportForm {
  file: File;
  type: "users" | "tenants" | "roles" | "modules";
  options?: {
    update_existing?: boolean;
    skip_errors?: boolean;
  };
}

export interface ExportForm {
  type: "users" | "tenants" | "roles" | "modules" | "audit_logs";
  format: "csv" | "excel" | "json";
  filters?: Record<string, any>;
  date_range?: DateRangeForm;
  columns?: string[];
}

// File Upload Forms
export interface FileUploadForm {
  file: File;
  type: "avatar" | "logo" | "attachment" | "document";
  description?: string;
  tags?: string[];
}

// Settings Forms
export interface SystemSettingsForm {
  general?: {
    site_name?: string;
    site_description?: string;
    contact_email?: string;
    timezone?: string;
    date_format?: string;
    time_format?: string;
  };
  security?: {
    password_min_length?: number;
    password_require_special?: boolean;
    session_timeout?: number;
    max_login_attempts?: number;
    two_factor_required?: boolean;
  };
  email?: {
    driver?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    encryption?: string;
    from_address?: string;
    from_name?: string;
  };
  storage?: {
    driver?: string;
    bucket?: string;
    region?: string;
    access_key?: string;
    secret_key?: string;
  };
}
