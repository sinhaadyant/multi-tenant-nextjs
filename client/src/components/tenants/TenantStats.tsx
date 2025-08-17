"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, Shield, TrendingUp } from "lucide-react";
import { useApiQuery } from "@/hooks/useApiQuery";

interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  totalUsers: number;
  totalRoles: number;
}

interface TenantStatsResponse {
  stats: TenantStats;
}

export function TenantStats() {
  const {
    data: statsData,
    isLoading,
    error,
  } = useApiQuery<TenantStatsResponse>(["tenant-stats"], "/tenants/stats", {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const stats = statsData?.data?.stats;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-muted animate-pulse rounded mb-2"></div>
              <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading statistics
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalTenants || 0}</div>
          <p className="text-xs text-muted-foreground">
            All registered tenants
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.activeTenants || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.totalTenants
              ? Math.round((stats.activeTenants / stats.totalTenants) * 100)
              : 0}
            % activation rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          <p className="text-xs text-muted-foreground">Across all tenants</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalRoles || 0}</div>
          <p className="text-xs text-muted-foreground">
            System and custom roles
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
