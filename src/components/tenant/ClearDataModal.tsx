"use client";

import React from 'react';
import { X, Trash2, AlertTriangle, Users, FileText, Activity, Bell } from 'lucide-react';
import { DummyDataStatus } from '@/hooks/useDummyData';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  currentData?: DummyDataStatus['currentData'];
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  currentData
}) => {
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Clear All Data
                </h3>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Warning */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    This action cannot be undone
                  </h4>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    All tenant data will be permanently deleted. This includes users, support tickets, audit logs, and notifications.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Data Summary */}
            {currentData && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Data that will be deleted:
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentData.users}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Users</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <FileText className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentData.tickets}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Support Tickets</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentData.auditLogs}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Audit Logs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Bell className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentData.notifications}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Notifications</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Final Confirmation
                  </h4>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                    Type "DELETE" in the input below to confirm you want to permanently delete all data.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
        </div>
      </div>
    </div>
  );
}; 