import type { Metadata } from "next";
import React from "react";
import TenantUsersClient from "@/components/tenant/TenantUsersClient";

export const metadata: Metadata = {
  title: "User Management | Tenant Dashboard",
  description: "Manage users within your tenant organization",
};

export default function TenantUsersPage() {
  return <TenantUsersClient />;
} 