const puppeteer = require('puppeteer');

async function testInviteLink() {
  let browser;
  
  try {
    console.log('🧪 Testing SuperAdmin invite link...');
    
    browser = await puppeteer.launch({
      headless: false, // Set to false to see the browser
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // The invite link from the previous generation
    const inviteLink = 'http://localhost:3000/superadmin/signup?token=25cba730a4314e1bef7719faaac72d870ac24c5a3c0e67830ddac324f719b836&email=newadmin%40superadmin.com';
    
    console.log('🌐 Navigating to invite link...');
    await page.goto(inviteLink, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if the signup form is present
    const signupForm = await page.$('form');
    if (!signupForm) {
      console.log('❌ Signup form not found');
      return false;
    }
    
    // Check if email is pre-filled and disabled
    const emailInput = await page.$('input[type="email"]');
    if (!emailInput) {
      console.log('❌ Email input not found');
      return false;
    }
    
    const isDisabled = await emailInput.evaluate(el => el.disabled);
    if (!isDisabled) {
      console.log('❌ Email input should be disabled');
      return false;
    }
    
    const emailValue = await emailInput.evaluate(el => el.value);
    console.log('📧 Email value:', emailValue);
    
    // Check if other form fields are present
    const nameInput = await page.$('input[placeholder*="name"]');
    const passwordInput = await page.$('input[type="password"]');
    const contactInput = await page.$('input[type="tel"]');
    
    if (!nameInput || !passwordInput || !contactInput) {
      console.log('❌ Required form fields not found');
      return false;
    }
    
    console.log('✅ Signup page loaded successfully!');
    console.log('✅ Email is pre-filled and disabled');
    console.log('✅ All required form fields are present');
    
    // Fill out the form
    console.log('📝 Filling out the signup form...');
    
    await nameInput.type('Test SuperAdmin');
    await contactInput.type('+1234567890');
    await passwordInput.type('TestPassword123');
    
    // Find confirm password field
    const passwordInputs = await page.$$('input[type="password"]');
    if (passwordInputs.length >= 2) {
      await passwordInputs[1].type('TestPassword123');
    }
    
    console.log('✅ Form filled out successfully');
    
    // Keep the browser open for manual testing
    console.log('🔄 Browser will stay open for manual testing...');
    console.log('📋 You can now manually test the signup process');
    console.log('🔗 Invite Link:', inviteLink);
    
    // Wait for user to close browser manually
    await new Promise(() => {}); // This will keep the script running
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing invite link:', error.message);
    return false;
  }
}

// Run the test
testInviteLink().then(success => {
  if (success) {
    console.log('🎉 Invite link test completed successfully!');
  } else {
    console.log('💥 Invite link test failed');
  }
}); 