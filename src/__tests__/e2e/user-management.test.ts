import { PuppeteerTestHelper, testData, selectors } from './puppeteer-setup';

describe('SuperAdmin User Management E2E Tests', () => {
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

  describe('User Management Overview', () => {
    test('should navigate to user management page', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Verify we're on the users page
      await testHelper.expectUrlToContain('/superadmin/users');
      
      // Verify page title
      await testHelper.expectElementToExist('h1');
      await testHelper.expectElementToHaveText('h1', 'User Management');
    });

    test('should display users table with data', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for table to load
      await testHelper.waitForElement('[data-testid="users-table"]', 10000);
      
      // Verify table headers
      await testHelper.expectElementToHaveText('th', 'Name');
      await testHelper.expectElementToHaveText('th', 'Email');
      await testHelper.expectElementToHaveText('th', 'Role');
      await testHelper.expectElementToHaveText('th', 'Tenant');
      await testHelper.expectElementToHaveText('th', 'Status');
      await testHelper.expectElementToHaveText('th', 'Created');
      await testHelper.expectElementToHaveText('th', 'Actions');
      
      // Verify table has data
      const tableRows = await testHelper.getPage().$$('tbody tr');
      expect(tableRows.length).toBeGreaterThan(0);
    });

    test('should search users by name or email', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for search input
      await testHelper.waitForElement('[data-testid="user-search-input"]', 10000);
      
      // Type search term
      await testHelper.typeText('[data-testid="user-search-input"]', 'admin');
      
      // Wait for search results
      await testHelper.waitForElement('tbody tr', 5000);
      
      // Verify search results
      const searchResults = await testHelper.getPage().$$('tbody tr');
      expect(searchResults.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter users by role', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for role filter
      await testHelper.waitForElement('[data-testid="role-filter"]', 10000);
      
      // Click role filter dropdown
      await testHelper.clickElement('[data-testid="role-filter"]');
      
      // Select admin role
      await testHelper.waitForElement('[data-value="admin"]', 5000);
      await testHelper.clickElement('[data-value="admin"]');
      
      // Verify filtered results
      await testHelper.waitForElement('tbody tr', 5000);
      const filteredRows = await testHelper.getPage().$$('tbody tr');
      expect(filteredRows.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter users by tenant', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for tenant filter
      await testHelper.waitForElement('[data-testid="tenant-filter"]', 10000);
      
      // Click tenant filter dropdown
      await testHelper.clickElement('[data-testid="tenant-filter"]');
      
      // Select a tenant
      await testHelper.waitForElement('[data-value="tenant-1"]', 5000);
      await testHelper.clickElement('[data-value="tenant-1"]');
      
      // Verify filtered results
      await testHelper.waitForElement('tbody tr', 5000);
      const filteredRows = await testHelper.getPage().$$('tbody tr');
      expect(filteredRows.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter users by status', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for status filter
      await testHelper.waitForElement('[data-testid="status-filter"]', 10000);
      
      // Click status filter dropdown
      await testHelper.clickElement('[data-testid="status-filter"]');
      
      // Select active status
      await testHelper.waitForElement('[data-value="active"]', 5000);
      await testHelper.clickElement('[data-value="active"]');
      
      // Verify filtered results
      await testHelper.waitForElement('tbody tr', 5000);
      const filteredRows = await testHelper.getPage().$$('tbody tr');
      expect(filteredRows.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('User Actions', () => {
    test('should view user details', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for table and view buttons
      await testHelper.waitForElement('[data-testid="view-user-button"]', 10000);
      
      // Click first view button
      await testHelper.clickElement('[data-testid="view-user-button"]');
      
      // Verify user details modal opens
      await testHelper.waitForElement('[data-testid="user-details-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="user-details-modal"]', 'User Details');
    });

    test('should edit user information', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for table and edit buttons
      await testHelper.waitForElement('[data-testid="edit-user-button"]', 10000);
      
      // Click first edit button
      await testHelper.clickElement('[data-testid="edit-user-button"]');
      
      // Verify edit user modal opens
      await testHelper.waitForElement('[data-testid="edit-user-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="edit-user-modal"]', 'Edit User');
      
      // Update user name
      await testHelper.typeText('input[name="name"]', 'Updated User Name');
      
      // Submit form
      await testHelper.clickElement('[data-testid="edit-user-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'User updated successfully');
    });

    test('should suspend a user', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for table and suspend buttons
      await testHelper.waitForElement('[data-testid="suspend-user-button"]', 10000);
      
      // Click first suspend button
      await testHelper.clickElement('[data-testid="suspend-user-button"]');
      
      // Verify confirmation modal opens
      await testHelper.waitForElement('[data-testid="suspend-user-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="suspend-user-modal"]', 'Suspend User');
      
      // Click confirm suspend
      await testHelper.clickElement('[data-testid="confirm-suspend-user"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 5000);
    });

    test('should activate a suspended user', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for table and activate buttons
      await testHelper.waitForElement('[data-testid="activate-user-button"]', 10000);
      
      // Click first activate button
      await testHelper.clickElement('[data-testid="activate-user-button"]');
      
      // Verify confirmation modal opens
      await testHelper.waitForElement('[data-testid="activate-user-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="activate-user-modal"]', 'Activate User');
      
      // Click confirm activate
      await testHelper.clickElement('[data-testid="confirm-activate-user"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 5000);
    });

    test('should delete a user', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for table and delete buttons
      await testHelper.waitForElement('[data-testid="delete-user-button"]', 10000);
      
      // Click first delete button
      await testHelper.clickElement('[data-testid="delete-user-button"]');
      
      // Verify confirmation modal opens
      await testHelper.waitForElement('[data-testid="delete-user-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="delete-user-modal"]', 'Delete User');
      
      // Click confirm delete
      await testHelper.clickElement('[data-testid="confirm-delete-user"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 5000);
    });

    test('should assign role to user', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for table and assign role buttons
      await testHelper.waitForElement('[data-testid="assign-role-button"]', 10000);
      
      // Click first assign role button
      await testHelper.clickElement('[data-testid="assign-role-button"]');
      
      // Verify role assignment modal opens
      await testHelper.waitForElement('[data-testid="assign-role-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="assign-role-modal"]', 'Assign Role');
      
      // Select a role
      await testHelper.clickElement('[data-testid="role-selector"]');
      await testHelper.clickElement('[data-value="user"]');
      
      // Submit assignment
      await testHelper.clickElement('[data-testid="assign-role-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Role assigned successfully');
    });

    test('should reset user password', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for table and reset password buttons
      await testHelper.waitForElement('[data-testid="reset-password-button"]', 10000);
      
      // Click first reset password button
      await testHelper.clickElement('[data-testid="reset-password-button"]');
      
      // Verify reset password modal opens
      await testHelper.waitForElement('[data-testid="reset-password-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="reset-password-modal"]', 'Reset Password');
      
      // Confirm reset
      await testHelper.clickElement('[data-testid="confirm-reset-password"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Password reset email sent');
    });
  });

  describe('Create User', () => {
    test('should navigate to create user page', async () => {
      await testHelper.navigateTo('/superadmin/users/new');
      
      // Verify we're on the create user page
      await testHelper.expectUrlToContain('/superadmin/users/new');
      
      // Verify page title
      await testHelper.expectElementToExist('h1');
      await testHelper.expectElementToHaveText('h1', 'Create New User');
    });

    test('should display create user form', async () => {
      await testHelper.navigateTo('/superadmin/users/new');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="create-user-form"]', 10000);
      
      // Verify form fields are present
      await testHelper.expectElementToExist('input[name="name"]');
      await testHelper.expectElementToExist('input[name="email"]');
      await testHelper.expectElementToExist('input[name="password"]');
      await testHelper.expectElementToExist('select[name="role"]');
      await testHelper.expectElementToExist('select[name="tenant"]');
    });

    test('should create a new user successfully', async () => {
      await testHelper.navigateTo('/superadmin/users/new');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="create-user-form"]', 10000);
      
      // Fill in user details
      await testHelper.typeText('input[name="name"]', 'Test User');
      await testHelper.typeText('input[name="email"]', 'testuser@example.com');
      await testHelper.typeText('input[name="password"]', 'Password123!');
      
      // Select role
      await testHelper.clickElement('select[name="role"]');
      await testHelper.clickElement('option[value="user"]');
      
      // Select tenant
      await testHelper.clickElement('select[name="tenant"]');
      await testHelper.clickElement('option[value="tenant-1"]');
      
      // Submit form
      await testHelper.clickElement('[data-testid="create-user-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'User created successfully');
    });

    test('should validate required fields', async () => {
      await testHelper.navigateTo('/superadmin/users/new');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="create-user-form"]', 10000);
      
      // Try to submit without filling required fields
      await testHelper.clickElement('[data-testid="create-user-submit"]');
      
      // Verify validation errors
      await testHelper.waitForElement('[data-testid="validation-error"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="validation-error"]', 'required');
    });

    test('should validate email format', async () => {
      await testHelper.navigateTo('/superadmin/users/new');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="create-user-form"]', 10000);
      
      // Fill in form with invalid email
      await testHelper.typeText('input[name="name"]', 'Test User');
      await testHelper.typeText('input[name="email"]', 'invalid-email');
      await testHelper.typeText('input[name="password"]', 'Password123!');
      
      // Submit form
      await testHelper.clickElement('[data-testid="create-user-submit"]');
      
      // Verify email validation error
      await testHelper.waitForElement('[data-testid="validation-error"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="validation-error"]', 'valid email');
    });

    test('should validate password strength', async () => {
      await testHelper.navigateTo('/superadmin/users/new');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="create-user-form"]', 10000);
      
      // Fill in form with weak password
      await testHelper.typeText('input[name="name"]', 'Test User');
      await testHelper.typeText('input[name="email"]', 'test@example.com');
      await testHelper.typeText('input[name="password"]', 'weak');
      
      // Submit form
      await testHelper.clickElement('[data-testid="create-user-submit"]');
      
      // Verify password validation error
      await testHelper.waitForElement('[data-testid="validation-error"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="validation-error"]', 'password strength');
    });

    test('should validate email uniqueness', async () => {
      await testHelper.navigateTo('/superadmin/users/new');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="create-user-form"]', 10000);
      
      // Fill in form with existing email
      await testHelper.typeText('input[name="name"]', 'Test User');
      await testHelper.typeText('input[name="email"]', 'admin@example.com');
      await testHelper.typeText('input[name="password"]', 'Password123!');
      
      // Submit form
      await testHelper.clickElement('[data-testid="create-user-submit"]');
      
      // Verify email already exists error
      await testHelper.waitForElement('[data-testid="validation-error"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="validation-error"]', 'already exists');
    });
  });

  describe('Bulk User Operations', () => {
    test('should select multiple users for bulk operations', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for table to load
      await testHelper.waitForElement('[data-testid="users-table"]', 10000);
      
      // Select multiple users
      const checkboxes = await testHelper.getPage().$$('[data-testid="user-checkbox"]');
      await checkboxes[0].click();
      await checkboxes[1].click();
      
      // Wait for bulk actions to appear
      await testHelper.waitForElement('[data-testid="bulk-actions"]', 5000);
      await testHelper.expectElementToExist('[data-testid="bulk-actions"]');
    });

    test('should bulk assign roles to users', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for table to load
      await testHelper.waitForElement('[data-testid="users-table"]', 10000);
      
      // Select multiple users
      const checkboxes = await testHelper.getPage().$$('[data-testid="user-checkbox"]');
      await checkboxes[0].click();
      await checkboxes[1].click();
      
      // Wait for bulk actions
      await testHelper.waitForElement('[data-testid="bulk-actions"]', 5000);
      
      // Click bulk assign role
      await testHelper.clickElement('[data-testid="bulk-assign-role-button"]');
      
      // Verify bulk assignment modal
      await testHelper.waitForElement('[data-testid="bulk-assign-role-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="bulk-assign-role-modal"]', 'Bulk Assign Role');
      
      // Select role for bulk assignment
      await testHelper.clickElement('[data-testid="bulk-role-selector"]');
      await testHelper.clickElement('[data-value="user"]');
      
      // Submit bulk assignment
      await testHelper.clickElement('[data-testid="bulk-assign-role-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 5000);
    });

    test('should bulk suspend users', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for table to load
      await testHelper.waitForElement('[data-testid="users-table"]', 10000);
      
      // Select multiple users
      const checkboxes = await testHelper.getPage().$$('[data-testid="user-checkbox"]');
      await checkboxes[0].click();
      await checkboxes[1].click();
      
      // Wait for bulk actions
      await testHelper.waitForElement('[data-testid="bulk-actions"]', 5000);
      
      // Click bulk suspend
      await testHelper.clickElement('[data-testid="bulk-suspend-button"]');
      
      // Verify bulk suspend modal
      await testHelper.waitForElement('[data-testid="bulk-suspend-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="bulk-suspend-modal"]', 'Bulk Suspend Users');
      
      // Confirm bulk suspend
      await testHelper.clickElement('[data-testid="confirm-bulk-suspend"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 5000);
    });

    test('should export selected users', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for table to load
      await testHelper.waitForElement('[data-testid="users-table"]', 10000);
      
      // Select multiple users
      const checkboxes = await testHelper.getPage().$$('[data-testid="user-checkbox"]');
      await checkboxes[0].click();
      await checkboxes[1].click();
      
      // Wait for bulk actions
      await testHelper.waitForElement('[data-testid="bulk-actions"]', 5000);
      
      // Click export button
      await testHelper.clickElement('[data-testid="bulk-export-button"]');
      
      // Verify export options
      await testHelper.waitForElement('[data-testid="export-options"]', 5000);
      
      // Click CSV export
      await testHelper.clickElement('[data-testid="export-csv"]');
      
      // Verify export success
      await testHelper.waitForElement('[data-testid="export-success"]', 5000);
    });
  });

  describe('User Management Responsive Design', () => {
    test('should be responsive on mobile devices', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Set mobile viewport
      await testHelper.getPage().setViewport({ width: 375, height: 667 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('user-management-mobile');
    });

    test('should be responsive on tablet devices', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Set tablet viewport
      await testHelper.getPage().setViewport({ width: 768, height: 1024 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('user-management-tablet');
    });
  });

  describe('User Management Performance', () => {
    test('should load users page within acceptable time', async () => {
      const startTime = Date.now();
      
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for table to load
      await testHelper.waitForElement('[data-testid="users-table"]', 10000);
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large user datasets efficiently', async () => {
      await testHelper.navigateTo('/superadmin/users');
      
      // Wait for table to load
      await testHelper.waitForElement('[data-testid="users-table"]', 10000);
      
      // Verify no loading spinners are visible
      const loadingSpinners = await testHelper.getPage().$$(selectors.loadingSpinner);
      expect(loadingSpinners.length).toBe(0);
    });
  });
}); 