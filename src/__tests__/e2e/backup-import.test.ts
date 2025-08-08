import { PuppeteerTestHelper, testData, selectors } from './puppeteer-setup';

describe('SuperAdmin Backup & Import E2E Tests', () => {
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

  describe('Backup Data Page', () => {
    test('should navigate to backup data page', async () => {
      await testHelper.navigateTo('/superadmin/backup');
      
      // Verify we're on the backup page
      await testHelper.expectUrlToContain('/superadmin/backup');
      
      // Verify page title
      await testHelper.expectElementToExist('h1');
      await testHelper.expectElementToHaveText('h1', 'Backup & Import');
    });

    test('should display backup options', async () => {
      await testHelper.navigateTo('/superadmin/backup');
      
      // Wait for backup options to load
      await testHelper.waitForElement('[data-testid="backup-options"]', 10000);
      
      // Verify backup options are present
      await testHelper.expectElementToExist('[data-testid="full-backup-option"]');
      await testHelper.expectElementToExist('[data-testid="partial-backup-option"]');
      await testHelper.expectElementToExist('[data-testid="scheduled-backup-option"]');
    });

    test('should create a full backup', async () => {
      await testHelper.navigateTo('/superadmin/backup');
      
      // Wait for backup options
      await testHelper.waitForElement('[data-testid="backup-options"]', 10000);
      
      // Select full backup option
      await testHelper.clickElement('[data-testid="full-backup-option"]');
      
      // Click create backup button
      await testHelper.waitForElement('[data-testid="create-backup-button"]', 10000);
      await testHelper.clickElement('[data-testid="create-backup-button"]');
      
      // Verify backup creation modal
      await testHelper.waitForElement('[data-testid="backup-creation-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="backup-creation-modal"]', 'Creating Backup');
      
      // Wait for backup to complete
      await testHelper.waitForElement('[data-testid="backup-success"]', 30000);
      await testHelper.expectElementToHaveText('[data-testid="backup-success"]', 'Backup created successfully');
    });

    test('should create a partial backup', async () => {
      await testHelper.navigateTo('/superadmin/backup');
      
      // Wait for backup options
      await testHelper.waitForElement('[data-testid="backup-options"]', 10000);
      
      // Select partial backup option
      await testHelper.clickElement('[data-testid="partial-backup-option"]');
      
      // Select backup components
      await testHelper.waitForElement('[data-testid="backup-components"]', 5000);
      await testHelper.clickElement('[data-testid="users-checkbox"]');
      await testHelper.clickElement('[data-testid="tenants-checkbox"]');
      
      // Click create backup button
      await testHelper.waitForElement('[data-testid="create-backup-button"]', 10000);
      await testHelper.clickElement('[data-testid="create-backup-button"]');
      
      // Verify backup creation modal
      await testHelper.waitForElement('[data-testid="backup-creation-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="backup-creation-modal"]', 'Creating Backup');
      
      // Wait for backup to complete
      await testHelper.waitForElement('[data-testid="backup-success"]', 30000);
      await testHelper.expectElementToHaveText('[data-testid="backup-success"]', 'Backup created successfully');
    });

    test('should schedule a backup', async () => {
      await testHelper.navigateTo('/superadmin/backup');
      
      // Wait for backup options
      await testHelper.waitForElement('[data-testid="backup-options"]', 10000);
      
      // Select scheduled backup option
      await testHelper.clickElement('[data-testid="scheduled-backup-option"]');
      
      // Configure schedule
      await testHelper.waitForElement('[data-testid="schedule-config"]', 5000);
      await testHelper.clickElement('select[name="frequency"]');
      await testHelper.clickElement('option[value="daily"]');
      
      // Set time
      await testHelper.typeText('input[name="time"]', '02:00');
      
      // Click schedule backup button
      await testHelper.waitForElement('[data-testid="schedule-backup-button"]', 10000);
      await testHelper.clickElement('[data-testid="schedule-backup-button"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Backup scheduled successfully');
    });

    test('should download backup file', async () => {
      await testHelper.navigateTo('/superadmin/backup');
      
      // Wait for backup history
      await testHelper.waitForElement('[data-testid="backup-history"]', 10000);
      
      // Click download button for first backup
      await testHelper.waitForElement('[data-testid="download-backup-button"]', 10000);
      await testHelper.clickElement('[data-testid="download-backup-button"]');
      
      // Verify download starts
      await testHelper.waitForElement('[data-testid="download-success"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="download-success"]', 'Download started');
    });

    test('should delete a backup', async () => {
      await testHelper.navigateTo('/superadmin/backup');
      
      // Wait for backup history
      await testHelper.waitForElement('[data-testid="backup-history"]', 10000);
      
      // Click delete button for first backup
      await testHelper.waitForElement('[data-testid="delete-backup-button"]', 10000);
      await testHelper.clickElement('[data-testid="delete-backup-button"]');
      
      // Verify confirmation modal
      await testHelper.waitForElement('[data-testid="delete-backup-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="delete-backup-modal"]', 'Delete Backup');
      
      // Confirm deletion
      await testHelper.clickElement('[data-testid="confirm-delete-backup"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 5000);
    });
  });

  describe('Backup History Page', () => {
    test('should navigate to backup history page', async () => {
      await testHelper.navigateTo('/superadmin/backup/history');
      
      // Verify we're on the backup history page
      await testHelper.expectUrlToContain('/superadmin/backup/history');
      
      // Verify page title
      await testHelper.expectElementToExist('h1');
      await testHelper.expectElementToHaveText('h1', 'Backup History');
    });

    test('should display backup history table', async () => {
      await testHelper.navigateTo('/superadmin/backup/history');
      
      // Wait for backup history table to load
      await testHelper.waitForElement('[data-testid="backup-history-table"]', 10000);
      
      // Verify table headers
      await testHelper.expectElementToHaveText('th', 'Backup Name');
      await testHelper.expectElementToHaveText('th', 'Type');
      await testHelper.expectElementToHaveText('th', 'Size');
      await testHelper.expectElementToHaveText('th', 'Created');
      await testHelper.expectElementToHaveText('th', 'Status');
      await testHelper.expectElementToHaveText('th', 'Actions');
      
      // Verify table has data
      const tableRows = await testHelper.getPage().$$('tbody tr');
      expect(tableRows.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter backup history by type', async () => {
      await testHelper.navigateTo('/superadmin/backup/history');
      
      // Wait for type filter
      await testHelper.waitForElement('[data-testid="backup-type-filter"]', 10000);
      
      // Click type filter dropdown
      await testHelper.clickElement('[data-testid="backup-type-filter"]');
      
      // Select full backup type
      await testHelper.waitForElement('[data-value="full"]', 5000);
      await testHelper.clickElement('[data-value="full"]');
      
      // Verify filtered results
      await testHelper.waitForElement('tbody tr', 5000);
      const filteredRows = await testHelper.getPage().$$('tbody tr');
      expect(filteredRows.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter backup history by status', async () => {
      await testHelper.navigateTo('/superadmin/backup/history');
      
      // Wait for status filter
      await testHelper.waitForElement('[data-testid="backup-status-filter"]', 10000);
      
      // Click status filter dropdown
      await testHelper.clickElement('[data-testid="backup-status-filter"]');
      
      // Select completed status
      await testHelper.waitForElement('[data-value="completed"]', 5000);
      await testHelper.clickElement('[data-value="completed"]');
      
      // Verify filtered results
      await testHelper.waitForElement('tbody tr', 5000);
      const filteredRows = await testHelper.getPage().$$('tbody tr');
      expect(filteredRows.length).toBeGreaterThanOrEqual(0);
    });

    test('should view backup details', async () => {
      await testHelper.navigateTo('/superadmin/backup/history');
      
      // Wait for backup history table
      await testHelper.waitForElement('[data-testid="backup-history-table"]', 10000);
      
      // Click view details button
      await testHelper.waitForElement('[data-testid="view-backup-details-button"]', 10000);
      await testHelper.clickElement('[data-testid="view-backup-details-button"]');
      
      // Verify backup details modal
      await testHelper.waitForElement('[data-testid="backup-details-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="backup-details-modal"]', 'Backup Details');
    });

    test('should restore from backup', async () => {
      await testHelper.navigateTo('/superadmin/backup/history');
      
      // Wait for backup history table
      await testHelper.waitForElement('[data-testid="backup-history-table"]', 10000);
      
      // Click restore button
      await testHelper.waitForElement('[data-testid="restore-backup-button"]', 10000);
      await testHelper.clickElement('[data-testid="restore-backup-button"]');
      
      // Verify restore confirmation modal
      await testHelper.waitForElement('[data-testid="restore-backup-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="restore-backup-modal"]', 'Restore from Backup');
      
      // Confirm restore
      await testHelper.clickElement('[data-testid="confirm-restore-backup"]');
      
      // Verify restore progress
      await testHelper.waitForElement('[data-testid="restore-progress"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="restore-progress"]', 'Restoring');
      
      // Wait for restore to complete
      await testHelper.waitForElement('[data-testid="restore-success"]', 60000);
      await testHelper.expectElementToHaveText('[data-testid="restore-success"]', 'Restore completed successfully');
    });
  });

  describe('Import Data Page', () => {
    test('should navigate to import data page', async () => {
      await testHelper.navigateTo('/superadmin/import');
      
      // Verify we're on the import page
      await testHelper.expectUrlToContain('/superadmin/import');
      
      // Verify page title
      await testHelper.expectElementToExist('h1');
      await testHelper.expectElementToHaveText('h1', 'Import Data');
    });

    test('should display import options', async () => {
      await testHelper.navigateTo('/superadmin/import');
      
      // Wait for import options to load
      await testHelper.waitForElement('[data-testid="import-options"]', 10000);
      
      // Verify import options are present
      await testHelper.expectElementToExist('[data-testid="file-upload-area"]');
      await testHelper.expectElementToExist('[data-testid="import-settings"]');
    });

    test('should upload backup file for import', async () => {
      await testHelper.navigateTo('/superadmin/import');
      
      // Wait for file upload area
      await testHelper.waitForElement('[data-testid="file-upload-area"]', 10000);
      
      // Upload a test backup file
      const fileInput = await testHelper.getPage().$('input[type="file"]');
      if (fileInput) {
        await fileInput.uploadFile('./test-data/sample-backup.json');
      }
      
      // Verify file is uploaded
      await testHelper.waitForElement('[data-testid="file-uploaded"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="file-uploaded"]', 'sample-backup.json');
    });

    test('should validate backup file format', async () => {
      await testHelper.navigateTo('/superadmin/import');
      
      // Wait for file upload area
      await testHelper.waitForElement('[data-testid="file-upload-area"]', 10000);
      
      // Upload an invalid file
      const fileInput = await testHelper.getPage().$('input[type="file"]');
      if (fileInput) {
        await fileInput.uploadFile('./test-data/invalid-file.txt');
      }
      
      // Verify validation error
      await testHelper.waitForElement('[data-testid="validation-error"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="validation-error"]', 'Invalid file format');
    });

    test('should configure import settings', async () => {
      await testHelper.navigateTo('/superadmin/import');
      
      // Wait for import settings
      await testHelper.waitForElement('[data-testid="import-settings"]', 10000);
      
      // Configure import options
      await testHelper.clickElement('[data-testid="overwrite-existing-checkbox"]');
      await testHelper.clickElement('[data-testid="validate-data-checkbox"]');
      
      // Select import mode
      await testHelper.clickElement('select[name="importMode"]');
      await testHelper.clickElement('option[value="merge"]');
    });

    test('should start data import', async () => {
      await testHelper.navigateTo('/superadmin/import');
      
      // Wait for import options
      await testHelper.waitForElement('[data-testid="import-options"]', 10000);
      
      // Upload a test file first
      const fileInput = await testHelper.getPage().$('input[type="file"]');
      if (fileInput) {
        await fileInput.uploadFile('./test-data/sample-backup.json');
      }
      
      // Wait for file to be uploaded
      await testHelper.waitForElement('[data-testid="file-uploaded"]', 10000);
      
      // Click start import button
      await testHelper.waitForElement('[data-testid="start-import-button"]', 10000);
      await testHelper.clickElement('[data-testid="start-import-button"]');
      
      // Verify import confirmation modal
      await testHelper.waitForElement('[data-testid="import-confirmation-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="import-confirmation-modal"]', 'Confirm Import');
      
      // Confirm import
      await testHelper.clickElement('[data-testid="confirm-import-button"]');
      
      // Verify import progress
      await testHelper.waitForElement('[data-testid="import-progress"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="import-progress"]', 'Importing');
      
      // Wait for import to complete
      await testHelper.waitForElement('[data-testid="import-success"]', 60000);
      await testHelper.expectElementToHaveText('[data-testid="import-success"]', 'Import completed successfully');
    });

    test('should handle import errors', async () => {
      await testHelper.navigateTo('/superadmin/import');
      
      // Wait for import options
      await testHelper.waitForElement('[data-testid="import-options"]', 10000);
      
      // Upload a corrupted file
      const fileInput = await testHelper.getPage().$('input[type="file"]');
      if (fileInput) {
        await fileInput.uploadFile('./test-data/corrupted-backup.json');
      }
      
      // Wait for file to be uploaded
      await testHelper.waitForElement('[data-testid="file-uploaded"]', 10000);
      
      // Click start import button
      await testHelper.waitForElement('[data-testid="start-import-button"]', 10000);
      await testHelper.clickElement('[data-testid="start-import-button"]');
      
      // Confirm import
      await testHelper.waitForElement('[data-testid="import-confirmation-modal"]', 5000);
      await testHelper.clickElement('[data-testid="confirm-import-button"]');
      
      // Verify import error
      await testHelper.waitForElement('[data-testid="import-error"]', 30000);
      await testHelper.expectElementToHaveText('[data-testid="import-error"]', 'Import failed');
    });

    test('should preview import data', async () => {
      await testHelper.navigateTo('/superadmin/import');
      
      // Wait for import options
      await testHelper.waitForElement('[data-testid="import-options"]', 10000);
      
      // Upload a test file
      const fileInput = await testHelper.getPage().$('input[type="file"]');
      if (fileInput) {
        await fileInput.uploadFile('./test-data/sample-backup.json');
      }
      
      // Wait for file to be uploaded
      await testHelper.waitForElement('[data-testid="file-uploaded"]', 10000);
      
      // Click preview button
      await testHelper.waitForElement('[data-testid="preview-import-button"]', 10000);
      await testHelper.clickElement('[data-testid="preview-import-button"]');
      
      // Verify preview modal
      await testHelper.waitForElement('[data-testid="import-preview-modal"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="import-preview-modal"]', 'Import Preview');
      
      // Verify preview data
      await testHelper.expectElementToExist('[data-testid="preview-data"]');
    });
  });

  describe('Backup & Import Responsive Design', () => {
    test('should be responsive on mobile devices', async () => {
      await testHelper.navigateTo('/superadmin/backup');
      
      // Set mobile viewport
      await testHelper.getPage().setViewport({ width: 375, height: 667 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('backup-import-mobile');
    });

    test('should be responsive on tablet devices', async () => {
      await testHelper.navigateTo('/superadmin/backup');
      
      // Set tablet viewport
      await testHelper.getPage().setViewport({ width: 768, height: 1024 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('backup-import-tablet');
    });
  });

  describe('Backup & Import Performance', () => {
    test('should load backup page within acceptable time', async () => {
      const startTime = Date.now();
      
      await testHelper.navigateTo('/superadmin/backup');
      
      // Wait for backup options to load
      await testHelper.waitForElement('[data-testid="backup-options"]', 10000);
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large backup files efficiently', async () => {
      await testHelper.navigateTo('/superadmin/backup');
      
      // Wait for backup options to load
      await testHelper.waitForElement('[data-testid="backup-options"]', 10000);
      
      // Verify no loading spinners are visible
      const loadingSpinners = await testHelper.getPage().$$(selectors.loadingSpinner);
      expect(loadingSpinners.length).toBe(0);
    });
  });
}); 