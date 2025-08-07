"use client";

import React from 'react';
import { X, Database, Calendar, Users, FileText, AlertCircle } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GenerateDummyDataParams } from '@/hooks/useDummyData';

const generateDummyDataSchema = z.object({
  dataRange: z.enum(['7', '30', '90']),
  userCount: z.number().min(1, 'At least 1 user is required').max(100, 'Maximum 100 users allowed'),
  tenantCount: z.number().min(0, 'Tenant count cannot be negative').max(10, 'Maximum 10 tenants allowed').optional(),
  includeSupportTickets: z.boolean()
});

type GenerateDummyDataFormData = z.infer<typeof generateDummyDataSchema>;

interface GenerateDummyDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GenerateDummyDataParams) => void;
  isLoading: boolean;
}

export const GenerateDummyDataModal: React.FC<GenerateDummyDataModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch
  } = useForm<GenerateDummyDataFormData>({
    resolver: zodResolver(generateDummyDataSchema),
    defaultValues: {
      dataRange: '30',
      userCount: 10,
      tenantCount: 0,
      includeSupportTickets: true
    },
    mode: 'onChange'
  });

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  const handleFormSubmit = (data: GenerateDummyDataFormData) => {
    onSubmit(data);
  };

  const getDataRangeDescription = (range: string) => {
    const descriptions = {
      '7': 'Last 7 days - Quick testing',
      '30': 'Last 30 days - Standard testing',
      '90': 'Last 90 days - Extended testing'
    };
    return descriptions[range as keyof typeof descriptions] || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Database className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Generate Dummy Data
                </h3>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="px-6 py-6 space-y-6">
            {/* Data Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Data Range *
              </label>
              <Controller
                name="dataRange"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: '7', label: '7 Days', icon: '📅' },
                      { value: '30', label: '30 Days', icon: '📆' },
                      { value: '90', label: '90 Days', icon: '🗓️' }
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
                            {getDataRangeDescription(option.value)}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              />
              {errors.dataRange && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.dataRange.message}
                </p>
              )}
            </div>

            {/* User Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Users *
              </label>
              <Controller
                name="userCount"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      {...field}
                      type="number"
                      min="1"
                      max="100"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter number of users"
                    />
                  </div>
                )}
              />
              {errors.userCount && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.userCount.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This will generate {watch('userCount') || 0} users with realistic profiles
              </p>
            </div>

            {/* Include Support Tickets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Include Support Tickets
              </label>
              <Controller
                name="includeSupportTickets"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Generate support tickets and comments
                      </span>
                    </label>
                  </div>
                )}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Creates realistic support tickets with comments and attachments
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    What will be generated?
                  </h4>
                  <ul className="mt-1 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• {watch('userCount') || 0} users with realistic profiles</li>
                    <li>• {(watch('userCount') || 0) * 5} audit log entries</li>
                    <li>• {Math.floor((watch('userCount') || 0) / 2)} notifications</li>
                    {watch('includeSupportTickets') && (
                      <li>• {Math.floor((watch('userCount') || 0) / 3)} support tickets with comments</li>
                    )}
                    <li>• All data will be timestamped within the selected range</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isLoading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Generate Data
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