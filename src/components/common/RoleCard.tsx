"use client";

import React from 'react';
import { Shield, Users, Check } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault?: boolean;
  color?: string;
  priority?: number;
}

interface RoleCardProps {
  role: Role;
  isSelected?: boolean;
  onClick?: (roleId: string) => void;
  showDetails?: boolean;
  className?: string;
}

const RoleCard: React.FC<RoleCardProps> = ({
  role,
  isSelected = false,
  onClick,
  showDetails = true,
  className = ""
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(role.id);
    }
  };

  return (
    <div
      className={`p-4 border rounded-lg transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white">{role.name}</h4>
            {role.isDefault && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Default
              </span>
            )}
            {!role.isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                Inactive
              </span>
            )}
          </div>
          
          {role.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{role.description}</p>
          )}
          
          {showDetails && (
            <div className="flex items-center space-x-4 text-xs text-gray-400 dark:text-gray-500">
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>ID: {role.id.slice(0, 8)}...</span>
              </div>
              {role.priority !== undefined && (
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>Priority: {role.priority}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {onClick && (
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-3 ${
            isSelected
              ? 'border-blue-500 bg-blue-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}>
            {isSelected && (
              <Check className="w-3 h-3 text-white" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleCard;
