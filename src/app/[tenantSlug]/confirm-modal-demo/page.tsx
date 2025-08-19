"use client";

import React from 'react';
import { ConfirmModalProvider } from '@/components/common/ConfirmModalProvider';
import ConfirmModalDemo from '@/components/common/ConfirmModalDemo';
import ConfirmModalExample from '@/components/common/ConfirmModalExample';

const ConfirmModalDemoPage: React.FC = () => {
  return (
    <ConfirmModalProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Confirmation Modal System
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              A comprehensive confirmation modal system with multiple variants and easy-to-use hooks.
            </p>
          </div>
          
          <ConfirmModalDemo />
          
          <div className="mt-12">
            <ConfirmModalExample />
          </div>
        </div>
      </div>
    </ConfirmModalProvider>
  );
};

export default ConfirmModalDemoPage; 