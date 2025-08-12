"use client";

import React, { useState, useEffect } from 'react';
import { X, Shield, Users, Building2, Eye, Settings, Check, X as XIcon } from 'lucide-react';
import { GlobalRole, Tenant, RoleUsage, PermissionOverride } from '@/hooks/useGlobalRolesAPI';
import Button from '@/components/ui/button/Button';
import { useToast } from '@/context/ToastContext';

interface GlobalRoleUsageProps {
  isOpen: boolean;
  onClose: () => void;
  role: GlobalRole;
  tenants: Tenant[];
  loading: boolean;
}

const GlobalRoleUsage: React.FC<GlobalRoleUsageProps> = ({
  isOpen,
  onClose,
  role,
  tenants,
  loading
}) => {
  const { showToast } = useToast();
  const [roleUsage, setRoleUsage] = useState<RoleUsage[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<RoleUsage | null>(null);
  const [showOverridesModal, setShowOverridesModal] = useState(false);
  const [overrides, setOverrides] = useState<PermissionOverride[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [loadingOverrides, setLoadingOverrides] = useState(false);

  // Load role usage data
  useEffect(() => {
    if (isOpen && role) {
      loadRoleUsage();
    }
  }, [isOpen, role]);

  const loadRoleUsage = async () => {
    try {
      setLoadingUsage(true);
      // This would call the API to get role usage
      // For now, we'll simulate the data
      const mockUsage: RoleUsage[] = tenants.map(tenant => ({
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        userCount: Math.floor(Math.random() * 50) + 1,
        hasOverrides: Math.random() > 0.7,
        overrides: []
      }));
      setRoleUsage(mockUsage);
    } catch (error: any) {
      showToast(error.message || 'Failed to load role usage', 'error');
    } finally {
      setLoadingUsage(false);
    }
  };

  const loadTenantOverrides = async (tenantId: string) => {
    try {
      setLoadingOverrides(true);
      // This would call the API to get tenant-specific overrides
      // For now, we'll simulate the data
      const mockOverrides: PermissionOverride[] = [
        {
          permissionId: '1',
          permissionName: 'View Dashboard',
          isGranted: true
        },
        {
          permissionId: '2',
          permissionName: 'Edit Users',
          isGranted: false
        }
      ];
      setOverrides(mockOverrides);
    } catch (error: any) {
      showToast(error.message || 'Failed to load overrides', 'error');
    } finally {
      setLoadingOverrides(false);
    }
  };

  const handleViewOverrides = async (usage: RoleUsage) => {
    setSelectedTenant(usage);
    await loadTenantOverrides(usage.tenantId);
    setShowOverridesModal(true);
  };

  const handleCloseOverrides = () => {
    setShowOverridesModal(false);
    setSelectedTenant(null);
    setOverrides([]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* Background overlay */}
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

          {/* Modal */}
          <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Role Usage: {role.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      View which tenants are using this global role and their customizations
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Role Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tenants</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {roleUsage.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {roleUsage.reduce((sum, usage) => sum + usage.userCount, 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">With Overrides</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {roleUsage.filter(usage => usage.hasOverrides).length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tenants List */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Tenants Using This Role
                </h4>

                {loadingUsage ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : roleUsage.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No tenants using this role
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      This global role is not currently assigned to any tenants
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {roleUsage.map((usage) => (
                      <div
                        key={usage.tenantId}
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/20 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {usage.tenantName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {usage.userCount} users • {usage.tenantSlug}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {usage.hasOverrides && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                <Settings className="w-3 h-3 mr-1" />
                                Customized
                              </span>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewOverrides(usage)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <Button
                onClick={onClose}
                variant="primary"
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overrides Modal */}
      {showOverridesModal && selectedTenant && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseOverrides}></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Tenant Overrides
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedTenant.tenantName} - Customizations for {role.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseOverrides}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Overrides List */}
                <div>
                  {loadingOverrides ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="animate-pulse">
                          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : overrides.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No customizations
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        This tenant is using the default permissions for this role
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {overrides.map((override) => (
                        <div
                          key={override.permissionId}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {override.permissionName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Permission override
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {override.isGranted ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                <Check className="w-3 h-3 mr-1" />
                                Granted
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                <XIcon className="w-3 h-3 mr-1" />
                                Denied
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleCloseOverrides}
                  variant="primary"
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalRoleUsage;
