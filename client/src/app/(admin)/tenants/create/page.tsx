"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useApiMutation } from "@/hooks/useApiMutation";
import { apiHelpers } from "@/lib/axios";
import { usePermissions } from "@/hooks/usePermissions";
import { notificationService } from "@/services/notificationService";

const createTenantSchema = z.object({
  name: z.string().min(1, "Tenant name is required"),
  domain: z
    .string()
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain format")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
  description: z.string().optional(),
});

type CreateTenantForm = z.infer<typeof createTenantSchema>;

export default function CreateTenantPage() {
  const router = useRouter();
  const { canCreate } = usePermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateTenantForm>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
      domain: "",
      is_active: true,
      description: "",
    },
  });

  const createTenantMutation = useApiMutation(
    async (data: CreateTenantForm) => {
      const response = await apiHelpers.post("/tenants", data);
      return response.data;
    },
    {
      onSuccess: data => {
        notificationService.success({
          message: "Tenant created successfully",
        });
        router.push("/tenants");
      },
      onError: error => {
        notificationService.error({
          message: error?.message || "Failed to create tenant",
        });
      },
    }
  );

  const onSubmit = async (data: CreateTenantForm) => {
    if (!canCreate("tenants")) {
      notificationService.error({
        message: "You don&apos;t have permission to create tenants",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createTenantMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isActive = watch("is_active");

  if (!canCreate("tenants")) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have permission to create tenants.
          </p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold tracking-tight">Create Tenant</h1>
            <p className="text-muted-foreground">
              Add a new tenant to the system
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
                  <p className="text-sm text-red-500">
                    {errors.domain.message}
                  </p>
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
                  onCheckedChange={checked => setValue("is_active", checked)}
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
                  <span>{isSubmitting ? "Creating..." : "Create Tenant"}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
