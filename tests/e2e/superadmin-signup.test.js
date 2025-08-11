const puppeteer = require('puppeteer');
const { TestHelper, TEST_CREDENTIALS } = require('./test-setup');
const SuperAdminDatabaseHelper = require('./superadmin-db-helper');

class SuperAdminSignupTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testHelper = null;
    this.dbHelper = new SuperAdminDatabaseHelper();
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
      details: [],
    };
    this.testData = {
      inviteToken: null,
      testEmail: `test-superadmin-${Date.now()}@example.com`,
      testName: 'Test SuperAdmin User',
      testContactNumber: '1234567890',
      testPassword: 'TestPass123!',
    };
  }

  async initialize() {
    try {
      console.log('🚀 Initializing SuperAdmin Signup Test Suite...');

      // Connect to database
      await this.dbHelper.connect();

      // Launch browser
      this.browser = await puppeteer.launch({
        headless: process.env.HEADLESS !== 'false',
        defaultViewport: null,
        args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
      });

      this.page = await this.browser.newPage();
      this.testHelper = new TestHelper(this.browser, this.page);

      console.log('✅ SuperAdmin signup test suite initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SuperAdmin signup test suite:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      console.log('🧹 Cleaning up SuperAdmin signup test data...');

      // Clean up created test data
      await this.cleanupTestData();

      // Disconnect from database
      await this.dbHelper.disconnect();

      // Close browser
      if (this.browser) {
        await this.browser.close();
      }

      console.log('✅ SuperAdmin signup test suite cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  async runAllTests() {
    try {
      await this.initialize();

      console.log('\n🎯 Starting SuperAdmin Signup Test Suite...\n');

      // Run all signup tests
      await this.testInvalidTokenAccess();
      await this.testValidTokenAccess();
      await this.testFormValidations();
      await this.testPasswordStrengthValidation();
      await this.testPasswordMatchValidation();
      await this.testContactNumberValidation();
      await this.testSuccessfulSignup();
      await this.testDuplicateEmailSignup();
      await this.testExpiredTokenSignup();
      await this.testEmailMismatchSignup();

      console.log('\n📊 SuperAdmin Signup Test Results:');
      console.log(`✅ Passed: ${this.testResults.passed}`);
      console.log(`❌ Failed: ${this.testResults.failed}`);
      
      if (this.testResults.errors.length > 0) {
        console.log('\n❌ Errors:');
        this.testResults.errors.forEach(error => console.log(`  - ${error}`));
      }

      return this.testResults;
    } catch (error) {
      console.error('❌ SuperAdmin Signup Tests failed:', error);
      this.testResults.errors.push(`Signup Tests: ${error.message}`);
      this.testResults.failed++;
      return this.testResults;
    } finally {
      await this.cleanup();
    }
  }

  async createTestInviteToken() {
    try {
      console.log('  🔑 Creating test invite token...');
      
      // Create an invite token for testing
      const inviteToken = await this.dbHelper.createInviteToken({
        email: this.testData.testEmail,
        type: 'superadmin',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      });

      this.testData.inviteToken = inviteToken.token;
      console.log('    ✅ Test invite token created');
      return inviteToken.token;
    } catch (error) {
      console.error('    ❌ Failed to create test invite token:', error);
      throw error;
    }
  }

  async testInvalidTokenAccess() {
    try {
      console.log('  📝 Testing access with invalid token...');

      await this.testHelper.page.goto('http://localhost:3000/superadmin/signup?token=invalid-token&email=test@example.com');

      // Wait for error message
      await this.testHelper.page.waitForSelector('h2', { timeout: 5000 });
      
      const errorTitle = await this.testHelper.page.$eval('h2', el => el.textContent);
      
      if (errorTitle.includes('Invalid Invite')) {
        console.log('    ✅ Invalid token properly rejected');
        this.testResults.passed++;
        this.testResults.details.push('Invalid token access properly rejected');
      } else {
        throw new Error('Invalid token not properly handled');
      }
    } catch (error) {
      console.error('    ❌ Invalid token test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Invalid token: ${error.message}`);
    }
  }

  async testValidTokenAccess() {
    try {
      console.log('  📝 Testing access with valid token...');

      // Create a valid invite token
      const token = await this.createTestInviteToken();
      
      await this.testHelper.page.goto(`http://localhost:3000/superadmin/signup?token=${token}&email=${this.testData.testEmail}`);

      // Wait for signup form
      await this.testHelper.page.waitForSelector('form', { timeout: 5000 });
      
      // Check if email is pre-filled and disabled
      const emailInput = await this.testHelper.page.$('#email');
      const isDisabled = await emailInput.evaluate(el => el.disabled);
      const emailValue = await emailInput.evaluate(el => el.value);
      
      if (isDisabled && emailValue === this.testData.testEmail) {
        console.log('    ✅ Valid token access successful, email pre-filled');
        this.testResults.passed++;
        this.testResults.details.push('Valid token access successful');
      } else {
        throw new Error('Email not properly pre-filled or disabled');
      }
    } catch (error) {
      console.error('    ❌ Valid token test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Valid token: ${error.message}`);
    }
  }

  async testFormValidations() {
    try {
      console.log('  📝 Testing form validations...');

      // Create a valid invite token
      const token = await this.createTestInviteToken();
      
      await this.testHelper.page.goto(`http://localhost:3000/superadmin/signup?token=${token}&email=${this.testData.testEmail}`);

      // Wait for signup form
      await this.testHelper.page.waitForSelector('form', { timeout: 5000 });

      // Test empty name validation
      await this.testHelper.page.click('button[type="submit"]');
      await this.testHelper.page.waitForTimeout(1000);

      const nameError = await this.testHelper.page.$('p.text-red-600');
      if (nameError) {
        const errorText = await nameError.evaluate(el => el.textContent);
        if (errorText.includes('Name must be at least 2 characters')) {
          console.log('    ✅ Name validation working');
          this.testResults.passed++;
        }
      }

      // Test invalid email format (should be pre-filled, but test anyway)
      await this.testHelper.page.fill('#name', 'Test');
      await this.testHelper.page.fill('#email', 'invalid-email');
      await this.testHelper.page.click('button[type="submit"]');
      await this.testHelper.page.waitForTimeout(1000);

      const emailError = await this.testHelper.page.$('p.text-red-600');
      if (emailError) {
        const errorText = await emailError.evaluate(el => el.textContent);
        if (errorText.includes('Please enter a valid email address')) {
          console.log('    ✅ Email validation working');
          this.testResults.passed++;
        }
      }

      this.testResults.details.push('Form validations working correctly');
    } catch (error) {
      console.error('    ❌ Form validation test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Form validation: ${error.message}`);
    }
  }

  async testPasswordStrengthValidation() {
    try {
      console.log('  📝 Testing password strength validation...');

      // Create a valid invite token
      const token = await this.createTestInviteToken();
      
      await this.page.goto(`http://localhost:3000/superadmin/signup?token=${token}&email=${this.testData.testEmail}`);

      // Wait for signup form
      await this.page.waitForSelector('form', { timeout: 5000 });

      // Fill basic info
      await this.testHelper.page.fill('#name', this.testData.testName);
      await this.testHelper.page.fill('#contactNumber', this.testData.testContactNumber);

      // Test weak password
      await this.testHelper.page.fill('#password', 'weak');
      await this.testHelper.page.waitForTimeout(500);

      // Check password strength indicators
      const strengthIndicators = await this.testHelper.page.$$('.text-red-600');
      let hasStrengthValidation = false;
      
      for (const indicator of strengthIndicators) {
        const text = await indicator.evaluate(el => el.textContent);
        if (text.includes('At least 8 characters') || text.includes('One uppercase letter')) {
          hasStrengthValidation = true;
          break;
        }
      }

      if (hasStrengthValidation) {
        console.log('    ✅ Password strength validation working');
        this.testResults.passed++;
      }

      // Test strong password
      await this.page.fill('#password', this.testData.testPassword);
      await this.page.waitForTimeout(500);

      // Check for green indicators
      const greenIndicators = await this.page.$$('.text-green-600');
      if (greenIndicators.length > 0) {
        console.log('    ✅ Strong password indicators working');
        this.testResults.passed++;
      }

      this.testResults.details.push('Password strength validation working correctly');
    } catch (error) {
      console.error('    ❌ Password strength test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Password strength: ${error.message}`);
    }
  }

  async testPasswordMatchValidation() {
    try {
      console.log('  📝 Testing password match validation...');

      // Create a valid invite token
      const token = await this.createTestInviteToken();
      
      await this.page.goto(`http://localhost:3000/superadmin/signup?token=${token}&email=${this.testData.testEmail}`);

      // Wait for signup form
      await this.page.waitForSelector('form', { timeout: 5000 });

      // Fill basic info
      await this.page.fill('#name', this.testData.testName);
      await this.page.fill('#contactNumber', this.testData.testContactNumber);
      await this.page.fill('#password', this.testData.testPassword);

      // Test non-matching password
      await this.page.fill('#confirmPassword', 'DifferentPass123!');
      await this.page.waitForTimeout(500);

      // Check for password match error
      const matchError = await this.page.$('.text-red-600');
      if (matchError) {
        const errorText = await matchError.evaluate(el => el.textContent);
        if (errorText.includes('Password does not match')) {
          console.log('    ✅ Password match validation working');
          this.testResults.passed++;
        }
      }

      // Test matching password
      await this.page.fill('#confirmPassword', this.testData.testPassword);
      await this.page.waitForTimeout(500);

      // Check for password match success
      const matchSuccess = await this.page.$('.text-green-600');
      if (matchSuccess) {
        const successText = await matchSuccess.evaluate(el => el.textContent);
        if (successText.includes('Password matches')) {
          console.log('    ✅ Password match success indicator working');
          this.testResults.passed++;
        }
      }

      this.testResults.details.push('Password match validation working correctly');
    } catch (error) {
      console.error('    ❌ Password match test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Password match: ${error.message}`);
    }
  }

  async testContactNumberValidation() {
    try {
      console.log('  📝 Testing contact number validation...');

      // Create a valid invite token
      const token = await this.createTestInviteToken();
      
      await this.page.goto(`http://localhost:3000/superadmin/signup?token=${token}&email=${this.testData.testEmail}`);

      // Wait for signup form
      await this.page.waitForSelector('form', { timeout: 5000 });

      // Fill basic info
      await this.page.fill('#name', this.testData.testName);
      await this.page.fill('#password', this.testData.testPassword);
      await this.page.fill('#confirmPassword', this.testData.testPassword);

      // Test invalid contact number (letters)
      await this.page.fill('#contactNumber', 'abc123def');
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(1000);

      const contactError = await this.page.$('p.text-red-600');
      if (contactError) {
        const errorText = await contactError.evaluate(el => el.textContent);
        if (errorText.includes('Contact number must contain only numbers')) {
          console.log('    ✅ Contact number validation working');
          this.testResults.passed++;
        }
      }

      // Test short contact number
      await this.page.fill('#contactNumber', '123');
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(1000);

      const shortError = await this.page.$('p.text-red-600');
      if (shortError) {
        const errorText = await shortError.evaluate(el => el.textContent);
        if (errorText.includes('Please enter a valid contact number (minimum 10 digits)')) {
          console.log('    ✅ Contact number length validation working');
          this.testResults.passed++;
        }
      }

      this.testResults.details.push('Contact number validation working correctly');
    } catch (error) {
      console.error('    ❌ Contact number test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Contact number: ${error.message}`);
    }
  }

  async testSuccessfulSignup() {
    try {
      console.log('  📝 Testing successful signup...');

      // Create a valid invite token
      const token = await this.createTestInviteToken();
      
      await this.page.goto(`http://localhost:3000/superadmin/signup?token=${token}&email=${this.testData.testEmail}`);

      // Wait for signup form
      await this.page.waitForSelector('form', { timeout: 5000 });

      // Fill all required fields
      await this.page.fill('#name', this.testData.testName);
      await this.page.fill('#contactNumber', this.testData.testContactNumber);
      await this.page.fill('#password', this.testData.testPassword);
      await this.page.fill('#confirmPassword', this.testData.testPassword);

      // Submit form
      await this.page.click('button[type="submit"]');

      // Wait for redirect to login page
      await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });

      // Check if redirected to login page
      const currentUrl = this.page.url();
      if (currentUrl.includes('/superadmin/login')) {
        console.log('    ✅ Successful signup - redirected to login');
        this.testResults.passed++;
      } else {
        throw new Error('Not redirected to login page after successful signup');
      }

      // Verify user was created in database
      const createdUser = await this.dbHelper.getSuperAdminByEmail(this.testData.testEmail);
      if (createdUser) {
        console.log('    ✅ User created in database');
        this.testResults.passed++;
        this.testResults.details.push('SuperAdmin signup successful - user created in database');
      } else {
        throw new Error('User not found in database after signup');
      }

      // Verify invite token was marked as used
      const usedToken = await this.dbHelper.getInviteToken(token);
      if (usedToken && usedToken.isUsed) {
        console.log('    ✅ Invite token marked as used');
        this.testResults.passed++;
      } else {
        throw new Error('Invite token not marked as used');
      }

    } catch (error) {
      console.error('    ❌ Successful signup test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Successful signup: ${error.message}`);
    }
  }

  async testDuplicateEmailSignup() {
    try {
      console.log('  📝 Testing duplicate email signup...');

      // Create a valid invite token
      const token = await this.createTestInviteToken();
      
      await this.page.goto(`http://localhost:3000/superadmin/signup?token=${token}&email=${this.testData.testEmail}`);

      // Wait for signup form
      await this.page.waitForSelector('form', { timeout: 5000 });

      // Fill all required fields
      await this.page.fill('#name', this.testData.testName);
      await this.page.fill('#contactNumber', this.testData.testContactNumber);
      await this.page.fill('#password', this.testData.testPassword);
      await this.page.fill('#confirmPassword', this.testData.testPassword);

      // Submit form
      await this.page.click('button[type="submit"]');

      // Wait for error message
      await this.page.waitForTimeout(2000);

      // Check for error message
      const errorElement = await this.page.$('.bg-red-50, .alert-error, [data-testid="error-message"]');
      if (errorElement) {
        const errorText = await errorElement.evaluate(el => el.textContent);
        if (errorText.includes('SuperAdmin account already exists')) {
          console.log('    ✅ Duplicate email properly rejected');
          this.testResults.passed++;
          this.testResults.details.push('Duplicate email signup properly rejected');
        } else {
          throw new Error('Unexpected error message for duplicate email');
        }
      } else {
        throw new Error('No error message displayed for duplicate email');
      }

    } catch (error) {
      console.error('    ❌ Duplicate email test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Duplicate email: ${error.message}`);
    }
  }

  async testExpiredTokenSignup() {
    try {
      console.log('  📝 Testing expired token signup...');

      // Create an expired invite token
      const expiredToken = await this.dbHelper.createInviteToken({
        email: `expired-${Date.now()}@example.com`,
        type: 'superadmin',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      });

      await this.page.goto(`http://localhost:3000/superadmin/signup?token=${expiredToken.token}&email=${expiredToken.email}`);

      // Wait for error message
      await this.page.waitForSelector('h2', { timeout: 5000 });
      
      const errorTitle = await this.page.$eval('h2', el => el.textContent);
      
      if (errorTitle.includes('Invalid Invite')) {
        console.log('    ✅ Expired token properly rejected');
        this.testResults.passed++;
        this.testResults.details.push('Expired token signup properly rejected');
      } else {
        throw new Error('Expired token not properly handled');
      }

    } catch (error) {
      console.error('    ❌ Expired token test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Expired token: ${error.message}`);
    }
  }

  async testEmailMismatchSignup() {
    try {
      console.log('  📝 Testing email mismatch signup...');

      // Create a valid invite token
      const token = await this.createTestInviteToken();
      
      // Try to access with different email
      await this.page.goto(`http://localhost:3000/superadmin/signup?token=${token}&email=different@example.com`);

      // Wait for error message
      await this.page.waitForSelector('h2', { timeout: 5000 });
      
      const errorTitle = await this.page.$eval('h2', el => el.textContent);
      
      if (errorTitle.includes('Invalid Invite')) {
        console.log('    ✅ Email mismatch properly rejected');
        this.testResults.passed++;
        this.testResults.details.push('Email mismatch signup properly rejected');
      } else {
        throw new Error('Email mismatch not properly handled');
      }

    } catch (error) {
      console.error('    ❌ Email mismatch test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Email mismatch: ${error.message}`);
    }
  }

  async cleanupTestData() {
    try {
      console.log('  🧹 Cleaning up test data...');

      // Delete test SuperAdmin users
      if (this.testData.testEmail) {
        await this.dbHelper.deleteSuperAdminByEmail(this.testData.testEmail);
      }

      // Delete test invite tokens
      if (this.testData.inviteToken) {
        await this.dbHelper.deleteInviteToken(this.testData.inviteToken);
      }

      console.log('    ✅ Test data cleaned up');
    } catch (error) {
      console.error('    ❌ Error cleaning up test data:', error);
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const tester = new SuperAdminSignupTester();
  tester.runAllTests()
    .then(results => {
      console.log('\n🎉 SuperAdmin Signup Test Suite completed!');
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = SuperAdminSignupTester; 