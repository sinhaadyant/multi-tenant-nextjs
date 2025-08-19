"use client";

import React, { useState, useEffect } from 'react';
import { Download, Database, Users, Building2, FileText, Clock, CheckCircle, AlertCircle, History, Trash2, Calendar, RefreshCw } from 'lucide-react';
import { useBackupData, useBackupHistory, useDeleteBackup } from '@/hooks/useBackupData';
import Button from '@/components/ui/button/Button';

export default function BackupPage() {
  const [backupOptions, setBackupOptions] = useState({
    includeTenants: true,
    includeUsers: true,
    includeNotifications: true,
    includeAuditLogs: false,
    includeSupportTickets: true,
    includeSystemSettings: true,
    excludeSensitiveData: true
  });

  const { mutate: createBackup, isPending: isCreatingBackup, error } = useBackupData();
  const { data: backupHistory, isLoading: isLoadingHistory, error: historyError, refetch } = useBackupHistory();
  const { mutate: deleteBackup, isPending: isDeleting } = useDeleteBackup();

  const backups = backupHistory?.backups || [];

  const handleBackup = () => {
    createBackup(backupOptions);
  };

  const handleOptionChange = (option: string) => {
    setBackupOptions(prev => ({
      ...prev,
      [option]: !prev[option as keyof typeof prev]
    }));
  };

  const handleDeleteBackup = (backupId: string) => {
    if (confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      deleteBackup(backupId);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'processing':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Auto-refresh the backup list when a backup is being created
  useEffect(() => {
    if (isCreatingBackup) {
      // Start polling for updates every 2 seconds while backup is being created
      const interval = setInterval(() => {
        refetch();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isCreatingBackup, refetch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Backup & Restore
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create comprehensive backups and manage your backup history
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoadingHistory || isCreatingBackup}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingHistory || isCreatingBackup ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.location.href = '/superadmin/backup/history'}
          >
            <History className="w-4 h-4 mr-2" />
            View All Backups
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Backups</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {isLoadingHistory ? '...' : backupHistory?.totalCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Backup</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {isLoadingHistory ? '...' : backupHistory?.lastBackupDate ? formatDate(backupHistory.lastBackupDate) : 'Never'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Size</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {isLoadingHistory ? '...' : backupHistory?.totalSize ? formatFileSize(backupHistory.totalSize) : '0 MB'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Successful</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {isLoadingHistory ? '...' : backups.filter(b => b.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Backups */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Backups
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/superadmin/backup/history'}
            >
              View All Backups
            </Button>
          </div>
        </div>

        {isLoadingHistory ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ) : historyError ? (
          <div className="p-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Database className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error loading backup history
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    {historyError instanceof Error ? historyError.message : 'An unexpected error occurred'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-6 text-center">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No recent backups</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create your first backup to see it here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {backups.slice(0, 5).map((backup) => (
              <div
                key={backup.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {backup.filename}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(backup.status)}`}>
                          {getStatusIcon(backup.status)}
                          <span className="ml-1">{backup.status}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(backup.createdAt)}
                        </div>
                        <div className="flex items-center">
                          <Database className="h-4 w-4 mr-1" />
                          {formatFileSize(backup.fileSize)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {backup.duration}ms
                        </div>
                      </div>
                      {backup.description && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {backup.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/superadmin/backup/${backup.id}/download`, '_blank')}
                      disabled={backup.status !== 'completed'}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBackup(backup.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backup Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Database className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Backup Configuration
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tenants Data
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={backupOptions.includeTenants}
                  onChange={() => handleOptionChange('includeTenants')}
                  className="sr-only peer"
                  disabled={isCreatingBackup}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Users Data
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={backupOptions.includeUsers}
                  onChange={() => handleOptionChange('includeUsers')}
                  className="sr-only peer"
                  disabled={isCreatingBackup}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Support Tickets
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={backupOptions.includeSupportTickets}
                  onChange={() => handleOptionChange('includeSupportTickets')}
                  className="sr-only peer"
                  disabled={isCreatingBackup}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Audit Logs
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={backupOptions.includeAuditLogs}
                  onChange={() => handleOptionChange('includeAuditLogs')}
                  className="sr-only peer"
                  disabled={isCreatingBackup}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  System Settings
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={backupOptions.includeSystemSettings}
                  onChange={() => handleOptionChange('includeSystemSettings')}
                  className="sr-only peer"
                  disabled={isCreatingBackup}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Exclude Sensitive Data
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={backupOptions.excludeSensitiveData}
                  onChange={() => handleOptionChange('excludeSensitiveData')}
                  className="sr-only peer"
                  disabled={isCreatingBackup}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Backup Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Download className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Create Backup
            </h2>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Database className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Backup Information
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <p>• Backup will be downloaded as a SQL file</p>
                    <p>• File will contain all selected data types</p>
                    <p>• Backup is encrypted and secure</p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleBackup}
              disabled={isCreatingBackup}
              className="w-full"
              size="md"
            >
              {isCreatingBackup ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Backup...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Backup Failed
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      {error instanceof Error ? error.message : 'An unexpected error occurred'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 