const puppeteer = require('puppeteer');

async function testButtonAccessibility() {
  console.log('🧪 Testing Button Accessibility in Browser');
  console.log('==========================================');

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless mode
      defaultViewport: null,
      args: ['--start-maximized']
    });

    const page = await browser.newPage();

    // Navigate to superadmin login
    console.log('\n1. Navigating to superadmin login...');
    await page.goto('http://localhost:3000/superadmin/login');
    await page.waitForSelector('input[type="email"]');

    // Login as superadmin
    console.log('2. Logging in as superadmin...');
    await page.type('input[type="email"]', 'sinhaadyant74@gmail.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation to notifications page
    console.log('3. Waiting for navigation...');
    await page.waitForNavigation();
    
    // Check if we're on the notifications page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (!currentUrl.includes('/superadmin/notifications')) {
      console.log('4. Navigating to notifications page...');
      await page.goto('http://localhost:3000/superadmin/notifications');
      await page.waitForSelector('h1');
    }

    // Wait for the page to load
    console.log('5. Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Check if the button exists
    console.log('6. Looking for the sample notification button...');
    const buttonSelector = 'button:has-text("Send Sample to anil@cc.com")';
    
    try {
      await page.waitForSelector(buttonSelector, { timeout: 10000 });
      console.log('✅ Button found!');
    } catch (error) {
      console.log('❌ Button not found');
      console.log('Available buttons:');
      const buttons = await page.$$eval('button', btns => btns.map(btn => btn.textContent));
      buttons.forEach((text, index) => {
        console.log(`   ${index + 1}. ${text}`);
      });
      return;
    }

    // Check button state
    console.log('7. Checking button state...');
    const button = await page.$(buttonSelector);
    const isDisabled = await button.evaluate(btn => btn.disabled);
    const buttonText = await button.evaluate(btn => btn.textContent);
    
    console.log('Button text:', buttonText);
    console.log('Button disabled:', isDisabled);

    if (isDisabled) {
      console.log('⚠️ Button is disabled');
      
      // Check for any error messages or loading states
      const pageContent = await page.content();
      if (pageContent.includes('User not found')) {
        console.log('❌ User not found message detected');
      }
      if (pageContent.includes('Loading users')) {
        console.log('⏳ Users are still loading');
      }
      if (pageContent.includes('Error loading users')) {
        console.log('❌ Error loading users detected');
      }
    } else {
      console.log('✅ Button is enabled and clickable');
      
      // Try clicking the button
      console.log('8. Attempting to click the button...');
      await button.click();
      
      // Wait for any response
      await page.waitForTimeout(2000);
      
      // Check for success toast
      const toastSelector = '[data-testid="toast"]';
      try {
        await page.waitForSelector(toastSelector, { timeout: 5000 });
        console.log('✅ Toast notification appeared');
      } catch (error) {
        console.log('⚠️ No toast notification found');
      }
    }

    // Take a screenshot for debugging
    console.log('9. Taking screenshot...');
    await page.screenshot({ path: 'button-debug.png', fullPage: true });
    console.log('📸 Screenshot saved as button-debug.png');

    console.log('\n🎉 Button accessibility test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available
try {
  require('puppeteer');
  testButtonAccessibility();
} catch (error) {
  console.log('❌ Puppeteer not available. Install it with: npm install puppeteer');
  console.log('📋 Manual testing instructions:');
  console.log('   1. Open browser: http://localhost:3000/superadmin/login');
  console.log('   2. Login as: sinhaadyant74@gmail.com / password123');
  console.log('   3. Navigate to: /superadmin/notifications');
  console.log('   4. Look for "Send Sample to anil@cc.com" button');
  console.log('   5. Check browser console for debug messages');
  console.log('   6. Try clicking the button');
}
