import type { Metadata } from "next";
import React from "react";
import TenantAnalyticsClient from "@/components/tenant/TenantAnalyticsClient";

export const metadata: Metadata = {
  title: "Analytics | Multi-Tenant Management",
  description: "Comprehensive analytics and insights for your organization",
};

export default function TenantAnalytics() {
  return <TenantAnalyticsClient />;
}
