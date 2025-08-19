import React from 'react';
import { X, User, Building, Calendar, Globe, Monitor, AlertTriangle, CheckCircle, XCircle, FileText, Clock, MapPin } from 'lucide-react';
import { AuditLog } from '@/hooks/useAuditLogs';

interface AuditLogDetailsModalProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

const AuditLogDetailsModal: React.FC<AuditLogDetailsModalProps> = ({
  log,
  isOpen,
  onClose
}) => {
  if (!isOpen || !log) return null;

  const getSeverityIcon = (action: string) => {
    if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('suspend')) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('change')) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getSeverityColor = (action: string) => {
    if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('suspend')) {
      return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
    }
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('change')) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
    }
    return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
  };

  const formatUserAgent = (userAgent: string) => {
    // Simple user agent parsing
    const browser = userAgent.includes('Chrome') ? 'Chrome' :
                   userAgent.includes('Firefox') ? 'Firefox' :
                   userAgent.includes('Safari') ? 'Safari' :
                   userAgent.includes('Edge') ? 'Edge' : 'Unknown';
    
    const os = userAgent.includes('Windows') ? 'Windows' :
               userAgent.includes('Mac') ? 'macOS' :
               userAgent.includes('Linux') ? 'Linux' :
               userAgent.includes('Android') ? 'Android' :
               userAgent.includes('iOS') ? 'iOS' : 'Unknown';

    return { browser, os, full: userAgent };
  };

  const renderReadableDetails = (details: any) => {
    if (!details) return null;

    const { before, after } = details;
    
    if (!before && !after) return null;

    const renderObjectAsList = (obj: any, title: string, color: string) => {
      if (!obj || typeof obj !== 'object') return null;

      const entries = Object.entries(obj);
      if (entries.length === 0) return null;

      return (
        <div className={`bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-200 dark:border-${color}-800 rounded-lg p-4`}>
          <h5 className={`text-sm font-medium text-${color}-700 dark:text-${color}-300 mb-3 flex items-center`}>
            <FileText className="w-4 h-4 mr-2" />
            {title}
          </h5>
          <div className="space-y-2">
            {entries.map(([key, value]) => (
              <div key={key} className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </span>
                <span className="text-sm text-gray-900 dark:text-white ml-4 text-right max-w-xs break-words">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
          <FileText className="w-4 h-4 mr-2" />
          Changes Made
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderObjectAsList(before, 'Previous Values', 'red')}
          {renderObjectAsList(after, 'New Values', 'green')}
        </div>
      </div>
    );
  };

  const userAgentInfo = formatUserAgent(log.userAgent);
  const actor = log.superAdmin || log.user;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {getSeverityIcon(log.action)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Audit Log Details
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Summary */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(log.action)}`}>
                  {log.action}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ID: {log.id}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Actor Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Who Performed This Action
              </h4>
              
              {actor && (
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Name
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {actor.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Email Address
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {actor.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Role
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {log.superAdmin ? 'Super Administrator' : 'User'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Target Information */}
              {log.tenant && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    Target Tenant
                  </h4>
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Tenant Name
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          {log.tenant.name}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Tenant Identifier
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white font-mono">
                          {log.tenant.slug}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Technical Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                <Monitor className="w-4 h-4 mr-2" />
                Technical Information
              </h4>
              
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                      <Globe className="w-3 h-3 mr-1" />
                      IP Address
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white font-mono">
                      {log.ipAddress}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Browser & Operating System
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {userAgentInfo.browser} on {userAgentInfo.os}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Full User Agent
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                      {userAgentInfo.full}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Exact Timestamp
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(log.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        timeZoneName: 'short'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Readable Details */}
          {log.details && (
            <div className="mt-6">
              {renderReadableDetails(log.details)}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogDetailsModal; 