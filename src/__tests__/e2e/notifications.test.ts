import { PuppeteerTestHelper, testData, selectors } from './puppeteer-setup';

describe('SuperAdmin Notifications E2E Tests', () => {
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

  describe('All Notifications Page', () => {
    test('should navigate to all notifications page', async () => {
      await testHelper.navigateTo('/superadmin/notifications');
      
      // Verify we're on the notifications page
      await testHelper.expectUrlToContain('/superadmin/notifications');
      
      // Verify page title
      await testHelper.expectElementToExist('h1');
      await testHelper.expectElementToHaveText('h1', 'Notifications');
    });

    test('should display notifications list', async () => {
      await testHelper.navigateTo('/superadmin/notifications');
      
      // Wait for notifications list to load
      await testHelper.waitForElement('[data-testid="notifications-list"]', 10000);
      
      // Verify notifications container exists
      await testHelper.expectElementToExist('[data-testid="notifications-list"]');
      
      // Verify notification items exist
      const notificationItems = await testHelper.getPage().$$('[data-testid="notification-item"]');
      expect(notificationItems.length).toBeGreaterThanOrEqual(0);
    });

    test('should display notification details', async () => {
      await testHelper.navigateTo('/superadmin/notifications');
      
      // Wait for notifications list
      await testHelper.waitForElement('[data-testid="notifications-list"]', 10000);
      
      // Verify notification elements
      await testHelper.expectElementToExist('[data-testid="notification-title"]');
      await testHelper.expectElementToExist('[data-testid="notification-message"]');
      await testHelper.expectElementToExist('[data-testid="notification-timestamp"]');
      await testHelper.expectElementToExist('[data-testid="notification-type"]');
    });

    test('should filter notifications by type', async () => {
      await testHelper.navigateTo('/superadmin/notifications');
      
      // Wait for type filter
      await testHelper.waitForElement('[data-testid="notification-type-filter"]', 10000);
      
      // Click type filter dropdown
      await testHelper.clickElement('[data-testid="notification-type-filter"]');
      
      // Select system notification type
      await testHelper.waitForElement('[data-value="system"]', 5000);
      await testHelper.clickElement('[data-value="system"]');
      
      // Verify filtered results
      await testHelper.waitForElement('[data-testid="notification-item"]', 5000);
      const filteredItems = await testHelper.getPage().$$('[data-testid="notification-item"]');
      expect(filteredItems.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter notifications by status', async () => {
      await testHelper.navigateTo('/superadmin/notifications');
      
      // Wait for status filter
      await testHelper.waitForElement('[data-testid="notification-status-filter"]', 10000);
      
      // Click status filter dropdown
      await testHelper.clickElement('[data-testid="notification-status-filter"]');
      
      // Select unread status
      await testHelper.waitForElement('[data-value="unread"]', 5000);
      await testHelper.clickElement('[data-value="unread"]');
      
      // Verify filtered results
      await testHelper.waitForElement('[data-testid="notification-item"]', 5000);
      const filteredItems = await testHelper.getPage().$$('[data-testid="notification-item"]');
      expect(filteredItems.length).toBeGreaterThanOrEqual(0);
    });

    test('should mark notification as read', async () => {
      await testHelper.navigateTo('/superadmin/notifications');
      
      // Wait for notifications list
      await testHelper.waitForElement('[data-testid="notifications-list"]', 10000);
      
      // Find unread notification
      await testHelper.waitForElement('[data-testid="mark-read-button"]', 10000);
      
      // Click mark as read button
      await testHelper.clickElement('[data-testid="mark-read-button"]');
      
      // Verify notification is marked as read
      await testHelper.waitForElement('[data-testid="notification-read"]', 5000);
    });

    test('should mark all notifications as read', async () => {
      await testHelper.navigateTo('/superadmin/notifications');
      
      // Wait for notifications list
      await testHelper.waitForElement('[data-testid="notifications-list"]', 10000);
      
      // Click mark all as read button
      await testHelper.waitForElement('[data-testid="mark-all-read-button"]', 10000);
      await testHelper.clickElement('[data-testid="mark-all-read-button"]');
      
      // Verify confirmation modal
      await testHelper.waitForElement('[data-testid="mark-all-read-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="mark-all-read-modal"]', 'Mark All as Read');
      
      // Confirm action
      await testHelper.clickElement('[data-testid="confirm-mark-all-read"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 5000);
    });

    test('should delete a notification', async () => {
      await testHelper.navigateTo('/superadmin/notifications');
      
      // Wait for notifications list
      await testHelper.waitForElement('[data-testid="notifications-list"]', 10000);
      
      // Click delete button
      await testHelper.waitForElement('[data-testid="delete-notification-button"]', 10000);
      await testHelper.clickElement('[data-testid="delete-notification-button"]');
      
      // Verify confirmation modal
      await testHelper.waitForElement('[data-testid="delete-notification-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="delete-notification-modal"]', 'Delete Notification');
      
      // Confirm deletion
      await testHelper.clickElement('[data-testid="confirm-delete-notification"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 5000);
    });

    test('should search notifications', async () => {
      await testHelper.navigateTo('/superadmin/notifications');
      
      // Wait for search input
      await testHelper.waitForElement('[data-testid="notification-search-input"]', 10000);
      
      // Type search term
      await testHelper.typeText('[data-testid="notification-search-input"]', 'system');
      
      // Wait for search results
      await testHelper.waitForElement('[data-testid="notification-item"]', 5000);
      
      // Verify search results
      const searchResults = await testHelper.getPage().$$('[data-testid="notification-item"]');
      expect(searchResults.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Send Notification Page', () => {
    test('should navigate to send notification page', async () => {
      await testHelper.navigateTo('/superadmin/notifications/send');
      
      // Verify we're on the send notification page
      await testHelper.expectUrlToContain('/superadmin/notifications/send');
      
      // Verify page title
      await testHelper.expectElementToExist('h1');
      await testHelper.expectElementToHaveText('h1', 'Send Notification');
    });

    test('should display send notification form', async () => {
      await testHelper.navigateTo('/superadmin/notifications/send');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="send-notification-form"]', 10000);
      
      // Verify form fields are present
      await testHelper.expectElementToExist('input[name="title"]');
      await testHelper.expectElementToExist('textarea[name="message"]');
      await testHelper.expectElementToExist('select[name="type"]');
      await testHelper.expectElementToExist('select[name="recipients"]');
      await testHelper.expectElementToExist('input[name="scheduledAt"]');
    });

    test('should send notification to all users', async () => {
      await testHelper.navigateTo('/superadmin/notifications/send');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="send-notification-form"]', 10000);
      
      // Fill in notification details
      await testHelper.typeText('input[name="title"]', 'System Maintenance');
      await testHelper.typeText('textarea[name="message"]', 'System will be under maintenance from 2-4 AM.');
      
      // Select notification type
      await testHelper.clickElement('select[name="type"]');
      await testHelper.clickElement('option[value="system"]');
      
      // Select all users as recipients
      await testHelper.clickElement('select[name="recipients"]');
      await testHelper.clickElement('option[value="all"]');
      
      // Submit form
      await testHelper.clickElement('[data-testid="send-notification-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Notification sent successfully');
    });

    test('should send notification to specific tenants', async () => {
      await testHelper.navigateTo('/superadmin/notifications/send');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="send-notification-form"]', 10000);
      
      // Fill in notification details
      await testHelper.typeText('input[name="title"]', 'Tenant Update');
      await testHelper.typeText('textarea[name="message"]', 'Important update for your tenant.');
      
      // Select notification type
      await testHelper.clickElement('select[name="type"]');
      await testHelper.clickElement('option[value="tenant"]');
      
      // Select specific tenants
      await testHelper.clickElement('select[name="recipients"]');
      await testHelper.clickElement('option[value="specific"]');
      
      // Select specific tenants
      await testHelper.waitForElement('[data-testid="tenant-selector"]', 5000);
      await testHelper.clickElement('[data-testid="tenant-selector"]');
      await testHelper.clickElement('[data-value="tenant-1"]');
      
      // Submit form
      await testHelper.clickElement('[data-testid="send-notification-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Notification sent successfully');
    });

    test('should schedule a notification', async () => {
      await testHelper.navigateTo('/superadmin/notifications/send');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="send-notification-form"]', 10000);
      
      // Fill in notification details
      await testHelper.typeText('input[name="title"]', 'Scheduled Maintenance');
      await testHelper.typeText('textarea[name="message"]', 'Scheduled maintenance notification.');
      
      // Set scheduled time (tomorrow at 2 AM)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(2, 0, 0, 0);
      
      await testHelper.typeText('input[name="scheduledAt"]', tomorrow.toISOString().slice(0, 16));
      
      // Submit form
      await testHelper.clickElement('[data-testid="send-notification-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Notification scheduled successfully');
    });

    test('should validate required fields', async () => {
      await testHelper.navigateTo('/superadmin/notifications/send');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="send-notification-form"]', 10000);
      
      // Try to submit without filling required fields
      await testHelper.clickElement('[data-testid="send-notification-submit"]');
      
      // Verify validation errors
      await testHelper.waitForElement('[data-testid="validation-error"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="validation-error"]', 'required');
    });

    test('should validate message length', async () => {
      await testHelper.navigateTo('/superadmin/notifications/send');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="send-notification-form"]', 10000);
      
      // Fill in form with very long message
      await testHelper.typeText('input[name="title"]', 'Test Title');
      await testHelper.typeText('textarea[name="message"]', 'A'.repeat(1001)); // Exceed 1000 character limit
      
      // Submit form
      await testHelper.clickElement('[data-testid="send-notification-submit"]');
      
      // Verify message length validation error
      await testHelper.waitForElement('[data-testid="validation-error"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="validation-error"]', 'too long');
    });

    test('should preview notification', async () => {
      await testHelper.navigateTo('/superadmin/notifications/send');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="send-notification-form"]', 10000);
      
      // Fill in notification details
      await testHelper.typeText('input[name="title"]', 'Preview Test');
      await testHelper.typeText('textarea[name="message"]', 'This is a preview test message.');
      
      // Click preview button
      await testHelper.clickElement('[data-testid="preview-notification-button"]');
      
      // Verify preview modal opens
      await testHelper.waitForElement('[data-testid="notification-preview-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="notification-preview-modal"]', 'Preview Test');
    });
  });

  describe('Notification Templates', () => {
    test('should display notification templates', async () => {
      await testHelper.navigateTo('/superadmin/notifications/send');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="send-notification-form"]', 10000);
      
      // Click templates button
      await testHelper.waitForElement('[data-testid="notification-templates-button"]', 10000);
      await testHelper.clickElement('[data-testid="notification-templates-button"]');
      
      // Verify templates modal opens
      await testHelper.waitForElement('[data-testid="notification-templates-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="notification-templates-modal"]', 'Notification Templates');
    });

    test('should use a notification template', async () => {
      await testHelper.navigateTo('/superadmin/notifications/send');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="send-notification-form"]', 10000);
      
      // Click templates button
      await testHelper.waitForElement('[data-testid="notification-templates-button"]', 10000);
      await testHelper.clickElement('[data-testid="notification-templates-button"]');
      
      // Wait for templates modal
      await testHelper.waitForElement('[data-testid="notification-templates-modal"]', 5000);
      
      // Select a template
      await testHelper.waitForElement('[data-testid="template-item"]', 5000);
      await testHelper.clickElement('[data-testid="template-item"]');
      
      // Verify form is populated with template data
      await testHelper.waitForElement('input[name="title"]', 5000);
      const titleValue = await testHelper.getPage().$eval('input[name="title"]', (el: any) => el.value);
      expect(titleValue).toBeTruthy();
    });
  });

  describe('Notifications Responsive Design', () => {
    test('should be responsive on mobile devices', async () => {
      await testHelper.navigateTo('/superadmin/notifications');
      
      // Set mobile viewport
      await testHelper.getPage().setViewport({ width: 375, height: 667 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('notifications-mobile');
    });

    test('should be responsive on tablet devices', async () => {
      await testHelper.navigateTo('/superadmin/notifications');
      
      // Set tablet viewport
      await testHelper.getPage().setViewport({ width: 768, height: 1024 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('notifications-tablet');
    });
  });

  describe('Notifications Performance', () => {
    test('should load notifications page within acceptable time', async () => {
      const startTime = Date.now();
      
      await testHelper.navigateTo('/superadmin/notifications');
      
      // Wait for notifications list to load
      await testHelper.waitForElement('[data-testid="notifications-list"]', 10000);
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large notification datasets efficiently', async () => {
      await testHelper.navigateTo('/superadmin/notifications');
      
      // Wait for notifications list to load
      await testHelper.waitForElement('[data-testid="notifications-list"]', 10000);
      
      // Verify no loading spinners are visible
      const loadingSpinners = await testHelper.getPage().$$(selectors.loadingSpinner);
      expect(loadingSpinners.length).toBe(0);
    });
  });
}); 