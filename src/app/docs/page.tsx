'use client';

import dynamic from 'next/dynamic';

// Dynamically import SwaggerUI component to avoid SSR issues
const SwaggerUIComponent = dynamic(() => import('@/components/SwaggerUI'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading API documentation...</p>
      </div>
    </div>
  )
});

export default function APIDocumentationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            API Documentation
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Complete API documentation for the Multi-Tenant Next.js application. 
            This documentation covers all endpoints for SuperAdmin and Tenant management, 
            including authentication, user management, audit logs, and more.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <SwaggerUIComponent />
        </div>
      </div>
    </div>
  );
} 