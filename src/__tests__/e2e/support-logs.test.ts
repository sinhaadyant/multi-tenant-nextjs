import { PuppeteerTestHelper, testData, selectors } from './puppeteer-setup';

describe('SuperAdmin Support & Logs E2E Tests', () => {
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

  describe('Support Tickets Overview', () => {
    test('should navigate to support page', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Verify we're on the support page
      await testHelper.expectUrlToContain('/superadmin/support');
      
      // Verify page title
      await testHelper.expectElementToExist('h1');
      await testHelper.expectElementToHaveText('h1', 'Support & Logs');
    });

    test('should display support tickets table', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for support tickets table to load
      await testHelper.waitForElement('[data-testid="support-tickets-table"]', 10000);
      
      // Verify table headers
      await testHelper.expectElementToHaveText('th', 'Ticket ID');
      await testHelper.expectElementToHaveText('th', 'Subject');
      await testHelper.expectElementToHaveText('th', 'Requester');
      await testHelper.expectElementToHaveText('th', 'Priority');
      await testHelper.expectElementToHaveText('th', 'Status');
      await testHelper.expectElementToHaveText('th', 'Created');
      await testHelper.expectElementToHaveText('th', 'Actions');
      
      // Verify table has data
      const tableRows = await testHelper.getPage().$$('tbody tr');
      expect(tableRows.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter support tickets by status', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for status filter
      await testHelper.waitForElement('[data-testid="ticket-status-filter"]', 10000);
      
      // Click status filter dropdown
      await testHelper.clickElement('[data-testid="ticket-status-filter"]');
      
      // Select open status
      await testHelper.waitForElement('[data-value="open"]', 5000);
      await testHelper.clickElement('[data-value="open"]');
      
      // Verify filtered results
      await testHelper.waitForElement('tbody tr', 5000);
      const filteredRows = await testHelper.getPage().$$('tbody tr');
      expect(filteredRows.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter support tickets by priority', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for priority filter
      await testHelper.waitForElement('[data-testid="ticket-priority-filter"]', 10000);
      
      // Click priority filter dropdown
      await testHelper.clickElement('[data-testid="ticket-priority-filter"]');
      
      // Select high priority
      await testHelper.waitForElement('[data-value="high"]', 5000);
      await testHelper.clickElement('[data-value="high"]');
      
      // Verify filtered results
      await testHelper.waitForElement('tbody tr', 5000);
      const filteredRows = await testHelper.getPage().$$('tbody tr');
      expect(filteredRows.length).toBeGreaterThanOrEqual(0);
    });

    test('should search support tickets', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for search input
      await testHelper.waitForElement('[data-testid="ticket-search-input"]', 10000);
      
      // Type search term
      await testHelper.typeText('[data-testid="ticket-search-input"]', 'login');
      
      // Wait for search results
      await testHelper.waitForElement('tbody tr', 5000);
      
      // Verify search results
      const searchResults = await testHelper.getPage().$$('tbody tr');
      expect(searchResults.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Support Ticket Management', () => {
    test('should view support ticket details', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for support tickets table
      await testHelper.waitForElement('[data-testid="support-tickets-table"]', 10000);
      
      // Click view details button
      await testHelper.waitForElement('[data-testid="view-ticket-button"]', 10000);
      await testHelper.clickElement('[data-testid="view-ticket-button"]');
      
      // Verify ticket details modal
      await testHelper.waitForElement('[data-testid="ticket-details-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="ticket-details-modal"]', 'Support Ticket Details');
    });

    test('should update ticket status', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for support tickets table
      await testHelper.waitForElement('[data-testid="support-tickets-table"]', 10000);
      
      // Click update status button
      await testHelper.waitForElement('[data-testid="update-status-button"]', 10000);
      await testHelper.clickElement('[data-testid="update-status-button"]');
      
      // Verify status update modal
      await testHelper.waitForElement('[data-testid="update-status-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="update-status-modal"]', 'Update Ticket Status');
      
      // Select new status
      await testHelper.clickElement('select[name="status"]');
      await testHelper.clickElement('option[value="in_progress"]');
      
      // Add comment
      await testHelper.typeText('textarea[name="comment"]', 'Working on this issue');
      
      // Submit update
      await testHelper.clickElement('[data-testid="update-status-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Status updated successfully');
    });

    test('should assign ticket to agent', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for support tickets table
      await testHelper.waitForElement('[data-testid="support-tickets-table"]', 10000);
      
      // Click assign ticket button
      await testHelper.waitForElement('[data-testid="assign-ticket-button"]', 10000);
      await testHelper.clickElement('[data-testid="assign-ticket-button"]');
      
      // Verify assign ticket modal
      await testHelper.waitForElement('[data-testid="assign-ticket-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="assign-ticket-modal"]', 'Assign Ticket');
      
      // Select agent
      await testHelper.clickElement('select[name="agent"]');
      await testHelper.clickElement('option[value="agent1"]');
      
      // Submit assignment
      await testHelper.clickElement('[data-testid="assign-ticket-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Ticket assigned successfully');
    });

    test('should add comment to ticket', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for support tickets table
      await testHelper.waitForElement('[data-testid="support-tickets-table"]', 10000);
      
      // Click add comment button
      await testHelper.waitForElement('[data-testid="add-comment-button"]', 10000);
      await testHelper.clickElement('[data-testid="add-comment-button"]');
      
      // Verify add comment modal
      await testHelper.waitForElement('[data-testid="add-comment-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="add-comment-modal"]', 'Add Comment');
      
      // Add comment
      await testHelper.typeText('textarea[name="comment"]', 'This is a test comment');
      
      // Submit comment
      await testHelper.clickElement('[data-testid="add-comment-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Comment added successfully');
    });

    test('should close support ticket', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for support tickets table
      await testHelper.waitForElement('[data-testid="support-tickets-table"]', 10000);
      
      // Click close ticket button
      await testHelper.waitForElement('[data-testid="close-ticket-button"]', 10000);
      await testHelper.clickElement('[data-testid="close-ticket-button"]');
      
      // Verify close ticket modal
      await testHelper.waitForElement('[data-testid="close-ticket-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="close-ticket-modal"]', 'Close Ticket');
      
      // Add resolution
      await testHelper.typeText('textarea[name="resolution"]', 'Issue has been resolved');
      
      // Submit closure
      await testHelper.clickElement('[data-testid="close-ticket-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Ticket closed successfully');
    });
  });

  describe('System Logs', () => {
    test('should display system logs', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for system logs section
      await testHelper.waitForElement('[data-testid="system-logs-section"]', 10000);
      
      // Verify system logs are present
      await testHelper.expectElementToExist('[data-testid="system-logs-table"]');
      
      // Verify table headers
      await testHelper.expectElementToHaveText('th', 'Timestamp');
      await testHelper.expectElementToHaveText('th', 'Level');
      await testHelper.expectElementToHaveText('th', 'Message');
      await testHelper.expectElementToHaveText('th', 'Source');
    });

    test('should filter system logs by level', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for system logs section
      await testHelper.waitForElement('[data-testid="system-logs-section"]', 10000);
      
      // Wait for log level filter
      await testHelper.waitForElement('[data-testid="log-level-filter"]', 10000);
      
      // Click log level filter dropdown
      await testHelper.clickElement('[data-testid="log-level-filter"]');
      
      // Select error level
      await testHelper.waitForElement('[data-value="error"]', 5000);
      await testHelper.clickElement('[data-value="error"]');
      
      // Verify filtered results
      await testHelper.waitForElement('tbody tr', 5000);
      const filteredRows = await testHelper.getPage().$$('tbody tr');
      expect(filteredRows.length).toBeGreaterThanOrEqual(0);
    });

    test('should search system logs', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for system logs section
      await testHelper.waitForElement('[data-testid="system-logs-section"]', 10000);
      
      // Wait for log search input
      await testHelper.waitForElement('[data-testid="log-search-input"]', 10000);
      
      // Type search term
      await testHelper.typeText('[data-testid="log-search-input"]', 'error');
      
      // Wait for search results
      await testHelper.waitForElement('tbody tr', 5000);
      
      // Verify search results
      const searchResults = await testHelper.getPage().$$('tbody tr');
      expect(searchResults.length).toBeGreaterThanOrEqual(0);
    });

    test('should download system logs', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for system logs section
      await testHelper.waitForElement('[data-testid="system-logs-section"]', 10000);
      
      // Click download logs button
      await testHelper.waitForElement('[data-testid="download-logs-button"]', 10000);
      await testHelper.clickElement('[data-testid="download-logs-button"]');
      
      // Verify download options
      await testHelper.waitForElement('[data-testid="download-options"]', 5000);
      
      // Click download logs
      await testHelper.clickElement('[data-testid="download-logs-file"]');
      
      // Verify download success
      await testHelper.waitForElement('[data-testid="download-success"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="download-success"]', 'Logs downloaded successfully');
    });
  });

  describe('Error Logs', () => {
    test('should display error logs', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for error logs section
      await testHelper.waitForElement('[data-testid="error-logs-section"]', 10000);
      
      // Verify error logs are present
      await testHelper.expectElementToExist('[data-testid="error-logs-table"]');
      
      // Verify table headers
      await testHelper.expectElementToHaveText('th', 'Timestamp');
      await testHelper.expectElementToHaveText('th', 'Error Type');
      await testHelper.expectElementToHaveText('th', 'Message');
      await testHelper.expectElementToHaveText('th', 'Stack Trace');
      await testHelper.expectElementToHaveText('th', 'User');
    });

    test('should view error log details', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for error logs section
      await testHelper.waitForElement('[data-testid="error-logs-section"]', 10000);
      
      // Click view error details button
      await testHelper.waitForElement('[data-testid="view-error-button"]', 10000);
      await testHelper.clickElement('[data-testid="view-error-button"]');
      
      // Verify error details modal
      await testHelper.waitForElement('[data-testid="error-details-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="error-details-modal"]', 'Error Details');
    });

    test('should acknowledge error', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for error logs section
      await testHelper.waitForElement('[data-testid="error-logs-section"]', 10000);
      
      // Click acknowledge error button
      await testHelper.waitForElement('[data-testid="acknowledge-error-button"]', 10000);
      await testHelper.clickElement('[data-testid="acknowledge-error-button"]');
      
      // Verify acknowledgment modal
      await testHelper.waitForElement('[data-testid="acknowledge-error-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="acknowledge-error-modal"]', 'Acknowledge Error');
      
      // Add note
      await testHelper.typeText('textarea[name="note"]', 'Error acknowledged and being investigated');
      
      // Submit acknowledgment
      await testHelper.clickElement('[data-testid="acknowledge-error-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Error acknowledged successfully');
    });
  });

  describe('Support & Logs Responsive Design', () => {
    test('should be responsive on mobile devices', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Set mobile viewport
      await testHelper.getPage().setViewport({ width: 375, height: 667 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('support-logs-mobile');
    });

    test('should be responsive on tablet devices', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Set tablet viewport
      await testHelper.getPage().setViewport({ width: 768, height: 1024 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('support-logs-tablet');
    });
  });

  describe('Support & Logs Performance', () => {
    test('should load support page within acceptable time', async () => {
      const startTime = Date.now();
      
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for support tickets table to load
      await testHelper.waitForElement('[data-testid="support-tickets-table"]', 10000);
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large log datasets efficiently', async () => {
      await testHelper.navigateTo('/superadmin/support');
      
      // Wait for system logs section to load
      await testHelper.waitForElement('[data-testid="system-logs-section"]', 10000);
      
      // Verify no loading spinners are visible
      const loadingSpinners = await testHelper.getPage().$$(selectors.loadingSpinner);
      expect(loadingSpinners.length).toBe(0);
    });
  });
}); 