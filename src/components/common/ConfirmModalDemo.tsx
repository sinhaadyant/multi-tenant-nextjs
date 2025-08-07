"use client";

import React from 'react';
import { Trash2, AlertTriangle, Info, CheckCircle, Settings } from 'lucide-react';
import { useConfirmModalHelpers } from '@/hooks/useConfirmModal';

const ConfirmModalDemo: React.FC = () => {
  const { confirmDelete, confirmAction, confirmInfo, confirmSuccess } = useConfirmModalHelpers();

  const handleDeleteUser = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('User deleted successfully');
  };

  const handleUpdateSettings = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Settings updated successfully');
  };

  const handleProceedWithAction = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('Action completed successfully');
  };

  const handleSystemRestart = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('System restart initiated');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Confirmation Modal Demo
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Click the buttons below to see different confirmation modal variants in action.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Danger Variant */}
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Danger Action</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Delete a user account permanently
          </p>
          <button
            onClick={() => confirmDelete('John Doe', handleDeleteUser)}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Delete User
          </button>
        </div>

        {/* Warning Variant */}
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Warning Action</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Update system settings that may affect performance
          </p>
          <button
            onClick={() => confirmAction(
              'Update System Settings',
              'This will update critical system settings. Some services may be temporarily unavailable during the update.',
              handleUpdateSettings
            )}
            className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
          >
            Update Settings
          </button>
        </div>

        {/* Info Variant */}
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Info Action</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Proceed with a standard operation
          </p>
          <button
            onClick={() => confirmInfo(
              'Proceed with Action',
              'This action will process your request and may take a few moments to complete.',
              handleProceedWithAction
            )}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Proceed
          </button>
        </div>

        {/* Success Variant */}
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Success Action</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Restart system with new configuration
          </p>
          <button
            onClick={() => confirmSuccess(
              'Restart System',
              'The system will restart with the new configuration. All active sessions will be terminated.',
              handleSystemRestart
            )}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Restart System
          </button>
        </div>
      </div>

      {/* Custom Example */}
      <div className="mt-8 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Custom Confirmation</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Example of a custom confirmation with specific text and behavior
        </p>
        <button
          onClick={() => {
            const { confirm } = useConfirmModalHelpers();
            confirm.confirmAction(
              'Custom Action',
              'This is a custom confirmation with specific requirements. Please review carefully before proceeding.',
              async () => {
                console.log('Custom action executed');
                await new Promise(resolve => setTimeout(resolve, 1000));
              },
              {
                confirmText: 'Execute Action',
                cancelText: 'Go Back',
              }
            );
          }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Custom Action
        </button>
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Usage Instructions</h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Basic Usage:</strong></p>
          <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-x-auto">
{`const { confirm } = useConfirmModalHelpers();

confirm.confirmDelete('User Name', async () => {
  // Your delete logic here
  await deleteUser();
});`}
          </pre>
          
          <p><strong>Custom Options:</strong></p>
          <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-x-auto">
{`confirm.confirmAction(
  'Custom Title',
  'Custom message',
  async () => {
    // Your action logic
  },
  {
    confirmText: 'Custom Confirm',
    cancelText: 'Custom Cancel',
    variant: 'info'
  }
);`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModalDemo; 