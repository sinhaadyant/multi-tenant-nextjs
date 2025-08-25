"use client";

import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Users, 
  Activity, 
  Shield, 
  TrendingUp,
  Calendar,
  Download,
  AlertCircle
} from 'lucide-react';
import { useGenerateTenantReport, GenerateTenantReportData } from '@/hooks/useTenantReports';
import { toast } from 'react-hot-toast';

interface TenantGenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
}

const TenantGenerateReportModal: React.FC<TenantGenerateReportModalProps> = ({
  isOpen,
  onClose,
  tenantSlug
}) => {
  const [formData, setFormData] = useState<GenerateTenantReportData>({
    reportType: '',
    name: '',
    dateFrom: '',
    dateTo: '',
    format: 'csv'
  });

  const generateReportMutation = useGenerateTenantReport(tenantSlug);

  const reportTypeOptions = [
    {
      value: 'user_activity',
      label: 'User Activity',
      icon: Users,
      description: 'Track user actions, login patterns, and activity within your organization',
      details: 'Includes user login history, page visits, actions performed, and session data'
    },
    {
      value: 'role_summary',
      label: 'Role Summary',
      icon: Shield,
      description: 'Comprehensive overview of role assignments and permissions',
      details: 'Shows role distribution, permission assignments, and access patterns'
    },
    {
      value: 'login_history',
      label: 'Login History',
      icon: Activity,
      description: 'Detailed login and authentication activity',
      details: 'Includes login attempts, successful/failed logins, IP addresses, and device info'
    },
    {
      value: 'audit_logs',
      label: 'Audit Logs',
      icon: FileText,
      description: 'Complete audit trail of system changes and user actions',
      details: 'Tracks all system modifications, data changes, and administrative actions'
    },
    {
      value: 'system_health',
      label: 'System Health',
      icon: TrendingUp,
      description: 'System performance and health metrics',
      details: 'Includes response times, error rates, resource usage, and system status'
    }
  ];

  const formatOptions = [
    { value: 'csv', label: 'CSV', description: 'Comma-separated values, good for data analysis' },
    { value: 'excel', label: 'Excel', description: 'Microsoft Excel format with formatting' },
    { value: 'pdf', label: 'PDF', description: 'Portable Document Format, good for sharing' }
  ];

  const handleInputChange = (field: keyof GenerateTenantReportData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reportType || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.dateFrom && formData.dateTo && new Date(formData.dateFrom) > new Date(formData.dateTo)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    try {
      await generateReportMutation.mutateAsync(formData);
      onClose();
      setFormData({
        reportType: '',
        name: '',
        dateFrom: '',
        dateTo: '',
        format: 'csv'
      });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const selectedReportType = reportTypeOptions.find(option => option.value === formData.reportType);

  if (!isOpen) return null;

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
                Generate New Report
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Report Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Report Type *
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {reportTypeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = formData.reportType === option.value;
                    
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange('reportType', option.value)}
                        className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className={`w-5 h-5 ${
                            isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                          }`}>
                            {option.label}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {option.description}
                        </p>
                        <p className={`text-xs mt-1 ${
                          isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {option.details}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Report Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('forms:placeholders.enterDescriptiveName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.dateFrom}
                      onChange={(e) => handleInputChange('dateFrom', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.dateTo}
                      onChange={(e) => handleInputChange('dateTo', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Export Format
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {formatOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('format', option.value)}
                      className={`p-3 rounded-lg border transition-all duration-200 text-center ${
                        formData.format === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <Download className={`w-5 h-5 mx-auto mb-2 ${
                        formData.format === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                      }`} />
                      <div className={`font-medium ${
                        formData.format === option.value ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                      }`}>
                        {option.label}
                      </div>
                      <p className={`text-xs mt-1 ${
                        formData.format === option.value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Report Type Details */}
              {selectedReportType && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        {selectedReportType.label} Report Details
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {selectedReportType.details}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={generateReportMutation.isPending}
              className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generateReportMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantGenerateReportModal;
