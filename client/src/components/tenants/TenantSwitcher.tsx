"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building,
  Search,
  Globe,
  Users,
  Shield,
  Check,
  X,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useApiMutation } from "@/hooks/useApiMutation";
import { apiHelpers } from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { notificationService } from "@/services/notificationService";
import { formatDate } from "@/lib/utils";
import type { Tenant } from "@/types";

interface TenantWithStats extends Tenant {
  userCount: number;
  roleCount: number;
}

interface TenantSwitcherProps {
  onTenantSwitch?: (tenantId: string) => void;
}

export function TenantSwitcher({ onTenantSwitch }: TenantSwitcherProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { canRead } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  const {
    data: tenantsData,
    isLoading,
    error,
  } = useApiQuery<{ tenants: TenantWithStats[] }>(
    ["tenants-for-switching"],
    "/tenants?limit=100&isActive=true",
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      enabled: !!user?.is_superadmin,
    }
  );

  const switchTenantMutation = useApiMutation(
    async (tenantId: string) => {
      const response = await apiHelpers.post("/auth/switch-tenant", {
        tenant_id: tenantId,
      });
      return response.data;
    },
    {
      onSuccess: data => {
        notificationService.success({
          message: "Tenant switched successfully",
        });
        // Refresh the page to update the context
        window.location.reload();
      },
      onError: error => {
        notificationService.error({
          message: error?.message || "Failed to switch tenant",
        });
      },
    }
  );

  const handleTenantSwitch = async (tenantId: string) => {
    if (!canRead("tenants")) {
      notificationService.error({
        message: "You don&apos;t have permission to switch tenants",
      });
      return;
    }

    setIsSwitching(true);
    try {
      await switchTenantMutation.mutateAsync(tenantId);
      setSelectedTenant(tenantId);
      onTenantSwitch?.(tenantId);
    } finally {
      setIsSwitching(false);
    }
  };

  const filteredTenants =
    tenantsData?.data?.tenants?.filter(
      tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.domain?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const currentTenant = tenantsData?.data?.tenants?.find(
    tenant => tenant.id === selectedTenant
  );

  // Only show for superadmins
  if (!user?.is_superadmin) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Tenant Switcher
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Switch between tenants for testing and management (Superadmin only)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Tenant Display */}
          {currentTenant && (
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{currentTenant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentTenant.domain || "No domain"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={currentTenant.is_active ? "default" : "secondary"}
                >
                  {currentTenant.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {currentTenant.userCount} users
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {currentTenant.roleCount} roles
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Created {formatDate(currentTenant.created_at)}
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tenants List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">
                  Loading tenants...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-600">Failed to load tenants</p>
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  No tenants found
                </p>
              </div>
            ) : (
              filteredTenants.map(tenant => (
                <div
                  key={tenant.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTenant === tenant.id
                      ? "bg-primary/10 border-primary"
                      : "bg-background hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedTenant(tenant.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {tenant.domain || "No domain"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={tenant.is_active ? "default" : "secondary"}
                      >
                        {tenant.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {selectedTenant === tenant.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {tenant.userCount} users
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {tenant.roleCount} roles
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Created {formatDate(tenant.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Switch Button */}
          {selectedTenant && selectedTenant !== user?.tenant_id && (
            <Button
              onClick={() => handleTenantSwitch(selectedTenant)}
              disabled={isSwitching}
              className="w-full"
            >
              {isSwitching ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Switching...
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Switch to Selected Tenant
                </>
              )}
            </Button>
          )}

          {/* Current Tenant Indicator */}
          {selectedTenant === user?.tenant_id && (
            <div className="text-center py-2">
              <Badge
                variant="outline"
                className="text-green-600 border-green-600"
              >
                <Check className="mr-1 h-3 w-3" />
                Current Tenant
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
