module.exports = {
  // Puppeteer configuration
  launch: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    devtools: process.env.DEVTOOLS === 'true',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--window-size=1920,1080'
    ],
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  },
  
  // Test configuration
  testDir: './tests/e2e/specs',
  outputDir: './tests/e2e/results',
  screenshotDir: './tests/e2e/screenshots',
  videoDir: './tests/e2e/videos',
  
  // Timeout settings
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  
  // Retry failed tests
  retries: process.env.CI ? 2 : 0,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: './tests/e2e/reports' }],
    ['json', { outputFile: './tests/e2e/results/results.json' }],
    ['list']
  ],
  
  // Global setup and teardown
  globalSetup: require.resolve('./setup/global-setup.js'),
  globalTeardown: require.resolve('./setup/global-teardown.js'),
  
  // Use multiple browsers
  projects: [
    {
      name: 'chromium',
      use: { ...require('puppeteer').devices['Desktop Chrome'] }
    }
  ]
}; 