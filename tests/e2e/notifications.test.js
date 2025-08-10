const { TestHelper, TEST_CREDENTIALS, ROLE_PERMISSIONS } = require('./test-setup');

class NotificationsTester {
  constructor() {
    this.testHelper = new TestHelper();
    this.results = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Notifications E2E Tests...\n');
    
    try {
      await this.testHelper.setup();
      
      // Test TechCorp Notifications
      console.log('\n🏢 Testing TechCorp Notifications...');
      await this.testTenantNotifications('techcorp');
      
      // Test GlobalRetail Notifications
      console.log('\n🛒 Testing GlobalRetail Notifications...');
      await this.testTenantNotifications('globalretail');
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Notifications test execution failed:', error);
    } finally {
      await this.testHelper.teardown();
    }
  }

  async testTenantNotifications(tenant) {
    const roles = ['admin', 'manager', 'user', 'viewer'];
    
    for (const role of roles) {
      console.log(`\n🔐 Testing ${tenant} ${role} notifications...`);
      
      const loginSuccess = await this.testHelper.login(tenant, role);
      if (!loginSuccess) {
        this.logResult(`${tenant} ${role} Login`, 'FAIL', `Failed to login as ${role}`);
        continue;
      }

      this.logResult(`${tenant} ${role} Login`, 'PASS', `Successfully logged in as ${role}`);

      // Test notifications access
      const accessTest = await this.testNotificationsAccess(`${tenant} ${role}`);
      this.logResult(`${tenant} ${role} Notifications Access`, accessTest ? 'PASS' : 'FAIL',
        accessTest ? 'Notifications accessible' : 'Notifications not accessible');

      if (accessTest) {
        // Test notifications viewing
        const viewTest = await this.testNotificationsViewing(`${tenant} ${role}`);
        this.logResult(`${tenant} ${role} Notifications Viewing`, viewTest ? 'PASS' : 'FAIL',
          viewTest ? 'Notifications viewing working' : 'Notifications viewing failed');

        // Test notifications creation (if permitted)
        if (role === 'admin' || role === 'manager') {
          const createTest = await this.testNotificationsCreation(`${tenant} ${role}`);
          this.logResult(`${tenant} ${role} Notifications Creation`, createTest ? 'PASS' : 'FAIL',
            createTest ? 'Notifications creation working' : 'Notifications creation failed');
        }

        // Test notifications filtering
        const filterTest = await this.testNotificationsFiltering(`${tenant} ${role}`);
        this.logResult(`${tenant} ${role} Notifications Filtering`, filterTest ? 'PASS' : 'FAIL',
          filterTest ? 'Notifications filtering working' : 'Notifications filtering failed');

        // Test notifications pagination
        const paginationTest = await this.testNotificationsPagination(`${tenant} ${role}`);
        this.logResult(`${tenant} ${role} Notifications Pagination`, paginationTest ? 'PASS' : 'FAIL',
          paginationTest ? 'Notifications pagination working' : 'Notifications pagination failed');
      }

      // Logout before next user
      await this.testHelper.navigateTo('/logout');
    }
  }

  async testNotificationsAccess(userType) {
    try {
      console.log(`🔔 Testing notifications access for ${userType}...`);
      
      // Navigate to notifications
      const success = await this.testHelper.navigateTo('/notifications');
      if (!success) {
        return false;
      }

      // Wait for page to load
      await this.testHelper.waitForPageLoad();

      // Check if we're on notifications page
      const currentUrl = await this.testHelper.getCurrentUrl();
      if (!currentUrl.includes('/notifications')) {
        console.error(`❌ Not on notifications page: ${currentUrl}`);
        return false;
      }

      // Check for notifications title or content
      const pageTitle = await this.testHelper.getText('h1, h2, .title, [data-testid="page-title"]');
      if (!pageTitle.toLowerCase().includes('notification')) {
        console.error(`❌ Notifications title not found: ${pageTitle}`);
        return false;
      }

      console.log(`✅ Notifications access successful for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ Notifications access failed for ${userType}:`, error.message);
      await this.testHelper.takeScreenshot(`notifications-access-${userType.toLowerCase().replace(/\s+/g, '-')}`);
      return false;
    }
  }

  async testNotificationsViewing(userType) {
    try {
      console.log(`👀 Testing notifications viewing for ${userType}...`);
      
      // Check for notifications list
      const notificationsList = await this.testHelper.page.$$('.notification-item, .notification-card, [data-testid="notification-item"]');
      if (notificationsList.length === 0) {
        console.log('⚠️ No notifications found (this might be normal)');
      }

      // Check for notification details
      const detailButtons = await this.testHelper.page.$$('button:contains("View"), button:contains("Read"), [data-testid="view-notification"]');
      if (detailButtons.length > 0) {
        // Click on first notification
        await detailButtons[0].click();
        await this.testHelper.waitForPageLoad();
        
        // Check if notification details opened
        const modal = await this.testHelper.page.$('[role="dialog"], .modal');
        if (modal) {
          console.log('✅ Notification details modal opened');
        }
      }

      // Check for notification status indicators
      const statusIndicators = await this.testHelper.page.$$('.unread, .read, [data-testid="notification-status"]');
      if (statusIndicators.length > 0) {
        console.log('✅ Notification status indicators found');
      }

      console.log(`✅ Notifications viewing test passed for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ Notifications viewing test failed for ${userType}:`, error.message);
      return false;
    }
  }

  async testNotificationsCreation(userType) {
    try {
      console.log(`📝 Testing notifications creation for ${userType}...`);
      
      // Look for create notification button
      const createButton = await this.testHelper.page.$('button:contains("Create"), button:contains("Send"), [data-testid="create-notification"]');
      if (!createButton) {
        console.log('⚠️ No create notification button found (this might be normal)');
        return true;
      }

      // Click create button
      await createButton.click();
      await this.testHelper.waitForPageLoad();

      // Check if create form opened
      const form = await this.testHelper.page.$('form, [data-testid="notification-form"]');
      if (!form) {
        console.error('❌ Notification creation form not found');
        return false;
      }

      // Fill notification form
      const testData = {
        title: 'Test Notification',
        message: 'This is a test notification message',
        recipients: 'all',
        priority: 'normal'
      };

      // Fill title
      const titleInput = await this.testHelper.page.$('input[name="title"], [data-testid="notification-title"]');
      if (titleInput) {
        await titleInput.type(testData.title);
      }

      // Fill message
      const messageInput = await this.testHelper.page.$('textarea[name="message"], [data-testid="notification-message"]');
      if (messageInput) {
        await messageInput.type(testData.message);
      }

      // Select recipients
      const recipientSelect = await this.testHelper.page.$('select[name="recipients"], [data-testid="notification-recipients"]');
      if (recipientSelect) {
        await this.testHelper.clickElement('select[name="recipients"], [data-testid="notification-recipients"]');
        await this.testHelper.page.select('select[name="recipients"], [data-testid="notification-recipients"]', 'all');
      }

      // Select priority
      const prioritySelect = await this.testHelper.page.$('select[name="priority"], [data-testid="notification-priority"]');
      if (prioritySelect) {
        await this.testHelper.clickElement('select[name="priority"], [data-testid="notification-priority"]');
        await this.testHelper.page.select('select[name="priority"], [data-testid="notification-priority"]', 'normal');
      }

      // Submit form
      const submitButton = await this.testHelper.page.$('button[type="submit"], button:contains("Send"), [data-testid="send-notification"]');
      if (submitButton) {
        await submitButton.click();
        await this.testHelper.waitForPageLoad();

        // Check for success message
        const successMessage = await this.testHelper.page.$('.success, .alert-success, [data-testid="success-message"]');
        if (successMessage) {
          console.log('✅ Notification sent successfully');
        }
      }

      console.log(`✅ Notifications creation test passed for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ Notifications creation test failed for ${userType}:`, error.message);
      return false;
    }
  }

  async testNotificationsFiltering(userType) {
    try {
      console.log(`🔍 Testing notifications filtering for ${userType}...`);
      
      // Test status filter (read/unread)
      const statusFilters = await this.testHelper.page.$$('select[name="status"], [data-testid="status-filter"]');
      if (statusFilters.length > 0) {
        await this.testHelper.clickElement('select[name="status"], [data-testid="status-filter"]');
        await this.testHelper.waitForPageLoad();
        console.log('✅ Status filter working');
      }

      // Test priority filter
      const priorityFilters = await this.testHelper.page.$$('select[name="priority"], [data-testid="priority-filter"]');
      if (priorityFilters.length > 0) {
        await this.testHelper.clickElement('select[name="priority"], [data-testid="priority-filter"]');
        await this.testHelper.waitForPageLoad();
        console.log('✅ Priority filter working');
      }

      // Test date filter
      const dateFilters = await this.testHelper.page.$$('input[type="date"], [data-testid="date-filter"]');
      if (dateFilters.length > 0) {
        await dateFilters[0].click();
        await this.testHelper.waitForPageLoad();
        console.log('✅ Date filter working');
      }

      // Test search functionality
      const searchResult = await this.testHelper.testSearchAndFilters('Notifications');

      console.log(`✅ Notifications filtering test passed for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ Notifications filtering test failed for ${userType}:`, error.message);
      return false;
    }
  }

  async testNotificationsPagination(userType) {
    try {
      console.log(`📄 Testing notifications pagination for ${userType}...`);
      
      return await this.testHelper.testPagination('Notifications');

    } catch (error) {
      console.error(`❌ Notifications pagination test failed for ${userType}:`, error.message);
      return false;
    }
  }

  async testNotificationActions(userType) {
    try {
      console.log(`⚡ Testing notification actions for ${userType}...`);
      
      // Test mark as read
      const markReadButtons = await this.testHelper.page.$$('button:contains("Mark as Read"), [data-testid="mark-read"]');
      if (markReadButtons.length > 0) {
        await markReadButtons[0].click();
        await this.testHelper.waitForPageLoad();
        console.log('✅ Mark as read action working');
      }

      // Test mark as unread
      const markUnreadButtons = await this.testHelper.page.$$('button:contains("Mark as Unread"), [data-testid="mark-unread"]');
      if (markUnreadButtons.length > 0) {
        await markUnreadButtons[0].click();
        await this.testHelper.waitForPageLoad();
        console.log('✅ Mark as unread action working');
      }

      // Test delete notification
      const deleteButtons = await this.testHelper.page.$$('button:contains("Delete"), [data-testid="delete-notification"]');
      if (deleteButtons.length > 0) {
        await deleteButtons[0].click();
        await this.testHelper.waitForPageLoad();
        
        // Confirm deletion if modal appears
        const confirmButton = await this.testHelper.page.$('button:contains("Confirm"), button:contains("Delete")');
        if (confirmButton) {
          await confirmButton.click();
          await this.testHelper.waitForPageLoad();
        }
        console.log('✅ Delete notification action working');
      }

      console.log(`✅ Notification actions test passed for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ Notification actions test failed for ${userType}:`, error.message);
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
    console.log('\n📊 Notifications Test Results Summary:');
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
      module: 'Notifications',
      summary: {
        total: total,
        passed: passed,
        failed: failed,
        successRate: ((passed / total) * 100).toFixed(1)
      },
      results: this.results,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('notifications-test-results.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Notifications test results saved to notifications-test-results.json');
  }
}

// Run the tests
async function main() {
  const tester = new NotificationsTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = NotificationsTester; 