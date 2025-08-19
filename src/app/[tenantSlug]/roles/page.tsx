import type { Metadata } from "next";
import React from "react";
import TenantRolesClient from "@/components/tenant/TenantRolesClient";

export const metadata: Metadata = {
  title: "Role Management | Tenant Dashboard",
  description: "Manage roles and permissions within your tenant organization",
};

export default function TenantRolesPage() {
  return <TenantRolesClient />;
} 