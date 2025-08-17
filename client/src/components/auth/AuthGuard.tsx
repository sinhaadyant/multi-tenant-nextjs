"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireTenant?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  requireAuth = true,
  requireTenant = false,
  redirectTo = "/login",
}: AuthGuardProps) {
  const { isAuthenticated, user, tenant, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Skip auth check for public routes
    const publicRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    if (isPublicRoute) {
      setIsChecking(false);
      return;
    }

    // If still loading auth state, wait
    if (isLoading) {
      return;
    }

    // Check authentication
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Check tenant requirement
    if (requireTenant && !tenant) {
      // If user is authenticated but no tenant is selected, redirect to tenant selection
      router.push("/select-tenant");
      return;
    }

    // If authenticated user tries to access login page, redirect to dashboard
    if (isAuthenticated && pathname === "/login") {
      router.push("/");
      return;
    }

    setIsChecking(false);
  }, [isAuthenticated, user, tenant, isLoading, requireAuth, requireTenant, redirectTo, router, pathname]);

  // Show loading spinner while checking auth
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth is required and user is not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If tenant is required and no tenant is selected, don't render children
  if (requireTenant && !tenant) {
    return null;
  }

  return <>{children}</>;
}

