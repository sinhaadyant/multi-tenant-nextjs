const { chromium } = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.test' });

async function globalSetup() {
  console.log('🚀 Starting global setup...');
  
  // Create necessary directories
  const dirs = [
    './tests/e2e/results',
    './tests/e2e/screenshots',
    './tests/e2e/videos',
    './tests/e2e/reports'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Start the browser and store the instance
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  // Store browser instance globally
  global.__BROWSER__ = browser;
  
  console.log('✅ Global setup completed');
}

module.exports = globalSetup; 