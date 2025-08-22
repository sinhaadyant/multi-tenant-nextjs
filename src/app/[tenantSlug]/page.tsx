import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "SuperAdmin Dashboard | Multi-Tenant Management",
  description: "SuperAdmin dashboard for managing multi-tenant application",
};

export default function TenantPage({ params }: { params: { tenantSlug: string } }) {
  // Redirect to the tenant dashboard page
  redirect(`/${params.tenantSlug}/dashboard`);
}
