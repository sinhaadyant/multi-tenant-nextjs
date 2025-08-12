"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Users, Key, Plus, Building2, Globe, Eye, Edit, Trash2 } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { useToast } from '@/context/ToastContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import GlobalRoleList from '@/components/superadmin/global-roles/GlobalRoleList';
import GlobalRoleForm from '@/components/superadmin/global-roles/GlobalRoleForm';
import GlobalRoleUsage from '@/components/superadmin/global-roles/GlobalRoleUsage';
import { useGlobalRolesAPI } from '@/hooks/useGlobalRolesAPI';

const GlobalRolesPage = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'roles' | 'usage'>('roles');
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [modalType, setModalType] = useState<'create' | 'edit' | null>(null);
  const [showUsageModal, setShowUsageModal] = useState(false);

  // Initialize the global roles API
  const {
    roles,
    modules,
    tenants,
    loading,
    error,
    fetchGlobalRoles,
    fetchModules,
    fetchTenants,
    createGlobalRole,
    updateGlobalRole,
    deleteGlobalRole,
    updateRolePermissions,
    getRoleUsage,
    setError
  } = useGlobalRolesAPI();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchGlobalRoles(),
          fetchModules(),
          fetchTenants()
        ]);
      } catch (error: any) {
        showToast(error.message || 'Failed to load data', 'error');
      }
    };
    loadData();
  }, []);

  // Handle URL parameters for tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'usage') {
      setActiveTab(tab);
    }
  }, []);

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeTab === 'roles') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', activeTab);
    }
    window.history.replaceState({}, '', url.toString());
  }, [activeTab]);

  const tabs = [
    {
      id: 'roles',
      label: 'Global Roles',
      icon: Globe,
      description: 'Create and manage global roles for all tenants'
    },
    {
      id: 'usage',
      label: 'Role Usage',
      icon: Users,
      description: 'View which tenants are using global roles'
    }
  ];

  // Handle role creation
  const handleCreateRole = async (roleData: any) => {
    try {
      const newRole = await createGlobalRole(roleData);
      showToast('Global role created successfully', 'success');
      setModalType(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to create global role', 'error');
    }
  };

  // Handle role update
  const handleUpdateRole = async (roleData: any) => {
    try {
      if (!selectedRole) return;
      
      await updateGlobalRole(selectedRole.id, roleData);
      showToast('Global role updated successfully', 'success');
      setModalType(null);
      setSelectedRole(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to update global role', 'error');
    }
  };

  // Handle role deletion
  const handleDeleteRole = async (role: any) => {
    try {
      await deleteGlobalRole(role.id);
      showToast('Global role deleted successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete global role', 'error');
    }
  };

  // Handle permission updates
  const handleUpdatePermissions = async (permissions: any[]) => {
    try {
      if (!selectedRole) {
        throw new Error('Please select a role first');
      }
      
      await updateRolePermissions(selectedRole.id, permissions);
      showToast('Permissions updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update permissions', 'error');
    }
  };

  // Handle viewing role usage
  const handleViewUsage = async (role: any) => {
    try {
      setSelectedRole(role);
      setShowUsageModal(true);
    } catch (error: any) {
      showToast(error.message || 'Failed to load role usage', 'error');
    }
  };

  // Open modal
  const openModal = (type: 'create' | 'edit', role?: any) => {
    setModalType(type);
    if (role) {
      setSelectedRole(role);
    }
  };

  // Close modal
  const closeModal = () => {
    setModalType(null);
    setSelectedRole(null);
  };

  // Clear error
  const handleClearError = () => {
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Global Role Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage global roles that can be used across all tenants
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'roles' && (
            <Button
              onClick={() => openModal('create')}
              variant="primary"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Global Role
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error Loading Data
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearError}
              className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <ErrorBoundary>
        {/* Global Roles Tab */}
        {activeTab === 'roles' && (
          <GlobalRoleList
            roles={roles}
            loading={loading}
            onSearch={(search) => {
              fetchGlobalRoles({ search });
            }}
            onFilter={(filters) => {
              fetchGlobalRoles(filters);
            }}
            onSort={(field, order) => {
              fetchGlobalRoles({ sortBy: field as any, sortOrder: order });
            }}
            onCreateRole={() => openModal('create')}
            onEditRole={(role) => openModal('edit', role)}
            onViewUsage={handleViewUsage}
            onDeleteRole={handleDeleteRole}
            currentFilters={{}}
          />
        )}

        {/* Role Usage Tab */}
        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Global Role Usage Overview
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    View which tenants are using global roles and their customizations
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/20 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {role.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {role.tenantCount || 0} tenants using
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewUsage(role)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Usage
                    </Button>
                  </div>
                  {role.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {role.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {role.permissionCount || 0} permissions
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Created {new Date(role.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ErrorBoundary>

      {/* Modals */}
      {modalType && (
        <GlobalRoleForm
          isOpen={true}
          onClose={closeModal}
          onSubmit={modalType === 'create' ? handleCreateRole : handleUpdateRole}
          role={modalType === 'edit' ? selectedRole : null}
          modules={modules}
          loading={loading}
        />
      )}

      {showUsageModal && selectedRole && (
        <GlobalRoleUsage
          isOpen={showUsageModal}
          onClose={() => {
            setShowUsageModal(false);
            setSelectedRole(null);
          }}
          role={selectedRole}
          tenants={tenants}
          loading={loading}
        />
      )}
    </div>
  );
};

export default GlobalRolesPage;
