"use client";

import React, { useState } from 'react';
import { Download, AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react';
import { useTenantAuditLogs, AuditLog } from '@/hooks/useTenantAuditLogs';
import TenantAuditLogsTable from '@/components/tenant/TenantAuditLogsTable';
import TenantAuditLogsFilters from '@/components/tenant/TenantAuditLogsFilters';
import TenantAuditLogDetailsModal from '@/components/tenant/TenantAuditLogDetailsModal';

export default function TenantAuditLogsPage() {
  const {
    auditLogs,
    stats,
    loading,
    error,
    filters,
    pagination,
    fetchAuditLogs,
    updateFilters,
    goToPage,
    exportLogs,
  } = useTenantAuditLogs();

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const handleViewLog = (log: AuditLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  const handleSort = (field: string) => {
    const newSortOrder = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    updateFilters({ sortBy: field, sortOrder: newSortOrder });
  };

  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    updateFilters({
      userEmail: '',
      actionType: '',
      startDate: '',
      endDate: '',
      page: 1
    });
  };

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    setExportLoading(true);
    try {
      await exportLogs(format);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExportLoading(false);
    }
  };

  const getActionStats = () => {
    if (!stats || !stats.actionBreakdown) return { create: 0, update: 0, delete: 0, login: 0, other: 0 };
    
    const actionStats = { create: 0, update: 0, delete: 0, login: 0, other: 0 };
    
    stats.actionBreakdown.forEach(item => {
      if (item.action.includes('create')) actionStats.create += item.count;
      else if (item.action.includes('update')) actionStats.update += item.count;
      else if (item.action.includes('delete')) actionStats.delete += item.count;
      else if (item.action.includes('login')) actionStats.login += item.count;
      else actionStats.other += item.count;
    });
    
    return actionStats;
  };

  const actionStats = getActionStats();

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-400 mr-2" />
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error loading audit logs
            </h3>
          </div>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
          <button
            onClick={() => fetchAuditLogs()}
            className="mt-3 text-sm text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Audit Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor system activity and user actions within your tenant
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleExport('csv')}
            disabled={exportLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2 inline" />
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exportLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2 inline" />
            {exportLoading ? 'Exporting...' : 'Export JSON'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Actions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.total || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Create Actions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {actionStats.create}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Update Actions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {actionStats.update}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delete Actions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {actionStats.delete}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Breakdown */}
      {stats && stats.actionBreakdown && stats.actionBreakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Action Breakdown (Last 30 Days)
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.actionBreakdown.slice(0, 6).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.action.replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <TenantAuditLogsFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        loading={loading}
      />

      {/* Data Table */}
      <TenantAuditLogsTable
        logs={auditLogs}
        loading={loading}
        onViewLog={handleViewLog}
        onSort={handleSort}
        sortBy={filters.sortBy || 'createdAt'}
        sortOrder={filters.sortOrder || 'desc'}
        currentPage={pagination?.page || 1}
        totalPages={pagination?.totalPages || 1}
        onPageChange={goToPage}
      />

      {/* Log Details Modal */}
      <TenantAuditLogDetailsModal
        log={selectedLog}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
} 