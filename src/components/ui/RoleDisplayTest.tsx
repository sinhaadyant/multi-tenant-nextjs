import React from 'react';
import { useTenantAuth } from '@/context/TenantAuthContext';
import RoleBadge from './RoleBadge';

const RoleDisplayTest: React.FC = () => {
  const { user, isLoading, error } = useTenantAuth();

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>;
  }

  if (!user) {
    return <div className="text-sm text-gray-500">No user data</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="text-sm font-medium mb-2">Role Display Test</h3>
      <div className="space-y-2">
        <div>
          <span className="text-xs text-gray-600">User: </span>
          <span className="text-sm font-medium">{user.name}</span>
        </div>
        <div>
          <span className="text-xs text-gray-600">Roles: </span>
          <span className="text-sm">{user.roles?.length || 0} role(s)</span>
        </div>
        <div>
          <span className="text-xs text-gray-600">First Role: </span>
          {user.roles && user.roles.length > 0 ? (
            <RoleBadge role={user.roles[0].name} size="sm" />
          ) : (
            <span className="text-sm text-gray-500">No role</span>
          )}
        </div>
        <div>
          <span className="text-xs text-gray-600">All Roles: </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {user.roles?.map((role, index) => (
              <RoleBadge key={index} role={role.name} size="sm" />
            )) || (
              <span className="text-xs text-gray-500">No roles found</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleDisplayTest; 