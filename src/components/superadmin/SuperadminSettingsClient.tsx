"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, 
  Shield, 
  Globe, 
  Users, 
  Lock, 
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Apple,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import Button from '@/components/ui/button/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { ErrorComponent } from './ErrorComponent';

interface GlobalSettings {
  id: string;
  socialLogin: {
    enabled: boolean;
    google: {
      enabled: boolean;
      clientId?: string;
      clientSecret?: string;
    };
    apple: {
      enabled: boolean;
      clientId?: string;
      teamId?: string;
      keyId?: string;
    };
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  features: {
    userRegistration: boolean;
    emailVerification: boolean;
    twoFactorAuth: boolean;
  };
  updatedAt: string;
  updatedBy: string;
}

const SuperadminSettingsClient: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch global settings
  const {
    data: settingsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['superadmin-settings'],
    queryFn: async (): Promise<GlobalSettings> => {
      const response = await fetch('/api/superadmin/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<GlobalSettings>) => {
      const response = await fetch('/api/superadmin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-settings'] });
      showToast('Settings updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update settings', 'error');
    },
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData);
    }
  }, [settingsData]);

  // Handle setting changes
  const handleSettingChange = (path: string, value: any) => {
    if (!settings) return;

    const newSettings = { ...settings };
    const keys = path.split('.');
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  // Save settings
  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      await updateSettingsMutation.mutateAsync(settings);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleResetToDefaults = () => {
    if (!settingsData) return;
    setSettings(settingsData);
    showToast('Settings reset to last saved values', 'info');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load settings';
    return <ErrorComponent error={errorMessage} onRetry={refetch} />;
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <span className="ml-2 text-gray-600">No settings found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Global Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure global settings that apply to all tenants
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            disabled={isSaving}
          >
            Reset
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Social Login Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Social Login Configuration
            </CardTitle>
            <CardDescription>
              Enable or disable social login providers for all tenants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Global Social Login Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Enable Social Login
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Allow tenants to use social login providers
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.socialLogin.enabled}
                onCheckedChange={(checked) => 
                  handleSettingChange('socialLogin.enabled', checked)
                }
              />
            </div>

            {/* Google Login */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Google Login
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow users to sign in with Google
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.socialLogin.google.enabled}
                  onCheckedChange={(checked) => 
                    handleSettingChange('socialLogin.google.enabled', checked)
                  }
                  disabled={!settings.socialLogin.enabled}
                />
              </div>
              
              {settings.socialLogin.google.enabled && (
                <div className="pl-11 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {settings.socialLogin.google.clientId ? 'Configured' : 'Not Configured'}
                    </Badge>
                    {settings.socialLogin.google.clientId && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Google OAuth credentials must be configured at the tenant level
                  </p>
                </div>
              )}
            </div>

            {/* Apple Login */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <Apple className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Apple Login
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow users to sign in with Apple
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.socialLogin.apple.enabled}
                  onCheckedChange={(checked) => 
                    handleSettingChange('socialLogin.apple.enabled', checked)
                  }
                  disabled={!settings.socialLogin.enabled}
                />
              </div>
              
              {settings.socialLogin.apple.enabled && (
                <div className="pl-11 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {settings.socialLogin.apple.clientId ? 'Configured' : 'Not Configured'}
                    </Badge>
                    {settings.socialLogin.apple.clientId && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Apple Sign-In credentials must be configured at the tenant level
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Configure global security policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Password Policy */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Password Policy
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Minimum Length: {settings.security.passwordPolicy.minLength} characters
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Require Uppercase
                  </span>
                  <Switch
                    checked={settings.security.passwordPolicy.requireUppercase}
                    onCheckedChange={(checked) => 
                      handleSettingChange('security.passwordPolicy.requireUppercase', checked)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Require Lowercase
                  </span>
                  <Switch
                    checked={settings.security.passwordPolicy.requireLowercase}
                    onCheckedChange={(checked) => 
                      handleSettingChange('security.passwordPolicy.requireLowercase', checked)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Require Numbers
                  </span>
                  <Switch
                    checked={settings.security.passwordPolicy.requireNumbers}
                    onCheckedChange={(checked) => 
                      handleSettingChange('security.passwordPolicy.requireNumbers', checked)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Require Special Characters
                  </span>
                  <Switch
                    checked={settings.security.passwordPolicy.requireSpecialChars}
                    onCheckedChange={(checked) => 
                      handleSettingChange('security.passwordPolicy.requireSpecialChars', checked)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Session Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Session Settings
              </h3>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Session Timeout: {settings.security.sessionTimeout} minutes
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Max Login Attempts: {settings.security.maxLoginAttempts}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Feature Settings
            </CardTitle>
            <CardDescription>
              Enable or disable global features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    User Registration
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Allow new user registration
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.features.userRegistration}
                onCheckedChange={(checked) => 
                  handleSettingChange('features.userRegistration', checked)
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Email Verification
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Require email verification for new users
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.features.emailVerification}
                onCheckedChange={(checked) => 
                  handleSettingChange('features.emailVerification', checked)
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enable 2FA for enhanced security
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.features.twoFactorAuth}
                onCheckedChange={(checked) => 
                  handleSettingChange('features.twoFactorAuth', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(settings.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Updated By:</span>
                <span className="text-gray-900 dark:text-white">
                  {settings.updatedBy}
                </span>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Important Notes
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Social login settings apply to all tenants</li>
                <li>• Individual tenants can override these settings</li>
                <li>• Security settings are enforced globally</li>
                <li>• Changes take effect immediately</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperadminSettingsClient;
