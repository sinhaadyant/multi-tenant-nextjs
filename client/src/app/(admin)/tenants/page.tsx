"use client";

import { TenantDataTable } from "@/components/tenants/TenantDataTable";
import { TenantStats } from "@/components/tenants/TenantStats";
import { TenantSwitcher } from "@/components/tenants/TenantSwitcher";

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
        <p className="text-muted-foreground">
          Manage multi-tenant organizations and their configurations
        </p>
      </div>

      {/* Stats Cards */}
      <TenantStats />

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <TenantDataTable />
        </div>
        <div>
          <TenantSwitcher />
        </div>
      </div>
    </div>
  );
}
