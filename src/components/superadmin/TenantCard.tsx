"use client";

import React from 'react';
import { 
  Eye, 
  Edit, 
  MoreHorizontal, 
  CheckCircle, 
  Clock, 
  XCircle,
  Users,
  Calendar,
  Building2,
  ExternalLink
} from 'lucide-react';
import { Tenant } from '@/hooks/useTenantsAPI';

interface TenantCardProps {
  tenant: Tenant;
  isSelected?: boolean;
  onSelect?: (tenantId: string) => void;
  onView?: (tenant: Tenant) => void;
  onEdit?: (tenant: Tenant) => void;
  onImpersonate?: (tenant: Tenant) => void;
  onSuspend?: (tenant: Tenant) => void;
  onReactivate?: (tenant: Tenant) => void;
  searchTerm?: string;
}

const TenantCard: React.FC<TenantCardProps> = ({
  tenant,
  isSelected = false,
  onSelect,
  onView,
  onEdit,
  onImpersonate,
  onSuspend,
  onReactivate,
  searchTerm = ''
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          label: 'Active'
        };
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4" />,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          label: 'Pending'
        };
      case 'suspended':
        return {
          icon: <XCircle className="w-4 h-4" />,
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
          label: 'Suspended'
        };
      default:
        return {
          icon: <MoreHorizontal className="w-4 h-4" />,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
          label: 'Unknown'
        };
    }
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const statusConfig = getStatusConfig(tenant.status);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
      isSelected 
        ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(tenant.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {highlightText(tenant.name, searchTerm)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {highlightText(tenant.slug, searchTerm)}
                {tenant.domain && (
                  <span className="ml-2 text-gray-500">
                    • {tenant.domain}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}>
              {statusConfig.icon}
              <span className="ml-1">{statusConfig.label}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Owner Info - Show tenant info instead since owner data is not available */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
              {tenant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {highlightText(tenant.name, searchTerm)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {tenant.domain || tenant.slug}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {tenant.userCount}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Total Users
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {tenant.plan}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Plan
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Created {formatDate(tenant.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Building2 className="w-4 h-4" />
            <span>{tenant.region}</span>
          </div>
        </div>

        {/* Features */}
        {tenant.features.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Features
            </p>
            <div className="flex flex-wrap gap-1">
              {tenant.features.slice(0, 3).map((feature) => (
                <span
                  key={feature}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded dark:bg-gray-700 dark:text-gray-300"
                >
                  {feature}
                </span>
              ))}
              {tenant.features.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded dark:bg-gray-700 dark:text-gray-300">
                  +{tenant.features.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {tenant.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {tenant.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onView?.(tenant)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            <button
              onClick={() => onImpersonate?.(tenant)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
            >
              <ExternalLink className="w-4 h-4" />
              Impersonate
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit?.(tenant)}
              className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            {tenant.status === 'active' ? (
              <button
                onClick={() => onSuspend?.(tenant)}
                className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                title="Suspend"
              >
                <XCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onReactivate?.(tenant)}
                className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                title="Reactivate"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantCard; 