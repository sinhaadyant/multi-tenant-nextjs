"use client";

import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Trash2, 
  Download, 
  Users, 
  FileText, 
  Activity, 
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Wrench,
  RefreshCw,
  Archive
} from 'lucide-react';
import { useDummyDataStatus, useGenerateDummyData, useClearAllData, useDownloadBackup } from '@/hooks/useDummyData';
import { GenerateDummyDataModal } from '@/components/tenant/GenerateDummyDataModal';
import { ClearDataModal } from '@/components/tenant/ClearDataModal';
import ErrorBoundary from '@/components/common/ErrorBoundary';

export default function UtilitiesPage() {
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Fetch data
  const { data: statusData, isLoading: statusLoading, error: statusError } = useDummyDataStatus();
  const { mutate: generateDummyData, isPending: isGenerating } = useGenerateDummyData();
  const { mutate: clearAllData, isPending: isClearing } = useClearAllData();
  const { mutate: downloadBackup, isPending: isDownloading } = useDownloadBackup();

  const currentData = statusData?.currentData;

  const handleGenerateDummyData = (params: any) => {
    generateDummyData(params, {
      onSuccess: () => {
        setIsGenerateModalOpen(false);
      }
    });
  };

  const handleClearAllData = () => {
    clearAllData(undefined, {
      onSuccess: () => {
        setIsClearModalOpen(false);
      }
    });
  };

  const handleDownloadBackup = (excludeAuditLogs: boolean) => {
    downloadBackup(excludeAuditLogs);
  };

  if (statusError) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading utilities
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {statusError.message || 'An error occurred while loading the utilities data.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Utilities</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage dummy data generation, clearing, and database backups
            </p>
          </div>
        </div>

        {/* Current Data Overview */}
        {statusLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mr-4" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Users */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentData?.users || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Support Tickets */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Support Tickets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentData?.tickets || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                  <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Audit Logs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentData?.auditLogs || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900">
                  <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Notifications</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentData?.notifications || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Utility Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generate Dummy Data */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Generate Dummy Data</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Create test data for development</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate realistic test data including users, tickets, audit logs, and notifications.
              </p>
              
              <button
                onClick={() => setIsGenerateModalOpen(true)}
                disabled={isGenerating}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Generate Data
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Clear All Data */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Clear All Data</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Remove all tenant data</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permanently delete all users, tickets, logs, and notifications. This action cannot be undone.
              </p>
              
              <button
                onClick={() => setIsClearModalOpen(true)}
                disabled={isClearing || (currentData && Object.values(currentData).every(count => count === 0))}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Download Backup */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Database Backup</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Download tenant data</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate and download a complete SQL backup of your tenant data.
              </p>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleDownloadBackup(false)}
                  disabled={isDownloading}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Backup
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleDownloadBackup(true)}
                  disabled={isDownloading}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4 mr-2" />
                      Backup (No Logs)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex">
            <Shield className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Important Information
              </h4>
              <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• All actions are logged in audit logs for security purposes</li>
                <li>• Dummy data is timestamped according to the selected range</li>
                <li>• Clearing data is permanent and cannot be undone</li>
                <li>• Backups include all tenant-specific data and can be restored</li>
                <li>• This utility is only available for tenant and user accounts</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modals */}
        <GenerateDummyDataModal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          onSubmit={handleGenerateDummyData}
          isLoading={isGenerating}
        />

        <ClearDataModal
          isOpen={isClearModalOpen}
          onClose={() => setIsClearModalOpen(false)}
          onConfirm={handleClearAllData}
          isLoading={isClearing}
          currentData={currentData}
        />
      </div>
    </ErrorBoundary>
  );
} 