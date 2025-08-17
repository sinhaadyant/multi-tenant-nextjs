// Import types for utility type definitions
import type { ApiResponse, ApiError } from "./api";
import type { AuthState } from "./auth";
import type { ValidationRule, ThemeMode } from "./common";

// Main Types Index - Export all types from the types folder

// API Types
export * from "./api";

// Entity Types
export * from "./entities";

// Form Types
export * from "./forms";

// Authentication Types
export * from "./auth";

// Common Types
export * from "./common";

// Re-export commonly used types for convenience
export type {
  // API
  ApiResponse,
  PaginationMeta,
  ApiError,
  PaginationParams,
  FilterParams,
  ApiRequestParams,
  HttpMethod,
  ApiEndpoint,
  LoginResponse,
  RefreshTokenResponse,
  LogoutResponse,
  PasswordResetResponse,
  PasswordResetConfirmResponse,
  ErrorResponse,
} from "./api";

export type {
  // Entities
  BaseEntity,
  User,
  AuthUser,
  Tenant,
  TenantSettings,
  Role,
  Module,
  Permission,
  UserPermissions,
  SupportTicket,
  TicketAttachment,
  TicketReply,
  AuditLog,
  LoginDevice,
  Token,
  ResetToken,
} from "./entities";

export type {
  // Forms
  CreateUserForm,
  UpdateUserForm,
  ChangePasswordForm,
  CreateTenantForm,
  UpdateTenantForm,
  CreateRoleForm,
  UpdateRoleForm,
  PermissionForm,
  CreateModuleForm,
  UpdateModuleForm,
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
  ResetPasswordForm,
  VerifyEmailForm,
  CreateTicketForm,
  UpdateTicketForm,
  TicketReplyForm,
  UpdateProfileForm,
  UpdateProfileSettingsForm,
  SearchForm,
  DateRangeForm,
  PaginationForm,
  BulkActionForm,
  ImportForm,
  ExportForm,
  FileUploadForm,
  SystemSettingsForm,
} from "./forms";

export type {
  // Auth
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  RefreshTokenRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  EmailVerificationRequest,
  ResendEmailVerificationRequest,
  LogoutRequest,
  TwoFactorAuthRequest,
  TwoFactorAuthSetupRequest,
  TwoFactorAuthSetupResponse,
  SessionInfo,
  AuthState,
  PermissionCheck,
  PermissionResult,
  AuthEvent,
  AuthError,
  AuthErrorCode,
  AuthConfig,
  MFASetup,
  MFAMethod,
  SocialAuthProvider,
  SocialAuthRequest,
  UseAuthReturn,
} from "./auth";

export type {
  // Common
  Pagination,
  PaginatedResponse,
  FilterOption,
  FilterGroup,
  AppliedFilter,
  SortOption,
  SortParams,
  SearchParams,
  TableColumn,
  TableAction,
  TableConfig,
  Status,
  StatusOption,
  Priority,
  PriorityOption,
  DateRange,
  DateRangeOption,
  FileInfo,
  FileUploadProgress,
  NotificationType,
  Notification,
  ModalConfig,
  ConfirmDialogConfig,
  BreadcrumbItem,
  MenuItem,
  TabItem,
  FormField,
  LoadingState,
  AsyncOperation,
  CacheConfig,
  CacheEntry,
  ThemeMode,
  LocaleConfig,
  Currency,
  Timezone,
  ValidationRule,
  AppEvent,
  AnalyticsEvent,
  FeatureFlag,
  AuditEvent,
  ExportFormat,
  ExportConfig,
  ImportConfig,
  ImportResult,
} from "./common";

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type Nullable<T> = T | null;

export type Undefinable<T> = T | undefined;

export type NonNullable<T> = T extends null | undefined ? never : T;

export type ValueOf<T> = T[keyof T];

export type KeysOf<T> = keyof T;

export type ArrayElement<T> = T extends Array<infer U> ? U : never;

export type PromiseType<T> = T extends Promise<infer U> ? U : never;

export type FunctionReturnType<T> = T extends (...args: any[]) => infer R
  ? R
  : never;

export type ComponentProps<T> =
  T extends React.ComponentType<infer P> ? P : never;

// Form Utility Types
export type FormData<T> = {
  [K in keyof T]: T[K];
};

export type FormErrors<T> = {
  [K in keyof T]?: string;
};

export type FormTouched<T> = {
  [K in keyof T]?: boolean;
};

// API Utility Types
export type ApiSuccessResponse<T> = ApiResponse<T> & {
  success: true;
  data: T;
};

export type ApiErrorResponse = ApiResponse<never> & {
  success: false;
  errors: ApiError[];
};

// Permission Utility Types
export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "view_all";

export type PermissionModule = string;

export type PermissionKey = `${PermissionModule}:${PermissionAction}`;

// Route Types
export type RouteParams = Record<string, string | number>;

export type QueryParams = Record<string, string | number | boolean | undefined>;

// Event Types
export type EventHandler<T = any> = (event: T) => void;

export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

// Callback Types
export type Callback<T = any> = (data: T) => void;

export type AsyncCallback<T = any> = (data: T) => Promise<void>;

// State Types
export type StateUpdater<T> = T | ((prev: T) => T);

export type StateSetter<T> = (value: StateUpdater<T>) => void;

// Ref Types
export type RefCallback<T> = (instance: T | null) => void;

export type RefObject<T> = {
  current: T | null;
};

// Component Types
export type ReactComponent<P = {}> = React.ComponentType<P>;

export type ReactElement = React.ReactElement;

export type ReactNode = React.ReactNode;

// Hook Types
export type HookReturn<T> = T;

export type HookState<T> = [T, StateSetter<T>];

export type HookLoading = [boolean, StateSetter<boolean>];

export type HookError = [string | null, StateSetter<string | null>];

// Store Types
export type StoreState = {
  auth: AuthState;
  tenant: any; // Will be defined in store
  ui: any; // Will be defined in store
};

export type StoreDispatch = (action: any) => void;

export type StoreSelector<T> = (state: StoreState) => T;

// Service Types
export type ServiceMethod<T = any, R = any> = (data: T) => Promise<R>;

export type ServiceConfig = {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
};

// Validation Types
export type ValidationSchema<T> = {
  [K in keyof T]: ValidationRule[];
};

export type ValidationResult<T> = {
  isValid: boolean;
  errors: FormErrors<T>;
};

// Theme Types
export type ThemeColors = {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  divider: string;
};

export type ThemeSpacing = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
};

export type ThemeBreakpoints = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
};

export type ThemeConfig = {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  breakpoints: ThemeBreakpoints;
  borderRadius: number;
  fontSize: number;
  fontFamily: string;
};
