import React from 'react';
import { Shield, Lock } from 'lucide-react';

interface PermissionBasedBlockProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredModule?: string;
  fallbackMessage?: string;
  showLockIcon?: boolean;
  className?: string;
  permissions?: {
    canView?: boolean;
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  };
  modules?: {
    [key: string]: {
      isEnabled?: boolean;
      isVisible?: boolean;
    };
  };
}

const PermissionBasedBlock: React.FC<PermissionBasedBlockProps> = ({
  children,
  requiredPermission,
  requiredModule,
  fallbackMessage = "You don't have permission to view this content. Contact your administrator for access.",
  showLockIcon = true,
  className = "",
  permissions = {},
  modules = {}
}) => {
  // Check if user has the required permission
  const hasPermission = () => {
    if (!requiredPermission && !requiredModule) {
      return true; // No permission required
    }

    if (requiredModule) {
      const module = modules[requiredModule];
      if (!module) {
        return false; // Module not found
      }
      
      // Check if module is enabled and visible
      if (module.isEnabled === false || module.isVisible === false) {
        return false;
      }
    }

    if (requiredPermission) {
      // Check specific permission
      const [moduleKey, action] = requiredPermission.split(':');
      
      switch (action) {
        case 'view':
        case 'read':
          return permissions.canView === true;
        case 'create':
          return permissions.canCreate === true;
        case 'update':
        case 'edit':
          return permissions.canUpdate === true;
        case 'delete':
          return permissions.canDelete === true;
        default:
          // If no specific action, check if user has any permission for this module
          return permissions.canView === true || 
                 permissions.canCreate === true || 
                 permissions.canUpdate === true || 
                 permissions.canDelete === true;
      }
    }

    return true;
  };

  if (!hasPermission()) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          {showLockIcon ? (
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          ) : (
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          )}
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {fallbackMessage}
          </p>
          {requiredPermission && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Required: {requiredPermission}
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PermissionBasedBlock;
