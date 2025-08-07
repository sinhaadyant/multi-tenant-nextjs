"use client";

import React, { useState } from 'react';
import { X, Calendar, FileText, Download, AlertCircle } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGenerateReport, GenerateReportData } from '@/hooks/useReports';
import { useTenants } from '@/hooks/useTenantsAPI';

const generateReportSchema = z.object({
  reportType: z.enum(['user_activity', 'tenant_summary', 'login_history', 'audit_logs', 'system_health'], {
    required_error: 'Please select a report type'
  }),
  dateFrom: z.string().min(1, 'Start date is required'),
  dateTo: z.string().min(1, 'End date is required'),
  tenantId: z.string().optional(),
  format: z.enum(['csv', 'excel', 'pdf'], {
    required_error: 'Please select a format'
  })
}).refine((data) => {
  const fromDate = new Date(data.dateFrom);
  const toDate = new Date(data.dateTo);
  return fromDate <= toDate;
}, {
  message: 'End date must be after start date',
  path: ['dateTo']
}).refine((data) => {
  const fromDate = new Date(data.dateFrom);
  const toDate = new Date(data.dateTo);
  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 365; // Max 1 year range
}, {
  message: 'Date range cannot exceed 1 year',
  path: ['dateTo']
});

type GenerateReportFormData = z.infer<typeof generateReportSchema>;

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GenerateReportModal: React.FC<GenerateReportModalProps> = ({
  isOpen,
  onClose
}) => {
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue
  } = useForm<GenerateReportFormData>({
    resolver: zodResolver(generateReportSchema),
    defaultValues: {
      reportType: 'user_activity',
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      dateTo: new Date().toISOString().split('T')[0], // Today
      format: 'csv'
    },
    mode: 'onChange'
  });

  const { mutate: generateReport, isPending } = useGenerateReport();
  const { data: tenantsData } = useTenants();
  const tenants = tenantsData?.data?.tenants || [];

  const reportType = watch('reportType');

  const onSubmit = (data: GenerateReportFormData) => {
    const submitData: GenerateReportData = {
      ...data,
      dateFrom: new Date(data.dateFrom).toISOString(),
      dateTo: new Date(data.dateTo + 'T23:59:59.999Z').toISOString()
    };

    generateReport(submitData, {
      onSuccess: () => {
        reset();
        onClose();
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      reset();
      onClose();
    }
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

  const getFormatDescription = (format: string) => {
    const descriptions = {
      csv: 'Comma-separated values, suitable for Excel and data analysis',
      excel: 'Excel format with formatting and multiple sheets',
      pdf: 'Portable Document Format, suitable for printing and sharing'
    };
    return descriptions[format as keyof typeof descriptions] || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Generate New Report
                </h3>
              </div>
              <button
                onClick={handleClose}
                disabled={isPending}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Report Type *
              </label>
              <Controller
                name="reportType"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'user_activity', label: 'User Activity', icon: '👥' },
                      { value: 'tenant_summary', label: 'Tenant Summary', icon: '🏢' },
                      { value: 'login_history', label: 'Login History', icon: '🔐' },
                      { value: 'audit_logs', label: 'Audit Logs', icon: '📋' },
                      { value: 'system_health', label: 'System Health', icon: '💻' }
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          field.value === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          {...field}
                          value={option.value}
                          className="mr-3"
                        />
                        <div className="flex items-center">
                          <span className="text-xl mr-3">{option.icon}</span>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {option.label}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {getReportTypeDescription(option.value)}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              />
              {errors.reportType && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.reportType.message}
                </p>
              )}
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Date Range *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    From Date
                  </label>
                  <Controller
                    name="dateFrom"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          {...field}
                          type="date"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                  />
                  {errors.dateFrom && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.dateFrom.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    To Date
                  </label>
                  <Controller
                    name="dateTo"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          {...field}
                          type="date"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                  />
                  {errors.dateTo && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.dateTo.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tenant Selection (for specific reports) */}
            {reportType === 'user_activity' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tenant (Optional)
                </label>
                <Controller
                  name="tenantId"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowTenantDropdown(!showTenantDropdown)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-left text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {field.value ? 
                          tenants.find(t => t.id === field.value)?.name || 'Select tenant' :
                          'All tenants'
                        }
                      </button>
                      
                      {showTenantDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setValue('tenantId', '');
                              setShowTenantDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            All tenants
                          </button>
                          {tenants.map((tenant) => (
                            <button
                              key={tenant.id}
                              type="button"
                              onClick={() => {
                                setValue('tenantId', tenant.id);
                                setShowTenantDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              {tenant.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>
            )}

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Export Format *
              </label>
              <Controller
                name="format"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'csv', label: 'CSV', icon: '📊' },
                      { value: 'excel', label: 'Excel', icon: '📈' },
                      { value: 'pdf', label: 'PDF', icon: '📄' }
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          field.value === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          {...field}
                          value={option.value}
                          className="sr-only"
                        />
                        <span className="text-2xl mb-2">{option.icon}</span>
                        <div className="text-center">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {getFormatDescription(option.value)}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              />
              {errors.format && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.format.message}
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Report Generation
                  </h4>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    Reports are generated in the background and will be available for download once complete. 
                    You'll be notified when your report is ready.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isPending}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 