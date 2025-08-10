const { TestHelper, TEST_CREDENTIALS, ROLE_PERMISSIONS } = require('./test-setup');

class UserManagementTester {
  constructor() {
    this.testHelper = new TestHelper();
    this.results = [];
  }

  async runAllTests() {
    console.log('🧪 Starting User Management E2E Tests...\n');
    
    try {
      await this.testHelper.setup();
      
      // Test TechCorp User Management
      console.log('\n🏢 Testing TechCorp User Management...');
      await this.testTenantUserManagement('techcorp');
      
      // Test GlobalRetail User Management
      console.log('\n🛒 Testing GlobalRetail User Management...');
      await this.testTenantUserManagement('globalretail');
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ User Management test execution failed:', error);
    } finally {
      await this.testHelper.teardown();
    }
  }

  async testTenantUserManagement(tenant) {
    const roles = ['admin', 'manager'];
    
    for (const role of roles) {
      console.log(`\n🔐 Testing ${tenant} ${role} user management...`);
      
      const loginSuccess = await this.testHelper.login(tenant, role);
      if (!loginSuccess) {
        this.logResult(`${tenant} ${role} Login`, 'FAIL', `Failed to login as ${role}`);
        continue;
      }

      this.logResult(`${tenant} ${role} Login`, 'PASS', `Successfully logged in as ${role}`);

      // Test user management access
      const accessTest = await this.testUserManagementAccess(`${tenant} ${role}`);
      this.logResult(`${tenant} ${role} User Management Access`, accessTest ? 'PASS' : 'FAIL',
        accessTest ? 'User management accessible' : 'User management not accessible');

      if (accessTest) {
        // Test CRUD operations
        const crudTest = await this.testUserCRUDOperations(`${tenant} ${role}`, role);
        this.logResult(`${tenant} ${role} User CRUD Operations`, crudTest ? 'PASS' : 'FAIL',
          crudTest ? 'CRUD operations working' : 'CRUD operations failed');

        // Test search and filters
        const searchTest = await this.testUserSearchAndFilters(`${tenant} ${role}`);
        this.logResult(`${tenant} ${role} User Search & Filters`, searchTest ? 'PASS' : 'FAIL',
          searchTest ? 'Search and filters working' : 'Search and filters failed');

        // Test pagination
        const paginationTest = await this.testUserPagination(`${tenant} ${role}`);
        this.logResult(`${tenant} ${role} User Pagination`, paginationTest ? 'PASS' : 'FAIL',
          paginationTest ? 'Pagination working' : 'Pagination failed');

        // Test role-based permissions
        const permissionsTest = await this.testUserRolePermissions(`${tenant} ${role}`, role);
        this.logResult(`${tenant} ${role} User Role Permissions`, permissionsTest ? 'PASS' : 'FAIL',
          permissionsTest ? 'Role permissions working' : 'Role permissions failed');
      }

      // Logout before next user
      await this.testHelper.navigateTo('/logout');
    }
  }

  async testUserManagementAccess(userType) {
    try {
      console.log(`👥 Testing user management access for ${userType}...`);
      
      // Navigate to user management
      const success = await this.testHelper.navigateTo('/users');
      if (!success) {
        return false;
      }

      // Wait for page to load
      await this.testHelper.waitForPageLoad();

      // Check if we're on user management page
      const currentUrl = await this.testHelper.getCurrentUrl();
      if (!currentUrl.includes('/users')) {
        console.error(`❌ Not on user management page: ${currentUrl}`);
        return false;
      }

      // Check for user management title or content
      const pageTitle = await this.testHelper.getText('h1, h2, .title, [data-testid="page-title"]');
      if (!pageTitle.toLowerCase().includes('user') && !pageTitle.toLowerCase().includes('users')) {
        console.error(`❌ User management title not found: ${pageTitle}`);
        return false;
      }

      console.log(`✅ User management access successful for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ User management access failed for ${userType}:`, error.message);
      await this.testHelper.takeScreenshot(`user-management-access-${userType.toLowerCase().replace(/\s+/g, '-')}`);
      return false;
    }
  }

  async testUserCRUDOperations(userType, role) {
    try {
      console.log(`🔄 Testing user CRUD operations for ${userType}...`);
      
      const permissions = ROLE_PERMISSIONS[role];
      const testData = {
        canCreate: permissions.canCreate,
        canEdit: permissions.canEdit,
        canDelete: permissions.canDelete,
        canView: permissions.canView,
        createData: {
          name: 'Test User',
          email: `testuser-${Date.now()}@example.com`,
          role: 'user',
          department: 'IT'
        },
        updateData: {
          name: 'Updated Test User',
          department: 'HR'
        }
      };

      const results = await this.testHelper.testCRUDOperations('User Management', testData);
      
      const passed = Object.values(results).filter(Boolean).length;
      const total = Object.keys(results).length;
      
      console.log(`✅ User CRUD test results: ${passed}/${total} passed`);
      return passed === total;

    } catch (error) {
      console.error(`❌ User CRUD test failed for ${userType}:`, error.message);
      return false;
    }
  }

  async testUserSearchAndFilters(userType) {
    try {
      console.log(`🔍 Testing user search and filters for ${userType}...`);
      
      // Test search functionality
      const searchResult = await this.testHelper.testSearchAndFilters('User Management');
      
      // Test specific user filters
      const filterSelectors = [
        'select[name="role"]',
        'select[name="department"]',
        'select[name="status"]',
        '[data-testid="role-filter"]',
        '[data-testid="department-filter"]'
      ];

      for (const selector of filterSelectors) {
        if (await this.testHelper.isElementVisible(selector)) {
          await this.testHelper.clickElement(selector);
          await this.testHelper.waitForPageLoad();
          console.log(`✅ Filter ${selector} working`);
        }
      }

      return searchResult;

    } catch (error) {
      console.error(`❌ User search and filters test failed for ${userType}:`, error.message);
      return false;
    }
  }

  async testUserPagination(userType) {
    try {
      console.log(`📄 Testing user pagination for ${userType}...`);
      
      return await this.testHelper.testPagination('User Management');

    } catch (error) {
      console.error(`❌ User pagination test failed for ${userType}:`, error.message);
      return false;
    }
  }

  async testUserRolePermissions(userType, role) {
    try {
      console.log(`🔐 Testing user role permissions for ${userType}...`);
      
      const permissions = ROLE_PERMISSIONS[role];
      
      // Test create user permission
      if (permissions.canCreate) {
        const createButton = await this.testHelper.page.$('button:contains("Create User"), button:contains("Add User"), [data-testid="create-user-button"]');
        if (!createButton) {
          console.error('❌ Create user button not found for role with create permission');
          return false;
        }
      } else {
        const createButton = await this.testHelper.page.$('button:contains("Create User"), button:contains("Add User")');
        if (createButton) {
          console.error('❌ Create user button found for role without create permission');
          return false;
        }
      }

      // Test edit user permission
      if (permissions.canEdit) {
        const editButtons = await this.testHelper.page.$$('button:contains("Edit"), [data-testid="edit-user-button"]');
        if (editButtons.length === 0) {
          console.error('❌ Edit user buttons not found for role with edit permission');
          return false;
        }
      } else {
        const editButtons = await this.testHelper.page.$$('button:contains("Edit")');
        if (editButtons.length > 0) {
          console.error('❌ Edit user buttons found for role without edit permission');
          return false;
        }
      }

      // Test delete user permission
      if (permissions.canDelete) {
        const deleteButtons = await this.testHelper.page.$$('button:contains("Delete"), [data-testid="delete-user-button"]');
        if (deleteButtons.length === 0) {
          console.error('❌ Delete user buttons not found for role with delete permission');
          return false;
        }
      } else {
        const deleteButtons = await this.testHelper.page.$$('button:contains("Delete")');
        if (deleteButtons.length > 0) {
          console.error('❌ Delete user buttons found for role without delete permission');
          return false;
        }
      }

      console.log(`✅ User role permissions test passed for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ User role permissions test failed for ${userType}:`, error.message);
      return false;
    }
  }

  logResult(testName, status, details) {
    const result = {
      test: testName,
      status: status,
      details: details,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${testName}: ${details}`);
  }

  generateReport() {
    console.log('\n📊 User Management Test Results Summary:');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detailed Results:');
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.details}`);
    });
    
    // Save results to file
    const fs = require('fs');
    const reportData = {
      module: 'User Management',
      summary: {
        total: total,
        passed: passed,
        failed: failed,
        successRate: ((passed / total) * 100).toFixed(1)
      },
      results: this.results,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('user-management-test-results.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 User Management test results saved to user-management-test-results.json');
  }
}

// Run the tests
async function main() {
  const tester = new UserManagementTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = UserManagementTester; 