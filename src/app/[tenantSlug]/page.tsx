import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "SuperAdmin Dashboard | Multi-Tenant Management",
  description: "SuperAdmin dashboard for managing multi-tenant application",
};

export default async function TenantPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;
  // Redirect to the tenant dashboard page
  redirect(`/${tenantSlug}/dashboard`);
}
