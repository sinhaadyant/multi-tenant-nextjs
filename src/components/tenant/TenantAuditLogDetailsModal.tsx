import React from 'react';
import { X, User, Calendar, MapPin, Monitor, Activity, Shield, Info } from 'lucide-react';
import { AuditLog } from '@/hooks/useTenantAuditLogs';

interface TenantAuditLogDetailsModalProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

const TenantAuditLogDetailsModal: React.FC<TenantAuditLogDetailsModalProps> = ({
  log,
  isOpen,
  onClose
}) => {
  if (!isOpen || !log) return null;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
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

  const getSeverityIcon = (action: string) => {
    if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('suspend')) {
      return '🔴';
    }
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('change')) {
      return '🟡';
    }
    return '🟢';
  };

  const formatUserAgent = (userAgent: string) => {
    if (!userAgent) return 'Unknown';
    
    // Simple browser detection
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Unknown Browser';
  };

  const formatDetails = (details: any) => {
    if (!details) return 'No additional details';
    
    if (typeof details === 'string') {
      return details;
    }
    
    if (typeof details === 'object') {
      return JSON.stringify(details, null, 2);
    }
    
    return String(details);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Audit Log Details
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Action Information */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Action Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Action
                </label>
                <div className="flex items-center mt-1">
                  <span className="mr-2">{getSeverityIcon(log.action)}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(log.action)}`}>
                    {log.action}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Timestamp
                </label>
                <div className="flex items-center mt-1 text-gray-900 dark:text-white">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {formatTimestamp(log.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              User Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  User Name
                </label>
                <p className="text-gray-900 dark:text-white mt-1">
                  {log.user?.name || log.superAdmin?.name || 'Unknown User'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <p className="text-gray-900 dark:text-white mt-1">
                  {log.user?.email || log.superAdmin?.email || 'No email'}
                </p>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Technical Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  IP Address
                </label>
                <div className="flex items-center mt-1">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  <code className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-sm">
                    {log.ipAddress || 'N/A'}
                  </code>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Browser
                </label>
                <p className="text-gray-900 dark:text-white mt-1">
                  {formatUserAgent(log.userAgent)}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Additional Details
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Details
              </label>
              <pre className="bg-gray-100 dark:bg-gray-600 p-3 rounded text-sm text-gray-900 dark:text-white overflow-x-auto">
                {formatDetails(log.details)}
              </pre>
            </div>
          </div>

          {/* User Agent Details */}
          {log.userAgent && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                User Agent Details
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full User Agent String
                </label>
                <pre className="bg-gray-100 dark:bg-gray-600 p-3 rounded text-xs text-gray-900 dark:text-white overflow-x-auto">
                  {log.userAgent}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantAuditLogDetailsModal;
