// Common Types and Utilities

// Pagination Types
export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// Filtering Types
export interface FilterOption {
  label: string;
  value: string | number | boolean;
  count?: number;
}

export interface FilterGroup {
  key: string;
  label: string;
  type:
    | "select"
    | "multiselect"
    | "date"
    | "daterange"
    | "text"
    | "number"
    | "boolean";
  options?: FilterOption[];
  placeholder?: string;
  multiple?: boolean;
}

export interface AppliedFilter {
  key: string;
  value: any;
  label?: string;
  operator?:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "like"
    | "in"
    | "not_in"
    | "between";
}

export interface FilterParams {
  [key: string]: any;
}

// Sorting Types
export interface SortOption {
  key: string;
  label: string;
  direction?: "asc" | "desc";
}

export interface SortParams {
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// Search Types
export interface SearchParams {
  query: string;
  fields?: string[];
  operator?: "or" | "and";
}

// Table Types
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
  render?: (value: any, record: T, index: number) => React.ReactNode;
  formatter?: (value: any) => string;
}

export interface TableAction<T = any> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "ghost"
    | "link";
  size?: "sm" | "default" | "lg";
  onClick: (record: T) => void;
  disabled?: (record: T) => boolean;
  hidden?: (record: T) => boolean;
  confirm?: {
    title: string;
    message: string;
  };
}

export interface TableConfig<T = any> {
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  selectable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  pagination?: boolean;
  loading?: boolean;
  emptyText?: string;
  rowKey?: keyof T | ((record: T) => string);
}

// Status Types
export type Status =
  | "active"
  | "inactive"
  | "pending"
  | "suspended"
  | "deleted";

export interface StatusOption {
  value: Status;
  label: string;
  color: string;
  icon?: React.ReactNode;
}

// Priority Types
export type Priority = "low" | "medium" | "high" | "urgent";

export interface PriorityOption {
  value: Priority;
  label: string;
  color: string;
  icon?: React.ReactNode;
}

// Date Range Types
export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface DateRangeOption {
  key: string;
  label: string;
  value: DateRange;
}

// File Types
export interface FileInfo {
  id: string;
  name: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  thumbnail_url?: string;
  uploaded_at: string;
  uploaded_by?: string;
}

export interface FileUploadProgress {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
  response?: any;
}

// Notification Types
export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

// Modal Types
export interface ModalConfig {
  title: string;
  content: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closable?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

// Confirmation Dialog Types
export interface ConfirmDialogConfig {
  title: string;
  message: string;
  type?: "info" | "warning" | "error";
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

// Breadcrumb Types
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  active?: boolean;
}

// Menu Types
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  children?: MenuItem[];
  disabled?: boolean;
  hidden?: boolean;
  badge?: string | number;
  permission?: string;
}

// Tab Types
export interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  closable?: boolean;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "select"
    | "multiselect"
    | "textarea"
    | "checkbox"
    | "radio"
    | "date"
    | "datetime"
    | "file"
    | "switch";
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: any }[];
  validation?: any;
  disabled?: boolean;
  hidden?: boolean;
  helpText?: string;
  errorText?: string;
}

// API Error Types
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
  status?: number;
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: any;
}

// Async Operation Types
export interface AsyncOperation<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

// Cache Types
export interface CacheConfig {
  key: string;
  ttl?: number;
  tags?: string[];
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
}

// Theme Types
export type ThemeMode = "light" | "dark" | "system";

export interface ThemeConfig {
  mode: ThemeMode;
  primaryColor: string;
  borderRadius: number;
  fontSize: number;
}

// Localization Types
export interface LocaleConfig {
  code: string;
  name: string;
  flag?: string;
  direction?: "ltr" | "rtl";
}

// Currency Types
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  position: "before" | "after";
  decimal_places: number;
}

// Timezone Types
export interface Timezone {
  name: string;
  offset: string;
  abbreviation: string;
}

// Validation Types
export interface ValidationRule {
  type: "required" | "email" | "min" | "max" | "pattern" | "custom";
  value?: any;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Event Types
export interface AppEvent {
  type: string;
  payload: any;
  timestamp: number;
  source?: string;
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

// Feature Flag Types
export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  conditions?: Record<string, any>;
}

// Audit Types
export interface AuditEvent {
  action: string;
  entity_type: string;
  entity_id: string;
  user_id?: string;
  tenant_id?: string;
  old_values?: any;
  new_values?: any;
  metadata?: Record<string, any>;
}

// Export Types
export type ExportFormat = "csv" | "excel" | "json" | "pdf";

export interface ExportConfig {
  format: ExportFormat;
  filename?: string;
  columns?: string[];
  filters?: FilterParams;
  date_range?: DateRange;
}

// Import Types
export interface ImportConfig {
  file: File;
  type: string;
  options?: {
    update_existing?: boolean;
    skip_errors?: boolean;
    validate_only?: boolean;
  };
}

export interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: string[];
}
