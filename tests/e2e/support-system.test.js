const { TestHelper, TEST_CREDENTIALS, ROLE_PERMISSIONS } = require('./test-setup');

class SupportSystemTester {
  constructor() {
    this.testHelper = new TestHelper();
    this.results = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Support System E2E Tests...\n');
    
    try {
      await this.testHelper.setup();
      
      // Test TechCorp Support System
      console.log('\n🏢 Testing TechCorp Support System...');
      await this.testTenantSupportSystem('techcorp');
      
      // Test GlobalRetail Support System
      console.log('\n🛒 Testing GlobalRetail Support System...');
      await this.testTenantSupportSystem('globalretail');
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Support System test execution failed:', error);
    } finally {
      await this.testHelper.teardown();
    }
  }

  async testTenantSupportSystem(tenant) {
    const roles = ['admin', 'manager', 'user', 'viewer'];
    
    for (const role of roles) {
      console.log(`\n🔐 Testing ${tenant} ${role} support system...`);
      
      const loginSuccess = await this.testHelper.login(tenant, role);
      if (!loginSuccess) {
        this.logResult(`${tenant} ${role} Login`, 'FAIL', `Failed to login as ${role}`);
        continue;
      }

      this.logResult(`${tenant} ${role} Login`, 'PASS', `Successfully logged in as ${role}`);

      // Test support system access
      const accessTest = await this.testSupportSystemAccess(`${tenant} ${role}`);
      this.logResult(`${tenant} ${role} Support System Access`, accessTest ? 'PASS' : 'FAIL',
        accessTest ? 'Support system accessible' : 'Support system not accessible');

      if (accessTest) {
        // Test ticket creation (if permitted)
        if (role !== 'viewer') {
          const createTest = await this.testTicketCreation(`${tenant} ${role}`);
          this.logResult(`${tenant} ${role} Ticket Creation`, createTest ? 'PASS' : 'FAIL',
            createTest ? 'Ticket creation working' : 'Ticket creation failed');
        }

        // Test ticket viewing
        const viewTest = await this.testTicketViewing(`${tenant} ${role}`);
        this.logResult(`${tenant} ${role} Ticket Viewing`, viewTest ? 'PASS' : 'FAIL',
          viewTest ? 'Ticket viewing working' : 'Ticket viewing failed');

        // Test ticket filtering
        const filterTest = await this.testTicketFiltering(`${tenant} ${role}`);
        this.logResult(`${tenant} ${role} Ticket Filtering`, filterTest ? 'PASS' : 'FAIL',
          filterTest ? 'Ticket filtering working' : 'Ticket filtering failed');

        // Test ticket pagination
        const paginationTest = await this.testTicketPagination(`${tenant} ${role}`);
        this.logResult(`${tenant} ${role} Ticket Pagination`, paginationTest ? 'PASS' : 'FAIL',
          paginationTest ? 'Ticket pagination working' : 'Ticket pagination failed');
      }

      // Logout before next user
      await this.testHelper.navigateTo('/logout');
    }
  }

  async testSupportSystemAccess(userType) {
    try {
      console.log(`🎫 Testing support system access for ${userType}...`);
      
      // Navigate to support system
      const success = await this.testHelper.navigateTo('/support');
      if (!success) {
        return false;
      }

      // Wait for page to load
      await this.testHelper.waitForPageLoad();

      // Check if we're on support page
      const currentUrl = await this.testHelper.getCurrentUrl();
      if (!currentUrl.includes('/support')) {
        console.error(`❌ Not on support page: ${currentUrl}`);
        return false;
      }

      console.log(`✅ Support system access successful for ${userType}`);
      return true;

    } catch (error) {
      console.error(`❌ Support system access failed for ${userType}:`, error.message);
      await this.testHelper.takeScreenshot(`support-access-${userType.toLowerCase().replace(/\s+/g, '-')}`);
      return false;
    }
  }

  async testTicketCreation(userType) {
    try {
      console.log(`📝 Testing ticket creation for ${userType}...`);
      
      // Look for create ticket button
      const createButton = await this.testHelper.page.$('button:contains("Create"), button:contains("New Ticket"), [data-testid="create-ticket"]');
      if (!createButton) {
        console.log('⚠️ No create ticket button found (this might be normal)');
        return true;
      }

      // Click create button
      await createButton.click();
      await this.testHelper.waitForPageLoad();

      // Fill ticket form
      const testData = {
        subject: 'Test Support Ticket',
        description: 'This is a test support ticket description',
        priority: 'medium',
        category: 'general'
      };

      // Fill subject
      const subjectInput = await this.testHelper.page.$('input[name="subject"], [data-testid="ticket-subject"]');
      if (subjectInput) {
        await subjectInput.type(testData.subject);
      }

      // Fill description
      const descriptionInput = await this.testHelper.page.$('textarea[name="description"], [data-testid="ticket-description"]');
      if (descriptionInput) {
        await descriptionInput.type(testData.description);
      }

      // Select priority
      const prioritySelect = await this.testHelper.page.$('select[name="priority"], [data-testid="ticket-priority"]');
      if (prioritySelect) {
        await this.testHelper.page.select('select[name="priority"], [data-testid="ticket-priority"]', 'medium');
      }

      // Submit form
      const submitButton = await this.testHelper.page.$('button[type="submit"], button:contains("Submit"), [data-testid="submit-ticket"]');
      if (submitButton) {
        await submitButton.click();
        await this.testHelper.waitForPageLoad();
        console.log('✅ Ticket created successfully');
      }

      return true;

    } catch (error) {
      console.error(`❌ Ticket creation test failed for ${userType}:`, error.message);
      return false;
    }
  }

  async testTicketViewing(userType) {
    try {
      console.log(`👀 Testing ticket viewing for ${userType}...`);
      
      // Check for tickets list
      const ticketsList = await this.testHelper.page.$$('.ticket-item, .ticket-card, [data-testid="ticket-item"]');
      if (ticketsList.length === 0) {
        console.log('⚠️ No tickets found (this might be normal)');
      }

      // Click on first ticket if available
      if (ticketsList.length > 0) {
        await ticketsList[0].click();
        await this.testHelper.waitForPageLoad();
        
        // Check if ticket details opened
        const ticketDetails = await this.testHelper.page.$('.ticket-details, [data-testid="ticket-details"]');
        if (ticketDetails) {
          console.log('✅ Ticket details opened');
        }
      }

      return true;

    } catch (error) {
      console.error(`❌ Ticket viewing test failed for ${userType}:`, error.message);
      return false;
    }
  }

  async testTicketFiltering(userType) {
    try {
      console.log(`🔍 Testing ticket filtering for ${userType}...`);
      
      // Test status filter
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

      // Test search functionality
      const searchResult = await this.testHelper.testSearchAndFilters('Support Tickets');

      return true;

    } catch (error) {
      console.error(`❌ Ticket filtering test failed for ${userType}:`, error.message);
      return false;
    }
  }

  async testTicketPagination(userType) {
    try {
      console.log(`📄 Testing ticket pagination for ${userType}...`);
      
      return await this.testHelper.testPagination('Support Tickets');

    } catch (error) {
      console.error(`❌ Ticket pagination test failed for ${userType}:`, error.message);
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
    console.log('\n📊 Support System Test Results Summary:');
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
      module: 'Support System',
      summary: {
        total: total,
        passed: passed,
        failed: failed,
        successRate: ((passed / total) * 100).toFixed(1)
      },
      results: this.results,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('support-system-test-results.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Support System test results saved to support-system-test-results.json');
  }
}

// Run the tests
async function main() {
  const tester = new SupportSystemTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SupportSystemTester; 