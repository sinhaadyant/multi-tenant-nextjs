'use client';

import React, { useEffect, useState } from 'react';
import { useGlobalNotifications } from '@/context/GlobalNotificationContext';
import { useReduxAuth } from '@/hooks/useReduxAuth';

export default function TestNotificationsPage() {
  const { unreadCount, isConnected, lastNotification, refreshNotifications } = useGlobalNotifications();
  const { user, tenant } = useReduxAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addTestResult('Page loaded');
    addTestResult(`User: ${user?.email || 'Not logged in'}`);
    addTestResult(`Tenant: ${tenant?.slug || 'No tenant'}`);
    addTestResult(`Global notifications connected: ${isConnected}`);
    addTestResult(`Unread count: ${unreadCount}`);
  }, [user, tenant, isConnected, unreadCount]);

  useEffect(() => {
    if (lastNotification) {
      addTestResult(`New notification received: ${lastNotification.title}`);
    }
  }, [lastNotification]);

  const handleManualRefresh = () => {
    addTestResult('Manual refresh triggered');
    refreshNotifications();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Global Notifications Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Panel */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>User Logged In:</span>
              <span className={user?.email ? 'text-green-600' : 'text-red-600'}>
                {user?.email ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tenant:</span>
              <span>{tenant?.slug || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span>Global Notifications:</span>
              <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Unread Count:</span>
              <span className="font-semibold">{unreadCount}</span>
            </div>
          </div>
        </div>

        {/* Actions Panel */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-3">
            <button
              onClick={handleManualRefresh}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Manual Refresh
            </button>
            <button
              onClick={() => {
                addTestResult('Console cleared');
                setTestResults([]);
              }}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Clear Log
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500">No test results yet...</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Keep this page open</li>
          <li>Open another browser tab and go to: <code className="bg-gray-200 px-2 py-1 rounded">http://localhost:3000/superadmin/login</code></li>
          <li>Login as: <code className="bg-gray-200 px-2 py-1 rounded">sinhaadyant74@gmail.com</code> / <code className="bg-gray-200 px-2 py-1 rounded">password123</code></li>
          <li>Go to: <code className="bg-gray-200 px-2 py-1 rounded">/superadmin/notifications</code></li>
          <li>Click "Send Sample to anil@cc.com" button</li>
          <li>Come back to this page and watch for updates</li>
          <li>You should see the unread count increase and new test results</li>
        </ol>
      </div>
    </div>
  );
}
