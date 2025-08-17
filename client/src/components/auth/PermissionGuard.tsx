"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionModule, PermissionAction } from "@/types";

interface PermissionGuardProps {
  children: ReactNode;
  module?: PermissionModule;
  action?: PermissionAction;
  fallback?: ReactNode;
}

export function PermissionGuard({
  children,
  fallback = null,
  module,
  action,
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions();

  let hasAccess = false;

  if (module && action) {
    hasAccess = hasPermission(module, action);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
