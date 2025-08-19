"use client";

import { TenantDashboardClient } from "@/components/tenant/TenantDashboardClient";
import { useTenantAuth } from "@/context/TenantAuthContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TenantDashboard() {
  const { user, isLoading } = useTenantAuth();
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!isLoading && !user) {
      router.push(`/${tenantSlug}/login`);
    }
  }, [user, isLoading, router, tenantSlug]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // If no user, don't render anything (redirect will happen)
  if (!user) {
    return null;
  }

  // User is authenticated, show dashboard
  return <TenantDashboardClient />;
}
