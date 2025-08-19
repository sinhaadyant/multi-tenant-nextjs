"use client";

import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, Database, Users, Building2, Clock } from 'lucide-react';
import { useImportData } from '@/hooks/useBackupData';

export default function ImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importOptions, setImportOptions] = useState({
    importTenants: true,
    importUsers: true,
    importNotifications: false,
    importSupportTickets: false,
    importSystemSettings: false,
    skipDuplicates: true,
    validateData: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: importData, isLoading, error } = useImportData();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/sql' && !file.name.endsWith('.sql')) {
        alert('Please select a valid SQL file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      alert('Please select a file to import');
      return;
    }
    importData({ file: selectedFile, options: importOptions });
  };

  const handleOptionChange = (option: string) => {
    setImportOptions(prev => ({
      ...prev,
      [option]: !prev[option as keyof typeof prev]
    }));
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.type !== 'application/sql' && !file.name.endsWith('.sql')) {
        alert('Please select a valid SQL file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Import Data
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Import data from backup files or external sources
          </p>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Upload className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upload File
          </h2>
        </div>

        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <FileText className="h-12 w-12 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {selectedFile.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-sm text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Drop your SQL file here
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  or click to browse
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse Files
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".sql"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Import Warning
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>• Importing data may overwrite existing records</p>
                <p>• Make sure to backup your current data first</p>
                <p>• Only import files from trusted sources</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Database className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Import Configuration
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tenants Data
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={importOptions.importTenants}
                  onChange={() => handleOptionChange('importTenants')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Users Data
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={importOptions.importUsers}
                  onChange={() => handleOptionChange('importUsers')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Support Tickets
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={importOptions.importSupportTickets}
                  onChange={() => handleOptionChange('importSupportTickets')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  System Settings
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={importOptions.importSystemSettings}
                  onChange={() => handleOptionChange('importSystemSettings')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Skip Duplicates
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={importOptions.skipDuplicates}
                  onChange={() => handleOptionChange('skipDuplicates')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Validate Data
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={importOptions.validateData}
                  onChange={() => handleOptionChange('validateData')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Import Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Upload className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Start Import
            </h2>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Database className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Import Information
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <p>• Only SQL files are supported</p>
                    <p>• Import will be processed in background</p>
                    <p>• You'll receive a notification when complete</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleImport}
              disabled={isLoading || !selectedFile}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing Data...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Start Import
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Import Failed
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      {error instanceof Error ? error.message : 'An unexpected error occurred'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 