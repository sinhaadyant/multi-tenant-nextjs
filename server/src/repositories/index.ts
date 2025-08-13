// Export Prisma client and base repository
export { default as prisma } from './prisma';
export { BaseRepository } from './prisma';

// Export all repositories
export { UserRepository } from './userRepository';
export { TenantRepository } from './tenantRepository';
export { RoleRepository } from './roleRepository';
export { ModuleRepository } from './moduleRepository';
export { SupportRepository } from './supportRepository';
export { TokenRepository } from './tokenRepository';
export { AuditRepository } from './auditRepository';
export { LoginDeviceRepository } from './loginDeviceRepository';

// Export types
export type { UserFilters, UserListParams } from './userRepository';
export type { TenantFilters, TenantListParams } from './tenantRepository';
export type { RoleFilters, RoleListParams } from './roleRepository';
export type { ModuleFilters, ModuleListParams } from './moduleRepository';
export type {
  SupportTicketFilters,
  SupportTicketListParams,
} from './supportRepository';
export type { AuditLogFilters, AuditLogListParams } from './auditRepository';
export type {
  LoginDeviceFilters,
  LoginDeviceListParams,
} from './loginDeviceRepository';
