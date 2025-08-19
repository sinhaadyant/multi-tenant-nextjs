"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Database, 
  Trash2, 
  ArrowRight, 
  AlertTriangle,
  Users,
  Building2,
  FileText,
  Clock
} from 'lucide-react';
import { useDataCounts } from '@/hooks/useDataManagement';

export default function DataManagementPage() {
  const { data: dataCounts, isLoading: countsLoading } = useDataCounts();

  const getDataCounts = () => {
    if (!dataCounts?.data?.counts) return { tenants: 0, users: 0, auditLogs: 0 };
    return dataCounts.data.counts;
  };

  const counts = getDataCounts();

  const managementOptions = [
    {
      title: 'Insert Sample Data',
      description: 'Generate sample tenants and users for testing purposes',
      icon: Database,
      href: '/superadmin/data-management/insert',
      color: 'blue',
      features: [
        'Create sample tenant organizations',
        'Generate users for each tenant',
        'Configure time ranges and backfilling',
        'Realistic test data generation'
      ]
    },
    {
      title: 'Clear Data',
      description: 'Permanently delete data from the system',
      icon: Trash2,
      href: '/superadmin/data-management/clear',
      color: 'red',
      features: [
        'Selective data deletion',
        'Clear tenants, users, or audit logs',
        'Comprehensive warnings and confirmations',
        'Audit trail for all operations'
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
        };
      case 'red':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          hover: 'hover:bg-red-100 dark:hover:bg-red-900/30'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-700',
          border: 'border-gray-200 dark:border-gray-600',
          icon: 'text-gray-600 dark:text-gray-400',
          hover: 'hover:bg-gray-100 dark:hover:bg-gray-600'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Data Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage system data for testing, development, and maintenance purposes
          </p>
        </div>

        {/* Current Data Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Current Data Overview
          </h2>
          {countsLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-gray-600 dark:text-gray-400">Loading data counts...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                    <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tenants</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.tenants}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                    <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Audit Logs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.auditLogs}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Management Options */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Data Management Tools
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {managementOptions.map((option) => {
              const colors = getColorClasses(option.color);
              const IconComponent = option.icon;
              
              return (
                <Link
                  key={option.title}
                  href={option.href}
                  className={`block ${colors.bg} ${colors.border} ${colors.hover} rounded-lg border p-6 transition-colors duration-200`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                          <IconComponent className={`w-6 h-6 ${colors.icon}`} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {option.title}
                        </h3>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {option.description}
                      </p>
                      
                      <ul className="space-y-2">
                        {option.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Warning Section */}
        <div className="mt-8">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Important Notice
                </h3>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                  <p>
                    These tools are designed for development and testing purposes. Please use them responsibly:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Always backup your data before performing any destructive operations</li>
                    <li>Sample data is for testing only and should not be used in production</li>
                    <li>Data deletion operations are permanent and cannot be undone</li>
                    <li>All operations are logged for audit purposes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
