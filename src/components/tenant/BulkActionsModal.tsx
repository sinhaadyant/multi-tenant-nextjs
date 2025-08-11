import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Copy, CheckSquare, XCircle } from 'lucide-react';
import Button from '@/components/ui/button/Button';

interface BulkActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: string) => void;
  selectedCount: number;
  isLoading?: boolean;
}

const BulkActionsModal: React.FC<BulkActionsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  isLoading = false
}) => {
  const [selectedAction, setSelectedAction] = useState<string>('');

  const actions = [
    {
      id: 'activate',
      label: 'Activate',
      description: 'Activate all selected roles',
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      darkBgColor: 'dark:bg-green-900'
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      description: 'Deactivate all selected roles',
      icon: XCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      darkBgColor: 'dark:bg-orange-900'
    },
    {
      id: 'clone',
      label: 'Clone',
      description: 'Create copies of all selected roles',
      icon: Copy,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      darkBgColor: 'dark:bg-blue-900'
    },
    {
      id: 'delete',
      label: 'Delete',
      description: 'Permanently delete all selected roles',
      icon: Trash2,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      darkBgColor: 'dark:bg-red-900'
    }
  ];

  const handleConfirm = () => {
    if (selectedAction) {
      onConfirm(selectedAction);
    }
  };

  const getActionIcon = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    return action ? action.icon : AlertTriangle;
  };

  const getActionColor = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    return action ? action.color : 'text-gray-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                  <AlertTriangle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Bulk Actions
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You have selected <span className="font-medium">{selectedCount}</span> role{selectedCount !== 1 ? 's' : ''}. 
                Choose an action to perform on all selected roles.
              </p>
            </div>

            <div className="space-y-3">
              {actions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <label
                    key={action.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAction === action.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bulkAction"
                      value={action.id}
                      checked={selectedAction === action.id}
                      onChange={(e) => setSelectedAction(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`p-2 rounded-lg ${action.bgColor} ${action.darkBgColor}`}>
                      <IconComponent className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {action.description}
                      </div>
                    </div>
                    {selectedAction === action.id && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>

            {selectedAction === 'delete' && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                  <div className="text-sm text-red-800 dark:text-red-200">
                    <strong>Warning:</strong> This action cannot be undone. All selected roles will be permanently deleted.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              onClick={handleConfirm}
              disabled={!selectedAction || isLoading}
              className={`w-full sm:w-auto sm:ml-3 ${
                selectedAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  {selectedAction && React.createElement(getActionIcon(selectedAction), {
                    className: `w-4 h-4 mr-2 ${getActionColor(selectedAction)}`
                  })}
                  {selectedAction ? `Confirm ${selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)}` : 'Select Action'}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto mt-3 sm:mt-0"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsModal; 