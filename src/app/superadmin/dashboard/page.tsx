import type { Metadata } from "next";
import React from "react";
import { DashboardClient } from "@/components/superadmin/DashboardClient";

export const metadata: Metadata = {
  title: "SuperAdmin Dashboard | Multi-Tenant Management",
  description: "SuperAdmin dashboard for managing multi-tenant application",
};

export default function SuperAdminDashboard() {
  return <DashboardClient />;
} 