"use client";

import React from 'react';
import { Trash2, Edit, Archive, UserX } from 'lucide-react';
import { useConfirmModalContext } from './ConfirmModalProvider';

const ConfirmModalExample: React.FC = () => {
  const { confirm } = useConfirmModalContext();

  const handleDeleteUser = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('User deleted successfully');
    // You could show a toast notification here
  };

  const handleArchiveData = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Data archived successfully');
  };

  const handleSuspendUser = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('User suspended successfully');
  };

  const handleBulkDelete = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Bulk delete completed');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Confirmation Modal Examples
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Real-world examples of how to use the confirmation modal in your components.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Management Example */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Management
          </h3>
          
          <div className="space-y-3">
            <button
              onClick={() => confirm({
                title: 'Delete User',
                message: 'Are you sure you want to delete this user? This action cannot be undone and will permanently remove all user data.',
                confirmText: 'Delete User',
                variant: 'danger',
                onConfirm: handleDeleteUser,
              })}
              className="flex items-center gap-2 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete User
            </button>

            <button
              onClick={() => confirm({
                title: 'Suspend User',
                message: 'This will temporarily suspend the user account. They will not be able to access the system until you reactivate their account.',
                confirmText: 'Suspend User',
                variant: 'warning',
                onConfirm: handleSuspendUser,
              })}
              className="flex items-center gap-2 w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              <UserX className="w-4 h-4" />
              Suspend User
            </button>
          </div>
        </div>

        {/* Data Management Example */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Data Management
          </h3>
          
          <div className="space-y-3">
            <button
              onClick={() => confirm({
                title: 'Archive Data',
                message: 'This will archive the selected data. Archived data will be moved to long-term storage and may take longer to retrieve.',
                confirmText: 'Archive Data',
                variant: 'info',
                onConfirm: handleArchiveData,
              })}
              className="flex items-center gap-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Archive className="w-4 h-4" />
              Archive Data
            </button>

            <button
              onClick={() => confirm({
                title: 'Bulk Delete',
                message: 'You are about to delete 150 items. This action cannot be undone. Please ensure you have a backup before proceeding.',
                confirmText: 'Delete All',
                cancelText: 'Cancel',
                variant: 'danger',
                onConfirm: handleBulkDelete,
              })}
              className="flex items-center gap-2 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Bulk Delete (150 items)
            </button>
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Implementation Example
        </h3>
        
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
          <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
{`// In your component
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';

const MyComponent = () => {
  const { confirm } = useConfirmModalContext();

  const handleDelete = () => {
    confirm({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item?',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        // Your delete logic here
        await deleteItem();
      },
    });
  };

  return (
    <button onClick={handleDelete}>
      Delete Item
    </button>
  );
};`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModalExample; 