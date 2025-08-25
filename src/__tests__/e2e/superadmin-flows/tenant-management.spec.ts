import { test, expect, Page } from '@playwright/test';

// Test data
const SUPERADMIN_CREDENTIALS = {
  email: 'admin@superadmin.com',
  password: 'Test123!@#',
};

const TEST_TENANT = {
  name: 'Test Tenant Corp',
  slug: 'test-tenant-e2e',
  domain: 'test-tenant.example.com',
  adminEmail: 'admin@test-tenant.com',
  adminName: 'Test Admin',
  adminPassword: 'TestAdmin123!',
};

test.describe('SuperAdmin Tenant Management E2E', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Navigate to SuperAdmin login
    await page.goto('/superadmin/auth/login');
    
    // Login as SuperAdmin
    await page.fill('[data-testid="email-input"]', SUPERADMIN_CREDENTIALS.email);
    await page.fill('[data-testid="password-input"]', SUPERADMIN_CREDENTIALS.password);
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('/superadmin/dashboard');
    await expect(page.locator('[data-testid="superadmin-dashboard"]')).toBeVisible();
  });

  test.afterEach(async () => {
    // Cleanup: Delete test tenant if it exists
    try {
      await page.goto('/superadmin/tenants');
      const tenantRow = page.locator(`[data-testid="tenant-row-${TEST_TENANT.slug}"]`);
      if (await tenantRow.isVisible()) {
        await tenantRow.locator('[data-testid="delete-tenant-button"]').click();
        await page.locator('[data-testid="confirm-delete-button"]').click();
        await page.waitForResponse(response => 
          response.url().includes('/api/superadmin/tenants') && response.status() === 200
        );
      }
    } catch (error) {
      console.log('Cleanup error:', error);
    }
    
    await page.close();
  });

  test('should create new tenant with all details', async () => {
    // Navigate to tenants page
    await page.click('[data-testid="sidebar-tenants"]');
    await page.waitForURL('/superadmin/tenants');
    
    // Click create tenant button
    await page.click('[data-testid="create-tenant-button"]');
    await expect(page.locator('[data-testid="create-tenant-modal"]')).toBeVisible();
    
    // Fill tenant details
    await page.fill('[data-testid="tenant-name-input"]', TEST_TENANT.name);
    await page.fill('[data-testid="tenant-slug-input"]', TEST_TENANT.slug);
    await page.fill('[data-testid="tenant-domain-input"]', TEST_TENANT.domain);
    
    // Select modules
    await page.check('[data-testid="module-users"]');
    await page.check('[data-testid="module-roles"]');
    await page.check('[data-testid="module-audit"]');
    await page.check('[data-testid="module-reports"]');
    
    // Fill admin user details
    await page.fill('[data-testid="admin-email-input"]', TEST_TENANT.adminEmail);
    await page.fill('[data-testid="admin-name-input"]', TEST_TENANT.adminName);
    await page.fill('[data-testid="admin-password-input"]', TEST_TENANT.adminPassword);
    
    // Submit form
    await page.click('[data-testid="submit-tenant-button"]');
    
    // Wait for creation success
    await page.waitForResponse(response => 
      response.url().includes('/api/superadmin/tenants') && 
      response.status() === 201
    );
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Tenant created successfully');
    
    // Verify tenant appears in list
    await expect(page.locator(`[data-testid="tenant-row-${TEST_TENANT.slug}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="tenant-name-${TEST_TENANT.slug}"]`)).toContainText(TEST_TENANT.name);
    await expect(page.locator(`[data-testid="tenant-status-${TEST_TENANT.slug}"]`)).toContainText('Active');
  });

  test('should configure tenant settings and modules', async () => {
    // First create a tenant
    await createTestTenant(page);
    
    // Navigate to tenant settings
    await page.click(`[data-testid="edit-tenant-${TEST_TENANT.slug}"]`);
    await expect(page.locator('[data-testid="tenant-settings-modal"]')).toBeVisible();
    
    // Update theme
    await page.selectOption('[data-testid="theme-select"]', 'purple');
    
    // Update language
    await page.selectOption('[data-testid="language-select"]', 'fr');
    
    // Add support module
    await page.check('[data-testid="module-support"]');
    
    // Update settings
    await page.click('[data-testid="update-settings-button"]');
    
    // Wait for update response
    await page.waitForResponse(response => 
      response.url().includes(`/api/superadmin/tenants/${TEST_TENANT.slug}`) && 
      response.status() === 200
    );
    
    // Verify settings were saved
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Settings updated successfully');
    
    // Verify modules are updated
    await page.reload();
    await page.click(`[data-testid="edit-tenant-${TEST_TENANT.slug}"]`);
    await expect(page.locator('[data-testid="module-support"]')).toBeChecked();
    await expect(page.locator('[data-testid="theme-select"]')).toHaveValue('purple');
    await expect(page.locator('[data-testid="language-select"]')).toHaveValue('fr');
  });

  test('should create tenant admin user', async () => {
    // First create a tenant
    await createTestTenant(page);
    
    // Navigate to tenant users
    await page.click(`[data-testid="manage-users-${TEST_TENANT.slug}"]`);
    await page.waitForURL(`/superadmin/tenants/${TEST_TENANT.slug}/users`);
    
    // Verify admin user was created during tenant creation
    await expect(page.locator(`[data-testid="user-row"]`)).toHaveCount(1);
    await expect(page.locator('[data-testid="user-email"]').first()).toContainText(TEST_TENANT.adminEmail);
    await expect(page.locator('[data-testid="user-role"]').first()).toContainText('Admin');
    
    // Create additional user
    await page.click('[data-testid="create-user-button"]');
    await expect(page.locator('[data-testid="create-user-modal"]')).toBeVisible();
    
    await page.fill('[data-testid="user-email-input"]', 'manager@test-tenant.com');
    await page.fill('[data-testid="user-name-input"]', 'Test Manager');
    await page.selectOption('[data-testid="user-role-select"]', 'manager');
    
    await page.click('[data-testid="create-user-submit"]');
    
    // Wait for user creation
    await page.waitForResponse(response => 
      response.url().includes('/api/superadmin/tenants') && 
      response.status() === 201
    );
    
    // Verify new user appears in list
    await expect(page.locator('[data-testid="user-row"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="user-email"]')).toContainText('manager@test-tenant.com');
  });

  test('should verify tenant isolation', async () => {
    // Create first tenant
    await createTestTenant(page);
    
    // Create second tenant
    const secondTenant = {
      ...TEST_TENANT,
      name: 'Second Test Tenant',
      slug: 'second-test-tenant',
      domain: 'second-tenant.example.com',
      adminEmail: 'admin@second-tenant.com',
    };
    
    await page.click('[data-testid="create-tenant-button"]');
    await fillTenantForm(page, secondTenant);
    await page.click('[data-testid="submit-tenant-button"]');
    
    // Wait for creation
    await page.waitForResponse(response => response.status() === 201);
    
    // Navigate to first tenant users
    await page.click(`[data-testid="manage-users-${TEST_TENANT.slug}"]`);
    await page.waitForURL(`/superadmin/tenants/${TEST_TENANT.slug}/users`);
    
    // Verify only first tenant's users are shown
    await expect(page.locator('[data-testid="user-email"]')).toContainText(TEST_TENANT.adminEmail);
    await expect(page.locator('[data-testid="user-email"]')).not.toContainText(secondTenant.adminEmail);
    
    // Navigate to second tenant users
    await page.goto('/superadmin/tenants');
    await page.click(`[data-testid="manage-users-${secondTenant.slug}"]`);
    await page.waitForURL(`/superadmin/tenants/${secondTenant.slug}/users`);
    
    // Verify only second tenant's users are shown
    await expect(page.locator('[data-testid="user-email"]')).toContainText(secondTenant.adminEmail);
    await expect(page.locator('[data-testid="user-email"]')).not.toContainText(TEST_TENANT.adminEmail);
    
    // Cleanup second tenant
    await page.goto('/superadmin/tenants');
    await page.click(`[data-testid="delete-tenant-${secondTenant.slug}"]`);
    await page.click('[data-testid="confirm-delete-button"]');
  });

  test('should deactivate and reactivate tenant', async () => {
    // Create tenant
    await createTestTenant(page);
    
    // Deactivate tenant
    await page.click(`[data-testid="tenant-actions-${TEST_TENANT.slug}"]`);
    await page.click(`[data-testid="deactivate-tenant-${TEST_TENANT.slug}"]`);
    
    // Confirm deactivation
    await expect(page.locator('[data-testid="deactivate-modal"]')).toBeVisible();
    await page.fill('[data-testid="deactivate-reason"]', 'Testing deactivation');
    await page.click('[data-testid="confirm-deactivate"]');
    
    // Wait for deactivation
    await page.waitForResponse(response => 
      response.url().includes(`/api/superadmin/tenants/${TEST_TENANT.slug}/status`) && 
      response.status() === 200
    );
    
    // Verify tenant is deactivated
    await expect(page.locator(`[data-testid="tenant-status-${TEST_TENANT.slug}"]`)).toContainText('Inactive');
    
    // Verify tenant login is blocked
    const tenantLoginPage = await page.context().newPage();
    await tenantLoginPage.goto(`/${TEST_TENANT.slug}/auth/login`);
    await expect(tenantLoginPage.locator('[data-testid="tenant-disabled-message"]')).toBeVisible();
    await tenantLoginPage.close();
    
    // Reactivate tenant
    await page.click(`[data-testid="tenant-actions-${TEST_TENANT.slug}"]`);
    await page.click(`[data-testid="activate-tenant-${TEST_TENANT.slug}"]`);
    await page.click('[data-testid="confirm-activate"]');
    
    // Wait for activation
    await page.waitForResponse(response => response.status() === 200);
    
    // Verify tenant is reactivated
    await expect(page.locator(`[data-testid="tenant-status-${TEST_TENANT.slug}"]`)).toContainText('Active');
  });

  test('should handle tenant creation validation errors', async () => {
    await page.click('[data-testid="create-tenant-button"]');
    
    // Test empty form submission
    await page.click('[data-testid="submit-tenant-button"]');
    
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Name is required');
    await expect(page.locator('[data-testid="slug-error"]')).toContainText('Slug is required');
    await expect(page.locator('[data-testid="domain-error"]')).toContainText('Domain is required');
    
    // Test invalid slug format
    await page.fill('[data-testid="tenant-slug-input"]', 'invalid-slug!@#');
    await page.click('[data-testid="submit-tenant-button"]');
    
    await expect(page.locator('[data-testid="slug-error"]')).toContainText('Invalid slug format');
    
    // Test duplicate slug
    await page.fill('[data-testid="tenant-name-input"]', 'Test Tenant');
    await page.fill('[data-testid="tenant-slug-input"]', 'existing-tenant');
    await page.fill('[data-testid="tenant-domain-input"]', 'test.example.com');
    await page.click('[data-testid="submit-tenant-button"]');
    
    await page.waitForResponse(response => response.status() === 409);
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Slug already exists');
  });

  test('should search and filter tenants', async () => {
    // Create multiple tenants for testing
    await createTestTenant(page);
    
    const tenant2 = {
      ...TEST_TENANT,
      name: 'Another Test Corp',
      slug: 'another-test',
      domain: 'another.example.com',
      adminEmail: 'admin@another.com',
    };
    
    await page.click('[data-testid="create-tenant-button"]');
    await fillTenantForm(page, tenant2);
    await page.click('[data-testid="submit-tenant-button"]');
    await page.waitForResponse(response => response.status() === 201);
    
    // Test search functionality
    await page.fill('[data-testid="tenant-search"]', 'Another');
    await page.waitForTimeout(500); // Wait for debounce
    
    await expect(page.locator('[data-testid="tenant-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="tenant-name"]')).toContainText('Another Test Corp');
    
    // Clear search
    await page.fill('[data-testid="tenant-search"]', '');
    await page.waitForTimeout(500);
    
    await expect(page.locator('[data-testid="tenant-row"]')).toHaveCount.toBeGreaterThan(1);
    
    // Test status filter
    await page.selectOption('[data-testid="status-filter"]', 'active');
    await expect(page.locator('[data-testid="tenant-status"]')).toContainText('Active');
    
    // Cleanup second tenant
    await page.click(`[data-testid="delete-tenant-${tenant2.slug}"]`);
    await page.click('[data-testid="confirm-delete-button"]');
  });

  test('should handle bulk tenant operations', async () => {
    // Create multiple tenants
    const tenants = [
      { ...TEST_TENANT, slug: 'bulk-test-1', name: 'Bulk Test 1' },
      { ...TEST_TENANT, slug: 'bulk-test-2', name: 'Bulk Test 2' },
      { ...TEST_TENANT, slug: 'bulk-test-3', name: 'Bulk Test 3' },
    ];
    
    for (const tenant of tenants) {
      await page.click('[data-testid="create-tenant-button"]');
      await fillTenantForm(page, tenant);
      await page.click('[data-testid="submit-tenant-button"]');
      await page.waitForResponse(response => response.status() === 201);
    }
    
    // Select multiple tenants
    await page.check(`[data-testid="select-tenant-bulk-test-1"]`);
    await page.check(`[data-testid="select-tenant-bulk-test-2"]`);
    
    // Bulk deactivate
    await page.click('[data-testid="bulk-actions-dropdown"]');
    await page.click('[data-testid="bulk-deactivate"]');
    await page.click('[data-testid="confirm-bulk-action"]');
    
    // Wait for bulk operation
    await page.waitForResponse(response => response.status() === 200);
    
    // Verify tenants are deactivated
    await expect(page.locator(`[data-testid="tenant-status-bulk-test-1"]`)).toContainText('Inactive');
    await expect(page.locator(`[data-testid="tenant-status-bulk-test-2"]`)).toContainText('Inactive');
    await expect(page.locator(`[data-testid="tenant-status-bulk-test-3"]`)).toContainText('Active');
    
    // Cleanup
    for (const tenant of tenants) {
      await page.click(`[data-testid="delete-tenant-${tenant.slug}"]`);
      await page.click('[data-testid="confirm-delete-button"]');
    }
  });
});

// Helper functions
async function createTestTenant(page: Page) {
  await page.goto('/superadmin/tenants');
  await page.click('[data-testid="create-tenant-button"]');
  await fillTenantForm(page, TEST_TENANT);
  await page.click('[data-testid="submit-tenant-button"]');
  await page.waitForResponse(response => response.status() === 201);
}

async function fillTenantForm(page: Page, tenant: typeof TEST_TENANT) {
  await page.fill('[data-testid="tenant-name-input"]', tenant.name);
  await page.fill('[data-testid="tenant-slug-input"]', tenant.slug);
  await page.fill('[data-testid="tenant-domain-input"]', tenant.domain);
  await page.fill('[data-testid="admin-email-input"]', tenant.adminEmail);
  await page.fill('[data-testid="admin-name-input"]', tenant.adminName || 'Test Admin');
  await page.fill('[data-testid="admin-password-input"]', tenant.adminPassword || 'TestAdmin123!');
  
  // Select default modules
  await page.check('[data-testid="module-users"]');
  await page.check('[data-testid="module-roles"]');
}
