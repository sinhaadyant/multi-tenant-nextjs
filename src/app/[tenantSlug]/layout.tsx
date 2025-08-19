"use client";

import React from "react";
import TenantSidebar from "@/layout/TenantSidebar";
import TenantHeader from "@/components/header/TenantHeader";
import Backdrop from "@/layout/Backdrop";
import { useSidebar } from "@/context/SidebarContext";
import { useTenantAuth } from "@/hooks/useTenantAuth";
import { Loader2 } from "lucide-react";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { isLoggedIn, isLoading, isFullyLoaded } = useTenantAuth();

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
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <>{children}</>;
  }

  // Show loading state if auth is not fully loaded (permissions/modules not ready)
  if (!isFullyLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading permissions and modules...</p>
        </div>
      </div>
    );
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
          {children}
        </div>
      </div>
    </div>
  );
}
