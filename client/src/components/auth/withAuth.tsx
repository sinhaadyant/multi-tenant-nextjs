"use client";

import { ComponentType } from "react";
import AuthGuard from "./AuthGuard";

interface WithAuthOptions {
  requireAuth?: boolean;
  requireTenant?: boolean;
  redirectTo?: string;
}

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <AuthGuard
        requireAuth={options.requireAuth}
        requireTenant={options.requireTenant}
        redirectTo={options.redirectTo}
      >
        <Component {...props} />
      </AuthGuard>
    );
  };

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
