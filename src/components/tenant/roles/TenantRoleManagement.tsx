"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Users, Key, Plus, Globe, Settings, Check, X as XIcon, Copy, Edit, Trash2 } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { useToast } from '@/context/ToastContext';


interface TenantRoleManagementProps {
  tenantId: string;
}

const TenantRoleManagement: React.FC<TenantRoleManagementProps> = ({ tenantId }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'global' | 'custom' | 'overrides'>('global');
  const [globalRoles, setGlobalRoles] = useState<any[]>([]);
  const [customRoles, setCustomRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockGlobalRoles = [
      {
        id: '1',
        name: 'Standard User',
        description: 'Basic user permissions for common tasks',
        permissionCount: 15,
        isAssigned: true,
        userCount: 25,
        hasOverrides: false
      },
      {
        id: '2',
        name: 'Power User',
        description: 'Advanced user with extended permissions',
        permissionCount: 28,
        isAssigned: true,
        userCount: 8,
        hasOverrides: true
      },
      {
        id: '3',
        name: 'Manager',
        description: 'Management level permissions',
        permissionCount: 35,
        isAssigned: false,
        userCount: 0,
        hasOverrides: false
      }
    ];

    const mockCustomRoles = [
      {
        id: 'custom1',
        name: 'Custom Support Role',
        description: 'Custom role for support team',
        permissionCount: 12,
        userCount: 5,
        isActive: true
      }
    ];

    setGlobalRoles(mockGlobalRoles);
    setCustomRoles(mockCustomRoles);
  }, []);

  const tabs = [
    {
      id: 'global',
      label: 'Global Roles',
      icon: Globe,
      description: 'Use global roles created by superadmin'
    },
    {
      id: 'custom',
      label: 'Custom Roles',
      icon: Shield,
      description: 'Create and manage custom roles'
    },
    {
      id: 'overrides',
      label: 'Permission Overrides',
      icon: Settings,
      description: 'Customize global role permissions'
    }
  ];

  const handleAssignRole = async (role: any) => {
    try {
      setLoading(true);
      // API call to assign role to tenant
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setGlobalRoles(prev => prev.map(r => 
        r.id === role.id ? { ...r, isAssigned: true } : r
      ));
      
      showToast(`Global role "${role.name}" assigned successfully`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to assign role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignRole = async (role: any) => {
    try {
      setLoading(true);
      // API call to unassign role from tenant
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setGlobalRoles(prev => prev.map(r => 
        r.id === role.id ? { ...r, isAssigned: false, userCount: 0 } : r
      ));
      
      showToast(`Global role "${role.name}" unassigned successfully`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to unassign role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomRole = () => {
    // Navigate to custom role creation
    showToast('Custom role creation feature coming soon', 'info');
  };

  const handleViewOverrides = (role: any) => {
    setSelectedRole(role);
    setShowOverrideModal(true);
  };

  const handleOverridePermissions = async (overrides: any[]) => {
    try {
      setLoading(true);
      // API call to update permission overrides
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setGlobalRoles(prev => prev.map(r => 
        r.id === selectedRole.id ? { ...r, hasOverrides: true } : r
      ));
      
      showToast('Permission overrides updated successfully', 'success');
      setShowOverrideModal(false);
      setSelectedRole(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to update overrides', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Role Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage roles and permissions for your tenant
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'custom' && (
            <Button
              onClick={handleCreateCustomRole}
              variant="primary"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Role
            </Button>
          )}
        </div>
      </div>

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
      {/* Global Roles Tab */}
      {activeTab === 'global' && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Global Roles Available
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  These roles are created by the superadmin and can be used across all tenants. 
                  You can assign them directly or customize their permissions for your tenant.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {globalRoles.map((role) => (
              <div
                key={role.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/20 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {role.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {role.permissionCount} permissions
                      </p>
                    </div>
                  </div>
                  {role.hasOverrides && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                      <Settings className="w-3 h-3 mr-1" />
                      Customized
                    </span>
                  )}
                </div>

                {role.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {role.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-500 dark:text-gray-400">
                    {role.userCount} users assigned
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    role.isAssigned
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {role.isAssigned ? 'Assigned' : 'Available'}
                  </span>
                </div>

                <div className="flex gap-2">
                  {role.isAssigned ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOverrides(role)}
                        className="flex-1"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Customize
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassignRole(role)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Unassign
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAssignRole(role)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Assign Role
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Roles Tab */}
      {activeTab === 'custom' && (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Custom Roles
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Create custom roles specific to your tenant's needs. These roles are only available to your tenant.
                </p>
              </div>
            </div>
          </div>

          {customRoles.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No custom roles yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first custom role to get started
              </p>
              <Button
                onClick={handleCreateCustomRole}
                variant="primary"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Role
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {customRoles.map((role) => (
                <div
                  key={role.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {role.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {role.permissionCount} permissions
                      </p>
                    </div>
                  </div>

                  {role.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {role.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-500 dark:text-gray-400">
                      {role.userCount} users assigned
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      role.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {role.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Permission Overrides Tab */}
      {activeTab === 'overrides' && (
        <div className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Permission Overrides
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Customize global role permissions for your tenant without creating new roles.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {globalRoles.filter(role => role.isAssigned).map((role) => (
              <div
                key={role.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {role.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {role.permissionCount} base permissions
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-500 dark:text-gray-400">
                    {role.userCount} users using this role
                  </span>
                  {role.hasOverrides && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                      <Settings className="w-3 h-3 mr-1" />
                      Customized
                    </span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewOverrides(role)}
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {role.hasOverrides ? 'Edit Overrides' : 'Add Overrides'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverrideModal && selectedRole && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowOverrideModal(false)}></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Customize Permissions
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedRole.name} - Override specific permissions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOverrideModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Permission Override Interface
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    This would show a detailed interface for overriding specific permissions for the {selectedRole.name} role.
                  </p>
                  <Button
                    onClick={() => handleOverridePermissions([])}
                    variant="primary"
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Overrides'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantRoleManagement;
