"use client";

import React from "react";
import { useTranslation } from 'react-i18next';
import TenantSidebar from "@/layout/TenantSidebar";
import TenantHeader from "@/components/header/TenantHeader";
import Backdrop from "@/layout/Backdrop";
import { useSidebar } from "@/context/SidebarContext";
import { useTenantAuth } from "@/hooks/useTenantAuth";
import { Loader2 } from "lucide-react";
// import Walkthrough from "@/components/common/Walkthrough";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation('common');
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { isLoggedIn, isLoading, isFullyLoaded, modules, permissions } = useTenantAuth();

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <>{children}</>;
  }

  // Show loading state if auth is not fully loaded (permissions/modules not ready)
  // But be more lenient - allow the page to load if we have basic auth
  if (!isFullyLoaded) {
    // Check if we have at least some basic data
    const hasBasicData = modules && modules.length > 0;
    
    if (!hasBasicData) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('common:loadingPermissionsAndModules')}</p>
            
            {/* Debug information */}
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left text-sm">
              <p><strong>Debug Info:</strong></p>
              <p>isLoggedIn: {isLoggedIn ? 'true' : 'false'}</p>
              <p>isFullyLoaded: {isFullyLoaded ? 'true' : 'false'}</p>
              <p>modules count: {modules?.length || 0}</p>
              <p>permissions count: {permissions?.length || 0}</p>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <TenantSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <TenantHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-7xl md:p-6 bg-gray-50 dark:bg-gray-900">
          {!isFullyLoaded && (
            <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              <strong>Note:</strong> Some features may not be fully loaded yet. The page will continue to load in the background.
            </div>
          )}
          {children}
          {/* First-time Walkthrough temporarily disabled to fix build */}
          {/* {isLoggedIn && (
            <Walkthrough
              userId={String((permissions as any)?.user?.id || (permissions as any)?.userId || '')}
              isFirstLogin={Boolean((permissions as any)?.user?.isFirstLogin)}
              permissions={(permissions as any)?.permissions || []}
              tenantModules={(modules as any) || []}
            />
          )} */}
        </div>
      </div>
    </div>
  );
}
