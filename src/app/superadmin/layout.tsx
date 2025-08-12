"use client";

import { useSidebar } from "@/context/SidebarContext";
import SuperAdminHeader from "@/components/header/SuperAdminHeader";
import SuperAdminSidebar from "@/layout/SuperAdminSidebar";
import Backdrop from "@/layout/Backdrop";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { usePathname } from "next/navigation";
import React from "react";
import GridShape from "@/components/common/GridShape";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import Image from "next/image";
import Link from "next/link";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();

  // Check if current page is an auth page
  const isAuthPage = pathname === '/superadmin/login' || 
                     pathname === '/superadmin/signup' || 
                     pathname === '/superadmin/forgot-password' || 
                     pathname === '/superadmin/reset-password';

  // For auth pages, render completely different layout
  if (isAuthPage) {
    return (
      <div className="flex min-h-screen">
        {/* Left Side - Background with Logo */}
        <div className="relative hidden w-1/2 bg-gradient-to-br from-brand-500 to-brand-600 lg:block">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex h-full flex-col justify-between p-12 text-white">
            <div>
              <Link href="/" className="inline-block">
                <Image
                  width={154}
                  height={32}
                  src="/images/logo/logo.svg"
                  alt="Logo"
                  className="brightness-0 invert"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </Link>
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl font-bold">
                Welcome to Multi-Tenant Platform
              </h1>
              <p className="text-lg text-white/80">
                Manage your tenants, users, and system with our comprehensive admin dashboard.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/60">
                © 2024 Multi-Tenant Platform. All rights reserved.
              </p>
              <ThemeToggleButton />
            </div>
          </div>
          <GridShape />
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex w-full flex-col justify-center lg:w-1/2">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <ProtectedRoute>
      <div className="min-h-screen xl:flex">
        {/* Sidebar and Backdrop */}
        <SuperAdminSidebar />
        <Backdrop />
        {/* Main Content Area */}
        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          {/* Header */}
          <SuperAdminHeader />
          {/* Page Content */}
          <div className="p-4 mx-auto max-w-7xl md:p-6">{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
