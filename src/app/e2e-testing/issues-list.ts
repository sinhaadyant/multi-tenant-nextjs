export interface Issue {
  id: string;
  category: 'authentication' | 'navigation' | 'form' | 'api' | 'database' | 'ui' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  symptoms: string[];
  solutions: string[];
  testId?: string;
}

export const E2E_TEST_ISSUES: Issue[] = [
  {
    id: 'auth-001',
    category: 'authentication',
    severity: 'critical',
    title: 'Login Failed',
    description: 'Unable to authenticate as Superadmin',
    symptoms: [
      'Login form not found',
      'Invalid credentials error',
      'Redirect to login page after submission',
      'Session not maintained'
    ],
    solutions: [
      'Verify admin@superadmin.com credentials exist in database',
      'Check if login API endpoint is working',
      'Ensure session management is properly configured',
      'Check for CSRF token issues'
    ],
    testId: 'login-test'
  },
  {
    id: 'nav-001',
    category: 'navigation',
    severity: 'high',
    title: 'Page Navigation Failed',
    description: 'Unable to navigate to tenant management pages',
    symptoms: [
      '404 errors on tenant pages',
      'Infinite loading states',
      'Redirect loops',
      'Page not found errors'
    ],
    solutions: [
      'Check if tenant routes are properly defined',
      'Verify Next.js routing configuration',
      'Ensure middleware is not blocking access',
      'Check for authentication guards'
    ],
    testId: 'navigation-test'
  },
  {
    id: 'search-001',
    category: 'form',
    severity: 'high',
    title: 'Search Input Not Working',
    description: 'Search functionality is not responding to user input',
    symptoms: [
      'Cannot type in search input',
      'Search input not found',
      'No API calls triggered on search',
      'Search results not updating'
    ],
    solutions: [
      'Check if search input has proper event handlers',
      'Verify debouncing implementation',
      'Ensure API endpoints are responding',
      'Check for JavaScript errors in console'
    ],
    testId: 'search-test'
  },
  {
    id: 'form-001',
    category: 'form',
    severity: 'high',
    title: 'Form Submission Failed',
    description: 'Tenant creation/editing forms are not submitting properly',
    symptoms: [
      'Form fields not found',
      'Validation errors not showing',
      'Submit button not working',
      'Form not redirecting after submission'
    ],
    solutions: [
      'Check form field names and IDs',
      'Verify form validation logic',
      'Ensure submit handler is properly bound',
      'Check for required field validation'
    ],
    testId: 'crud-test'
  },
  {
    id: 'api-001',
    category: 'api',
    severity: 'critical',
    title: 'API Endpoints Not Responding',
    description: 'Backend API calls are failing',
    symptoms: [
      'Network errors in console',
      '500 server errors',
      'API timeout errors',
      'CORS errors'
    ],
    solutions: [
      'Check if backend server is running',
      'Verify API route definitions',
      'Check database connectivity',
      'Review API error handling'
    ],
    testId: 'api-test'
  },
  {
    id: 'db-001',
    category: 'database',
    severity: 'high',
    title: 'Database Connection Issues',
    description: 'Unable to fetch or save data from database',
    symptoms: [
      'Empty data returned from API',
      'Database connection errors',
      'Prisma client errors',
      'Data not persisting'
    ],
    solutions: [
      'Check database connection string',
      'Verify Prisma schema is up to date',
      'Run database migrations',
      'Check database permissions'
    ],
    testId: 'database-test'
  },
  {
    id: 'ui-001',
    category: 'ui',
    severity: 'medium',
    title: 'UI Elements Not Found',
    description: 'Expected UI elements are not present on the page',
    symptoms: [
      'Test selectors not finding elements',
      'Missing buttons or links',
      'Incorrect element attributes',
      'Elements not rendered'
    ],
    solutions: [
      'Add data-testid attributes to elements',
      'Check if elements are conditionally rendered',
      'Verify component props and state',
      'Check for loading states'
    ],
    testId: 'ui-test'
  },
  {
    id: 'perf-001',
    category: 'performance',
    severity: 'medium',
    title: 'Slow Page Loading',
    description: 'Pages are taking too long to load',
    symptoms: [
      'Long loading times',
      'Slow API responses',
      'Unresponsive UI',
      'Memory leaks'
    ],
    solutions: [
      'Optimize database queries',
      'Implement proper caching',
      'Check for unnecessary re-renders',
      'Review bundle size and loading'
    ],
    testId: 'performance-test'
  },
  {
    id: 'hyd-001',
    category: 'ui',
    severity: 'medium',
    title: 'Hydration Mismatch',
    description: 'Server and client rendering differences',
    symptoms: [
      'Hydration warnings in console',
      'UI flickering on load',
      'Inconsistent rendering',
      'React hydration errors'
    ],
    solutions: [
      'Add suppressHydrationWarning to dynamic content',
      'Use useEffect for client-side only code',
      'Check for date/time rendering differences',
      'Ensure consistent data between server and client'
    ],
    testId: 'hydration-test'
  },
  {
    id: 'state-001',
    category: 'ui',
    severity: 'medium',
    title: 'State Management Issues',
    description: 'Component state not updating properly',
    symptoms: [
      'UI not reflecting data changes',
      'Stale data displayed',
      'State not persisting',
      'Inconsistent state updates'
    ],
    solutions: [
      'Check React state management',
      'Verify useEffect dependencies',
      'Ensure proper state initialization',
      'Review state update logic'
    ],
    testId: 'state-test'
  }
];

export const getIssuesByCategory = (category: Issue['category']): Issue[] => {
  return E2E_TEST_ISSUES.filter(issue => issue.category === category);
};

export const getIssuesBySeverity = (severity: Issue['severity']): Issue[] => {
  return E2E_TEST_ISSUES.filter(issue => issue.severity === severity);
};

export const getCriticalIssues = (): Issue[] => {
  return E2E_TEST_ISSUES.filter(issue => issue.severity === 'critical');
};

export const getHighPriorityIssues = (): Issue[] => {
  return E2E_TEST_ISSUES.filter(issue => 
    issue.severity === 'critical' || issue.severity === 'high'
  );
}; 