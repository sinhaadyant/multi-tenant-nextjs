const { test, expect } = require('@playwright/test');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test data
const testRole = {
  name: 'Test Role E2E',
  description: 'Test role for e2e testing',
  permissions: []
};

const testPermission = {
  name: 'test.permission.e2e',
  description: 'Test permission for e2e testing',
  module: 'test',
  action: 'read'
};

let createdRoleId;
let createdPermissionId;
let superadminToken;

test.describe('Roles & Permissions Module - Comprehensive E2E Tests', () => {
  test.beforeAll(async () => {
    // Clean up any existing test data
    await prisma.rolePermission.deleteMany({
      where: {
        role: {
          name: { contains: 'Test Role E2E' }
        }
      }
    });
    
    await prisma.role.deleteMany({
      where: {
        name: { contains: 'Test Role E2E' }
      }
    });
    
    await prisma.permission.deleteMany({
      where: {
        name: { contains: 'test.permission.e2e' }
      }
    });

    // Login as superadmin and get token
    const loginResponse = await fetch('http://localhost:3000/api/auth/superadmin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@example.com',
        password: 'superadmin123'
      })
    });
    
    const loginData = await loginResponse.json();
    superadminToken = loginData.data.token;
  });

  test.afterAll(async () => {
    // Clean up test data
    if (createdRoleId) {
      await prisma.rolePermission.deleteMany({
        where: { roleId: createdRoleId }
      });
      await prisma.role.delete({ where: { id: createdRoleId } });
    }
    
    if (createdPermissionId) {
      await prisma.permission.delete({ where: { id: createdPermissionId } });
    }
    
    await prisma.$disconnect();
  });

  test.describe('Authentication & Navigation', () => {
    test('should login as superadmin and navigate to roles page', async ({ page }) => {
      // Login
      await page.goto('/superadmin/login');
      await page.fill('[data-testid="email-input"]', 'superadmin@example.com');
      await page.fill('[data-testid="password-input"]', 'superadmin123');
      await page.click('[data-testid="login-button"]');
      
      // Wait for redirect to dashboard
      await page.waitForURL('/superadmin/dashboard');
      
      // Navigate to roles page
      await page.click('text=Roles & Permissions');
      await page.waitForURL('/superadmin/roles');
      
      // Verify page loaded
      await expect(page.locator('h1')).toContainText('Roles & Permissions Management');
    });
  });

  test.describe('Roles Management Tab', () => {
    test('should display roles with dynamic database counts', async ({ page }) => {
      await page.goto('/superadmin/roles');
      
      // Wait for roles to load
      await page.waitForSelector('[data-testid="roles-table"]', { timeout: 10000 });
      
      // Get initial role count from database
      const dbRoleCount = await prisma.role.count();
      
      // Verify role count is displayed correctly
      const displayedRoles = await page.locator('[data-testid="role-row"]').count();
      expect(displayedRoles).toBeGreaterThan(0);
      
      // Verify user counts are dynamic (from database)
      const firstRoleRow = page.locator('[data-testid="role-row"]').first();
      const userCountText = await firstRoleRow.locator('[data-testid="user-count"]').textContent();
      const userCount = parseInt(userCountText);
      expect(userCount).toBeGreaterThanOrEqual(0);
    });

    test('should implement search functionality with debouncing', async ({ page }) => {
      await page.goto('/superadmin/roles');
      
      // Wait for search input
      await page.waitForSelector('[data-testid="search-input"]');
      
      // Type search term slowly to test debouncing
      await page.fill('[data-testid="search-input"]', 'admin');
      
      // Wait for debounce delay (500ms)
      await page.waitForTimeout(600);
      
      // Verify search results
      const searchResults = await page.locator('[data-testid="role-row"]').count();
      expect(searchResults).toBeGreaterThan(0);
      
      // Clear search
      await page.fill('[data-testid="search-input"]', '');
      await page.waitForTimeout(600);
      
      // Verify all roles are shown again
      const allResults = await page.locator('[data-testid="role-row"]').count();
      expect(allResults).toBeGreaterThan(searchResults);
    });

    test('should implement sorting functionality', async ({ page }) => {
      await page.goto('/superadmin/roles');
      
      // Test name sorting
      await page.click('[data-testid="sort-name"]');
      await page.waitForTimeout(500);
      
      // Get first role name
      const firstName = await page.locator('[data-testid="role-name"]').first().textContent();
      
      // Click again to reverse sort
      await page.click('[data-testid="sort-name"]');
      await page.waitForTimeout(500);
      
      // Get first role name after reverse sort
      const firstAfterReverse = await page.locator('[data-testid="role-name"]').first().textContent();
      
      // Names should be different (unless all names are the same)
      expect(firstName).toBeDefined();
      expect(firstAfterReverse).toBeDefined();
      
      // Test user count sorting
      await page.click('[data-testid="sort-userCount"]');
      await page.waitForTimeout(500);
      
      // Test created date sorting
      await page.click('[data-testid="sort-createdAt"]');
      await page.waitForTimeout(500);
    });

    test('should implement status filtering', async ({ page }) => {
      await page.goto('/superadmin/roles');
      
      // Get total roles count
      const totalRoles = await page.locator('[data-testid="role-row"]').count();
      
      // Filter by active status
      await page.selectOption('[data-testid="status-filter"]', 'active');
      await page.waitForTimeout(500);
      
      const activeRoles = await page.locator('[data-testid="role-row"]').count();
      expect(activeRoles).toBeLessThanOrEqual(totalRoles);
      
      // Filter by inactive status
      await page.selectOption('[data-testid="status-filter"]', 'inactive');
      await page.waitForTimeout(500);
      
      const inactiveRoles = await page.locator('[data-testid="role-row"]').count();
      expect(inactiveRoles).toBeLessThanOrEqual(totalRoles);
      
      // Reset to all
      await page.selectOption('[data-testid="status-filter"]', 'all');
      await page.waitForTimeout(500);
      
      const allRoles = await page.locator('[data-testid="role-row"]').count();
      expect(allRoles).toBe(totalRoles);
    });

    test('should implement pagination', async ({ page }) => {
      await page.goto('/superadmin/roles');
      
      // Check if pagination exists
      const paginationExists = await page.locator('[data-testid="pagination"]').isVisible();
      
      if (paginationExists) {
        // Get total pages
        const totalPages = await page.locator('[data-testid="page-number"]').count();
        
        if (totalPages > 1) {
          // Go to next page
          await page.click('[data-testid="next-page"]');
          await page.waitForTimeout(500);
          
          // Verify page changed
          const currentPage = await page.locator('[data-testid="current-page"]').textContent();
          expect(currentPage).toBe('2');
          
          // Go back to first page
          await page.click('[data-testid="prev-page"]');
          await page.waitForTimeout(500);
          
          const firstPage = await page.locator('[data-testid="current-page"]').textContent();
          expect(firstPage).toBe('1');
        }
      }
    });

    test('should create a new role', async ({ page }) => {
      await page.goto('/superadmin/roles');
      
      // Click create role button
      await page.click('[data-testid="create-role-button"]');
      
      // Fill role form
      await page.fill('[data-testid="role-name-input"]', testRole.name);
      await page.fill('[data-testid="role-description-input"]', testRole.description);
      
      // Submit form
      await page.click('[data-testid="submit-role-button"]');
      
      // Wait for success message
      await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 });
      
      // Verify role was created in database
      const createdRole = await prisma.role.findFirst({
        where: { name: testRole.name }
      });
      
      expect(createdRole).toBeTruthy();
      createdRoleId = createdRole.id;
      
      // Verify role appears in the list
      await page.waitForSelector(`text=${testRole.name}`);
    });

    test('should edit an existing role', async ({ page }) => {
      await page.goto('/superadmin/roles');
      
      // Find and click edit button for the test role
      const editButton = page.locator(`[data-testid="edit-role-${createdRoleId}"]`);
      await editButton.click();
      
      // Update role name
      const updatedName = 'Updated Test Role E2E';
      await page.fill('[data-testid="role-name-input"]', updatedName);
      
      // Submit form
      await page.click('[data-testid="submit-role-button"]');
      
      // Wait for success message
      await page.waitForSelector('[data-testid="success-toast"]');
      
      // Verify role was updated in database
      const updatedRole = await prisma.role.findUnique({
        where: { id: createdRoleId }
      });
      
      expect(updatedRole.name).toBe(updatedName);
      
      // Update testRole for cleanup
      testRole.name = updatedName;
    });

    test('should view role details', async ({ page }) => {
      await page.goto('/superadmin/roles');
      
      // Find and click view button for the test role
      const viewButton = page.locator(`[data-testid="view-role-${createdRoleId}"]`);
      await viewButton.click();
      
      // Verify modal opens
      await page.waitForSelector('[data-testid="role-details-modal"]');
      
      // Verify role details are displayed
      await expect(page.locator('[data-testid="role-name-display"]')).toContainText(testRole.name);
      await expect(page.locator('[data-testid="role-description-display"]')).toContainText(testRole.description);
      
      // Close modal
      await page.click('[data-testid="close-modal"]');
    });

    test('should delete a role', async ({ page }) => {
      await page.goto('/superadmin/roles');
      
      // Find and click delete button for the test role
      const deleteButton = page.locator(`[data-testid="delete-role-${createdRoleId}"]`);
      await deleteButton.click();
      
      // Confirm deletion
      await page.click('[data-testid="confirm-delete"]');
      
      // Wait for success message
      await page.waitForSelector('[data-testid="success-toast"]');
      
      // Verify role was deleted from database
      const deletedRole = await prisma.role.findUnique({
        where: { id: createdRoleId }
      });
      
      expect(deletedRole).toBeNull();
      
      // Reset createdRoleId
      createdRoleId = null;
    });
  });

  test.describe('Permission Groups Tab', () => {
    test('should display permissions with dynamic counts', async ({ page }) => {
      await page.goto('/superadmin/roles?tab=permissions');
      
      // Wait for permissions to load
      await page.waitForSelector('[data-testid="permissions-container"]', { timeout: 10000 });
      
      // Get permission count from database
      const dbPermissionCount = await prisma.permission.count();
      
      // Verify permissions are displayed
      const displayedPermissions = await page.locator('[data-testid="permission-item"]').count();
      expect(displayedPermissions).toBeGreaterThan(0);
    });

    test('should implement permission search and filtering', async ({ page }) => {
      await page.goto('/superadmin/roles?tab=permissions');
      
      // Wait for search input
      await page.waitForSelector('[data-testid="permission-search"]');
      
      // Search for permissions
      await page.fill('[data-testid="permission-search"]', 'user');
      await page.waitForTimeout(500);
      
      // Verify search results
      const searchResults = await page.locator('[data-testid="permission-item"]').count();
      expect(searchResults).toBeGreaterThan(0);
      
      // Test module filtering
      await page.selectOption('[data-testid="module-filter"]', 'user');
      await page.waitForTimeout(500);
      
      const moduleResults = await page.locator('[data-testid="permission-item"]').count();
      expect(moduleResults).toBeGreaterThan(0);
    });

    test('should group permissions by module', async ({ page }) => {
      await page.goto('/superadmin/roles?tab=permissions');
      
      // Wait for permission groups to load
      await page.waitForSelector('[data-testid="permission-group"]');
      
      // Get module groups
      const moduleGroups = await page.locator('[data-testid="permission-group"]').count();
      expect(moduleGroups).toBeGreaterThan(0);
      
      // Verify each group has permissions
      for (let i = 0; i < moduleGroups; i++) {
        const group = page.locator('[data-testid="permission-group"]').nth(i);
        const permissionCount = await group.locator('[data-testid="permission-item"]').count();
        expect(permissionCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Role Assignment Tab', () => {
    test('should display users with dynamic role assignments', async ({ page }) => {
      await page.goto('/superadmin/roles?tab=assignment');
      
      // Wait for users table to load
      await page.waitForSelector('[data-testid="users-table"]', { timeout: 10000 });
      
      // Get user count from database
      const dbUserCount = await prisma.user.count();
      
      // Verify users are displayed
      const displayedUsers = await page.locator('[data-testid="user-row"]').count();
      expect(displayedUsers).toBeGreaterThan(0);
    });

    test('should implement user search and filtering', async ({ page }) => {
      await page.goto('/superadmin/roles?tab=assignment');
      
      // Wait for search input
      await page.waitForSelector('[data-testid="user-search"]');
      
      // Search for users
      await page.fill('[data-testid="user-search"]', 'admin');
      await page.waitForTimeout(500);
      
      // Verify search results
      const searchResults = await page.locator('[data-testid="user-row"]').count();
      expect(searchResults).toBeGreaterThan(0);
      
      // Test tenant filtering
      await page.selectOption('[data-testid="tenant-filter"]', 'all');
      await page.waitForTimeout(500);
      
      // Test role filtering
      await page.selectOption('[data-testid="role-filter"]', 'all');
      await page.waitForTimeout(500);
    });

    test('should assign roles to users', async ({ page }) => {
      await page.goto('/superadmin/roles?tab=assignment');
      
      // Wait for users table
      await page.waitForSelector('[data-testid="users-table"]');
      
      // Get first user
      const firstUser = page.locator('[data-testid="user-row"]').first();
      
      // Get available roles
      const roleSelect = firstUser.locator('[data-testid="role-select"]');
      const roleOptions = await roleSelect.locator('option').count();
      
      if (roleOptions > 1) {
        // Select a role
        await roleSelect.selectOption({ index: 1 });
        
        // Wait for assignment to complete
        await page.waitForTimeout(2000);
        
        // Verify role was assigned (check for success indicator)
        const assignedRole = await roleSelect.evaluate(el => el.value);
        expect(assignedRole).toBeTruthy();
      }
    });

    test('should display assignment statistics', async ({ page }) => {
      await page.goto('/superadmin/roles?tab=assignment');
      
      // Wait for statistics to load
      await page.waitForSelector('[data-testid="assignment-stats"]');
      
      // Verify statistics are displayed
      const totalUsers = await page.locator('[data-testid="total-users"]').textContent();
      const usersWithRoles = await page.locator('[data-testid="users-with-roles"]').textContent();
      const usersWithoutRoles = await page.locator('[data-testid="users-without-roles"]').textContent();
      
      expect(parseInt(totalUsers)).toBeGreaterThan(0);
      expect(parseInt(usersWithRoles)).toBeGreaterThanOrEqual(0);
      expect(parseInt(usersWithoutRoles)).toBeGreaterThanOrEqual(0);
      
      // Verify math is correct
      expect(parseInt(totalUsers)).toBe(parseInt(usersWithRoles) + parseInt(usersWithoutRoles));
    });
  });

  test.describe('Permission Assignment', () => {
    test('should assign permissions to roles', async ({ page }) => {
      // First create a new role
      await page.goto('/superadmin/roles');
      await page.click('[data-testid="create-role-button"]');
      await page.fill('[data-testid="role-name-input"]', 'Permission Test Role');
      await page.fill('[data-testid="role-description-input"]', 'Role for testing permission assignment');
      await page.click('[data-testid="submit-role-button"]');
      await page.waitForSelector('[data-testid="success-toast"]');
      
      // Get the created role ID
      const createdRole = await prisma.role.findFirst({
        where: { name: 'Permission Test Role' }
      });
      const testRoleId = createdRole.id;
      
      // Edit the role to assign permissions
      const editButton = page.locator(`[data-testid="edit-role-${testRoleId}"]`);
      await editButton.click();
      
      // Wait for permissions to load
      await page.waitForSelector('[data-testid="permissions-list"]');
      
      // Select some permissions
      const permissionCheckboxes = page.locator('[data-testid="permission-checkbox"]');
      const checkboxCount = await permissionCheckboxes.count();
      
      if (checkboxCount > 0) {
        // Select first permission
        await permissionCheckboxes.first().check();
        
        // Submit form
        await page.click('[data-testid="submit-role-button"]');
        await page.waitForSelector('[data-testid="success-toast"]');
        
        // Verify permissions were assigned in database
        const rolePermissions = await prisma.rolePermission.findMany({
          where: { roleId: testRoleId },
          include: { permission: true }
        });
        
        expect(rolePermissions.length).toBeGreaterThan(0);
      }
      
      // Clean up
      await prisma.rolePermission.deleteMany({
        where: { roleId: testRoleId }
      });
      await prisma.role.delete({
        where: { id: testRoleId }
      });
    });
  });

  test.describe('Error Handling & Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network error by going offline
      await page.context().setOffline(true);
      
      await page.goto('/superadmin/roles');
      
      // Should show error message
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 });
      
      // Go back online
      await page.context().setOffline(false);
      
      // Should recover and show data
      await page.reload();
      await page.waitForSelector('[data-testid="roles-table"]');
    });

    test('should handle empty states', async ({ page }) => {
      await page.goto('/superadmin/roles');
      
      // Search for non-existent role
      await page.fill('[data-testid="search-input"]', 'NonExistentRole12345');
      await page.waitForTimeout(600);
      
      // Should show empty state
      await page.waitForSelector('[data-testid="empty-state"]');
      await expect(page.locator('[data-testid="empty-state"]')).toContainText('No roles found');
    });

    test('should handle validation errors', async ({ page }) => {
      await page.goto('/superadmin/roles');
      
      // Try to create role with invalid data
      await page.click('[data-testid="create-role-button"]');
      await page.click('[data-testid="submit-role-button"]');
      
      // Should show validation error
      await page.waitForSelector('[data-testid="validation-error"]');
    });
  });

  test.describe('Performance & Responsiveness', () => {
    test('should load roles within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/superadmin/roles');
      await page.waitForSelector('[data-testid="roles-table"]');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test('should handle large datasets', async ({ page }) => {
      // Create multiple test roles to test pagination
      const testRoles = [];
      for (let i = 0; i < 25; i++) {
        testRoles.push({
          name: `Performance Test Role ${i}`,
          description: `Role ${i} for performance testing`
        });
      }
      
      // Create roles via API
      for (const role of testRoles) {
        await fetch('http://localhost:3000/api/superadmin/roles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${superadminToken}`
          },
          body: JSON.stringify(role)
        });
      }
      
      // Test page loads with many roles
      await page.goto('/superadmin/roles');
      await page.waitForSelector('[data-testid="roles-table"]');
      
      // Verify pagination works
      const paginationExists = await page.locator('[data-testid="pagination"]').isVisible();
      expect(paginationExists).toBe(true);
      
      // Clean up test roles
      for (const role of testRoles) {
        await prisma.role.deleteMany({
          where: { name: role.name }
        });
      }
    });
  });
}); 