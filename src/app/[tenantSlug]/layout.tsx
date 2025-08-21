"use client";

import React from "react";
import TenantSidebar from "@/layout/TenantSidebar";
import TenantHeader from "@/components/header/TenantHeader";
import Backdrop from "@/layout/Backdrop";
import { useSidebar } from "@/context/SidebarContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <ProtectedRoute requireAuth={true}>
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
    </ProtectedRoute>
  );
}
