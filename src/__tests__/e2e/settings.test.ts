import { PuppeteerTestHelper, testData, selectors } from './puppeteer-setup';

describe('SuperAdmin Settings E2E Tests', () => {
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

  describe('Settings Overview', () => {
    test('should navigate to settings page', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Verify we're on the settings page
      await testHelper.expectUrlToContain('/superadmin/settings');
      
      // Verify page title
      await testHelper.expectElementToExist('h1');
      await testHelper.expectElementToHaveText('h1', 'Settings');
    });

    test('should display settings sections', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Wait for settings sections to load
      await testHelper.waitForElement('[data-testid="settings-sections"]', 10000);
      
      // Verify settings sections are present
      await testHelper.expectElementToExist('[data-testid="general-settings"]');
      await testHelper.expectElementToExist('[data-testid="security-settings"]');
      await testHelper.expectElementToExist('[data-testid="email-settings"]');
      await testHelper.expectElementToExist('[data-testid="system-settings"]');
    });
  });

  describe('General Settings', () => {
    test('should display general settings form', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Wait for general settings section
      await testHelper.waitForElement('[data-testid="general-settings"]', 10000);
      
      // Click on general settings tab
      await testHelper.clickElement('[data-testid="general-settings-tab"]');
      
      // Verify general settings form
      await testHelper.waitForElement('[data-testid="general-settings-form"]', 10000);
      
      // Verify form fields
      await testHelper.expectElementToExist('input[name="siteName"]');
      await testHelper.expectElementToExist('input[name="siteDescription"]');
      await testHelper.expectElementToExist('input[name="contactEmail"]');
      await testHelper.expectElementToExist('input[name="contactPhone"]');
      await testHelper.expectElementToExist('select[name="timezone"]');
      await testHelper.expectElementToExist('select[name="dateFormat"]');
    });

    test('should update general settings', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Wait for general settings section
      await testHelper.waitForElement('[data-testid="general-settings"]', 10000);
      
      // Click on general settings tab
      await testHelper.clickElement('[data-testid="general-settings-tab"]');
      
      // Wait for general settings form
      await testHelper.waitForElement('[data-testid="general-settings-form"]', 10000);
      
      // Update site name
      await testHelper.typeText('input[name="siteName"]', 'Updated Site Name');
      
      // Update site description
      await testHelper.typeText('input[name="siteDescription"]', 'Updated site description');
      
      // Update contact email
      await testHelper.typeText('input[name="contactEmail"]', 'updated@example.com');
      
      // Select timezone
      await testHelper.clickElement('select[name="timezone"]');
      await testHelper.clickElement('option[value="UTC"]');
      
      // Save settings
      await testHelper.clickElement('[data-testid="save-general-settings"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Settings updated successfully');
    });

    test('should validate general settings form', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Wait for general settings section
      await testHelper.waitForElement('[data-testid="general-settings"]', 10000);
      
      // Click on general settings tab
      await testHelper.clickElement('[data-testid="general-settings-tab"]');
      
      // Wait for general settings form
      await testHelper.waitForElement('[data-testid="general-settings-form"]', 10000);
      
      // Enter invalid email
      await testHelper.typeText('input[name="contactEmail"]', 'invalid-email');
      
      // Try to save settings
      await testHelper.clickElement('[data-testid="save-general-settings"]');
      
      // Verify validation error
      await testHelper.waitForElement('[data-testid="validation-error"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="validation-error"]', 'valid email');
    });
  });

  describe('Security Settings', () => {
    test('should display security settings form', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Wait for security settings section
      await testHelper.waitForElement('[data-testid="security-settings"]', 10000);
      
      // Click on security settings tab
      await testHelper.clickElement('[data-testid="security-settings-tab"]');
      
      // Verify security settings form
      await testHelper.waitForElement('[data-testid="security-settings-form"]', 10000);
      
      // Verify form fields
      await testHelper.expectElementToExist('input[name="sessionTimeout"]');
      await testHelper.expectElementToExist('input[name="maxLoginAttempts"]');
      await testHelper.expectElementToExist('input[name="passwordMinLength"]');
      await testHelper.expectElementToExist('input[name="passwordExpiryDays"]');
      await testHelper.expectElementToExist('input[name="enableTwoFactor"]');
      await testHelper.expectElementToExist('input[name="enableAuditLogs"]');
    });

    test('should update security settings', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Wait for security settings section
      await testHelper.waitForElement('[data-testid="security-settings"]', 10000);
      
      // Click on security settings tab
      await testHelper.clickElement('[data-testid="security-settings-tab"]');
      
      // Wait for security settings form
      await testHelper.waitForElement('[data-testid="security-settings-form"]', 10000);
      
      // Update session timeout
      await testHelper.typeText('input[name="sessionTimeout"]', '30');
      
      // Update max login attempts
      await testHelper.typeText('input[name="maxLoginAttempts"]', '5');
      
      // Update password minimum length
      await testHelper.typeText('input[name="passwordMinLength"]', '8');
      
      // Enable two-factor authentication
      await testHelper.clickElement('input[name="enableTwoFactor"]');
      
      // Save settings
      await testHelper.clickElement('[data-testid="save-security-settings"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Security settings updated successfully');
    });

    test('should validate security settings form', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Wait for security settings section
      await testHelper.waitForElement('[data-testid="security-settings"]', 10000);
      
      // Click on security settings tab
      await testHelper.clickElement('[data-testid="security-settings-tab"]');
      
      // Wait for security settings form
      await testHelper.waitForElement('[data-testid="security-settings-form"]', 10000);
      
      // Enter invalid session timeout
      await testHelper.typeText('input[name="sessionTimeout"]', '0');
      
      // Try to save settings
      await testHelper.clickElement('[data-testid="save-security-settings"]');
      
      // Verify validation error
      await testHelper.waitForElement('[data-testid="validation-error"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="validation-error"]', 'greater than 0');
    });
  });

  describe('Email Settings', () => {
    test('should display email settings form', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Wait for email settings section
      await testHelper.waitForElement('[data-testid="email-settings"]', 10000);
      
      // Click on email settings tab
      await testHelper.clickElement('[data-testid="email-settings-tab"]');
      
      // Verify email settings form
      await testHelper.waitForElement('[data-testid="email-settings-form"]', 10000);
      
      // Verify form fields
      await testHelper.expectElementToExist('select[name="emailProvider"]');
      await testHelper.expectElementToExist('input[name="smtpHost"]');
      await testHelper.expectElementToExist('input[name="smtpPort"]');
      await testHelper.expectElementToExist('input[name="smtpUsername"]');
      await testHelper.expectElementToExist('input[name="smtpPassword"]');
      await testHelper.expectElementToExist('input[name="fromEmail"]');
      await testHelper.expectElementToExist('input[name="fromName"]');
    });

    test('should update email settings', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Wait for email settings section
      await testHelper.waitForElement('[data-testid="email-settings"]', 10000);
      
      // Click on email settings tab
      await testHelper.clickElement('[data-testid="email-settings-tab"]');
      
      // Wait for email settings form
      await testHelper.waitForElement('[data-testid="email-settings-form"]', 10000);
      
      // Select email provider
      await testHelper.clickElement('select[name="emailProvider"]');
      await testHelper.clickElement('option[value="smtp"]');
      
      // Update SMTP settings
      await testHelper.typeText('input[name="smtpHost"]', 'smtp.example.com');
      await testHelper.typeText('input[name="smtpPort"]', '587');
      await testHelper.typeText('input[name="smtpUsername"]', 'test@example.com');
      await testHelper.typeText('input[name="smtpPassword"]', 'password123');
      
      // Update from email and name
      await testHelper.typeText('input[name="fromEmail"]', 'noreply@example.com');
      await testHelper.typeText('input[name="fromName"]', 'System Admin');
      
      // Save settings
      await testHelper.clickElement('[data-testid="save-email-settings"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Email settings updated successfully');
    });

    test('should test email configuration', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Wait for email settings section
      await testHelper.waitForElement('[data-testid="email-settings"]', 10000);
      
      // Click on email settings tab
      await testHelper.clickElement('[data-testid="email-settings-tab"]');
      
      // Wait for email settings form
      await testHelper.waitForElement('[data-testid="email-settings-form"]', 10000);
      
      // Click test email button
      await testHelper.waitForElement('[data-testid="test-email-button"]', 10000);
      await testHelper.clickElement('[data-testid="test-email-button"]');
      
      // Verify test email modal
      await testHelper.waitForElement('[data-testid="test-email-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="test-email-modal"]', 'Test Email Configuration');
      
      // Enter test email address
      await testHelper.typeText('input[name="testEmail"]', 'test@example.com');
      
      // Send test email
      await testHelper.clickElement('[data-testid="send-test-email"]');
      
      // Verify test email sent
      await testHelper.waitForElement('[data-testid="test-email-success"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="test-email-success"]', 'Test email sent successfully');
    });
  });

  describe('System Settings', () => {
    test('should display system settings form', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Wait for system settings section
      await testHelper.waitForElement('[data-testid="system-settings"]', 10000);
      
      // Click on system settings tab
      await testHelper.clickElement('[data-testid="system-settings-tab"]');
      
      // Verify system settings form
      await testHelper.waitForElement('[data-testid="system-settings-form"]', 10000);
      
      // Verify form fields
      await testHelper.expectElementToExist('input[name="maintenanceMode"]');
      await testHelper.expectElementToExist('input[name="debugMode"]');
      await testHelper.expectElementToExist('input[name="logLevel"]');
      await testHelper.expectElementToExist('input[name="backupFrequency"]');
      await testHelper.expectElementToExist('input[name="maxFileSize"]');
      await testHelper.expectElementToExist('input[name="allowedFileTypes"]');
    });

    test('should update system settings', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Wait for system settings section
      await testHelper.waitForElement('[data-testid="system-settings"]', 10000);
      
      // Click on system settings tab
      await testHelper.clickElement('[data-testid="system-settings-tab"]');
      
      // Wait for system settings form
      await testHelper.waitForElement('[data-testid="system-settings-form"]', 10000);
      
      // Enable debug mode
      await testHelper.clickElement('input[name="debugMode"]');
      
      // Update log level
      await testHelper.clickElement('select[name="logLevel"]');
      await testHelper.clickElement('option[value="debug"]');
      
      // Update backup frequency
      await testHelper.typeText('input[name="backupFrequency"]', 'daily');
      
      // Update max file size
      await testHelper.typeText('input[name="maxFileSize"]', '10');
      
      // Save settings
      await testHelper.clickElement('[data-testid="save-system-settings"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'System settings updated successfully');
    });

    test('should toggle maintenance mode', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Wait for system settings section
      await testHelper.waitForElement('[data-testid="system-settings"]', 10000);
      
      // Click on system settings tab
      await testHelper.clickElement('[data-testid="system-settings-tab"]');
      
      // Wait for system settings form
      await testHelper.waitForElement('[data-testid="system-settings-form"]', 10000);
      
      // Toggle maintenance mode
      await testHelper.clickElement('input[name="maintenanceMode"]');
      
      // Verify maintenance mode confirmation
      await testHelper.waitForElement('[data-testid="maintenance-mode-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="maintenance-mode-modal"]', 'Enable Maintenance Mode');
      
      // Confirm maintenance mode
      await testHelper.clickElement('[data-testid="confirm-maintenance-mode"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Maintenance mode enabled');
    });
  });

  describe('Settings Responsive Design', () => {
    test('should be responsive on mobile devices', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Set mobile viewport
      await testHelper.getPage().setViewport({ width: 375, height: 667 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('settings-mobile');
    });

    test('should be responsive on tablet devices', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Set tablet viewport
      await testHelper.getPage().setViewport({ width: 768, height: 1024 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('settings-tablet');
    });
  });

  describe('Settings Performance', () => {
    test('should load settings page within acceptable time', async () => {
      const startTime = Date.now();
      
      await testHelper.navigateTo('/superadmin/settings');
      
      // Wait for settings sections to load
      await testHelper.waitForElement('[data-testid="settings-sections"]', 10000);
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle settings form submission efficiently', async () => {
      await testHelper.navigateTo('/superadmin/settings');
      
      // Wait for general settings section
      await testHelper.waitForElement('[data-testid="general-settings"]', 10000);
      
      // Click on general settings tab
      await testHelper.clickElement('[data-testid="general-settings-tab"]');
      
      // Wait for general settings form
      await testHelper.waitForElement('[data-testid="general-settings-form"]', 10000);
      
      // Update a setting
      await testHelper.typeText('input[name="siteName"]', 'Test Site Name');
      
      // Save settings
      await testHelper.clickElement('[data-testid="save-general-settings"]');
      
      // Verify no loading spinners are visible during submission
      const loadingSpinners = await testHelper.getPage().$$(selectors.loadingSpinner);
      expect(loadingSpinners.length).toBe(0);
    });
  });
}); 