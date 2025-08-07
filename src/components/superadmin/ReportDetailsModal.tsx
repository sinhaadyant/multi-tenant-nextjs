"use client";

import React from 'react';
import { X, Download, FileText, Calendar, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useDownloadReport } from '@/hooks/useReports';
import { Report } from '@/hooks/useReports';

interface ReportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
}

export const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({
  isOpen,
  onClose,
  report
}) => {
  const { mutate: downloadReport, isPending: isDownloading } = useDownloadReport();

  const handleDownload = () => {
    if (report && report.status === 'ready') {
      downloadReport(report.id);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      generating: {
        icon: Clock,
        className: 'text-yellow-600 dark:text-yellow-400',
        label: 'Generating',
        description: 'Report is being generated in the background'
      },
      ready: {
        icon: CheckCircle,
        className: 'text-green-600 dark:text-green-400',
        label: 'Ready',
        description: 'Report is ready for download'
      },
      failed: {
        icon: XCircle,
        className: 'text-red-600 dark:text-red-400',
        label: 'Failed',
        description: 'Report generation failed'
      }
    };
    return configs[status as keyof typeof configs];
  };

  const getReportTypeLabel = (type: string) => {
    const typeLabels = {
      user_activity: 'User Activity',
      tenant_summary: 'Tenant Summary',
      login_history: 'Login History',
      audit_logs: 'Audit Logs',
      system_health: 'System Health'
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  const getReportTypeDescription = (type: string) => {
    const descriptions = {
      user_activity: 'Detailed user activity logs including logins, actions, and session data',
      tenant_summary: 'Comprehensive summary of tenant usage, users, and performance metrics',
      login_history: 'Complete login history with IP addresses, user agents, and success/failure status',
      audit_logs: 'System audit logs including all administrative actions and security events',
      system_health: 'Platform health metrics including performance, errors, and system status'
    };
    return descriptions[type as keyof typeof descriptions] || '';
  };

  if (!isOpen || !report) return null;

  const statusConfig = getStatusConfig(report.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Report Details
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Report Header */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getReportTypeLabel(report.reportType)}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {getReportTypeDescription(report.reportType)}
                  </p>
                </div>
                <div className="flex items-center">
                  <StatusIcon className={`w-5 h-5 ${statusConfig.className} mr-2`} />
                  <span className={`text-sm font-medium ${statusConfig.className}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Report Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">Report Information</h5>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Date Range</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {format(new Date(report.dateFrom), 'MMM dd, yyyy')} - {format(new Date(report.dateTo), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Format</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white uppercase">
                        {report.format}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Generated By</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {report.generatedBy.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {report.generatedBy.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-4">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">Timestamps</h5>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {format(new Date(report.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {format(new Date(report.updatedAt), 'MMM dd, yyyy HH:mm:ss')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">File Name</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                      {report.fileName}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Applied */}
            {report.filters && Object.keys(report.filters).length > 0 && (
              <div className="space-y-4">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">Filters Applied</h5>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
                    {JSON.stringify(report.filters, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Status Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {statusConfig.label}
                  </h4>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    {statusConfig.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
              
              {report.status === 'ready' && (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </>
                  )}
                </button>
              )}

              {report.status === 'failed' && (
                <button
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Regenerate Report
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 