"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

const ApiDebugger: React.FC = () => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [testResults, setTestResults] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    const results: any = {};

    try {
      // Test 1: Basic API
      console.log('🧪 Testing basic API...');
      const basicResponse = await fetch('/api/test');
      results.basic = {
        success: basicResponse.ok,
        status: basicResponse.status,
        data: await basicResponse.json()
      };

      // Test 2: Database API
      console.log('🧪 Testing database API...');
      const dbResponse = await fetch('/api/test/db');
      results.database = {
        success: dbResponse.ok,
        status: dbResponse.status,
        data: await dbResponse.json()
      };

      // Test 3: Dashboard API
      console.log('🧪 Testing dashboard API...');
      const dashboardResponse = await fetch('/api/test/dashboard');
      results.dashboard = {
        success: dashboardResponse.ok,
        status: dashboardResponse.status,
        data: await dashboardResponse.json()
      };

      // Test 4: Tenant Dashboard API
      console.log('🧪 Testing tenant dashboard API...');
      const tenantDashboardResponse = await fetch(`/api/test/tenant-dashboard?tenantSlug=${tenantSlug}`);
      results.tenantDashboard = {
        success: tenantDashboardResponse.ok,
        status: tenantDashboardResponse.status,
        data: await tenantDashboardResponse.json()
      };

      // Test 5: Check authentication tokens
      console.log('🧪 Checking authentication tokens...');
      const tokens = {
        tenant_auth_token: localStorage.getItem('tenant_auth_token'),
        auth_token: localStorage.getItem('auth_token'),
        access_token: sessionStorage.getItem('access_token'),
        refresh_token: localStorage.getItem('refresh_token')
      };
      results.tokens = tokens;

      // Test 6: Try actual tenant dashboard API with auth
      console.log('🧪 Testing actual tenant dashboard API...');
      const authToken = tokens.tenant_auth_token || tokens.auth_token || tokens.access_token;
      if (authToken) {
        try {
          const actualResponse = await fetch(`/api/tenant/${tenantSlug}/dashboard/stats`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });
          results.actualDashboard = {
            success: actualResponse.ok,
            status: actualResponse.status,
            data: await actualResponse.json()
          };
        } catch (error: any) {
          results.actualDashboard = {
            success: false,
            error: error.message
          };
        }
      } else {
        results.actualDashboard = {
          success: false,
          error: 'No auth token found'
        };
      }

      setTestResults(results);
      toast.success('API tests completed!');
      
    } catch (error: any) {
      console.error('❌ API test error:', error);
      toast.error('API tests failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        API Debugger
      </h3>
      
      <button
        onClick={runTests}
        disabled={isLoading}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Running Tests...' : 'Run API Tests'}
      </button>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          {Object.entries(testResults).map(([testName, result]: [string, any]) => (
            <div key={testName} className="border rounded p-3">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {testName.charAt(0).toUpperCase() + testName.slice(1)} Test
              </h4>
              <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiDebugger;
