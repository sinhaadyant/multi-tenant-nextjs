// Custom API Hooks
export * from "./useApiQuery";
export * from "./useApiMutation";

// Auth Hook
export { useAuth } from "./useAuth";

// Permissions Hook
export { usePermissions } from "./usePermissions";

// Notification Hook
export { useNotification } from "./useNotification";

// Re-export commonly used hooks
export { useAppDispatch, useAppSelector } from "@/store/hooks";

// Export types for hooks
export type {
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
