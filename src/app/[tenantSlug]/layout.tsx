"use client";

import { useSidebar } from "@/context/SidebarContext";
import { DynamicPermissionsProvider } from "@/context/DynamicPermissionsContext";
import AppHeader from "@/layout/AppHeader";
import DynamicSidebar from "@/layout/DynamicSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";
import { usePathname } from "next/navigation";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();

  // Check if current page is login page
  const isLoginPage = pathname?.includes('/login');
  const isSignupPage = pathname?.includes('/signup');
  const isForgotPasswordPage = pathname?.includes('/forgot-password');
  const isResetPasswordPage = pathname?.includes('/reset-password');

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <DynamicPermissionsProvider>
      {/* If it's an auth page, render without header and sidebar */}
      {isLoginPage || isSignupPage || isForgotPasswordPage || isResetPasswordPage ? (
        <div className="min-h-screen">
          {children}
        </div>
      ) : (
        <div className="min-h-screen xl:flex">
          {/* Sidebar and Backdrop - Only for authenticated pages */}
          <DynamicSidebar />
          <Backdrop />
          {/* Main Content Area */}
          <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
            {/* Header - Only for authenticated pages */}
            <AppHeader />
            {/* Page Content */}
            <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
          </div>
        </div>
      )}
    </DynamicPermissionsProvider>
  );
}
