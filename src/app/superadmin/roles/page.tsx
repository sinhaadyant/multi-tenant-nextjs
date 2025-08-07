"use client";

import React from 'react';
import Link from 'next/link';
import { Shield, Users, Key, Plus, Search, Filter, MoreHorizontal } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { Input } from '@/components/form/input/InputField';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/dropdown';
import { useToast } from '@/context/ToastContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import RolesManagement from '@/components/superadmin/roles/RolesManagement';
import PermissionGroups from '@/components/superadmin/roles/PermissionGroups';
import RoleAssignment from '@/components/superadmin/roles/RoleAssignment';

const RolesPage = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = React.useState<'roles' | 'permissions' | 'assignment'>('roles');

  // Handle URL parameters for tab
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'permissions' || tab === 'assignment') {
      setActiveTab(tab);
    }
  }, []);

  const tabs = [
    {
      id: 'roles',
      label: 'Roles Management',
      icon: Shield,
      description: 'Create, edit, and manage user roles'
    },
    {
      id: 'permissions',
      label: 'Permission Groups',
      icon: Key,
      description: 'Manage permission groups and individual permissions'
    },
    {
      id: 'assignment',
      label: 'Role Assignment',
      icon: Users,
      description: 'Assign roles to users across tenants'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Roles & Permissions Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage user roles, permissions, and role assignments across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setActiveTab('roles')}
            variant={activeTab === 'roles' ? 'default' : 'outline'}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
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

      {/* Tab Content */}
      <ErrorBoundary>
        {activeTab === 'roles' && <RolesManagement />}
        {activeTab === 'permissions' && <PermissionGroups />}
        {activeTab === 'assignment' && <RoleAssignment />}
      </ErrorBoundary>
    </div>
  );
};

export default RolesPage; 