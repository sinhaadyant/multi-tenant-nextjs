import React from 'react';
import { X, User, Building, Calendar, Globe, Monitor, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
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
      return 'text-red-600 bg-red-50 border-red-200';
    }
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('change')) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
    return 'text-green-600 bg-green-50 border-green-200';
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

  const renderJsonDiff = (details: any) => {
    if (!details) return null;

    const { before, after } = details;
    
    if (!before && !after) return null;

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Changes
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {before && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <h5 className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">
                Before
              </h5>
              <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40">
                {JSON.stringify(before, null, 2)}
              </pre>
            </div>
          )}
          {after && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <h5 className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">
                After
              </h5>
              <pre className="text-xs text-green-600 dark:text-green-400 overflow-auto max-h-40">
                {JSON.stringify(after, null, 2)}
              </pre>
            </div>
          )}
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
                <p className="text-sm text-gray-500 dark:text-gray-400">
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
              <div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(log.action)}`}>
                  {log.action}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                ID: {log.id}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Actor Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Actor Information
              </h4>
              
              {actor && (
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Name
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {actor.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Email
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
                        {log.superAdmin ? 'Super Admin' : 'User'}
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
                          Name
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {log.tenant.name}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Slug
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">
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
                Technical Details
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
                      Browser
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {userAgentInfo.browser} on {userAgentInfo.os}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      User Agent
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                      {userAgentInfo.full}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Timestamp
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* JSON Diff */}
          {log.details && (
            <div className="mt-6">
              {renderJsonDiff(log.details)}
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