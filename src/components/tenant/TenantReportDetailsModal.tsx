"use client";

import React from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { TenantReport } from '@/hooks/useTenantReports';
import { useDownloadTenantReport } from '@/hooks/useTenantReports';

interface TenantReportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: TenantReport | null;
  tenantSlug: string;
}

const TenantReportDetailsModal: React.FC<TenantReportDetailsModalProps> = ({
  isOpen,
  onClose,
  report,
  tenantSlug
}) => {
  const downloadReportMutation = useDownloadTenantReport(tenantSlug);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      generating: {
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        label: 'Generating'
      },
      ready: {
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        label: 'Ready'
      },
      failed: {
        icon: XCircle,
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        label: 'Failed'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.generating;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getReportTypeLabel = (type: string) => {
    const typeLabels = {
      user_activity: 'User Activity',
      role_summary: 'Role Summary',
      login_history: 'Login History',
      audit_logs: 'Audit Logs',
      system_health: 'System Health'
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  const getReportFormat = (report: TenantReport) => {
    try {
      const data = JSON.parse(report.data);
      return data.format || 'Unknown';
    } catch {
      return 'Unknown';
    }
  };

  const handleDownload = async () => {
    if (report) {
      try {
        await downloadReportMutation.mutateAsync(report.id);
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Report Details
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Report Header */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {report.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getReportTypeLabel(report.type)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(report.status || 'generating')}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Format:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {getReportFormat(report)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Created:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {format(new Date(report.createdAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Report Information */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Report Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Generated By
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {report.user?.name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {report.user?.email || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Last Updated
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(report.updatedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Data Preview */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Report Data
                </h4>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Data Preview
                    </span>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded border p-3 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {(() => {
                        try {
                          const data = JSON.parse(report.data);
                          return JSON.stringify(data, null, 2);
                        } catch {
                          return report.data || 'No data available';
                        }
                      })()}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Report Type Description */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      {getReportTypeLabel(report.type)} Report
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {(() => {
                        const descriptions = {
                          user_activity: 'This report contains detailed information about user activities, including login patterns, page visits, and actions performed within the system.',
                          role_summary: 'This report provides a comprehensive overview of role assignments, permissions, and access patterns across your organization.',
                          login_history: 'This report tracks all login attempts, successful and failed authentications, IP addresses, and device information.',
                          audit_logs: 'This report contains a complete audit trail of system changes, data modifications, and administrative actions.',
                          system_health: 'This report includes system performance metrics, response times, error rates, and overall system status.'
                        };
                        return descriptions[report.type as keyof typeof descriptions] || 'Report contains relevant data for analysis and monitoring.';
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleDownload}
              disabled={downloadReportMutation.isPending || report.status !== 'ready'}
              className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadReportMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantReportDetailsModal;
