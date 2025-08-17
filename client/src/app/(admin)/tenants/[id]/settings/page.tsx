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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building, Save, Loader2, Settings, Database, Shield, Users, Globe, Zap } from "lucide-react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useApiMutation } from "@/hooks/useApiMutation";
import { apiHelpers } from "@/lib/axios";
import { usePermissions } from "@/hooks/usePermissions";
import { notificationService } from "@/services/notificationService";
import type { Tenant } from "@/types";

const tenantSettingsSchema = z.object({
  // General Settings
  max_users: z.number().min(1, "Maximum users must be at least 1"),
  max_roles: z.number().min(1, "Maximum roles must be at least 1"),
  max_storage_gb: z.number().min(1, "Storage limit must be at least 1GB"),
  
  // Feature Flags
  enable_advanced_analytics: z.boolean(),
  enable_api_access: z.boolean(),
  enable_custom_branding: z.boolean(),
  enable_audit_logs: z.boolean(),
  
  // Security Settings
  password_policy: z.object({
    min_length: z.number().min(6, "Minimum password length must be at least 6"),
    require_uppercase: z.boolean(),
    require_lowercase: z.boolean(),
    require_numbers: z.boolean(),
    require_special_chars: z.boolean(),
    max_age_days: z.number().min(0, "Password age must be 0 or greater"),
  }),
  
  // Custom Settings
  custom_domain: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  language: z.string().min(1, "Language is required"),
  
  // Override Settings
  override_global_settings: z.boolean(),
  settings_notes: z.string().optional(),
});

type TenantSettingsForm = z.infer<typeof tenantSettingsSchema>;

interface TenantSettings {
  id: string;
  tenant_id: string;
  settings: TenantSettingsForm;
  created_at: string;
  updated_at: string;
}

interface TenantSettingsResponse {
  tenant: Tenant;
  settings: TenantSettings;
}

export default function TenantSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { canUpdate } = usePermissions();
  const tenantId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: tenantData, isLoading, error } = useApiQuery<TenantSettingsResponse>(
    ["tenant-settings", tenantId],
    `/tenants/${tenantId}/settings`,
    { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TenantSettingsForm>({
    resolver: zodResolver(tenantSettingsSchema),
    defaultValues: {
      max_users: 100,
      max_roles: 20,
      max_storage_gb: 10,
      enable_advanced_analytics: false,
      enable_api_access: false,
      enable_custom_branding: false,
      enable_audit_logs: true,
      password_policy: {
        min_length: 8,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_special_chars: false,
        max_age_days: 90,
      },
      custom_domain: "",
      timezone: "UTC",
      language: "en",
      override_global_settings: false,
      settings_notes: "",
    },
  });

  useEffect(() => {
    if (tenantData?.data?.settings) {
      const settings = tenantData.data.settings.settings;
      reset(settings);
    }
  }, [tenantData, reset]);

  const updateSettingsMutation = useApiMutation(
    async (data: TenantSettingsForm) => {
      const response = await apiHelpers.put(`/tenants/${tenantId}/settings`, data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        notificationService.success({
          message: "Tenant settings updated successfully",
        });
      },
      onError: (error) => {
        notificationService.error({
          message: error?.message || "Failed to update tenant settings",
        });
      },
    }
  );

  const onSubmit = async (data: TenantSettingsForm) => {
    if (!canUpdate("tenants")) {
      notificationService.error({
        message: "You don&apos;t have permission to update tenant settings",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSettingsMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const overrideGlobalSettings = watch("override_global_settings");

  if (!canUpdate("tenants")) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have permission to manage tenant settings.
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
          <span>Loading tenant settings...</span>
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
            The tenant you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
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
            <h1 className="text-3xl font-bold tracking-tight">Tenant Settings</h1>
            <p className="text-muted-foreground">
              Configure settings for {tenant.name}
            </p>
          </div>
        </div>
        <Badge variant={tenant.is_active ? "default" : "secondary"}>
          {tenant.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Override Global Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings Override
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="override_global_settings">Override Global Settings</Label>
                <p className="text-sm text-muted-foreground">
                  Enable to override system-wide settings for this tenant
                </p>
              </div>
              <Switch
                id="override_global_settings"
                checked={overrideGlobalSettings}
                onCheckedChange={(checked) => setValue("override_global_settings", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {overrideGlobalSettings && (
          <>
            {/* Resource Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Resource Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="max_users">Maximum Users</Label>
                    <Input
                      id="max_users"
                      type="number"
                      {...register("max_users", { valueAsNumber: true })}
                    />
                    {errors.max_users && (
                      <p className="text-sm text-red-600">{errors.max_users.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="max_roles">Maximum Roles</Label>
                    <Input
                      id="max_roles"
                      type="number"
                      {...register("max_roles", { valueAsNumber: true })}
                    />
                    {errors.max_roles && (
                      <p className="text-sm text-red-600">{errors.max_roles.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="max_storage_gb">Storage Limit (GB)</Label>
                    <Input
                      id="max_storage_gb"
                      type="number"
                      {...register("max_storage_gb", { valueAsNumber: true })}
                    />
                    {errors.max_storage_gb && (
                      <p className="text-sm text-red-600">{errors.max_storage_gb.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Flags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Feature Flags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enable_advanced_analytics">Advanced Analytics</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable advanced reporting and analytics features
                      </p>
                    </div>
                    <Switch
                      id="enable_advanced_analytics"
                      {...register("enable_advanced_analytics")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enable_api_access">API Access</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow API access for this tenant
                      </p>
                    </div>
                    <Switch
                      id="enable_api_access"
                      {...register("enable_api_access")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enable_custom_branding">Custom Branding</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow custom logos and branding
                      </p>
                    </div>
                    <Switch
                      id="enable_custom_branding"
                      {...register("enable_custom_branding")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enable_audit_logs">Audit Logs</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable detailed audit logging
                      </p>
                    </div>
                    <Switch
                      id="enable_audit_logs"
                      {...register("enable_audit_logs")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password_min_length">Minimum Password Length</Label>
                    <Input
                      id="password_min_length"
                      type="number"
                      {...register("password_policy.min_length", { valueAsNumber: true })}
                    />
                    {errors.password_policy?.min_length && (
                      <p className="text-sm text-red-600">{errors.password_policy.min_length.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="password_max_age">Password Max Age (days)</Label>
                    <Input
                      id="password_max_age"
                      type="number"
                      {...register("password_policy.max_age_days", { valueAsNumber: true })}
                    />
                    {errors.password_policy?.max_age_days && (
                      <p className="text-sm text-red-600">{errors.password_policy.max_age_days.message}</p>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="require_uppercase">Require Uppercase</Label>
                    <Switch
                      id="require_uppercase"
                      {...register("password_policy.require_uppercase")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="require_lowercase">Require Lowercase</Label>
                    <Switch
                      id="require_lowercase"
                      {...register("password_policy.require_lowercase")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="require_numbers">Require Numbers</Label>
                    <Switch
                      id="require_numbers"
                      {...register("password_policy.require_numbers")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="require_special_chars">Require Special Characters</Label>
                    <Switch
                      id="require_special_chars"
                      {...register("password_policy.require_special_chars")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Custom Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="custom_domain">Custom Domain</Label>
                    <Input
                      id="custom_domain"
                      placeholder="app.tenant.com"
                      {...register("custom_domain")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={watch("timezone")}
                      onValueChange={(value) => setValue("timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={watch("language")}
                      onValueChange={(value) => setValue("language", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="settings_notes">Settings Notes</Label>
                  <Textarea
                    id="settings_notes"
                    placeholder="Add notes about these settings..."
                    {...register("settings_notes")}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
