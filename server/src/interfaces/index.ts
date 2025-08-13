import { Request } from 'express';

// Base interfaces
export interface BaseEntity {
  id: number;
  created_at: Date;
  updated_at: Date;
}

export interface SoftDeleteEntity extends BaseEntity {
  deleted_at?: Date;
}

// User interfaces
export interface User extends BaseEntity {
  tenant_id: number;
  role_id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  is_superadmin: boolean;
  is_active: boolean;
  last_login_at?: Date;
}

export interface CreateUserRequest {
  tenant_id: number;
  role_id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  is_superadmin?: boolean;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  role_id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  is_active?: boolean;
}

// Tenant interfaces
export interface Tenant extends BaseEntity {
  name: string;
  domain?: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  is_active: boolean;
  login_restrictions_id?: number;
}

export interface CreateTenantRequest {
  name: string;
  domain?: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  is_active?: boolean;
  login_restrictions?: CreateTenantLoginRestrictionsRequest;
}

export interface UpdateTenantRequest {
  name?: string;
  domain?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  is_active?: boolean;
  login_restrictions?: UpdateTenantLoginRestrictionsRequest;
}

// Tenant Login Restrictions interfaces
export interface TenantLoginRestrictions extends BaseEntity {
  max_devices: number;
  allow_multiple_sessions: boolean;
  password_expiry_days?: number;
  ip_whitelist?: string; // JSON array of IPs
  default_for_tenants: boolean;
}

export interface CreateTenantLoginRestrictionsRequest {
  max_devices: number;
  allow_multiple_sessions: boolean;
  password_expiry_days?: number;
  ip_whitelist?: string[];
  default_for_tenants?: boolean;
}

export interface UpdateTenantLoginRestrictionsRequest {
  max_devices?: number;
  allow_multiple_sessions?: boolean;
  password_expiry_days?: number;
  ip_whitelist?: string[];
  default_for_tenants?: boolean;
}

// Role interfaces
export interface Role extends BaseEntity {
  tenant_id?: number; // null for global roles
  name: string;
  description?: string;
  is_system: boolean;
}

export interface CreateRoleRequest {
  tenant_id?: number;
  name: string;
  description?: string;
  is_system?: boolean;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  is_system?: boolean;
}

// Module interfaces
export interface Module extends BaseEntity {
  name: string;
  description?: string;
  is_active: boolean;
  order_index: number;
}

export interface CreateModuleRequest {
  name: string;
  description?: string;
  is_active?: boolean;
  order_index?: number;
}

export interface UpdateModuleRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  order_index?: number;
}

// Menu interfaces
export interface Menu extends BaseEntity {
  module_id: number;
  parent_id?: number;
  title: string;
  icon?: string;
  route_path: string;
  order_index: number;
  is_active: boolean;
}

export interface CreateMenuRequest {
  module_id: number;
  parent_id?: number;
  title: string;
  icon?: string;
  route_path: string;
  order_index?: number;
  is_active?: boolean;
}

export interface UpdateMenuRequest {
  module_id?: number;
  parent_id?: number;
  title?: string;
  icon?: string;
  route_path?: string;
  order_index?: number;
  is_active?: boolean;
}

// Permission interfaces
export interface Permission extends BaseEntity {
  role_id: number;
  module_id: number;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface CreatePermissionRequest {
  role_id: number;
  module_id: number;
  can_create?: boolean;
  can_read?: boolean;
  can_update?: boolean;
  can_delete?: boolean;
}

export interface UpdatePermissionRequest {
  can_create?: boolean;
  can_read?: boolean;
  can_update?: boolean;
  can_delete?: boolean;
}

// Authentication interfaces
export interface RefreshToken extends BaseEntity {
  user_id: number;
  token: string;
  expires_at: Date;
}

export interface ResetToken extends BaseEntity {
  user_id: number;
  token: string;
  expires_at: Date;
}

export interface LoginDevice extends BaseEntity {
  user_id: number;
  device_info: string; // JSON
  ip_address: string;
  last_active_at: Date;
  is_active: boolean;
}

// Support interfaces
export interface SupportTicket extends BaseEntity {
  tenant_id: number;
  user_id: number;
  subject: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
}

export interface CreateSupportTicketRequest {
  tenant_id: number;
  user_id: number;
  subject: string;
  status?: 'open' | 'in_progress' | 'closed';
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateSupportTicketRequest {
  subject?: string;
  status?: 'open' | 'in_progress' | 'closed';
  priority?: 'low' | 'medium' | 'high';
}

export interface SupportReply extends BaseEntity {
  ticket_id: number;
  user_id: number;
  message: string;
}

export interface CreateSupportReplyRequest {
  ticket_id: number;
  user_id: number;
  message: string;
}

export interface SupportAttachment extends BaseEntity {
  reply_id: number;
  file_path: string;
  file_type: string;
}

// Audit log interfaces
export interface AuditLog extends BaseEntity {
  tenant_id?: number;
  user_id?: number;
  action: string;
  module: string;
  record_id?: number;
  ip_address: string;
  old_values?: string; // JSON
  new_values?: string; // JSON
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: string[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  filters?: Record<string, any>;
}

// Request interfaces with user context
export interface AuthenticatedRequest extends Request {
  user?: User;
  tenant?: Tenant;
}

export interface PaginatedRequest extends AuthenticatedRequest {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
    [key: string]: any;
  };
}

// Filter interfaces
export interface UserFilters {
  tenant_id?: number;
  role_id?: number;
  is_active?: boolean;
  is_superadmin?: boolean;
  created_at_from?: string;
  created_at_to?: string;
}

export interface TenantFilters {
  is_active?: boolean;
  created_at_from?: string;
  created_at_to?: string;
}

export interface RoleFilters {
  tenant_id?: number;
  is_system?: boolean;
  created_at_from?: string;
  created_at_to?: string;
}

export interface ModuleFilters {
  is_active?: boolean;
  created_at_from?: string;
  created_at_to?: string;
}

export interface SupportTicketFilters {
  tenant_id?: number;
  user_id?: number;
  status?: 'open' | 'in_progress' | 'closed';
  priority?: 'low' | 'medium' | 'high';
  created_at_from?: string;
  created_at_to?: string;
}

export interface AuditLogFilters {
  tenant_id?: number;
  user_id?: number;
  action?: string;
  module?: string;
  created_at_from?: string;
  created_at_to?: string;
}

// JWT Payload interface
export interface JwtPayload {
  user_id: number;
  tenant_id: number;
  email: string;
  is_superadmin: boolean;
  role_id: number;
  iat?: number;
  exp?: number;
}

// Login interfaces
export interface LoginRequest {
  email: string;
  password: string;
  device_info?: {
    os?: string;
    browser?: string;
    device_name?: string;
  };
}

export interface LoginResponse {
  user: Omit<User, 'password_hash'>;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  new_password: string;
}

// File upload interfaces
export interface FileUploadRequest {
  file: Express.Multer.File;
  reply_id: number;
}

// Database query interfaces
export interface WhereClause {
  [key: string]: any;
}

export interface OrderClause {
  [key: string]: 'ASC' | 'DESC';
}

export interface IncludeClause {
  model: any;
  as?: string;
  required?: boolean;
  where?: WhereClause;
  include?: IncludeClause[];
}

// Service interfaces
export interface BaseService<T> {
  create(data: any): Promise<T>;
  findById(id: number): Promise<T | null>;
  findAll(options?: any): Promise<{ rows: T[]; count: number }>;
  update(id: number, data: any): Promise<T>;
  delete(id: number): Promise<boolean>;
}

export interface UserService extends BaseService<User> {
  findByEmail(email: string): Promise<User | null>;
  findByTenant(tenant_id: number, options?: any): Promise<{ rows: User[]; count: number }>;
  updateLastLogin(user_id: number): Promise<void>;
}

export interface TenantService extends BaseService<Tenant> {
  findByDomain(domain: string): Promise<Tenant | null>;
  getDefaultLoginRestrictions(): Promise<TenantLoginRestrictions | null>;
}

export interface AuthService {
  login(credentials: LoginRequest, ip_address: string): Promise<LoginResponse>;
  refreshToken(token: string): Promise<LoginResponse>;
  logout(user_id: number, token?: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
  confirmResetPassword(token: string, new_password: string): Promise<void>;
  revokeDevice(user_id: number, device_id: number): Promise<void>;
  validateToken(token: string): Promise<JwtPayload>;
}
