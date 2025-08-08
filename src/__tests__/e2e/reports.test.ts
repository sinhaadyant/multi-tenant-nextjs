import { PuppeteerTestHelper, testData, selectors } from './puppeteer-setup';

describe('SuperAdmin Reports E2E Tests', () => {
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

  describe('Reports Overview', () => {
    test('should navigate to reports page', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Verify we're on the reports page
      await testHelper.expectUrlToContain('/superadmin/reports');
      
      // Verify page title
      await testHelper.expectElementToExist('h1');
      await testHelper.expectElementToHaveText('h1', 'Reports');
    });

    test('should display available reports', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Wait for reports list to load
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      
      // Verify reports are present
      await testHelper.expectElementToExist('[data-testid="user-activity-report"]');
      await testHelper.expectElementToExist('[data-testid="tenant-growth-report"]');
      await testHelper.expectElementToExist('[data-testid="system-performance-report"]');
      await testHelper.expectElementToExist('[data-testid="audit-summary-report"]');
    });
  });

  describe('User Activity Report', () => {
    test('should generate user activity report', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Wait for reports list
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      
      // Click user activity report
      await testHelper.clickElement('[data-testid="user-activity-report"]');
      
      // Wait for report configuration
      await testHelper.waitForElement('[data-testid="report-configuration"]', 10000);
      
      // Configure report parameters
      await testHelper.clickElement('select[name="timeRange"]');
      await testHelper.clickElement('option[value="30d"]');
      
      // Generate report
      await testHelper.clickElement('[data-testid="generate-report-button"]');
      
      // Wait for report generation
      await testHelper.waitForElement('[data-testid="report-generation-progress"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="report-generation-progress"]', 'Generating Report');
      
      // Wait for report to complete
      await testHelper.waitForElement('[data-testid="report-results"]', 30000);
      await testHelper.expectElementToExist('[data-testid="report-results"]');
    });

    test('should display user activity chart', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Generate user activity report first
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      await testHelper.clickElement('[data-testid="user-activity-report"]');
      await testHelper.waitForElement('[data-testid="report-configuration"]', 10000);
      await testHelper.clickElement('[data-testid="generate-report-button"]');
      await testHelper.waitForElement('[data-testid="report-results"]', 30000);
      
      // Verify chart is displayed
      await testHelper.expectElementToExist('[data-testid="user-activity-chart"]');
      await testHelper.expectElementToHaveText('[data-testid="user-activity-chart-title"]', 'User Activity Over Time');
    });

    test('should display user activity table', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Generate user activity report first
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      await testHelper.clickElement('[data-testid="user-activity-report"]');
      await testHelper.waitForElement('[data-testid="report-configuration"]', 10000);
      await testHelper.clickElement('[data-testid="generate-report-button"]');
      await testHelper.waitForElement('[data-testid="report-results"]', 30000);
      
      // Verify table is displayed
      await testHelper.expectElementToExist('[data-testid="user-activity-table"]');
      
      // Verify table headers
      await testHelper.expectElementToHaveText('th', 'User');
      await testHelper.expectElementToHaveText('th', 'Login Count');
      await testHelper.expectElementToHaveText('th', 'Last Login');
      await testHelper.expectElementToHaveText('th', 'Session Duration');
    });
  });

  describe('Tenant Growth Report', () => {
    test('should generate tenant growth report', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Wait for reports list
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      
      // Click tenant growth report
      await testHelper.clickElement('[data-testid="tenant-growth-report"]');
      
      // Wait for report configuration
      await testHelper.waitForElement('[data-testid="report-configuration"]', 10000);
      
      // Configure report parameters
      await testHelper.clickElement('select[name="timeRange"]');
      await testHelper.clickElement('option[value="12m"]');
      
      // Generate report
      await testHelper.clickElement('[data-testid="generate-report-button"]');
      
      // Wait for report generation
      await testHelper.waitForElement('[data-testid="report-generation-progress"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="report-generation-progress"]', 'Generating Report');
      
      // Wait for report to complete
      await testHelper.waitForElement('[data-testid="report-results"]', 30000);
      await testHelper.expectElementToExist('[data-testid="report-results"]');
    });

    test('should display tenant growth chart', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Generate tenant growth report first
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      await testHelper.clickElement('[data-testid="tenant-growth-report"]');
      await testHelper.waitForElement('[data-testid="report-configuration"]', 10000);
      await testHelper.clickElement('[data-testid="generate-report-button"]');
      await testHelper.waitForElement('[data-testid="report-results"]', 30000);
      
      // Verify chart is displayed
      await testHelper.expectElementToExist('[data-testid="tenant-growth-chart"]');
      await testHelper.expectElementToHaveText('[data-testid="tenant-growth-chart-title"]', 'Tenant Growth Over Time');
    });

    test('should display tenant statistics', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Generate tenant growth report first
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      await testHelper.clickElement('[data-testid="tenant-growth-report"]');
      await testHelper.waitForElement('[data-testid="report-configuration"]', 10000);
      await testHelper.clickElement('[data-testid="generate-report-button"]');
      await testHelper.waitForElement('[data-testid="report-results"]', 30000);
      
      // Verify statistics are displayed
      await testHelper.expectElementToExist('[data-testid="total-tenants-stat"]');
      await testHelper.expectElementToExist('[data-testid="new-tenants-stat"]');
      await testHelper.expectElementToExist('[data-testid="active-tenants-stat"]');
      await testHelper.expectElementToExist('[data-testid="growth-rate-stat"]');
    });
  });

  describe('System Performance Report', () => {
    test('should generate system performance report', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Wait for reports list
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      
      // Click system performance report
      await testHelper.clickElement('[data-testid="system-performance-report"]');
      
      // Wait for report configuration
      await testHelper.waitForElement('[data-testid="report-configuration"]', 10000);
      
      // Configure report parameters
      await testHelper.clickElement('select[name="timeRange"]');
      await testHelper.clickElement('option[value="7d"]');
      
      // Generate report
      await testHelper.clickElement('[data-testid="generate-report-button"]');
      
      // Wait for report generation
      await testHelper.waitForElement('[data-testid="report-generation-progress"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="report-generation-progress"]', 'Generating Report');
      
      // Wait for report to complete
      await testHelper.waitForElement('[data-testid="report-results"]', 30000);
      await testHelper.expectElementToExist('[data-testid="report-results"]');
    });

    test('should display system performance metrics', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Generate system performance report first
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      await testHelper.clickElement('[data-testid="system-performance-report"]');
      await testHelper.waitForElement('[data-testid="report-configuration"]', 10000);
      await testHelper.clickElement('[data-testid="generate-report-button"]');
      await testHelper.waitForElement('[data-testid="report-results"]', 30000);
      
      // Verify performance metrics
      await testHelper.expectElementToExist('[data-testid="cpu-usage-metric"]');
      await testHelper.expectElementToExist('[data-testid="memory-usage-metric"]');
      await testHelper.expectElementToExist('[data-testid="disk-usage-metric"]');
      await testHelper.expectElementToExist('[data-testid="response-time-metric"]');
      await testHelper.expectElementToExist('[data-testid="error-rate-metric"]');
    });

    test('should display performance charts', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Generate system performance report first
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      await testHelper.clickElement('[data-testid="system-performance-report"]');
      await testHelper.waitForElement('[data-testid="report-configuration"]', 10000);
      await testHelper.clickElement('[data-testid="generate-report-button"]');
      await testHelper.waitForElement('[data-testid="report-results"]', 30000);
      
      // Verify performance charts
      await testHelper.expectElementToExist('[data-testid="cpu-usage-chart"]');
      await testHelper.expectElementToExist('[data-testid="memory-usage-chart"]');
      await testHelper.expectElementToExist('[data-testid="response-time-chart"]');
      await testHelper.expectElementToExist('[data-testid="error-rate-chart"]');
    });
  });

  describe('Audit Summary Report', () => {
    test('should generate audit summary report', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Wait for reports list
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      
      // Click audit summary report
      await testHelper.clickElement('[data-testid="audit-summary-report"]');
      
      // Wait for report configuration
      await testHelper.waitForElement('[data-testid="report-configuration"]', 10000);
      
      // Configure report parameters
      await testHelper.clickElement('select[name="timeRange"]');
      await testHelper.clickElement('option[value="30d"]');
      
      // Generate report
      await testHelper.clickElement('[data-testid="generate-report-button"]');
      
      // Wait for report generation
      await testHelper.waitForElement('[data-testid="report-generation-progress"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="report-generation-progress"]', 'Generating Report');
      
      // Wait for report to complete
      await testHelper.waitForElement('[data-testid="report-results"]', 30000);
      await testHelper.expectElementToExist('[data-testid="report-results"]');
    });

    test('should display audit summary statistics', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Generate audit summary report first
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      await testHelper.clickElement('[data-testid="audit-summary-report"]');
      await testHelper.waitForElement('[data-testid="report-configuration"]', 10000);
      await testHelper.clickElement('[data-testid="generate-report-button"]');
      await testHelper.waitForElement('[data-testid="report-results"]', 30000);
      
      // Verify audit summary statistics
      await testHelper.expectElementToExist('[data-testid="total-audit-logs-stat"]');
      await testHelper.expectElementToExist('[data-testid="successful-actions-stat"]');
      await testHelper.expectElementToExist('[data-testid="failed-actions-stat"]');
      await testHelper.expectElementToExist('[data-testid="unique-users-stat"]');
    });

    test('should display audit activity chart', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Generate audit summary report first
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      await testHelper.clickElement('[data-testid="audit-summary-report"]');
      await testHelper.waitForElement('[data-testid="report-configuration"]', 10000);
      await testHelper.clickElement('[data-testid="generate-report-button"]');
      await testHelper.waitForElement('[data-testid="report-results"]', 30000);
      
      // Verify audit activity chart
      await testHelper.expectElementToExist('[data-testid="audit-activity-chart"]');
      await testHelper.expectElementToHaveText('[data-testid="audit-activity-chart-title"]', 'Audit Activity Over Time');
    });
  });

  describe('Report Export', () => {
    test('should export report to PDF', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Generate a report first
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      await testHelper.clickElement('[data-testid="user-activity-report"]');
      await testHelper.waitForElement('[data-testid="report-configuration"]', 10000);
      await testHelper.clickElement('[data-testid="generate-report-button"]');
      await testHelper.waitForElement('[data-testid="report-results"]', 30000);
      
      // Click export button
      await testHelper.waitForElement('[data-testid="export-report-button"]', 10000);
      await testHelper.clickElement('[data-testid="export-report-button"]');
      
      // Verify export options
      await testHelper.waitForElement('[data-testid="export-options"]', 5000);
      
      // Click PDF export
      await testHelper.clickElement('[data-testid="export-pdf"]');
      
      // Verify export success
      await testHelper.waitForElement('[data-testid="export-success"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="export-success"]', 'Report exported successfully');
    });

    test('should export report to Excel', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Generate a report first
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      await testHelper.clickElement('[data-testid="user-activity-report"]');
      await testHelper.waitForElement('[data-testid="report-configuration"]', 10000);
      await testHelper.clickElement('[data-testid="generate-report-button"]');
      await testHelper.waitForElement('[data-testid="report-results"]', 30000);
      
      // Click export button
      await testHelper.waitForElement('[data-testid="export-report-button"]', 10000);
      await testHelper.clickElement('[data-testid="export-report-button"]');
      
      // Verify export options
      await testHelper.waitForElement('[data-testid="export-options"]', 5000);
      
      // Click Excel export
      await testHelper.clickElement('[data-testid="export-excel"]');
      
      // Verify export success
      await testHelper.waitForElement('[data-testid="export-success"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="export-success"]', 'Report exported successfully');
    });

    test('should schedule report generation', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Wait for reports list
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      
      // Click user activity report
      await testHelper.clickElement('[data-testid="user-activity-report"]');
      
      // Wait for report configuration
      await testHelper.waitForElement('[data-testid="report-configuration"]', 10000);
      
      // Click schedule button
      await testHelper.waitForElement('[data-testid="schedule-report-button"]', 10000);
      await testHelper.clickElement('[data-testid="schedule-report-button"]');
      
      // Configure schedule
      await testHelper.waitForElement('[data-testid="schedule-configuration"]', 5000);
      await testHelper.clickElement('select[name="frequency"]');
      await testHelper.clickElement('option[value="weekly"]');
      
      // Set email recipients
      await testHelper.typeText('input[name="emailRecipients"]', 'admin@example.com');
      
      // Save schedule
      await testHelper.clickElement('[data-testid="save-schedule-button"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Report scheduled successfully');
    });
  });

  describe('Reports Responsive Design', () => {
    test('should be responsive on mobile devices', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Set mobile viewport
      await testHelper.getPage().setViewport({ width: 375, height: 667 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('reports-mobile');
    });

    test('should be responsive on tablet devices', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Set tablet viewport
      await testHelper.getPage().setViewport({ width: 768, height: 1024 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('reports-tablet');
    });
  });

  describe('Reports Performance', () => {
    test('should load reports page within acceptable time', async () => {
      const startTime = Date.now();
      
      await testHelper.navigateTo('/superadmin/reports');
      
      // Wait for reports list to load
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large report datasets efficiently', async () => {
      await testHelper.navigateTo('/superadmin/reports');
      
      // Wait for reports list to load
      await testHelper.waitForElement('[data-testid="reports-list"]', 10000);
      
      // Verify no loading spinners are visible
      const loadingSpinners = await testHelper.getPage().$$(selectors.loadingSpinner);
      expect(loadingSpinners.length).toBe(0);
    });
  });
}); 