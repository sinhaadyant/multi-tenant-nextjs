// Export all validation schemas
export * from './authSchemas';
export * from './userSchemas';
export * from './tenantSchemas';
export * from './roleSchemas';
export * from './moduleSchemas';
export * from './supportSchemas';
export * from './fileSchemas';

// Re-export commonly used schemas for convenience
export {
  // Auth schemas
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  changePasswordSchema,
  revokeDeviceSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  enable2FASchema,
  verify2FASchema,
  disable2FASchema,
  getSessionsSchema,
  revokeSessionSchema,
  getDevicesSchema,
  updateDeviceSchema,
} from './authSchemas';

export {
  // User schemas
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  userListQuerySchema,
  userIdParamSchema,
  userEmailParamSchema,
  bulkUserOperationSchema,
  userImportSchema,
  userExportSchema,
  userStatsQuerySchema,
  userActivityQuerySchema,
  userPermissionsQuerySchema,
  userRolesQuerySchema,
  userSearchSchema,
  userPreferencesSchema,
} from './userSchemas';

export {
  // Tenant schemas
  createTenantSchema,
  updateTenantSchema,
  tenantListQuerySchema,
  tenantIdParamSchema,
  tenantSlugParamSchema,
  tenantDomainParamSchema,
  updateTenantSettingsSchema,
  updateTenantSubscriptionSchema,
  updateTenantLoginRestrictionsSchema,
  tenantStatsQuerySchema,
  tenantExportSchema,
  tenantImportSchema,
  tenantBackupSchema,
  tenantRestoreSchema,
} from './tenantSchemas';

export {
  // Role schemas
  createRoleSchema,
  updateRoleSchema,
  roleListQuerySchema,
  roleIdParamSchema,
  roleNameParamSchema,
  updateRolePermissionsSchema,
  assignUsersToRoleSchema,
  removeUsersFromRoleSchema,
  rolePermissionsQuerySchema,
  userEffectivePermissionsSchema,
  roleStatsQuerySchema,
  roleExportSchema,
  roleImportSchema,
  permissionMatrixSchema,
  roleHierarchySchema,
  roleTemplateSchema,
  createRoleFromTemplateSchema,
  roleAuditQuerySchema,
} from './roleSchemas';

export {
  // Module schemas
  createModuleSchema,
  updateModuleSchema,
  createSubmoduleSchema,
  updateSubmoduleSchema,
  moduleListQuerySchema,
  moduleIdParamSchema,
  submoduleIdParamSchema,
  reorderModulesSchema,
  reorderSubmodulesSchema,
  menuTreeQuerySchema,
  modulePermissionsSchema,
  submodulePermissionsSchema,
  moduleStatsQuerySchema,
  moduleExportSchema,
  moduleImportSchema,
  moduleCacheSchema,
  moduleDependencySchema,
  moduleHealthCheckSchema,
} from './moduleSchemas';

export {
  // Support schemas
  createTicketSchema,
  updateTicketSchema,
  ticketListQuerySchema,
  ticketIdParamSchema,
  createReplySchema,
  updateReplySchema,
  replyIdParamSchema,
  uploadAttachmentSchema,
  attachmentIdParamSchema,
  ticketStatsQuerySchema,
  ticketExportSchema,
  ticketBulkOperationSchema,
  ticketTemplateSchema,
  ticketCategorySchema,
  ticketSLASchema,
  ticketNotificationSchema,
  ticketEscalationSchema,
} from './supportSchemas';

// Export types for convenience
export type {
  // Auth types
  LoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
  RequestPasswordResetRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  RevokeDeviceRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  Enable2FARequest,
  Verify2FARequest,
  Disable2FARequest,
  GetSessionsRequest,
  RevokeSessionRequest,
  GetDevicesRequest,
  UpdateDeviceRequest,
} from './authSchemas';

export type {
  // User types
  CreateUserRequest,
  UpdateUserRequest,
  UpdateProfileRequest,
  UserListQuery,
  UserIdParam,
  UserEmailParam,
  BulkUserOperation,
  UserImport,
  UserExport,
  UserStatsQuery,
  UserActivityQuery,
  UserPermissionsQuery,
  UserRolesQuery,
  UserSearch,
  UserPreferences,
} from './userSchemas';

export type {
  // Tenant types
  CreateTenantRequest,
  UpdateTenantRequest,
  TenantListQuery,
  TenantIdParam,
  TenantSlugParam,
  TenantDomainParam,
  UpdateTenantSettingsRequest,
  UpdateTenantSubscriptionRequest,
  UpdateTenantLoginRestrictionsRequest,
  TenantStatsQuery,
  TenantExport,
  TenantImport,
  TenantBackup,
  TenantRestore,
} from './tenantSchemas';

export type {
  // Role types
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleListQuery,
  RoleIdParam,
  RoleNameParam,
  UpdateRolePermissionsRequest,
  AssignUsersToRoleRequest,
  RemoveUsersFromRoleRequest,
  RolePermissionsQuery,
  UserEffectivePermissionsRequest,
  RoleStatsQuery,
  RoleExport,
  RoleImport,
  PermissionMatrixRequest,
  RoleHierarchyRequest,
  RoleTemplate,
  CreateRoleFromTemplateRequest,
  RoleAuditQuery,
} from './roleSchemas';

export type {
  // Module types
  CreateModuleRequest,
  UpdateModuleRequest,
  CreateSubmoduleRequest,
  UpdateSubmoduleRequest,
  ModuleListQuery,
  ModuleIdParam,
  SubmoduleIdParam,
  ReorderModulesRequest,
  ReorderSubmodulesRequest,
  MenuTreeQuery,
  ModulePermissionsRequest,
  SubmodulePermissionsRequest,
  ModuleStatsQuery,
  ModuleExport,
  ModuleImport,
  ModuleCacheRequest,
  ModuleDependencyRequest,
  ModuleHealthCheckRequest,
} from './moduleSchemas';

export type {
  // Support types
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketListQuery,
  TicketIdParam,
  CreateReplyRequest,
  UpdateReplyRequest,
  ReplyIdParam,
  UploadAttachmentRequest,
  AttachmentIdParam,
  TicketStatsQuery,
  TicketExport,
  TicketBulkOperation,
  TicketTemplate,
  TicketCategory,
  TicketSLA,
  TicketNotification,
  TicketEscalation,
} from './supportSchemas';
