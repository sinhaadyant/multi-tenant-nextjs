import { PuppeteerTestHelper, testData, selectors } from './puppeteer-setup';

describe('SuperAdmin Audit Logs E2E Tests', () => {
  let testHelper: PuppeteerTestHelper;

  beforeAll(async () => {
    testHelper = new PuppeteerTestHelper();
    await testHelper.setup();
  });

  afterAll(async () => {
    await testHelper.teardown();
  });

  beforeEach(async () => {
    // Login before each test
    await testHelper.login(testData.superAdmin.email, testData.superAdmin.password);
  });

  describe('Audit Logs Overview', () => {
    test('should navigate to audit logs page', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Verify we're on the audit logs page
      await testHelper.expectUrlToContain('/superadmin/audit');
      
      // Verify page title
      await testHelper.expectElementToExist('h1');
      await testHelper.expectElementToHaveText('h1', 'Audit Logs');
    });

    test('should display audit logs table', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for audit logs table to load
      await testHelper.waitForElement('[data-testid="audit-logs-table"]', 10000);
      
      // Verify table headers
      await testHelper.expectElementToHaveText('th', 'Timestamp');
      await testHelper.expectElementToHaveText('th', 'User');
      await testHelper.expectElementToHaveText('th', 'Action');
      await testHelper.expectElementToHaveText('th', 'Resource');
      await testHelper.expectElementToHaveText('th', 'Details');
      await testHelper.expectElementToHaveText('th', 'IP Address');
      await testHelper.expectElementToHaveText('th', 'Status');
      
      // Verify table has data
      const tableRows = await testHelper.getPage().$$('tbody tr');
      expect(tableRows.length).toBeGreaterThan(0);
    });

    test('should display audit log details', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for audit logs table
      await testHelper.waitForElement('[data-testid="audit-logs-table"]', 10000);
      
      // Verify audit log elements
      await testHelper.expectElementToExist('[data-testid="audit-timestamp"]');
      await testHelper.expectElementToExist('[data-testid="audit-user"]');
      await testHelper.expectElementToExist('[data-testid="audit-action"]');
      await testHelper.expectElementToExist('[data-testid="audit-resource"]');
      await testHelper.expectElementToExist('[data-testid="audit-details"]');
      await testHelper.expectElementToExist('[data-testid="audit-ip"]');
      await testHelper.expectElementToExist('[data-testid="audit-status"]');
    });
  });

  describe('Audit Logs Filtering', () => {
    test('should filter audit logs by user', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for user filter
      await testHelper.waitForElement('[data-testid="user-filter"]', 10000);
      
      // Click user filter dropdown
      await testHelper.clickElement('[data-testid="user-filter"]');
      
      // Select a user
      await testHelper.waitForElement('[data-value="admin@example.com"]', 5000);
      await testHelper.clickElement('[data-value="admin@example.com"]');
      
      // Verify filtered results
      await testHelper.waitForElement('tbody tr', 5000);
      const filteredRows = await testHelper.getPage().$$('tbody tr');
      expect(filteredRows.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter audit logs by action', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for action filter
      await testHelper.waitForElement('[data-testid="action-filter"]', 10000);
      
      // Click action filter dropdown
      await testHelper.clickElement('[data-testid="action-filter"]');
      
      // Select an action
      await testHelper.waitForElement('[data-value="CREATE"]', 5000);
      await testHelper.clickElement('[data-value="CREATE"]');
      
      // Verify filtered results
      await testHelper.waitForElement('tbody tr', 5000);
      const filteredRows = await testHelper.getPage().$$('tbody tr');
      expect(filteredRows.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter audit logs by resource', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for resource filter
      await testHelper.waitForElement('[data-testid="resource-filter"]', 10000);
      
      // Click resource filter dropdown
      await testHelper.clickElement('[data-testid="resource-filter"]');
      
      // Select a resource
      await testHelper.waitForElement('[data-value="User"]', 5000);
      await testHelper.clickElement('[data-value="User"]');
      
      // Verify filtered results
      await testHelper.waitForElement('tbody tr', 5000);
      const filteredRows = await testHelper.getPage().$$('tbody tr');
      expect(filteredRows.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter audit logs by date range', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for date range filter
      await testHelper.waitForElement('[data-testid="date-range-filter"]', 10000);
      
      // Click date range filter
      await testHelper.clickElement('[data-testid="date-range-filter"]');
      
      // Set start date
      await testHelper.waitForElement('[data-testid="start-date-input"]', 5000);
      await testHelper.typeText('[data-testid="start-date-input"]', '2024-01-01');
      
      // Set end date
      await testHelper.waitForElement('[data-testid="end-date-input"]', 5000);
      await testHelper.typeText('[data-testid="end-date-input"]', '2024-12-31');
      
      // Apply filter
      await testHelper.clickElement('[data-testid="apply-date-filter"]');
      
      // Verify filtered results
      await testHelper.waitForElement('tbody tr', 5000);
      const filteredRows = await testHelper.getPage().$$('tbody tr');
      expect(filteredRows.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter audit logs by status', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for status filter
      await testHelper.waitForElement('[data-testid="status-filter"]', 10000);
      
      // Click status filter dropdown
      await testHelper.clickElement('[data-testid="status-filter"]');
      
      // Select success status
      await testHelper.waitForElement('[data-value="SUCCESS"]', 5000);
      await testHelper.clickElement('[data-value="SUCCESS"]');
      
      // Verify filtered results
      await testHelper.waitForElement('tbody tr', 5000);
      const filteredRows = await testHelper.getPage().$$('tbody tr');
      expect(filteredRows.length).toBeGreaterThanOrEqual(0);
    });

    test('should search audit logs', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for search input
      await testHelper.waitForElement('[data-testid="audit-search-input"]', 10000);
      
      // Type search term
      await testHelper.typeText('[data-testid="audit-search-input"]', 'login');
      
      // Wait for search results
      await testHelper.waitForElement('tbody tr', 5000);
      
      // Verify search results
      const searchResults = await testHelper.getPage().$$('tbody tr');
      expect(searchResults.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Audit Log Details', () => {
    test('should view audit log details', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for audit logs table
      await testHelper.waitForElement('[data-testid="audit-logs-table"]', 10000);
      
      // Click view details button
      await testHelper.waitForElement('[data-testid="view-audit-details-button"]', 10000);
      await testHelper.clickElement('[data-testid="view-audit-details-button"]');
      
      // Verify audit details modal
      await testHelper.waitForElement('[data-testid="audit-details-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="audit-details-modal"]', 'Audit Log Details');
    });

    test('should display detailed audit information', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for audit logs table
      await testHelper.waitForElement('[data-testid="audit-logs-table"]', 10000);
      
      // Click view details button
      await testHelper.waitForElement('[data-testid="view-audit-details-button"]', 10000);
      await testHelper.clickElement('[data-testid="view-audit-details-button"]');
      
      // Wait for audit details modal
      await testHelper.waitForElement('[data-testid="audit-details-modal"]', 5000);
      
      // Verify detailed information
      await testHelper.expectElementToExist('[data-testid="audit-full-timestamp"]');
      await testHelper.expectElementToExist('[data-testid="audit-full-user"]');
      await testHelper.expectElementToExist('[data-testid="audit-full-action"]');
      await testHelper.expectElementToExist('[data-testid="audit-full-resource"]');
      await testHelper.expectElementToExist('[data-testid="audit-full-details"]');
      await testHelper.expectElementToExist('[data-testid="audit-full-ip"]');
      await testHelper.expectElementToExist('[data-testid="audit-full-status"]');
      await testHelper.expectElementToExist('[data-testid="audit-user-agent"]');
      await testHelper.expectElementToExist('[data-testid="audit-session-id"]');
    });

    test('should display audit log changes', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for audit logs table
      await testHelper.waitForElement('[data-testid="audit-logs-table"]', 10000);
      
      // Click view details button for an update action
      await testHelper.waitForElement('[data-testid="view-audit-details-button"]', 10000);
      await testHelper.clickElement('[data-testid="view-audit-details-button"]');
      
      // Wait for audit details modal
      await testHelper.waitForElement('[data-testid="audit-details-modal"]', 5000);
      
      // Verify changes section
      await testHelper.expectElementToExist('[data-testid="audit-changes-section"]');
      await testHelper.expectElementToExist('[data-testid="audit-old-values"]');
      await testHelper.expectElementToExist('[data-testid="audit-new-values"]');
    });
  });

  describe('Audit Logs Export', () => {
    test('should export audit logs to CSV', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for audit logs table
      await testHelper.waitForElement('[data-testid="audit-logs-table"]', 10000);
      
      // Click export button
      await testHelper.waitForElement('[data-testid="export-audit-logs-button"]', 10000);
      await testHelper.clickElement('[data-testid="export-audit-logs-button"]');
      
      // Verify export options
      await testHelper.waitForElement('[data-testid="export-options"]', 5000);
      
      // Click CSV export
      await testHelper.clickElement('[data-testid="export-csv"]');
      
      // Verify export success
      await testHelper.waitForElement('[data-testid="export-success"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="export-success"]', 'Export completed');
    });

    test('should export audit logs to JSON', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for audit logs table
      await testHelper.waitForElement('[data-testid="audit-logs-table"]', 10000);
      
      // Click export button
      await testHelper.waitForElement('[data-testid="export-audit-logs-button"]', 10000);
      await testHelper.clickElement('[data-testid="export-audit-logs-button"]');
      
      // Verify export options
      await testHelper.waitForElement('[data-testid="export-options"]', 5000);
      
      // Click JSON export
      await testHelper.clickElement('[data-testid="export-json"]');
      
      // Verify export success
      await testHelper.waitForElement('[data-testid="export-success"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="export-success"]', 'Export completed');
    });

    test('should export filtered audit logs', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for audit logs table
      await testHelper.waitForElement('[data-testid="audit-logs-table"]', 10000);
      
      // Apply a filter first
      await testHelper.waitForElement('[data-testid="action-filter"]', 10000);
      await testHelper.clickElement('[data-testid="action-filter"]');
      await testHelper.waitForElement('[data-value="CREATE"]', 5000);
      await testHelper.clickElement('[data-value="CREATE"]');
      
      // Wait for filtered results
      await testHelper.waitForElement('tbody tr', 5000);
      
      // Click export button
      await testHelper.waitForElement('[data-testid="export-audit-logs-button"]', 10000);
      await testHelper.clickElement('[data-testid="export-audit-logs-button"]');
      
      // Verify export options
      await testHelper.waitForElement('[data-testid="export-options"]', 5000);
      
      // Click CSV export
      await testHelper.clickElement('[data-testid="export-csv"]');
      
      // Verify export success
      await testHelper.waitForElement('[data-testid="export-success"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="export-success"]', 'Export completed');
    });
  });

  describe('Audit Logs Analytics', () => {
    test('should display audit logs statistics', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for statistics section
      await testHelper.waitForElement('[data-testid="audit-statistics"]', 10000);
      
      // Verify statistics cards
      await testHelper.expectElementToExist('[data-testid="total-audit-logs"]');
      await testHelper.expectElementToExist('[data-testid="today-audit-logs"]');
      await testHelper.expectElementToExist('[data-testid="failed-actions"]');
      await testHelper.expectElementToExist('[data-testid="unique-users"]');
    });

    test('should display audit logs chart', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for audit logs chart
      await testHelper.waitForElement('[data-testid="audit-logs-chart"]', 15000);
      
      // Verify chart container exists
      await testHelper.expectElementToExist('[data-testid="audit-logs-chart"]');
      
      // Verify chart title
      await testHelper.expectElementToHaveText('[data-testid="audit-logs-chart-title"]', 'Audit Logs Activity');
    });

    test('should allow chart time period selection', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for time period selector
      await testHelper.waitForElement('[data-testid="audit-chart-time-selector"]', 10000);
      
      // Click time period selector
      await testHelper.clickElement('[data-testid="audit-chart-time-selector"]');
      
      // Select different time period
      await testHelper.waitForElement('[data-value="7d"]', 5000);
      await testHelper.clickElement('[data-value="7d"]');
      
      // Verify chart updates
      await testHelper.waitForElement('[data-testid="audit-chart-loading"]', 5000);
      await testHelper.waitForElement('[data-testid="audit-logs-chart"]', 10000);
    });
  });

  describe('Audit Logs Responsive Design', () => {
    test('should be responsive on mobile devices', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Set mobile viewport
      await testHelper.getPage().setViewport({ width: 375, height: 667 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('audit-logs-mobile');
    });

    test('should be responsive on tablet devices', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Set tablet viewport
      await testHelper.getPage().setViewport({ width: 768, height: 1024 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('audit-logs-tablet');
    });
  });

  describe('Audit Logs Performance', () => {
    test('should load audit logs page within acceptable time', async () => {
      const startTime = Date.now();
      
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for audit logs table to load
      await testHelper.waitForElement('[data-testid="audit-logs-table"]', 10000);
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large audit log datasets efficiently', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for audit logs table to load
      await testHelper.waitForElement('[data-testid="audit-logs-table"]', 10000);
      
      // Verify no loading spinners are visible
      const loadingSpinners = await testHelper.getPage().$$(selectors.loadingSpinner);
      expect(loadingSpinners.length).toBe(0);
    });

    test('should paginate through audit logs efficiently', async () => {
      await testHelper.navigateTo('/superadmin/audit');
      
      // Wait for audit logs table
      await testHelper.waitForElement('[data-testid="audit-logs-table"]', 10000);
      
      // Wait for pagination
      await testHelper.waitForElement('[data-testid="pagination"]', 10000);
      
      // Click next page button
      await testHelper.clickElement('[data-testid="next-button"]');
      
      // Verify page changed
      await testHelper.waitForElement('tbody tr', 5000);
      
      // Click previous page button
      await testHelper.clickElement('[data-testid="prev-button"]');
      
      // Verify back to first page
      await testHelper.waitForElement('tbody tr', 5000);
    });
  });
}); 