import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "SuperAdmin Dashboard | Multi-Tenant Management",
  description: "SuperAdmin dashboard for managing multi-tenant application",
};

export default function SuperAdminPage() {
  // Redirect to the dashboard page
  redirect("/superadmin/dashboard");
}
