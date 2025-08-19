import type { Metadata } from "next";
import React from "react";
import TenantDashboardClient from "@/components/tenant/TenantDashboardClient";

export const metadata: Metadata = {
  title: "Tenant Dashboard | Multi-Tenant Management",
  description: "Tenant dashboard for managing organization data",
};

export default function TenantDashboard() {
  return <TenantDashboardClient />;
} 