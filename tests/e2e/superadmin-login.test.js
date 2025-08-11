const puppeteer = require('puppeteer');
const SuperAdminDatabaseHelper = require('./superadmin-db-helper');

class SuperAdminLoginTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.dbHelper = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      details: [],
      errors: []
    };
    this.testData = {
      validEmail: 'admin@superadmin.com',
      validPassword: 'AdminPass123',
      invalidEmail: 'invalid@example.com',
      invalidPassword: 'WrongPassword123',
      testEmail: `test-login-${Date.now()}@example.com`,
      testPassword: 'TestPass123!',
      testName: 'Test Login User',
      testContactNumber: '1234567890'
    };
  }

  async initialize() {
    try {
      console.log('🚀 Initializing SuperAdmin Login Test Suite...');
      
      // Initialize database helper
      this.dbHelper = new SuperAdminDatabaseHelper();
      await this.dbHelper.connect();
      console.log('✅ SuperAdmin Database connected successfully');

      // Launch browser
      this.browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      this.page = await this.browser.newPage();
      
      // Set viewport
      await this.page.setViewport({ width: 1280, height: 720 });
      
      console.log('✅ SuperAdmin login test suite initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SuperAdmin login test suite:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      console.log('🧹 Cleaning up SuperAdmin login test data...');
      
      if (this.page) {
        await this.page.close();
      }
      
      if (this.browser) {
        await this.browser.close();
      }
      
      if (this.dbHelper) {
        await this.cleanupTestData();
        await this.dbHelper.disconnect();
      }
      
      console.log('✅ SuperAdmin login test suite cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  async runAllTests() {
    try {
      console.log('\n🎯 Starting SuperAdmin Login Test Suite...\n');

      await this.testInvalidCredentials();
      await this.testValidCredentials();
      await this.testEmptyFields();
      await this.testInvalidEmailFormat();
      await this.testInactiveAccount();

      console.log('\n📊 SuperAdmin Login Test Results:');
      console.log(`✅ Passed: ${this.testResults.passed}`);
      console.log(`❌ Failed: ${this.testResults.failed}`);
      
      if (this.testResults.errors.length > 0) {
        console.log('\n❌ Errors:');
        this.testResults.errors.forEach(error => console.log(`  - ${error}`));
      }

      return this.testResults;
    } catch (error) {
      console.error('❌ SuperAdmin Login Tests failed:', error);
      this.testResults.errors.push(`Login Tests: ${error.message}`);
      this.testResults.failed++;
      return this.testResults;
    } finally {
      await this.cleanup();
    }
  }

  async createTestUser() {
    try {
      console.log('  👤 Creating test user...');
      
      // Create a test SuperAdmin user
      const testUser = await this.dbHelper.createSuperAdmin({
        name: this.testData.testName,
        email: this.testData.testEmail,
        password: this.testData.testPassword,
        contactNumber: this.testData.testContactNumber,
        isActive: true
      });

      console.log('    ✅ Test user created');
      return testUser;
    } catch (error) {
      console.error('    ❌ Failed to create test user:', error);
      throw error;
    }
  }

  async testInvalidCredentials() {
    try {
      console.log('  📝 Testing invalid credentials...');

      await this.page.goto('http://localhost:3000/superadmin/login');

      // Wait for login form
      await this.page.waitForSelector('form', { timeout: 5000 });

      // Fill invalid credentials
      await this.page.type('input[type="email"]', this.testData.invalidEmail);
      await this.page.type('input[type="password"]', this.testData.invalidPassword);

      // Submit form
      console.log('    Submitting form with invalid credentials...');
      
      // Trigger the form submission through React Hook Form
      await this.page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
          console.log('Form submit event dispatched');
        }
      });

      // Wait for error message
      await this.page.waitForSelector('.text-red-500, .bg-red-50, [data-testid="error-message"]', { timeout: 5000 });

      // Check for error message
      const errorElement = await this.page.$('.text-red-500, .bg-red-50, [data-testid="error-message"]');
      if (errorElement) {
        const errorText = await errorElement.evaluate(el => el.textContent);
        console.log(`    ✅ Invalid credentials properly rejected: ${errorText}`);
        this.testResults.passed++;
        this.testResults.details.push('Invalid credentials properly rejected');
      } else {
        throw new Error('No error message shown for invalid credentials');
      }

    } catch (error) {
      console.error('    ❌ Invalid credentials test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Invalid credentials: ${error.message}`);
    }
  }

  async testValidCredentials() {
    try {
      console.log('  📝 Testing valid credentials...');

      await this.page.goto('http://localhost:3000/superadmin/login');

      // Wait for login form
      await this.page.waitForSelector('form', { timeout: 5000 });

      // Fill valid credentials
      await this.page.type('input[type="email"]', this.testData.validEmail);
      await this.page.type('input[type="password"]', this.testData.validPassword);

      // Submit form
      console.log('    Submitting form with valid credentials...');
      
      // Trigger the form submission through React Hook Form
      await this.page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
          console.log('Form submit event dispatched');
        }
      });

      // Wait for navigation to dashboard
      try {
        await this.page.waitForNavigation({ timeout: 10000 });
      } catch (error) {
        console.log('    No navigation occurred, checking for success...');
      }

      // Check if we're on the dashboard
      const currentUrl = this.page.url();
      console.log(`    Current URL after login: ${currentUrl}`);
      
      if (currentUrl.includes('/superadmin/dashboard')) {
        console.log('    ✅ Successful login - redirected to dashboard');
        this.testResults.passed++;
        this.testResults.details.push('Valid credentials login successful');
      } else {
        // Check for success message or other indicators
        const pageContent = await this.page.content();
        if (pageContent.includes('success') || pageContent.includes('Success') || pageContent.includes('dashboard')) {
          console.log('    ✅ Successful login - success indicators found');
          this.testResults.passed++;
          this.testResults.details.push('Valid credentials login successful');
        } else {
          throw new Error('Login failed - not redirected to dashboard');
        }
      }

    } catch (error) {
      console.error('    ❌ Valid credentials test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Valid credentials: ${error.message}`);
    }
  }

  async testEmptyFields() {
    try {
      console.log('  📝 Testing empty fields validation...');

      await this.page.goto('http://localhost:3000/superadmin/login');

      // Wait for login form
      await this.page.waitForSelector('form', { timeout: 5000 });

      // Submit form without filling any fields
      console.log('    Submitting form with empty fields...');
      
      // Trigger the form submission through React Hook Form
      await this.page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
          console.log('Form submit event dispatched');
        }
      });

      // Wait for validation errors
      await this.page.waitForSelector('.text-red-500', { timeout: 5000 });

      // Check for validation errors
      const validationErrors = await this.page.$$('.text-red-500');
      if (validationErrors.length > 0) {
        console.log(`    ✅ Empty fields validation working: ${validationErrors.length} errors shown`);
        for (let i = 0; i < validationErrors.length; i++) {
          const errorText = await validationErrors[i].evaluate(el => el.textContent);
          console.log(`    Validation error ${i + 1}: ${errorText}`);
        }
        this.testResults.passed++;
        this.testResults.details.push('Empty fields validation working');
      } else {
        throw new Error('No validation errors shown for empty fields');
      }

    } catch (error) {
      console.error('    ❌ Empty fields test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Empty fields: ${error.message}`);
    }
  }

  async testInvalidEmailFormat() {
    try {
      console.log('  📝 Testing invalid email format...');

      await this.page.goto('http://localhost:3000/superadmin/login');

      // Wait for login form
      await this.page.waitForSelector('form', { timeout: 5000 });

      // Fill invalid email format
      await this.page.type('input[type="email"]', 'invalid-email');
      await this.page.type('input[type="password"]', this.testData.validPassword);

      // Submit form
      console.log('    Submitting form with invalid email format...');
      
      // Trigger the form submission through React Hook Form
      await this.page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
          console.log('Form submit event dispatched');
        }
      });

      // Wait for validation error
      await this.page.waitForSelector('.text-red-500', { timeout: 5000 });

      // Check for email validation error
      const validationErrors = await this.page.$$('.text-red-500');
      let emailErrorFound = false;
      
      for (let i = 0; i < validationErrors.length; i++) {
        const errorText = await validationErrors[i].evaluate(el => el.textContent);
        if (errorText.toLowerCase().includes('email') || errorText.toLowerCase().includes('valid')) {
          console.log(`    ✅ Invalid email format validation: ${errorText}`);
          emailErrorFound = true;
          break;
        }
      }

      if (emailErrorFound) {
        this.testResults.passed++;
        this.testResults.details.push('Invalid email format validation working');
      } else {
        throw new Error('No email validation error shown for invalid format');
      }

    } catch (error) {
      console.error('    ❌ Invalid email format test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Invalid email format: ${error.message}`);
    }
  }

  async testInactiveAccount() {
    try {
      console.log('  📝 Testing inactive account...');

      // Create a test user and deactivate it
      const testUser = await this.createTestUser();
      await this.dbHelper.updateSuperAdminLastLogin(testUser.id);
      
      // Deactivate the user
      await this.dbHelper.prisma.superAdmin.update({
        where: { id: testUser.id },
        data: { isActive: false }
      });

      await this.page.goto('http://localhost:3000/superadmin/login');

      // Wait for login form
      await this.page.waitForSelector('form', { timeout: 5000 });

      // Fill credentials for inactive account
      await this.page.type('input[type="email"]', this.testData.testEmail);
      await this.page.type('input[type="password"]', this.testData.testPassword);

      // Submit form
      console.log('    Submitting form with inactive account...');
      
      // Trigger the form submission through React Hook Form
      await this.page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
          console.log('Form submit event dispatched');
        }
      });

      // Wait for error message
      await this.page.waitForSelector('.text-red-500, .bg-red-50, [data-testid="error-message"]', { timeout: 5000 });

      // Check for error message
      const errorElement = await this.page.$('.text-red-500, .bg-red-50, [data-testid="error-message"]');
      if (errorElement) {
        const errorText = await errorElement.evaluate(el => el.textContent);
        console.log(`    ✅ Inactive account properly rejected: ${errorText}`);
        this.testResults.passed++;
        this.testResults.details.push('Inactive account properly rejected');
      } else {
        throw new Error('No error message shown for inactive account');
      }

    } catch (error) {
      console.error('    ❌ Inactive account test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Inactive account: ${error.message}`);
    }
  }

  async cleanupTestData() {
    try {
      console.log('  🧹 Cleaning up test data...');
      
      // Delete test user if it exists
      await this.dbHelper.deleteSuperAdminByEmail(this.testData.testEmail);
      
      console.log('    ✅ Test data cleaned up');
    } catch (error) {
      console.error('    ❌ Error cleaning up test data:', error);
    }
  }
}

module.exports = SuperAdminLoginTester; 