"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import InsertSampleDataForm from '@/components/superadmin/InsertSampleDataForm';

export default function InsertSampleDataPage() {
  const handleSuccess = () => {
    // Optionally redirect or show additional success message
    console.log('Sample data inserted successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/superadmin/data-management"
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Insert Sample Data
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Generate sample tenants and users for testing and development purposes
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <InsertSampleDataForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
