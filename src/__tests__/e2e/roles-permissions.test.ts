import { PuppeteerTestHelper, testData, selectors } from './puppeteer-setup';

describe('SuperAdmin Roles & Permissions E2E Tests', () => {
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

  describe('Roles Management Page', () => {
    test('should navigate to roles management page', async () => {
      await testHelper.navigateTo('/superadmin/roles');
      
      // Verify we're on the roles page
      await testHelper.expectUrlToContain('/superadmin/roles');
      
      // Verify page elements are present
      await testHelper.expectElementToExist('h1'); // Page title
      await testHelper.expectElementToExist('table'); // Roles table
    });

    test('should display roles table with data', async () => {
      await testHelper.navigateTo('/superadmin/roles');
      
      // Wait for table to load
      await testHelper.waitForElement('table', 10000);
      
      // Verify table headers
      await testHelper.expectElementToHaveText('th', 'Role Name');
      await testHelper.expectElementToHaveText('th', 'Description');
      await testHelper.expectElementToHaveText('th', 'Permissions');
      await testHelper.expectElementToHaveText('th', 'Users');
      await testHelper.expectElementToHaveText('th', 'Created');
      await testHelper.expectElementToHaveText('th', 'Actions');
      
      // Verify table has data
      const tableRows = await testHelper.getPage().$$('tbody tr');
      expect(tableRows.length).toBeGreaterThan(0);
    });

    test('should create a new role', async () => {
      await testHelper.navigateTo('/superadmin/roles');
      
      // Click create role button
      await testHelper.waitForElement('[data-testid="create-role-button"]', 10000);
      await testHelper.clickElement('[data-testid="create-role-button"]');
      
      // Verify create role modal opens
      await testHelper.waitForElement('[data-testid="create-role-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="create-role-modal"]', 'Create New Role');
      
      // Fill in role details
      await testHelper.typeText('input[name="name"]', 'Test Role');
      await testHelper.typeText('textarea[name="description"]', 'Test role description');
      
      // Select permissions
      await testHelper.clickElement('[data-testid="permission-checkbox"]');
      
      // Submit form
      await testHelper.clickElement('[data-testid="create-role-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Role created successfully');
    });

    test('should edit an existing role', async () => {
      await testHelper.navigateTo('/superadmin/roles');
      
      // Wait for table and edit buttons
      await testHelper.waitForElement('[data-testid="edit-role-button"]', 10000);
      
      // Click first edit button
      await testHelper.clickElement('[data-testid="edit-role-button"]');
      
      // Verify edit role modal opens
      await testHelper.waitForElement('[data-testid="edit-role-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="edit-role-modal"]', 'Edit Role');
      
      // Update role description
      await testHelper.typeText('textarea[name="description"]', 'Updated description');
      
      // Submit form
      await testHelper.clickElement('[data-testid="edit-role-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Role updated successfully');
    });

    test('should delete a role', async () => {
      await testHelper.navigateTo('/superadmin/roles');
      
      // Wait for table and delete buttons
      await testHelper.waitForElement('[data-testid="delete-role-button"]', 10000);
      
      // Click first delete button
      await testHelper.clickElement('[data-testid="delete-role-button"]');
      
      // Verify confirmation modal opens
      await testHelper.waitForElement('[data-testid="delete-role-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="delete-role-modal"]', 'Delete Role');
      
      // Click confirm delete
      await testHelper.clickElement('[data-testid="confirm-delete-role"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 5000);
    });

    test('should view role details', async () => {
      await testHelper.navigateTo('/superadmin/roles');
      
      // Wait for table and view buttons
      await testHelper.waitForElement('[data-testid="view-role-button"]', 10000);
      
      // Click first view button
      await testHelper.clickElement('[data-testid="view-role-button"]');
      
      // Verify role details modal opens
      await testHelper.waitForElement('[data-testid="role-details-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="role-details-modal"]', 'Role Details');
    });

    test('should search roles by name', async () => {
      await testHelper.navigateTo('/superadmin/roles');
      
      // Wait for search input
      await testHelper.waitForElement('[data-testid="search-input"]', 10000);
      
      // Type search term
      await testHelper.typeText('[data-testid="search-input"]', 'admin');
      
      // Wait for search results
      await testHelper.waitForElement('tbody tr', 5000);
      
      // Verify search results
      const searchResults = await testHelper.getPage().$$('tbody tr');
      expect(searchResults.length).toBeGreaterThan(0);
    });

    test('should filter roles by permission', async () => {
      await testHelper.navigateTo('/superadmin/roles');
      
      // Wait for permission filter
      await testHelper.waitForElement('[data-testid="permission-filter"]', 10000);
      
      // Click permission filter dropdown
      await testHelper.clickElement('[data-testid="permission-filter"]');
      
      // Select a permission
      await testHelper.waitForElement('[data-value="user_management"]', 5000);
      await testHelper.clickElement('[data-value="user_management"]');
      
      // Verify filtered results
      await testHelper.waitForElement('tbody tr', 5000);
      const filteredRows = await testHelper.getPage().$$('tbody tr');
      expect(filteredRows.length).toBeGreaterThan(0);
    });
  });

  describe('Permission Groups Page', () => {
    test('should navigate to permission groups page', async () => {
      await testHelper.navigateTo('/superadmin/roles?tab=permissions');
      
      // Verify we're on the permissions page
      await testHelper.expectUrlToContain('/superadmin/roles');
      await testHelper.expectUrlToContain('tab=permissions');
      
      // Verify page elements are present
      await testHelper.expectElementToExist('h1'); // Page title
      await testHelper.expectElementToExist('[data-testid="permissions-list"]'); // Permissions list
    });

    test('should display permission groups', async () => {
      await testHelper.navigateTo('/superadmin/roles?tab=permissions');
      
      // Wait for permissions list to load
      await testHelper.waitForElement('[data-testid="permissions-list"]', 10000);
      
      // Verify permission groups are displayed
      await testHelper.expectElementToHaveText('body', 'User Management');
      await testHelper.expectElementToHaveText('body', 'Tenant Management');
      await testHelper.expectElementToHaveText('body', 'System Administration');
    });

    test('should create a new permission group', async () => {
      await testHelper.navigateTo('/superadmin/roles?tab=permissions');
      
      // Click create permission group button
      await testHelper.waitForElement('[data-testid="create-permission-group-button"]', 10000);
      await testHelper.clickElement('[data-testid="create-permission-group-button"]');
      
      // Verify create permission group modal opens
      await testHelper.waitForElement('[data-testid="create-permission-group-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="create-permission-group-modal"]', 'Create Permission Group');
      
      // Fill in permission group details
      await testHelper.typeText('input[name="name"]', 'Test Permission Group');
      await testHelper.typeText('textarea[name="description"]', 'Test permission group description');
      
      // Submit form
      await testHelper.clickElement('[data-testid="create-permission-group-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Permission group created successfully');
    });

    test('should edit a permission group', async () => {
      await testHelper.navigateTo('/superadmin/roles?tab=permissions');
      
      // Wait for edit buttons
      await testHelper.waitForElement('[data-testid="edit-permission-group-button"]', 10000);
      
      // Click first edit button
      await testHelper.clickElement('[data-testid="edit-permission-group-button"]');
      
      // Verify edit modal opens
      await testHelper.waitForElement('[data-testid="edit-permission-group-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="edit-permission-group-modal"]', 'Edit Permission Group');
      
      // Update description
      await testHelper.typeText('textarea[name="description"]', 'Updated description');
      
      // Submit form
      await testHelper.clickElement('[data-testid="edit-permission-group-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Permission group updated successfully');
    });

    test('should delete a permission group', async () => {
      await testHelper.navigateTo('/superadmin/roles?tab=permissions');
      
      // Wait for delete buttons
      await testHelper.waitForElement('[data-testid="delete-permission-group-button"]', 10000);
      
      // Click first delete button
      await testHelper.clickElement('[data-testid="delete-permission-group-button"]');
      
      // Verify confirmation modal opens
      await testHelper.waitForElement('[data-testid="delete-permission-group-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="delete-permission-group-modal"]', 'Delete Permission Group');
      
      // Click confirm delete
      await testHelper.clickElement('[data-testid="confirm-delete-permission-group"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 5000);
    });
  });

  describe('Role Assignment Page', () => {
    test('should navigate to role assignment page', async () => {
      await testHelper.navigateTo('/superadmin/roles?tab=assignment');
      
      // Verify we're on the role assignment page
      await testHelper.expectUrlToContain('/superadmin/roles');
      await testHelper.expectUrlToContain('tab=assignment');
      
      // Verify page elements are present
      await testHelper.expectElementToExist('h1'); // Page title
      await testHelper.expectElementToExist('[data-testid="role-assignment-table"]'); // Assignment table
    });

    test('should display role assignment table', async () => {
      await testHelper.navigateTo('/superadmin/roles?tab=assignment');
      
      // Wait for assignment table to load
      await testHelper.waitForElement('[data-testid="role-assignment-table"]', 10000);
      
      // Verify table headers
      await testHelper.expectElementToHaveText('th', 'User');
      await testHelper.expectElementToHaveText('th', 'Current Role');
      await testHelper.expectElementToHaveText('th', 'Available Roles');
      await testHelper.expectElementToHaveText('th', 'Actions');
      
      // Verify table has data
      const tableRows = await testHelper.getPage().$$('tbody tr');
      expect(tableRows.length).toBeGreaterThan(0);
    });

    test('should assign role to user', async () => {
      await testHelper.navigateTo('/superadmin/roles?tab=assignment');
      
      // Wait for assignment table
      await testHelper.waitForElement('[data-testid="role-assignment-table"]', 10000);
      
      // Click assign role button for first user
      await testHelper.waitForElement('[data-testid="assign-role-button"]', 10000);
      await testHelper.clickElement('[data-testid="assign-role-button"]');
      
      // Verify assignment modal opens
      await testHelper.waitForElement('[data-testid="role-assignment-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="role-assignment-modal"]', 'Assign Role');
      
      // Select a role
      await testHelper.clickElement('[data-testid="role-selector"]');
      await testHelper.clickElement('[data-value="admin"]');
      
      // Submit assignment
      await testHelper.clickElement('[data-testid="assign-role-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Role assigned successfully');
    });

    test('should remove role from user', async () => {
      await testHelper.navigateTo('/superadmin/roles?tab=assignment');
      
      // Wait for assignment table
      await testHelper.waitForElement('[data-testid="role-assignment-table"]', 10000);
      
      // Click remove role button for first user
      await testHelper.waitForElement('[data-testid="remove-role-button"]', 10000);
      await testHelper.clickElement('[data-testid="remove-role-button"]');
      
      // Verify confirmation modal opens
      await testHelper.waitForElement('[data-testid="remove-role-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="remove-role-modal"]', 'Remove Role');
      
      // Click confirm remove
      await testHelper.clickElement('[data-testid="confirm-remove-role"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 5000);
    });

    test('should search users for role assignment', async () => {
      await testHelper.navigateTo('/superadmin/roles?tab=assignment');
      
      // Wait for search input
      await testHelper.waitForElement('[data-testid="user-search-input"]', 10000);
      
      // Type search term
      await testHelper.typeText('[data-testid="user-search-input"]', 'admin');
      
      // Wait for search results
      await testHelper.waitForElement('tbody tr', 5000);
      
      // Verify search results
      const searchResults = await testHelper.getPage().$$('tbody tr');
      expect(searchResults.length).toBeGreaterThan(0);
    });

    test('should filter by current role', async () => {
      await testHelper.navigateTo('/superadmin/roles?tab=assignment');
      
      // Wait for role filter
      await testHelper.waitForElement('[data-testid="current-role-filter"]', 10000);
      
      // Click role filter dropdown
      await testHelper.clickElement('[data-testid="current-role-filter"]');
      
      // Select admin role
      await testHelper.waitForElement('[data-value="admin"]', 5000);
      await testHelper.clickElement('[data-value="admin"]');
      
      // Verify filtered results
      await testHelper.waitForElement('tbody tr', 5000);
      const filteredRows = await testHelper.getPage().$$('tbody tr');
      expect(filteredRows.length).toBeGreaterThan(0);
    });

    test('should bulk assign roles', async () => {
      await testHelper.navigateTo('/superadmin/roles?tab=assignment');
      
      // Wait for assignment table
      await testHelper.waitForElement('[data-testid="role-assignment-table"]', 10000);
      
      // Select multiple users
      const checkboxes = await testHelper.getPage().$$('[data-testid="user-checkbox"]');
      await checkboxes[0].click();
      await checkboxes[1].click();
      
      // Wait for bulk actions to appear
      await testHelper.waitForElement('[data-testid="bulk-role-actions"]', 5000);
      
      // Click bulk assign role
      await testHelper.clickElement('[data-testid="bulk-assign-role-button"]');
      
      // Verify bulk assignment modal
      await testHelper.waitForElement('[data-testid="bulk-role-assignment-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="bulk-role-assignment-modal"]', 'Bulk Assign Role');
      
      // Select role for bulk assignment
      await testHelper.clickElement('[data-testid="bulk-role-selector"]');
      await testHelper.clickElement('[data-value="user"]');
      
      // Submit bulk assignment
      await testHelper.clickElement('[data-testid="bulk-assign-role-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 5000);
    });
  });

  describe('Roles & Permissions Responsive Design', () => {
    test('should be responsive on mobile devices', async () => {
      await testHelper.navigateTo('/superadmin/roles');
      
      // Set mobile viewport
      await testHelper.getPage().setViewport({ width: 375, height: 667 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('roles-mobile');
    });

    test('should be responsive on tablet devices', async () => {
      await testHelper.navigateTo('/superadmin/roles');
      
      // Set tablet viewport
      await testHelper.getPage().setViewport({ width: 768, height: 1024 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('roles-tablet');
    });
  });

  describe('Roles & Permissions Performance', () => {
    test('should load roles page within acceptable time', async () => {
      const startTime = Date.now();
      
      await testHelper.navigateTo('/superadmin/roles');
      
      // Wait for table to load
      await testHelper.waitForElement('table', 10000);
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large datasets efficiently', async () => {
      await testHelper.navigateTo('/superadmin/roles');
      
      // Wait for table to load
      await testHelper.waitForElement('table', 10000);
      
      // Verify no loading spinners are visible
      const loadingSpinners = await testHelper.getPage().$$(selectors.loadingSpinner);
      expect(loadingSpinners.length).toBe(0);
    });
  });
}); 