"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building, Save, Loader2 } from "lucide-react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useApiMutation } from "@/hooks/useApiMutation";
import { apiHelpers } from "@/lib/axios";
import { usePermissions } from "@/hooks/usePermissions";
import { notificationService } from "@/services/notificationService";
import type { Tenant } from "@/types";

const updateTenantSchema = z.object({
  name: z.string().min(1, "Tenant name is required"),
  domain: z
    .string()
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain format")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
  description: z.string().optional(),
});

type UpdateTenantForm = z.infer<typeof updateTenantSchema>;

interface TenantResponse {
  tenant: Tenant;
}

export default function EditTenantPage() {
  const params = useParams();
  const router = useRouter();
  const { canUpdate } = usePermissions();
  const tenantId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: tenantData,
    isLoading,
    error,
  } = useApiQuery<TenantResponse>(
    ["tenant", tenantId],
    `/tenants/${tenantId}`,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<UpdateTenantForm>({
    resolver: zodResolver(updateTenantSchema),
    defaultValues: {
      name: "",
      domain: "",
      is_active: true,
      description: "",
    },
  });

  // Update form when tenant data is loaded
  useEffect(() => {
    if (tenantData?.data?.tenant) {
      const tenant = tenantData.data.tenant;
      reset({
        name: tenant.name,
        domain: tenant.domain || "",
        is_active: tenant.is_active,
        description: tenant.description || "",
      });
    }
  }, [tenantData, reset]);

  const updateTenantMutation = useApiMutation(
    async (data: UpdateTenantForm) => {
      const response = await apiHelpers.put(`/tenants/${tenantId}`, data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        notificationService.success({
          message: "Tenant updated successfully",
        });
        router.push(`/tenants/${tenantId}`);
      },
      onError: (error) => {
        notificationService.error({
          message: error?.message || "Failed to update tenant",
        });
      },
    }
  );

  const onSubmit = async (data: UpdateTenantForm) => {
    if (!canUpdate("tenants")) {
      notificationService.error({
        message: "You don&apos;t have permission to update tenants",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTenantMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isActive = watch("is_active");

  if (!canUpdate("tenants")) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have permission to update tenants.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span>Loading tenant details...</span>
        </div>
      </div>
    );
  }

  if (error || !tenantData?.data?.tenant) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Tenant Not Found</h1>
          <p className="text-muted-foreground">
            The tenant you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button onClick={() => router.push("/tenants")} className="mt-4">
            Back to Tenants
          </Button>
        </div>
      </div>
    );
  }

  const tenant = tenantData.data.tenant;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Tenant</h1>
            <p className="text-muted-foreground">
              Update tenant information for {tenant.name}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Tenant Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Tenant Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter tenant name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Domain */}
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  {...register("domain")}
                  placeholder="example.com"
                  className={errors.domain ? "border-red-500" : ""}
                />
                {errors.domain && (
                  <p className="text-sm text-red-500">{errors.domain.message}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Optional: Custom domain for this tenant
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Enter tenant description"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Optional: Brief description of the tenant
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable this tenant
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("is_active", checked)}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{isSubmitting ? "Updating..." : "Update Tenant"}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
