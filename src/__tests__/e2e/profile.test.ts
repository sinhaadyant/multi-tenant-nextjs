import { PuppeteerTestHelper, testData, selectors } from './puppeteer-setup';

describe('SuperAdmin Profile E2E Tests', () => {
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

  describe('Profile Overview', () => {
    test('should navigate to profile page', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Verify we're on the profile page
      await testHelper.expectUrlToContain('/superadmin/profile');
      
      // Verify page title
      await testHelper.expectElementToExist('h1');
      await testHelper.expectElementToHaveText('h1', 'Profile');
    });

    test('should display profile information', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for profile information to load
      await testHelper.waitForElement('[data-testid="profile-information"]', 10000);
      
      // Verify profile sections are present
      await testHelper.expectElementToExist('[data-testid="personal-info-section"]');
      await testHelper.expectElementToExist('[data-testid="contact-info-section"]');
      await testHelper.expectElementToExist('[data-testid="security-section"]');
      await testHelper.expectElementToExist('[data-testid="preferences-section"]');
    });

    test('should display user avatar', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for profile information to load
      await testHelper.waitForElement('[data-testid="profile-information"]', 10000);
      
      // Verify avatar is present
      await testHelper.expectElementToExist('[data-testid="user-avatar"]');
      
      // Verify avatar image
      const avatar = await testHelper.getPage().$('[data-testid="user-avatar"] img');
      expect(avatar).toBeTruthy();
    });
  });

  describe('Personal Information', () => {
    test('should display personal information form', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for personal information section
      await testHelper.waitForElement('[data-testid="personal-info-section"]', 10000);
      
      // Click edit personal information button
      await testHelper.waitForElement('[data-testid="edit-personal-info-button"]', 10000);
      await testHelper.clickElement('[data-testid="edit-personal-info-button"]');
      
      // Verify personal information form
      await testHelper.waitForElement('[data-testid="personal-info-form"]', 10000);
      
      // Verify form fields
      await testHelper.expectElementToExist('input[name="firstName"]');
      await testHelper.expectElementToExist('input[name="lastName"]');
      await testHelper.expectElementToExist('input[name="displayName"]');
      await testHelper.expectElementToExist('select[name="gender"]');
      await testHelper.expectElementToExist('input[name="dateOfBirth"]');
    });

    test('should update personal information', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for personal information section
      await testHelper.waitForElement('[data-testid="personal-info-section"]', 10000);
      
      // Click edit personal information button
      await testHelper.waitForElement('[data-testid="edit-personal-info-button"]', 10000);
      await testHelper.clickElement('[data-testid="edit-personal-info-button"]');
      
      // Wait for personal information form
      await testHelper.waitForElement('[data-testid="personal-info-form"]', 10000);
      
      // Update personal information
      await testHelper.typeText('input[name="firstName"]', 'Updated First Name');
      await testHelper.typeText('input[name="lastName"]', 'Updated Last Name');
      await testHelper.typeText('input[name="displayName"]', 'Updated Display Name');
      
      // Select gender
      await testHelper.clickElement('select[name="gender"]');
      await testHelper.clickElement('option[value="male"]');
      
      // Update date of birth
      await testHelper.typeText('input[name="dateOfBirth"]', '1990-01-01');
      
      // Save changes
      await testHelper.clickElement('[data-testid="save-personal-info"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Personal information updated successfully');
    });

    test('should validate personal information form', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for personal information section
      await testHelper.waitForElement('[data-testid="personal-info-section"]', 10000);
      
      // Click edit personal information button
      await testHelper.waitForElement('[data-testid="edit-personal-info-button"]', 10000);
      await testHelper.clickElement('[data-testid="edit-personal-info-button"]');
      
      // Wait for personal information form
      await testHelper.waitForElement('[data-testid="personal-info-form"]', 10000);
      
      // Clear required fields
      await testHelper.getPage().$eval('input[name="firstName"]', (el: any) => el.value = '');
      await testHelper.getPage().$eval('input[name="lastName"]', (el: any) => el.value = '');
      
      // Try to save changes
      await testHelper.clickElement('[data-testid="save-personal-info"]');
      
      // Verify validation errors
      await testHelper.waitForElement('[data-testid="validation-error"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="validation-error"]', 'required');
    });
  });

  describe('Contact Information', () => {
    test('should display contact information form', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for contact information section
      await testHelper.waitForElement('[data-testid="contact-info-section"]', 10000);
      
      // Click edit contact information button
      await testHelper.waitForElement('[data-testid="edit-contact-info-button"]', 10000);
      await testHelper.clickElement('[data-testid="edit-contact-info-button"]');
      
      // Verify contact information form
      await testHelper.waitForElement('[data-testid="contact-info-form"]', 10000);
      
      // Verify form fields
      await testHelper.expectElementToExist('input[name="email"]');
      await testHelper.expectElementToExist('input[name="phone"]');
      await testHelper.expectElementToExist('input[name="address"]');
      await testHelper.expectElementToExist('input[name="city"]');
      await testHelper.expectElementToExist('input[name="state"]');
      await testHelper.expectElementToExist('input[name="zipCode"]');
      await testHelper.expectElementToExist('select[name="country"]');
    });

    test('should update contact information', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for contact information section
      await testHelper.waitForElement('[data-testid="contact-info-section"]', 10000);
      
      // Click edit contact information button
      await testHelper.waitForElement('[data-testid="edit-contact-info-button"]', 10000);
      await testHelper.clickElement('[data-testid="edit-contact-info-button"]');
      
      // Wait for contact information form
      await testHelper.waitForElement('[data-testid="contact-info-form"]', 10000);
      
      // Update contact information
      await testHelper.typeText('input[name="phone"]', '+1234567890');
      await testHelper.typeText('input[name="address"]', '123 Main Street');
      await testHelper.typeText('input[name="city"]', 'New York');
      await testHelper.typeText('input[name="state"]', 'NY');
      await testHelper.typeText('input[name="zipCode"]', '10001');
      
      // Select country
      await testHelper.clickElement('select[name="country"]');
      await testHelper.clickElement('option[value="US"]');
      
      // Save changes
      await testHelper.clickElement('[data-testid="save-contact-info"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Contact information updated successfully');
    });

    test('should validate email format', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for contact information section
      await testHelper.waitForElement('[data-testid="contact-info-section"]', 10000);
      
      // Click edit contact information button
      await testHelper.waitForElement('[data-testid="edit-contact-info-button"]', 10000);
      await testHelper.clickElement('[data-testid="edit-contact-info-button"]');
      
      // Wait for contact information form
      await testHelper.waitForElement('[data-testid="contact-info-form"]', 10000);
      
      // Enter invalid email
      await testHelper.typeText('input[name="email"]', 'invalid-email');
      
      // Try to save changes
      await testHelper.clickElement('[data-testid="save-contact-info"]');
      
      // Verify validation error
      await testHelper.waitForElement('[data-testid="validation-error"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="validation-error"]', 'valid email');
    });
  });

  describe('Security Settings', () => {
    test('should display security settings form', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for security section
      await testHelper.waitForElement('[data-testid="security-section"]', 10000);
      
      // Click edit security settings button
      await testHelper.waitForElement('[data-testid="edit-security-button"]', 10000);
      await testHelper.clickElement('[data-testid="edit-security-button"]');
      
      // Verify security settings form
      await testHelper.waitForElement('[data-testid="security-form"]', 10000);
      
      // Verify form fields
      await testHelper.expectElementToExist('input[name="currentPassword"]');
      await testHelper.expectElementToExist('input[name="newPassword"]');
      await testHelper.expectElementToExist('input[name="confirmPassword"]');
      await testHelper.expectElementToExist('input[name="enableTwoFactor"]');
    });

    test('should change password', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for security section
      await testHelper.waitForElement('[data-testid="security-section"]', 10000);
      
      // Click edit security settings button
      await testHelper.waitForElement('[data-testid="edit-security-button"]', 10000);
      await testHelper.clickElement('[data-testid="edit-security-button"]');
      
      // Wait for security settings form
      await testHelper.waitForElement('[data-testid="security-form"]', 10000);
      
      // Enter current password
      await testHelper.typeText('input[name="currentPassword"]', testData.superAdmin.password);
      
      // Enter new password
      await testHelper.typeText('input[name="newPassword"]', 'NewPassword123!');
      
      // Confirm new password
      await testHelper.typeText('input[name="confirmPassword"]', 'NewPassword123!');
      
      // Save changes
      await testHelper.clickElement('[data-testid="save-security-settings"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Password changed successfully');
    });

    test('should validate password change', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for security section
      await testHelper.waitForElement('[data-testid="security-section"]', 10000);
      
      // Click edit security settings button
      await testHelper.waitForElement('[data-testid="edit-security-button"]', 10000);
      await testHelper.clickElement('[data-testid="edit-security-button"]');
      
      // Wait for security settings form
      await testHelper.waitForElement('[data-testid="security-form"]', 10000);
      
      // Enter current password
      await testHelper.typeText('input[name="currentPassword"]', testData.superAdmin.password);
      
      // Enter weak new password
      await testHelper.typeText('input[name="newPassword"]', 'weak');
      
      // Confirm new password
      await testHelper.typeText('input[name="confirmPassword"]', 'weak');
      
      // Try to save changes
      await testHelper.clickElement('[data-testid="save-security-settings"]');
      
      // Verify validation error
      await testHelper.waitForElement('[data-testid="validation-error"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="validation-error"]', 'password strength');
    });

    test('should enable two-factor authentication', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for security section
      await testHelper.waitForElement('[data-testid="security-section"]', 10000);
      
      // Click edit security settings button
      await testHelper.waitForElement('[data-testid="edit-security-button"]', 10000);
      await testHelper.clickElement('[data-testid="edit-security-button"]');
      
      // Wait for security settings form
      await testHelper.waitForElement('[data-testid="security-form"]', 10000);
      
      // Enable two-factor authentication
      await testHelper.clickElement('input[name="enableTwoFactor"]');
      
      // Verify 2FA setup modal
      await testHelper.waitForElement('[data-testid="two-factor-setup-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="two-factor-setup-modal"]', 'Two-Factor Authentication Setup');
      
      // Complete 2FA setup
      await testHelper.waitForElement('[data-testid="qr-code"]', 5000);
      await testHelper.expectElementToExist('[data-testid="qr-code"]');
      
      // Enter verification code
      await testHelper.typeText('input[name="verificationCode"]', '123456');
      
      // Verify 2FA
      await testHelper.clickElement('[data-testid="verify-two-factor"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Two-factor authentication enabled');
    });
  });

  describe('Profile Preferences', () => {
    test('should display preferences form', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for preferences section
      await testHelper.waitForElement('[data-testid="preferences-section"]', 10000);
      
      // Click edit preferences button
      await testHelper.waitForElement('[data-testid="edit-preferences-button"]', 10000);
      await testHelper.clickElement('[data-testid="edit-preferences-button"]');
      
      // Verify preferences form
      await testHelper.waitForElement('[data-testid="preferences-form"]', 10000);
      
      // Verify form fields
      await testHelper.expectElementToExist('select[name="language"]');
      await testHelper.expectElementToExist('select[name="timezone"]');
      await testHelper.expectElementToExist('select[name="dateFormat"]');
      await testHelper.expectElementToExist('select[name="timeFormat"]');
      await testHelper.expectElementToExist('input[name="emailNotifications"]');
      await testHelper.expectElementToExist('input[name="pushNotifications"]');
    });

    test('should update preferences', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for preferences section
      await testHelper.waitForElement('[data-testid="preferences-section"]', 10000);
      
      // Click edit preferences button
      await testHelper.waitForElement('[data-testid="edit-preferences-button"]', 10000);
      await testHelper.clickElement('[data-testid="edit-preferences-button"]');
      
      // Wait for preferences form
      await testHelper.waitForElement('[data-testid="preferences-form"]', 10000);
      
      // Update preferences
      await testHelper.clickElement('select[name="language"]');
      await testHelper.clickElement('option[value="en"]');
      
      await testHelper.clickElement('select[name="timezone"]');
      await testHelper.clickElement('option[value="UTC"]');
      
      await testHelper.clickElement('select[name="dateFormat"]');
      await testHelper.clickElement('option[value="MM/DD/YYYY"]');
      
      await testHelper.clickElement('select[name="timeFormat"]');
      await testHelper.clickElement('option[value="12h"]');
      
      // Enable notifications
      await testHelper.clickElement('input[name="emailNotifications"]');
      await testHelper.clickElement('input[name="pushNotifications"]');
      
      // Save preferences
      await testHelper.clickElement('[data-testid="save-preferences"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Preferences updated successfully');
    });
  });

  describe('Profile Avatar', () => {
    test('should upload profile avatar', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for profile information to load
      await testHelper.waitForElement('[data-testid="profile-information"]', 10000);
      
      // Click change avatar button
      await testHelper.waitForElement('[data-testid="change-avatar-button"]', 10000);
      await testHelper.clickElement('[data-testid="change-avatar-button"]');
      
      // Verify avatar upload modal
      await testHelper.waitForElement('[data-testid="avatar-upload-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="avatar-upload-modal"]', 'Change Profile Picture');
      
      // Upload avatar file
      const fileInput = await testHelper.getPage().$('input[type="file"]');
      if (fileInput) {
        await fileInput.uploadFile('./test-data/avatar.jpg');
      }
      
      // Verify file is uploaded
      await testHelper.waitForElement('[data-testid="avatar-preview"]', 10000);
      await testHelper.expectElementToExist('[data-testid="avatar-preview"]');
      
      // Save avatar
      await testHelper.clickElement('[data-testid="save-avatar"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Avatar updated successfully');
    });

    test('should validate avatar file type', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for profile information to load
      await testHelper.waitForElement('[data-testid="profile-information"]', 10000);
      
      // Click change avatar button
      await testHelper.waitForElement('[data-testid="change-avatar-button"]', 10000);
      await testHelper.clickElement('[data-testid="change-avatar-button"]');
      
      // Wait for avatar upload modal
      await testHelper.waitForElement('[data-testid="avatar-upload-modal"]', 5000);
      
      // Upload invalid file
      const fileInput = await testHelper.getPage().$('input[type="file"]');
      if (fileInput) {
        await fileInput.uploadFile('./test-data/invalid-file.txt');
      }
      
      // Verify validation error
      await testHelper.waitForElement('[data-testid="validation-error"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="validation-error"]', 'Invalid file type');
    });
  });

  describe('Profile Responsive Design', () => {
    test('should be responsive on mobile devices', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Set mobile viewport
      await testHelper.getPage().setViewport({ width: 375, height: 667 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('profile-mobile');
    });

    test('should be responsive on tablet devices', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Set tablet viewport
      await testHelper.getPage().setViewport({ width: 768, height: 1024 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('profile-tablet');
    });
  });

  describe('Profile Performance', () => {
    test('should load profile page within acceptable time', async () => {
      const startTime = Date.now();
      
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for profile information to load
      await testHelper.waitForElement('[data-testid="profile-information"]', 10000);
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle profile form submissions efficiently', async () => {
      await testHelper.navigateTo('/superadmin/profile');
      
      // Wait for personal information section
      await testHelper.waitForElement('[data-testid="personal-info-section"]', 10000);
      
      // Click edit personal information button
      await testHelper.waitForElement('[data-testid="edit-personal-info-button"]', 10000);
      await testHelper.clickElement('[data-testid="edit-personal-info-button"]');
      
      // Wait for personal information form
      await testHelper.waitForElement('[data-testid="personal-info-form"]', 10000);
      
      // Update a field
      await testHelper.typeText('input[name="displayName"]', 'Test Display Name');
      
      // Save changes
      await testHelper.clickElement('[data-testid="save-personal-info"]');
      
      // Verify no loading spinners are visible during submission
      const loadingSpinners = await testHelper.getPage().$$(selectors.loadingSpinner);
      expect(loadingSpinners.length).toBe(0);
    });
  });
}); 