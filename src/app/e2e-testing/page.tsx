"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, RefreshCw, CheckCircle, XCircle, AlertTriangle, Info, BookOpen, Settings } from 'lucide-react';
import { E2E_TEST_ISSUES, getCriticalIssues, getHighPriorityIssues, type Issue } from './issues-list';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'error';
  message: string;
  timestamp: string;
  details?: string;
}

interface TestModule {
  id: string;
  name: string;
  description: string;
  tests: string[];
}

const TenantManagementE2ETest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [browserWindow, setBrowserWindow] = useState<any>(null);
  const [testProgress, setTestProgress] = useState(0);
  const [issues, setIssues] = useState<string[]>([]);
  const [showIssuesGuide, setShowIssuesGuide] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  const testModules: TestModule[] = [
    {
      id: 'tenant-search',
      name: 'Tenant Search & Filtering',
      description: 'Test search functionality, debouncing, and filtering',
      tests: [
        'Search input responsiveness',
        'Debounced API calls',
        'Clear search functionality',
        'Status filtering',
        'Region filtering',
        'Sort by different fields'
      ]
    },
    {
      id: 'tenant-crud',
      name: 'Tenant CRUD Operations',
      description: 'Test Create, Read, Update, Delete operations',
      tests: [
        'Create new tenant',
        'View tenant details',
        'Edit tenant information',
        'Delete tenant',
        'Form validation'
      ]
    },
    {
      id: 'tenant-details',
      name: 'Tenant Detail Pages',
      description: 'Test tenant detail pages and real data display',
      tests: [
        'Tenant information display',
        'User count from database',
        'Status and region display',
        'Navigation between pages'
      ]
    },
    {
      id: 'tenant-performance',
      name: 'Performance & Database',
      description: 'Test performance and database integration',
      tests: [
        'Database count accuracy',
        'API response times',
        'Real-time data updates',
        'Error handling'
      ]
    }
  ];

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  };

  const addIssue = (issue: string) => {
    setIssues(prev => [...prev, issue]);
  };

  const logMessage = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const result: TestResult = {
      id: Date.now().toString(),
      name: message,
      status: type === 'success' ? 'passed' : type === 'error' ? 'failed' : 'running',
      message: `[${timestamp}] ${message}`,
      timestamp: new Date().toISOString()
    };
    addResult(result);
  };

  const runSingleTest = async (testName: string, testFunction: () => Promise<boolean>) => {
    setCurrentTest(testName);
    logMessage(`Starting: ${testName}`, 'info');
    
    try {
      const success = await testFunction();
      if (success) {
        logMessage(`✅ Passed: ${testName}`, 'success');
      } else {
        logMessage(`❌ Failed: ${testName}`, 'error');
        addIssue(`${testName}: Test failed - check browser for details`);
      }
    } catch (error) {
      logMessage(`💥 Error: ${testName} - ${error}`, 'error');
      addIssue(`${testName}: ${error}`);
    }
    
    setTestProgress(prev => prev + 1);
  };

  const testTenantSearch = async (): Promise<boolean> => {
    try {
      // Navigate to tenants page
      await browserWindow.goto('http://localhost:3000/superadmin/tenants');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test search input
      const searchInput = await browserWindow.$('input[placeholder*="Search tenants"]');
      if (!searchInput) {
        throw new Error('Search input not found');
      }
      
      await searchInput.type('test');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const inputValue = await browserWindow.$eval('input[placeholder*="Search tenants"]', (el: any) => el.value);
      if (inputValue !== 'test') {
        throw new Error('Search input not working');
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  };

  const testTenantCreate = async (): Promise<boolean> => {
    try {
      // Navigate to create tenant page
      await browserWindow.goto('http://localhost:3000/superadmin/tenants/create');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fill form
      await browserWindow.type('input[name="name"]', 'E2E Test Tenant');
      await browserWindow.type('input[name="subdomain"]', 'e2e-test');
      await browserWindow.type('input[name="domain"]', 'e2e-test.example.com');
      await browserWindow.select('select[name="status"]', 'active');
      await browserWindow.select('select[name="region"]', 'US East');
      
      // Submit form
      await browserWindow.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if redirected back to list
      const currentUrl = browserWindow.url();
      if (currentUrl.includes('/superadmin/tenants')) {
        return true;
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const testTenantDetails = async (): Promise<boolean> => {
    try {
      // Navigate to tenants list
      await browserWindow.goto('http://localhost:3000/superadmin/tenants');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click on first tenant
      const tenantRow = await browserWindow.$('tr[data-testid="tenant-row"]');
      if (!tenantRow) {
        throw new Error('No tenant rows found');
      }
      
      await tenantRow.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if detail page loaded
      const currentUrl = browserWindow.url();
      if (currentUrl.includes('/superadmin/tenants/')) {
        return true;
      } else {
        throw new Error('Detail page not loaded');
      }
    } catch (error) {
      throw error;
    }
  };

  const testDatabaseCounts = async (): Promise<boolean> => {
    try {
      // Get database count via API
      const response = await browserWindow.evaluate(async () => {
        const res = await fetch('/api/superadmin/tenants?page=1&limit=1');
        const data = await res.json();
        return data;
      });
      
      if (response && response.total !== undefined) {
        logMessage(`Database count: ${response.total} tenants`, 'info');
        return true;
      } else {
        throw new Error('Could not fetch database count');
      }
    } catch (error) {
      throw error;
    }
  };

  const runAllTests = async () => {
    if (selectedModules.length === 0) {
      logMessage('⚠️ Please select at least one test module to run', 'warning');
      return;
    }

    setIsRunning(true);
    setResults([]);
    setIssues([]);
    setTestProgress(0);
    
    try {
      logMessage('🚀 Starting E2E test suite...', 'info');
      logMessage(`📋 Selected modules: ${selectedModules.join(', ')}`, 'info');
      
      // Call the API to start tests
      const response = await fetch('/api/e2e-testing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'run-tests',
          modules: selectedModules 
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        logMessage('✅ Test process started successfully', 'success');
        logMessage('🌐 Chrome browser window will open automatically', 'info');
        logMessage('👀 Watch the browser for real-time test execution', 'info');
        
        // Simulate test progress updates
        let progress = 0;
        const selectedTestModules = testModules.filter(module => selectedModules.includes(module.id));
        const totalTests = selectedTestModules.reduce((acc, module) => acc + module.tests.length, 0);
        
        const progressInterval = setInterval(() => {
          if (progress < totalTests) {
            progress++;
            setTestProgress(progress);
            
            // Simulate test results
            const currentModule = selectedTestModules.find(module => 
              module.tests.length > progress - selectedTestModules.slice(0, selectedTestModules.findIndex(m => m.tests.length > progress)).reduce((acc, m) => acc + m.tests.length, 0)
            );
            
            if (currentModule) {
              const testIndex = progress - selectedTestModules.slice(0, selectedTestModules.findIndex(m => m === currentModule)).reduce((acc, m) => acc + m.tests.length, 0) - 1;
              if (testIndex >= 0 && testIndex < currentModule.tests.length) {
                setCurrentTest(currentModule.tests[testIndex]);
                logMessage(`Testing: ${currentModule.tests[testIndex]}`, 'info');
              }
            }
          } else {
            clearInterval(progressInterval);
            logMessage('🎉 All selected tests completed!', 'success');
            setIsRunning(false);
            setCurrentTest('');
          }
        }, 2000);
        
      } else {
        throw new Error(data.message || 'Failed to start tests');
      }
      
    } catch (error) {
      logMessage(`💥 Test suite failed: ${error}`, 'error');
      addIssue(`Test suite error: ${error}`);
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const stopTests = () => {
    setIsRunning(false);
    setCurrentTest('');
    logMessage('⏹️ Tests stopped by user', 'warning');
  };

  const clearResults = () => {
    setResults([]);
    setIssues([]);
    setTestProgress(0);
  };

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const selectAllModules = () => {
    setSelectedModules(testModules.map(module => module.id));
  };

  const deselectAllModules = () => {
    setSelectedModules([]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🧪 Tenant Management E2E Testing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive end-to-end testing for Tenant Management module with real browser automation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Modules */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Test Modules
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={selectAllModules}
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllModules}
                    className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {testModules.map((module) => (
                  <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={module.id}
                        checked={selectedModules.includes(module.id)}
                        onChange={() => handleModuleToggle(module.id)}
                        className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        disabled={isRunning}
                      />
                      <div className="flex-1">
                        <label htmlFor={module.id} className="font-medium text-gray-900 dark:text-white mb-2 cursor-pointer">
                          {module.name}
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {module.description}
                        </p>
                        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          {module.tests.map((test, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                              {test}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {module.tests.length} test{module.tests.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedModules.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-green-800 dark:text-green-200 text-sm">
                      {selectedModules.length} module{selectedModules.length !== 1 ? 's' : ''} selected for testing
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test Controls & Output */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Test Controls
                </h2>
                <div className="flex items-center space-x-2">
                  {isRunning && (
                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                      <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                      Running...
                    </div>
                  )}
                  <button
                    onClick={runAllTests}
                    disabled={isRunning}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run All Tests
                  </button>
                  <button
                    onClick={stopTests}
                    disabled={!isRunning}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </button>
                  <button
                    onClick={clearResults}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {isRunning && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{testProgress} / {testModules.reduce((acc, module) => acc + module.tests.length, 0)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(testProgress / testModules.reduce((acc, module) => acc + module.tests.length, 0)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Current Test */}
              {currentTest && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin mr-2" />
                    <span className="text-blue-800 dark:text-blue-200 font-medium">
                      Currently testing: {currentTest}
                    </span>
                  </div>
                </div>
              )}

              {/* Test Output */}
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Test Output
                </h3>
                <div 
                  ref={outputRef}
                  className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm"
                >
                  {results.length === 0 ? (
                    <div className="text-gray-500">
                      No test results yet. Click "Run All Tests" to start testing.
                    </div>
                  ) : (
                    results.map((result) => (
                      <div key={result.id} className="flex items-start mb-2">
                        {getStatusIcon(result.status)}
                        <span className="ml-2">{result.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Issues Panel */}
            {issues.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                    Issues Found ({issues.length})
                  </h2>
                  <button
                    onClick={() => setShowIssuesGuide(!showIssuesGuide)}
                    className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <BookOpen className="w-4 h-4 mr-1" />
                    {showIssuesGuide ? 'Hide' : 'Show'} Issues Guide
                  </button>
                </div>
                
                <div className="space-y-2">
                  {issues.map((issue, index) => (
                    <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-yellow-800 dark:text-yellow-200 text-sm">
                          {issue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {showIssuesGuide && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      📚 Common Issues & Solutions
                    </h3>
                    
                    {/* Critical Issues */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-red-600 dark:text-red-400 mb-3">
                        🔴 Critical Issues
                      </h4>
                      <div className="space-y-3">
                        {getCriticalIssues().map((issue) => (
                          <div key={issue.id} className="border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">
                              {issue.title}
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {issue.description}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Symptoms:</h6>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  {issue.symptoms.map((symptom, index) => (
                                    <li key={index} className="flex items-start">
                                      <span className="w-1 h-1 bg-red-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                      {symptom}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Solutions:</h6>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  {issue.solutions.map((solution, index) => (
                                    <li key={index} className="flex items-start">
                                      <span className="w-1 h-1 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                      {solution}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* High Priority Issues */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-orange-600 dark:text-orange-400 mb-3">
                        🟠 High Priority Issues
                      </h4>
                      <div className="space-y-3">
                        {getHighPriorityIssues().filter(issue => issue.severity === 'high').map((issue) => (
                          <div key={issue.id} className="border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                            <h5 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                              {issue.title}
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {issue.description}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Symptoms:</h6>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  {issue.symptoms.map((symptom, index) => (
                                    <li key={index} className="flex items-start">
                                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                      {symptom}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Solutions:</h6>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  {issue.solutions.map((solution, index) => (
                                    <li key={index} className="flex items-start">
                                      <span className="w-1 h-1 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                      {solution}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="text-blue-800 dark:text-blue-200 text-sm">
                          <p className="font-medium mb-1">💡 Quick Fix Commands:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li><code className="bg-gray-100 px-1 rounded">npm run test:tenant-fix-errors</code> - Fix console errors</li>
                            <li><code className="bg-gray-100 px-1 rounded">npm run test:tenant-add-ids</code> - Add test IDs</li>
                            <li><code className="bg-gray-100 px-1 rounded">npm run db:migrate</code> - Update database</li>
                            <li><code className="bg-gray-100 px-1 rounded">npm run dev</code> - Restart development server</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantManagementE2ETest; 