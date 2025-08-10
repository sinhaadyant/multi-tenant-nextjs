'use client';

import React, { useEffect, useState } from 'react';
import { useSuperadminDashboard } from '@/hooks/useSuperadminDashboard';

export default function DashboardTest() {
  const { data, isLoading, error } = useSuperadminDashboard();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Debug info
    setDebugInfo({
      hasData: !!data,
      isLoading,
      hasError: !!error,
      errorMessage: error?.message,
      dataKeys: data ? Object.keys(data) : [],
      summary: data?.summary,
      charts: data?.charts ? {
        userSignups: data.charts.userSignups?.length || 0,
        tenantActivity: data.charts.tenantActivity?.length || 0,
        roleDistribution: data.charts.roleDistribution?.length || 0,
        planDistribution: data.charts.tenantPlanDistribution?.length || 0,
      } : null,
      recentActivity: data?.recentActivity?.auditLogs?.length || 0,
      topTenants: data?.topTenants?.length || 0,
    });
  }, [data, isLoading, error]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Test Page</h1>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {isLoading && (
        <div className="bg-blue-100 p-4 rounded-lg">
          <p className="text-blue-800">Loading dashboard data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 p-4 rounded-lg">
          <p className="text-red-800">Error: {error.message}</p>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="bg-green-100 p-4 rounded-lg">
            <p className="text-green-800">✅ Dashboard data loaded successfully!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold">Summary</h3>
              <p>Total Tenants: {data.summary?.totalTenants}</p>
              <p>Active Tenants: {data.summary?.activeTenants}</p>
              <p>Total Users: {data.summary?.totalUsers}</p>
              <p>SuperAdmins: {data.summary?.totalSuperAdmins}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold">Charts Data</h3>
              <p>User Signups: {data.charts?.userSignups?.length || 0} points</p>
              <p>Tenant Activity: {data.charts?.tenantActivity?.length || 0} points</p>
              <p>Role Distribution: {data.charts?.roleDistribution?.length || 0} roles</p>
              <p>Plan Distribution: {data.charts?.tenantPlanDistribution?.length || 0} plans</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold">Recent Activity</h3>
              <p>Audit Logs: {data.recentActivity?.auditLogs?.length || 0}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold">Top Tenants</h3>
              <p>Count: {data.topTenants?.length || 0}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">Sample Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Recent Activity Sample</h4>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(data.recentActivity?.auditLogs?.slice(0, 2), null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium">Top Tenants Sample</h4>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(data.topTenants?.slice(0, 2), null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 