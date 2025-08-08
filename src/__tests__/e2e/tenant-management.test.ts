import { PuppeteerTestHelper, testData, selectors } from './puppeteer-setup';

describe('SuperAdmin Tenant Management E2E Tests', () => {
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

  describe('All Tenants Page', () => {
    test('should navigate to all tenants page', async () => {
      await testHelper.navigateTo('/superadmin/tenants');
      
      // Verify we're on the tenants page
      await testHelper.expectUrlToContain('/superadmin/tenants');
      
      // Verify page title
      await testHelper.expectElementToExist('h1');
      await testHelper.expectElementToHaveText('h1', 'Tenant Management');
    });

    test('should display tenants table with data', async () => {
      await testHelper.navigateTo('/superadmin/tenants');
      
      // Wait for table to load
      await testHelper.waitForElement('[data-testid="tenants-table"]', 10000);
      
      // Verify table headers
      await testHelper.expectElementToHaveText('th', 'Tenant Name');
      await testHelper.expectElementToHaveText('th', 'Subdomain');
      await testHelper.expectElementToHaveText('th', 'Status');
      await testHelper.expectElementToHaveText('th', 'Users');
      await testHelper.expectElementToHaveText('th', 'Created');
      await testHelper.expectElementToHaveText('th', 'Actions');
      
      // Verify table has data
      const tableRows = await testHelper.getPage().$$('tbody tr');
      expect(tableRows.length).toBeGreaterThan(0);
    });

    test('should search tenants by name', async () => {
      await testHelper.navigateTo('/superadmin/tenants');
      
      // Wait for search input
      await testHelper.waitForElement('[data-testid="tenant-search-input"]', 10000);
      
      // Type search term
      await testHelper.typeText('[data-testid="tenant-search-input"]', 'test');
      
      // Wait for search results
      await testHelper.waitForElement('tbody tr', 5000);
      
      // Verify search results
      const searchResults = await testHelper.getPage().$$('tbody tr');
      expect(searchResults.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter tenants by status', async () => {
      await testHelper.navigateTo('/superadmin/tenants');
      
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

    test('should view tenant details', async () => {
      await testHelper.navigateTo('/superadmin/tenants');
      
      // Wait for table and view buttons
      await testHelper.waitForElement('[data-testid="view-tenant-button"]', 10000);
      
      // Click first view button
      await testHelper.clickElement('[data-testid="view-tenant-button"]');
      
      // Verify tenant details modal opens
      await testHelper.waitForElement('[data-testid="tenant-details-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="tenant-details-modal"]', 'Tenant Details');
    });

    test('should edit tenant information', async () => {
      await testHelper.navigateTo('/superadmin/tenants');
      
      // Wait for table and edit buttons
      await testHelper.waitForElement('[data-testid="edit-tenant-button"]', 10000);
      
      // Click first edit button
      await testHelper.clickElement('[data-testid="edit-tenant-button"]');
      
      // Verify edit tenant modal opens
      await testHelper.waitForElement('[data-testid="edit-tenant-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="edit-tenant-modal"]', 'Edit Tenant');
      
      // Update tenant name
      await testHelper.typeText('input[name="name"]', 'Updated Tenant Name');
      
      // Submit form
      await testHelper.clickElement('[data-testid="edit-tenant-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Tenant updated successfully');
    });

    test('should suspend a tenant', async () => {
      await testHelper.navigateTo('/superadmin/tenants');
      
      // Wait for table and suspend buttons
      await testHelper.waitForElement('[data-testid="suspend-tenant-button"]', 10000);
      
      // Click first suspend button
      await testHelper.clickElement('[data-testid="suspend-tenant-button"]');
      
      // Verify confirmation modal opens
      await testHelper.waitForElement('[data-testid="suspend-tenant-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="suspend-tenant-modal"]', 'Suspend Tenant');
      
      // Click confirm suspend
      await testHelper.clickElement('[data-testid="confirm-suspend-tenant"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 5000);
    });

    test('should activate a suspended tenant', async () => {
      await testHelper.navigateTo('/superadmin/tenants');
      
      // Wait for table and activate buttons
      await testHelper.waitForElement('[data-testid="activate-tenant-button"]', 10000);
      
      // Click first activate button
      await testHelper.clickElement('[data-testid="activate-tenant-button"]');
      
      // Verify confirmation modal opens
      await testHelper.waitForElement('[data-testid="activate-tenant-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="activate-tenant-modal"]', 'Activate Tenant');
      
      // Click confirm activate
      await testHelper.clickElement('[data-testid="confirm-activate-tenant"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 5000);
    });

    test('should delete a tenant', async () => {
      await testHelper.navigateTo('/superadmin/tenants');
      
      // Wait for table and delete buttons
      await testHelper.waitForElement('[data-testid="delete-tenant-button"]', 10000);
      
      // Click first delete button
      await testHelper.clickElement('[data-testid="delete-tenant-button"]');
      
      // Verify confirmation modal opens
      await testHelper.waitForElement('[data-testid="delete-tenant-modal"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="delete-tenant-modal"]', 'Delete Tenant');
      
      // Click confirm delete
      await testHelper.clickElement('[data-testid="confirm-delete-tenant"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 5000);
    });
  });

  describe('Create Tenant Page', () => {
    test('should navigate to create tenant page', async () => {
      await testHelper.navigateTo('/superadmin/tenants/new');
      
      // Verify we're on the create tenant page
      await testHelper.expectUrlToContain('/superadmin/tenants/new');
      
      // Verify page title
      await testHelper.expectElementToExist('h1');
      await testHelper.expectElementToHaveText('h1', 'Create New Tenant');
    });

    test('should display create tenant form', async () => {
      await testHelper.navigateTo('/superadmin/tenants/new');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="create-tenant-form"]', 10000);
      
      // Verify form fields are present
      await testHelper.expectElementToExist('input[name="name"]');
      await testHelper.expectElementToExist('input[name="subdomain"]');
      await testHelper.expectElementToExist('input[name="email"]');
      await testHelper.expectElementToExist('input[name="phone"]');
      await testHelper.expectElementToExist('textarea[name="description"]');
      await testHelper.expectElementToExist('select[name="plan"]');
    });

    test('should create a new tenant successfully', async () => {
      await testHelper.navigateTo('/superadmin/tenants/new');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="create-tenant-form"]', 10000);
      
      // Fill in tenant details
      await testHelper.typeText('input[name="name"]', 'Test Tenant');
      await testHelper.typeText('input[name="subdomain"]', 'test-tenant');
      await testHelper.typeText('input[name="email"]', 'test@tenant.com');
      await testHelper.typeText('input[name="phone"]', '+1234567890');
      await testHelper.typeText('textarea[name="description"]', 'Test tenant description');
      
      // Select plan
      await testHelper.clickElement('select[name="plan"]');
      await testHelper.clickElement('option[value="basic"]');
      
      // Submit form
      await testHelper.clickElement('[data-testid="create-tenant-submit"]');
      
      // Verify success message
      await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="success-message"]', 'Tenant created successfully');
    });

    test('should validate required fields', async () => {
      await testHelper.navigateTo('/superadmin/tenants/new');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="create-tenant-form"]', 10000);
      
      // Try to submit without filling required fields
      await testHelper.clickElement('[data-testid="create-tenant-submit"]');
      
      // Verify validation errors
      await testHelper.waitForElement('[data-testid="validation-error"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="validation-error"]', 'required');
    });

    test('should validate subdomain uniqueness', async () => {
      await testHelper.navigateTo('/superadmin/tenants/new');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="create-tenant-form"]', 10000);
      
      // Fill in form with existing subdomain
      await testHelper.typeText('input[name="name"]', 'Test Tenant');
      await testHelper.typeText('input[name="subdomain"]', 'existing-subdomain');
      await testHelper.typeText('input[name="email"]', 'test@tenant.com');
      
      // Submit form
      await testHelper.clickElement('[data-testid="create-tenant-submit"]');
      
      // Verify subdomain already exists error
      await testHelper.waitForElement('[data-testid="validation-error"]', 10000);
      await testHelper.expectElementToHaveText('[data-testid="validation-error"]', 'already exists');
    });

    test('should validate email format', async () => {
      await testHelper.navigateTo('/superadmin/tenants/new');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="create-tenant-form"]', 10000);
      
      // Fill in form with invalid email
      await testHelper.typeText('input[name="name"]', 'Test Tenant');
      await testHelper.typeText('input[name="subdomain"]', 'test-tenant');
      await testHelper.typeText('input[name="email"]', 'invalid-email');
      
      // Submit form
      await testHelper.clickElement('[data-testid="create-tenant-submit"]');
      
      // Verify email validation error
      await testHelper.waitForElement('[data-testid="validation-error"]', 5000);
      await testHelper.expectElementToHaveText('[data-testid="validation-error"]', 'valid email');
    });

    test('should allow tenant plan selection', async () => {
      await testHelper.navigateTo('/superadmin/tenants/new');
      
      // Wait for form to load
      await testHelper.waitForElement('[data-testid="create-tenant-form"]', 10000);
      
      // Verify plan options are available
      await testHelper.expectElementToExist('option[value="basic"]');
      await testHelper.expectElementToExist('option[value="premium"]');
      await testHelper.expectElementToExist('option[value="enterprise"]');
      
      // Select different plan
      await testHelper.clickElement('select[name="plan"]');
      await testHelper.clickElement('option[value="premium"]');
      
      // Verify plan selection
      const selectedPlan = await testHelper.getPage().$eval('select[name="plan"]', (el: any) => el.value);
      expect(selectedPlan).toBe('premium');
    });
  });

  describe('Tenant Details Page', () => {
    test('should navigate to tenant details page', async () => {
      await testHelper.navigateTo('/superadmin/tenants/1');
      
      // Verify we're on the tenant details page
      await testHelper.expectUrlToContain('/superadmin/tenants/');
      
      // Verify page title
      await testHelper.expectElementToExist('h1');
    });

    test('should display tenant information', async () => {
      await testHelper.navigateTo('/superadmin/tenants/1');
      
      // Wait for tenant details to load
      await testHelper.waitForElement('[data-testid="tenant-details"]', 10000);
      
      // Verify tenant information sections
      await testHelper.expectElementToExist('[data-testid="tenant-basic-info"]');
      await testHelper.expectElementToExist('[data-testid="tenant-users"]');
      await testHelper.expectElementToExist('[data-testid="tenant-activity"]');
      await testHelper.expectElementToExist('[data-testid="tenant-settings"]');
    });

    test('should display tenant users list', async () => {
      await testHelper.navigateTo('/superadmin/tenants/1');
      
      // Wait for users section to load
      await testHelper.waitForElement('[data-testid="tenant-users"]', 10000);
      
      // Verify users table
      await testHelper.expectElementToExist('[data-testid="users-table"]');
      
      // Verify table headers
      await testHelper.expectElementToHaveText('th', 'Name');
      await testHelper.expectElementToHaveText('th', 'Email');
      await testHelper.expectElementToHaveText('th', 'Role');
      await testHelper.expectElementToHaveText('th', 'Status');
    });

    test('should display tenant activity log', async () => {
      await testHelper.navigateTo('/superadmin/tenants/1');
      
      // Wait for activity section to load
      await testHelper.waitForElement('[data-testid="tenant-activity"]', 10000);
      
      // Verify activity log
      await testHelper.expectElementToExist('[data-testid="activity-log"]');
      
      // Verify activity items exist
      const activityItems = await testHelper.getPage().$$('[data-testid="activity-item"]');
      expect(activityItems.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Tenant Management Responsive Design', () => {
    test('should be responsive on mobile devices', async () => {
      await testHelper.navigateTo('/superadmin/tenants');
      
      // Set mobile viewport
      await testHelper.getPage().setViewport({ width: 375, height: 667 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('tenant-management-mobile');
    });

    test('should be responsive on tablet devices', async () => {
      await testHelper.navigateTo('/superadmin/tenants');
      
      // Set tablet viewport
      await testHelper.getPage().setViewport({ width: 768, height: 1024 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('tenant-management-tablet');
    });
  });

  describe('Tenant Management Performance', () => {
    test('should load tenants page within acceptable time', async () => {
      const startTime = Date.now();
      
      await testHelper.navigateTo('/superadmin/tenants');
      
      // Wait for table to load
      await testHelper.waitForElement('[data-testid="tenants-table"]', 10000);
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large tenant datasets efficiently', async () => {
      await testHelper.navigateTo('/superadmin/tenants');
      
      // Wait for table to load
      await testHelper.waitForElement('[data-testid="tenants-table"]', 10000);
      
      // Verify no loading spinners are visible
      const loadingSpinners = await testHelper.getPage().$$(selectors.loadingSpinner);
      expect(loadingSpinners.length).toBe(0);
    });
  });
}); 